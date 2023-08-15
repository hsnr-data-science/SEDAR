from flask import jsonify, Response
from flask_jwt_extended import jwt_required
from flask_restful import Resource
from werkzeug.exceptions import InternalServerError
from flask_restful.reqparse import Argument
from database.data_access import mapping_data_access
from services.decorators import parse_params, check_permissions_workspace

class Mappings(Resource):
    #@jwt_required
    def get(self, workspace_id):
        """
        API get request for mappings.

        :param workspace_id: id of workspace.
        :returns: all mappings of a given workspace in JSON format.
        """
        try:
            return jsonify([item for item in mapping_data_access.get_list(workspace_id)])
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    
    @jwt_required()
    @check_permissions_workspace(can_read=True, can_write=True)
    @parse_params(
        Argument("mappings_file", type=str, required=True),
        Argument("name", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
        Argument("mapping_id", default=None, type=str, required=False),
    )
    def post(self, workspace_id, mappings_file, name, description, mapping_id):
        """
        API post request to add a new mapping.

        :param name: Name of new mapping.
        :param file: The file containing the mapping.
        :param workspace_id: id of workspace the file is to be added.
        :param description: description of the mapping_file to be added.
        :param mapping_id: mapping_id of the mapping_file to be edited. Only used if present.
        :returns: newly added mapping.
        """
        try:
            if mapping_id:
                return jsonify(mapping_data_access.update(name=name, mapping_id=mapping_id, mappings_file=mappings_file, workspace_id=workspace_id, description=description))
            else:
                return jsonify(mapping_data_access.add(name=name, mappings_file=mappings_file, workspace_id=workspace_id, description=description))
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace(can_read=True, can_write=True)
    @parse_params(
        Argument("mappings_file", type=str, required=True),
        Argument("name", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
    )
    def put(self, workspace_id:str, mapping_id:str, name:str, description:str):
        """
        API put request for updating a mapping in a workspace.

        :param workspace_id: id of workspace.
        :param mapping_id: id of mapping.
        :param title: title of mapping.
        :param description: description of mapping.
        :return: updated mapping.
        """
        try:
            return mapping_data_access.update(workspace_id, mapping_id, name, description)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace(can_read=True, can_write=True)
    @parse_params(
        Argument("mapping_id", type=str, required=True),
    )
    def delete(self, workspace_id, mapping_id):
        """
        API delete request for deleting an mapping from a workspace.

        :param workspace_id: id of workspace.
        :param mapping_id: id of ontology in MongoDB.
        :return: HTTP-Code 200 if the deletion was successful and failure-code otherwise.
        """
        try:
            print(mapping_id)
            mapping_data_access.delete(workspace_id, mapping_id)
            return Response(status=204)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
