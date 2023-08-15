import io
import json
from flask import jsonify, send_file
from flask_jwt_extended import jwt_required
from flask_restful import Resource
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_logs_data_access
from flask_restful.reqparse import Argument
from flask_restful.inputs import boolean

class Logs(Resource):
    """
    Class to manage logs of a datasets.
    """

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_read=True)
    @parse_params(
        Argument("is_download", default=False, type=boolean, required=False),
        Argument("language", default='en', type=str, required=False)
    )
    def get(self, workspace_id:str, dataset_id:str, is_download:bool, language:str):
        """
        API get request to get latest dataset logs.

        :returns: logs
        """   
        try:
            if is_download==False:
                return jsonify(dataset_logs_data_access.get(dataset_id).serialize())
            else:
                return send_file(io.BytesIO(json.dumps(dataset_logs_data_access.get(dataset_id).serialize(True, language)).encode('utf-8')), attachment_filename=f'logs_{dataset_id}.json')
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")