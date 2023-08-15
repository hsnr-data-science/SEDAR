from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from services.decorators import parse_params,check_permissions_workspace
from database.data_access import workspace_data_access, user_data_access
from werkzeug.exceptions import InternalServerError

class Workspaces(Resource):
    """
    Class to manage workspaces.
    """
    @jwt_required()
    @check_permissions_workspace(can_read=True)
    def get(self, workspace_id:str=None):
        """
        API get request for workspaces.

        :param workspace_id: id of the workspace.
        :returns: workspaces associated to the given user.
        """  
        try:
            if workspace_id==None:
                user = user_data_access.get(get_jwt_identity()['email'])
                return [item.serialize(True, user) for item in workspace_data_access.get_all(user)]
            else:
                return workspace_data_access.get(workspace_id).serialize()
        except Exception as ex:
            print(ex)
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @parse_params(
        Argument("title", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False)
    )
    def post(self, title:str, description:str):
        """
        API post request for workspaces. Creates a new workspace for a given user

        :param title: title of the new workspace.
        :param description: description of the new workspace.
        :returns: newly added workspace.
        """
        try:
            user = user_data_access.get(get_jwt_identity()['email']) 
            return workspace_data_access.create(title, user, description).serialize(True, user)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    @jwt_required()
    @check_permissions_workspace(can_read=True, can_write=True)
    @parse_params(
        Argument("title", default=None, type=str, required=False),
        Argument("description", default=None, type=str, required=False),
    )
    def put(self, workspace_id:str, title:str, description:str):
        """
        API put request for workspaces. Updates the given workspace.

        :param title: new title of the workspace.
        :param description: description of the workspace.
        :returns: updated workspace.
        """
        try:
            return workspace_data_access.update(workspace_id, title, description).serialize()
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    def delete(self, workspace_id:str):
        """
        API delete request for workspaces. Deletes a given workspace by workspace_id.

        :param workspace_id: workspace_id of a workspace
        :returns: okay response to notify the client.
        """ 
        try:
            email = get_jwt_identity()['email']
            workspace_data_access.delete(workspace_id, user_data_access.get(email))
            return f"deleted workspace {workspace_id}", 200
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
