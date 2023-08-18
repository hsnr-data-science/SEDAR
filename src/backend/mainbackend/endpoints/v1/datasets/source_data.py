from flask import jsonify
from services.ingestion.dataframe_delta import get_change_data
from commons.services.data_frame_helper import DataFrameHelper
from flask_restful.reqparse import Argument
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from services.kafka_service import start_profiling as s_p
from flask_restful.inputs import boolean
from commons.configuration.settings import Settings
from database.data_access import dataset_logs_data_access
import requests
import json
import io

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(can_read=True)
@parse_params(
    Argument("session_id", default='', type=str, required=True),
    Argument("flattened", default=False, type=boolean, required=False),
)
def get_preview(workspace_id:str, dataset_id:str, session_id:str, flattened:bool):
    """
    API get request to get a preview of the data source.

    :returns: preview as json.
    """   
    try:
        dfh = DataFrameHelper(dataset_id, session_id)
        sdf = dfh.get_source_df(flattened)
        return jsonify({"header":sdf.schema.names, 
        "body":sdf.limit(10).toJSON().map(lambda d: json.loads(d)).collect()})
    except Exception as ex:
        return str(ex), 500

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(can_read=True)
@parse_params(
    Argument("session_id", default='', type=str, required=True),
    Argument("query", default='', type=str, required=True),
    Argument("is_save", default=False, type=boolean, required=False),
    Argument("datasetname", default='', type=str, required=False),
    Argument("is_polymorph", default=False, type=boolean, required=False),
    Argument("write_type", default='DEFAULT', type=str, required=False),
)
def query_source_data(workspace_id:str, dataset_id:str, session_id:str, query:str, is_save:bool, datasetname:str, is_polymorph:bool, write_type:str):
    """
    API post request to query the sourcedata or save a query result.

    :returns: query result as json.
    """   
    try:
        dfh = DataFrameHelper(dataset_id, session_id)
        dfh.df = dfh.get_source_df()
        dfh.df.createOrReplaceTempView(f"{str(dfh.dataset.uid)}")
        result = dfh.spark_session.sql(query)

        if is_save:
            data = {"datasource_definition": json.dumps({
                "name": f"{datasetname}",
                "spark_packages": ["org.mongodb.spark:mongo-spark-connector_2.12:3.0.0"],
                "read_type": "SOURCE_FILE",
                "read_format": "json",
                "read_options": {"multiLine": "true"},
                "source_files": ["data"],
                "plugin_files": ["plugin"],
                "write_type": write_type
                }),
                "title":datasetname,
                "query":query,
                "lineage":json.dumps([dataset_id]),
                "is_polymorph":is_polymorph,
                "code": ""
            }
            access_token=create_access_token(identity={'email':get_jwt_identity()["email"]})
            file = io.BytesIO(json.dumps(result.toJSON().map(lambda d: json.loads(d)).collect()).encode('utf-8'))

            files = {'data':('data.json', file, 'application/json')}
            settings = Settings()
            resp = requests.post(
                f"http://{settings.server.host}:{settings.server.port}/api/v1/workspaces/{workspace_id}/datasets/create",
                data=data,
                files=files,
                cookies={"access_token_cookie":access_token}
            )
            return "", 200
        try:
            user = get_jwt_identity()['email']
            dataset_logs_data_access.create(dataset_id, {"en":f"Queried source data.", "de":f"Hat Quellendaten abgefragt."}, "READ", user)
        except:
            pass
        return jsonify({"header":result.schema.names, 
        "body":result.toJSON().map(lambda d: json.loads(d)).collect()})
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(can_read=True)
@parse_params(
    Argument("session_id", default=False, type=str, required=True),
    Argument("version", default=None, type=int, required=False),
    Argument("version_to_compare", default=None, type=int, required=False),
    
)
def get_deltas_of_version(workspace_id:str, dataset_id:str, session_id:str, version:str, version_to_compare:str):
    """
    API get request to get the deltas for a specific version of a dataset.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param session_id: id of the spark session.
    :param version: version of the dataset.
    :param version_to_compare: version to compare.
    :returns: deltas as json.
    """  
    try:      
        dfh = DataFrameHelper(dataset_id, session_id)
        if version!=0:
            deltas = get_change_data(dfh.get_source_df(version=version_to_compare), dfh.get_source_df(version=version), dfh.datasource.resolve_current_revision().id_column)
        else:
            deltas = dfh.get_source_df(version=version)
            
        try:
            user = get_jwt_identity()['email']
            dataset_logs_data_access.create(dataset_id, {"en":f"Viewed deltas. (Version {version} - {str(version_to_compare)})", "de":f"Hat Delta gesichtet. (Version {version} - {str(version_to_compare)})"}, "READ", user)
        except:
            pass
        return jsonify({"header":deltas.schema.names, 
        "body":deltas.toJSON().map(lambda d: json.loads(d)).collect()})
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(can_write=True)
@parse_params(
    Argument("session_id", default='', type=str, required=False),
    Argument("version", type=str, required=True)
)
def start_profiling(workspace_id:str, dataset_id:str, session_id:str, version:str):
    """
    API get request to start the profiling.

    :param workspace_id: id of workspace.
    :param dataset_id: id of dataset.
    :param session_id: id of current spark session.
    :param version: the dataset version to be profiled

    :returns: 200
    """
    print("Profile START")
    try:
        s_p(dataset_id, str(version))
        try:
            user = get_jwt_identity()['email']
            dataset_logs_data_access.create(dataset_id, {"en":f"Started profiling.", "de":f"Profiling wurde gestartet."}, "CREATE", user)
        except:
            pass
        return '', 200
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception: \n\t {ex}")
