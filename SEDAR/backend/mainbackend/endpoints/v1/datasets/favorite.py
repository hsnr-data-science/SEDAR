from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import InternalServerError
from services.decorators import check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_favorite_data_access

"""
Class to manage the datasets marked as favorite in a workspace.
"""

@jwt_required()
@check_permissions_workspace()
def get_favorites(workspace_id:str):
    """
    API get request to get all favorites of a specific user.

    :param workspace_id: id of the workspace.
    :returns: all datasets marked as favorite.
    """   
    try:
        email = get_jwt_identity()['email']
        return jsonify([item.serialize(email=email, is_search=True) for item in dataset_favorite_data_access.get_all(workspace_id, email)]), 200
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset()
def set_favorite(workspace_id:str, dataset_id:str):
    """
    API patch request for adding or removing a connection between a given user and a dataset as favorite. 

    :param workspace_id: id of the workspace.
    :param dataset_id: the id of the dataset.
    :returns: 200 status or internal server error
    """   
    try:
        dataset_favorite_data_access.patch(dataset_id, get_jwt_identity()['email'])
        return "", 200 
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")
