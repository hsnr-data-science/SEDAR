from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful.reqparse import Argument
from endpoints.v1.misc import delete_sourcedata_from_index, index_sourcedata
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_options_data_access, dataset_logs_data_access
from flask_restful.inputs import boolean
from werkzeug.exceptions import InternalServerError
from apscheduler.schedulers.background import BackgroundScheduler

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(author_only=True)
def set_public_status(workspace_id:str, dataset_id:str):
    """
    API request to change the status of the dataset.

    :returns: users.
    """   
    try:
        user = get_jwt_identity()['email']
        res = dataset_options_data_access.set_status(dataset_id, user, workspace_id)
        try:
            if len(res)==0:
                stat = 'public'
            else:
                stat = 'private'
            dataset_logs_data_access.create(dataset_id, {"en":f"The status of the dataset changed to {stat}.", "de":f"Der Status des Datensatzes hat sich auf {stat} geändert."}, "UPDATE", user)
        except:
            pass
        return jsonify(res), 201
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(author_only=True)
@parse_params(
    Argument("email", default=None, type=str, required=False),
    Argument("add", default=None, type=boolean, required=False),
    Argument("can_read", default=None, type=boolean, required=False),
    Argument("can_write", default=None, type=boolean, required=False),
    Argument("can_delete", default=None, type=boolean, required=False),
)
def add_user(workspace_id:str, dataset_id:str, email:str, add:bool, can_read:bool, can_write:bool, can_delete:bool):
    """
    API put request for datasets. Updates the dataset.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param email: email of the user that should be added or removed from.
    :param add: states if a user or a ontology gets removed or added.
    :param can_read: defines wether the user can read or not.
    :param can_write: defines wether the user can write or not.
    :param can_delete: defines wether the user can delete or not.
    :returns: user
    """
    try:
        res = dataset_options_data_access.add_user(dataset_id, email, add, can_read, can_write, can_delete)
        try:
            user = get_jwt_identity()['email']
            if add==True:
                d = {"en":f"The user with the email {email} was granted access.", "de":f"Dem Benutzer mit der E-Mail {email} wurde Zugang gewährt."}
                stat = "CREATE"
            elif add==False:
                d = {"en":f"The user with the email {email} was removed access.", "de":f"Dem Benutzer mit der E-Mail {email} wurde der Zugang entzogen."}
                stat = "DELETE"
            else:
                d = {"en":f"The permissions of the user with the email {email} was changed.", "de":f"Die Berechtigungen des Benutzers mit der E-Mail {email} wurden geändert."}
                stat = "UPDATE"
            dataset_logs_data_access.create(dataset_id, d, stat, user)
        except:
            pass
        return res, 201
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(author_only=True)
@parse_params(
    Argument("with_thread", default=True, type=boolean, required=False)
)
def add_index_data(workspace_id:str, dataset_id:str, with_thread:bool):
    """
    API put request to index the data to elasticsearch.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param with_thread: is needed for testing only.
    :returns: user
    """
    try:
        if with_thread==True:
            scheduler = BackgroundScheduler()
            scheduler.add_job(lambda: index_sourcedata(workspace_id, dataset_id))
            scheduler.start()   
        else:
            index_sourcedata(workspace_id, dataset_id)
        try:
            user = get_jwt_identity()['email']
            dataset_logs_data_access.create(dataset_id, {"en":f"The dataset was indexed.", "de":f"Der Datensatz wurde indexiert."}, "UPDATE", user)
        except:
            pass
        return "", 200
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset(author_only=True)
def delete_index_data(workspace_id:str, dataset_id:str):
    """
    API delete request to unindex the data from elasticsearch.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :returns: user
    """
    try:
        delete_sourcedata_from_index(workspace_id, dataset_id)
        try:
            user = get_jwt_identity()['email']
            dataset_logs_data_access.create(dataset_id, {"en":f"The dataset was removed from the index.", "de":f"Der Datensatz wurde vom Index gelöscht."}, "DELETE", user)
        except:
            pass
        return "", 200
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")