import io
import json
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from flask_restful import Resource
import requests
from pyspark.sql.types import *
from pyspark.sql.functions import *
from flask import request
from flask_restful import Resource
from services.decorators import check_permissions_workspace
from database.data_access import dataset_attributes_data_access
from commons.configuration.settings import Settings

from commons.services.data_frame_helper import DataFrameHelper
import socket
from PySPARQL.Wrapper import PySPARQLWrapper


def process_input(data, source_ids, is_polymorph, custom_is_polymorph, set_fk, set_pk, auto_detect):
    """
    Processes the data['input'] field recursively. Base condition is data['type'] == 'data_source' 
    where a datamart is read from source and returns a pyspark Dataframe object.
    :param spark_helper: To re-use single spark session object.
    :param data: Dictionary object containing 'input' and 'type' mandatory keys and other keys
    based on 'type.
    :return: Dataframe. A pyspark Dataframe object.
    """
    if data['type'] == 'join':
        if custom_is_polymorph==False:
            is_polymorph=False
        r1 = process_input(data['input'][0]['input'][0], source_ids, is_polymorph, custom_is_polymorph, set_fk, set_pk, auto_detect)
        df1 = r1[0]
        r2 = process_input(data['input'][1]['input'][0], r1[1], r1[2], custom_is_polymorph, set_fk, set_pk, auto_detect)
        df2 = r2[0]
        if set_fk==True or auto_detect==True:
            if auto_detect == True:
                if data['input'][0]['columnID'] != data['input'][1]['columnID']:
                    settings = Settings()
                    dataset_attributes_data_access.patch(data['input'][0]['columnID'], r2[3].dataset.uid, data['input'][1]['columnID'], settings.server.workflow_always_set_pk, is_workflow=True, dataset_id=r1[3].dataset.uid)
            else:
                dataset_attributes_data_access.patch(data['input'][0]['columnID'], r2[3].dataset.uid, data['input'][1]['columnID'], set_pk, is_workflow=True, dataset_id=r1[3].dataset.uid)
        if data['input'][0]['column'] == data['input'][1]['column']:
            return (df1.join(df2, data['input'][0]['column']), r2[1], r2[2], r2[3])
        else:
            return (df1.join(df2, df1[data['input'][0]['column']] == df2[data['input'][1]['column']]), r2[1], r2[2], r2[3])

    elif data['type'] == 'filter':
        if auto_detect==True:
            is_polymorph=False
        r = process_input(data['input'][0], source_ids, is_polymorph, custom_is_polymorph, set_fk, set_pk, auto_detect)
        df1 = r[0]
        return (df1.filter(data["condition"]), r[1], r[2], r[3])

    elif data['type'] == 'select':
        if auto_detect==True:
            is_polymorph=False
        r = process_input(data['input'][0], source_ids, is_polymorph, custom_is_polymorph, set_fk, set_pk, auto_detect)
        df1 = r[0]
        if 'distinct' in data.keys() and data['distinct']:
            return (df1.select(*data["columns"]).distinct(), r[1], r[2], r[3])
        return (df1.select(*data["columns"]), r[1], r[2], r[3])

    elif data['type'] == 'groupby':
        if auto_detect==True:
            is_polymorph=False
        r = process_input(data['input'][0], source_ids, is_polymorph, custom_is_polymorph, set_fk, set_pk, auto_detect)
        df1 = r[0]
        return (df1.groupBy(*data['column']).agg(data["aggregate"]), r[1], r[2], r[3])

    elif data['type'] == 'flatten':
        r = process_input(data['input'][0], source_ids, is_polymorph, custom_is_polymorph, set_fk, set_pk, auto_detect)
        df1 = r[0]
        return (DataFrameHelper.flatten(df1), r[1], r[2], r[3])

    elif data['type'] == 'data_source':
        source_ids.append(data['uid'])
        dfh = DataFrameHelper(data['uid'])
        return (dfh.get_source_df(), source_ids, is_polymorph, dfh)
    elif data['type'] == 'obda':
        settings = Settings()
        dfh_obda = DataFrameHelper(hive=True)
        sparql_endpoint = f'http://{socket.gethostbyname(socket.gethostname())}:{settings.ontop_service.port}/sparql'
        wrapper = PySPARQLWrapper(dfh_obda.spark_session, sparql_endpoint)
        result = wrapper.query(data['input'][0])
        resultDF = result.dataFrame
        dfh_obda.spark_session.stop()
        return (resultDF, {}, False)
        

class WorkFlow(Resource):

    @jwt_required()
    @check_permissions_workspace()
    def post(self, workspace_id):
        """
        Data is fetched using request.data method. Data is a array of json(dictionary) objects.
        It just submits the request and doesn't return anything. To check if request was
        completed successfully, check if the target datamart is showing in Data management tab.
        """

        try:
            data = json.loads(request.data)
            for data_input in data:
                # data_input['input'] is always an array of dictionary objects. though only index [0]
                # is fetched everytime except for case of join, where 2 inputs are required
                poly = True
                if data_input['auto'] == False:
                    poly = data_input['isPolymorph']

                result = process_input(data_input['input'][0], [], poly, data_input['isPolymorph'], data_input['setFk'], data_input['setPk'], data_input['auto'])
                
                filename = f"{data_input['name'].replace(' ','').lower()}"
                data = {"datasource_definition": json.dumps({
                    "name": f"{data_input['name']}",
                    "spark_packages": ["org.mongodb.spark:mongo-spark-connector_2.12:3.0.0"],
                    "read_type": "SOURCE_FILE",
                    "read_format": "json",
                    "read_options": {"multiLine": "true"},
                    "source_files": [filename],
                    "plugin_files": ["plugin"],
                    "write_type": data_input['write_type']
                }),
                    "title": data_input['name'],
                    "query": "",
                    "lineage": json.dumps(result[1]),
                    "code": f"{json.dumps(data_input)}",
                    "is_workflow": True,
                    "is_polymorph": result[2],
                }
                access_token = create_access_token(identity={'email': get_jwt_identity()["email"]})
                file = io.BytesIO(json.dumps(result[0].toJSON().map(lambda d: json.loads(d)).collect()).encode('utf-8'))

                files = {filename: (f'{filename}.json', file, 'application/json')}
                settings = Settings()
                resp = requests.post(
                    f"http://{settings.server.host}:{settings.server.port}/api/v1/workspaces/{workspace_id}/datasets/create",
                    data=data,
                    files=files,
                    cookies={"access_token_cookie": access_token}
                )
                result[3].spark_session.stop()
            return "", 200

        except Exception as ex:
            return ex, 200
        

