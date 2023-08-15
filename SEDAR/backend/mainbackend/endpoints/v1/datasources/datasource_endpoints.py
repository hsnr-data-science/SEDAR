from datetime import datetime
import json
from pywebhdfs.webhdfs import PyWebHdfsClient
from werkzeug.datastructures import FileStorage
from commons.enums import WriteType
from commons.enums import IngestionState
from commons.models.datasource import DatasourceDefinition
from endpoints.v1.datasources import DatasourceDefinitionInput
from flask_jwt_extended import jwt_required
from flask import request, jsonify
from . import datasource_dto
from services.kafka_service import start_ingestion
from services.decorators import parse_params
from flask_restful.reqparse import Argument
from werkzeug.exceptions import BadRequest, NotFound
from commons.repositories import datasource_repo
from endpoints.v1.datasources import datasource_revision_builder
from traceback import print_exception
from services.decorators import check_permissions_workspace

# |====[ added by marcel]===================================================================================
from database.data_access import dataset_data_access, dataset_logs_data_access
from flask_jwt_extended.utils import get_jwt_identity
from commons.services.data_frame_helper import DataFrameHelper
from commons.models.dataset.models import CustomReadFormats
from commons.configuration.settings import Settings
# |====[ end added ]===================================================================================

# |====[ create ]===================================================================================
@jwt_required()
@check_permissions_workspace()
def create_definition(workspace_id):
    FIELD_DEFINITION = "datasource_definition"
    # check if definition is send as file
    if FIELD_DEFINITION in request.files:
        data: FileStorage = request.files[FIELD_DEFINITION]
        input = DatasourceDefinitionInput(data.stream.read().decode("utf-8"))
    else:
        input = DatasourceDefinitionInput(request.form.get(FIELD_DEFINITION))

    definition = DatasourceDefinition().save()

    try:
        files = dict()
        for key in request.files:
            files[key] = request.files[key]

        next_revision = datasource_revision_builder.build_revision(input, files, definition, workspace_id)
        definition = datasource_repo.save_revision(next_revision, definition)
        requestform = request.form
        # |====[ added by marcel]===================================================================================
        dataset = dataset_data_access.create(request.form.get('title'), get_jwt_identity()['email'], workspace_id, str(definition.id))
        if len(definition.resolve_current_revision().continuation_timers)!=0:
            dataset.range_start=datetime.now()
            dataset.range_end=datetime.now()
            dataset.save()
        if next_revision.update_for != '' and next_revision.update_for != None:
            dataset.is_update_for = True
            dataset.save()
        if next_revision.write_type == WriteType.CUSTOM:
            data = json.loads(request.form.get('datasource_definition'))
            custom = CustomReadFormats(read_format=data["custom_read_format"], read_options=data["custom_read_options"])
            custom.save()
            dataset.custom_read_formats.connect(custom)
        if request.form.get('query') != None and request.form.get('lineage') != None:
            for id in json.loads(request.form.get('lineage')):
                d = DataFrameHelper(id, without_session=True)
                dataset.lineage.connect(d.dataset, {'script':request.form.get('query'), 'code':request.form.get('code'), 'is_workflow':request.form.get('is_workflow'), 'version':d.datasource.last_successful_ingestion})
                if request.form.get('is_polymorph')=="True":
                    dataset.polymorph.connect(d.dataset)
                    d.dataset.polymorph.connect(dataset)
        # |====[ end added ]===================================================================================
    except Exception as e:
        settings = Settings()
        hdfs = PyWebHdfsClient(host=settings.hdfs_storage.namenode, port=settings.hdfs_storage.web_port)
        hdfs.delete_file_dir(f"/datalake/{workspace_id}/sources/{str(definition.pk)}", recursive=True)
        hdfs.delete_file_dir(f"/datalake/{workspace_id}/plugins/{str(definition.pk)}")
        datasource_repo.delete(str(definition.pk))
        print_exception(type(e), e, e.__traceback__)
        raise BadRequest("Could not create datasource definition: " + str(e))
    #return jsonify(datasource_dto(definition))
    # |====[ added by marcel]===================================================================================
    email = get_jwt_identity()['email']
    return jsonify(dataset.serialize(email=email))
    # |====[ end added ]===================================================================================


# |====[ update ]===================================================================================
@jwt_required()
@check_permissions_workspace()
@parse_params(
    Argument("filename", default=None,required=False, type=str),
    Argument("write_type", default=None,required=False, type=str),
    Argument("id_column", default=None,required=False, type=str),
)
def update_definition(workspace_id: str, dataset_id: str,filename: str, write_type: str, id_column: str):
    # |====[ added by marcel]===================================================================================
    dataset = dataset_data_access.get(dataset_id)
    definition = datasource_repo.find_by_id(dataset.datasource)
    user = get_jwt_identity()['email']
    try:
        dataset_logs_data_access.create(dataset_id, {"en":f"A update was started.", "de":f"Ein Update wurde gestartet."}, "UPDATE", user)
    except:
        pass 
    # |====[ end added ]===================================================================================
    
    try:
        print("###################################update_definition#########################################")
        if filename:
            data = {
                    "name": filename,
                    "id_column": id_column,
                    "spark_packages": ["org.mongodb.spark:mongo-spark-connector_2.12:3.0.0"],
                    "read_type": "SOURCE_FILE",
                    "read_format": "json",
                    "read_options": {"multiLine": "true"},
                    "source_files": [filename],
                    "write_type": write_type,
                    "update_for": "",
                    },
            data2 = str(data).replace("\'", "\"").replace('(', '').replace(')', '')
            print("DATA", data2[:-1])
            input = DatasourceDefinitionInput(data2[:-1])
            print(input)
        else:
            input = DatasourceDefinitionInput(request.form.get("datasource_definition"))
            print(input)
        
    except Exception as e:
        print(e)
    
    try:
        files = dict()
        for key in request.files:
            files[key] = request.files[key]
            print("files[key]",files[key])
        next_revision = datasource_revision_builder.build_revision(input, files, definition, workspace_id)
        definition = datasource_repo.save_revision(next_revision, definition)

    except Exception as e:
        raise BadRequest("Could not update datasource definition: " + str(e))

    return jsonify(datasource_dto(definition)), 200


# |====[ run ]======================================================================================
@jwt_required()
@check_permissions_workspace()
def run_ingestion(workspace_id: str, dataset_id: str):
    print("######################################run_ingestion##########################################")
    #datasource = datasource_repo.find_by_id(id)
    # |====[ added by marcel]===================================================================================
    datasource = datasource_repo.find_by_id(dataset_data_access.get(dataset_id).datasource)
    # |====[ end added ]===================================================================================
    
    if not datasource:
        raise NotFound()

    # check if could start new ingestion
    event = datasource.resolve_latest_ingestion()
    if event and event.state == IngestionState.RUNNING:
        raise BadRequest("Ingestion for datasource already running")
    datasource = datasource_repo.new_event(datasource)
    start_ingestion(str(datasource.id))
    return jsonify(datasource_dto(datasource))
