from flask import jsonify
from flask_jwt_extended import jwt_required
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from database.data_access import workspace_data_access
from services.decorators import parse_params, check_permissions_workspace
from flask_restful.inputs import boolean


class Workspaceusers(Resource):
    """
    Class to manage the users of workspace.
    """

    @jwt_required()
    @check_permissions_workspace()
    @parse_params()
    def get(self, workspace_id:str):
        """
        API get request for getting all users of the current workspace.

        :param workspace_id: id of the workspace.
        :returns: current user object.
        """
        try:
            return jsonify([item.serialize() for item in workspace_data_access.get_all_users(workspace_id)])
        except Exception as ex:
            print(ex)
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace(author_only=True)
    @parse_params(
        Argument("add", default=None, type=boolean, required=False),
        Argument("email", default=None, type=str, required=False),
        Argument("can_read", default=None, type=boolean, required=False),
        Argument("can_write", default=None, type=boolean, required=False),
        Argument("can_delete", default=None, type=boolean, required=False),
    )
    def put(self, workspace_id:str, add:bool, email:str, can_read:bool, can_write:bool, can_delete:bool):
        """
        API put request to add users to manage the user access of a given workspace.

        :param workspace_id: id of the current workspace.
        :param add: defines if userrel should be added, updated or deleted.
        :param email: email of user that should be removed or added.
        :param can_read: defines wether the user can read or not.
        :param can_write: defines wether the user can write or not.
        :param can_delete: defines wether the user can delete or not.
        :returns: user object.
        """
        try:
            return workspace_data_access.add_user(workspace_id, add, email, can_read, can_write, can_delete).serialize(workspace_data_access.get(workspace_id))
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

