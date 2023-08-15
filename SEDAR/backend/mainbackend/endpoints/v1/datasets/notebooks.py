from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset, check_permissions_notebook
from database.data_access import dataset_notebook_data_access, dataset_logs_data_access
from flask_restful.inputs import boolean
from werkzeug.exceptions import InternalServerError


# @jwt_required()
# @check_permissions_workspace()
# @check_permissions_dataset()
@parse_params(
    Argument("notebook_id", default=None, type=str, required=True),
    Argument("run_id", default=None, type=str, required=True),
    Argument("experiment_id", default=None, type=str, required=True), 
)
def add_mlrun_to_notebook(workspace_id:str, dataset_id:str, notebook_id:str, run_id:str, experiment_id:str):
    try:
        
        dataset_notebook_data_access.add_mlrun_to_notebook(notebook_id, run_id, experiment_id)
        
        return run_id
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_permissions_workspace()
@check_permissions_dataset()
@parse_params(
    Argument("notebook_type", default=None, type=str, required=True),
)
def notebook_code(workspace_id:str, dataset_id:str, notebook_type:str):
    """
    API get request to get all public and own notebooks.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param notebook_type: type of the notebook.
    :returns: code for the dataframe.
    """   
    try:
        return jsonify({"code":dataset_notebook_data_access.notebook_code(dataset_id, notebook_type)})
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")

class Notebooks(Resource):
    """
    Class to manage notebooks.
    """

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_read=True)
    def get(self, workspace_id:str, dataset_id:str, notebook_id:str=None):
        """
        API get request to get all public and own notebooks.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param notebook_id: id of the notebook.
        :returns: notebooks associated to the dataset.
        """   
        try:
            if notebook_id == None:
                return [item.serialize() for item in dataset_notebook_data_access.get_all(dataset_id, get_jwt_identity()['email'])]
            else:
                pass
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("title", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
        Argument("type", default=None, type=str, required=True),
        Argument("is_public", default=None, type=boolean, required=True),
        Argument("version", default=None, type=str, required=True)
    )
    def post(self, workspace_id:str, dataset_id:str, title:str, description:str, type:str, is_public:bool, version:str):
        """
        API post request to create a new notebook. 

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param notebook_id: id of the notebook.
        :param title: title of the notebook.
        :param description: description of the notebook.
        :param type: type of the notebook (JUPYTER).
        :param is_public: defined whether the notebook is public or not.
        :param version: version of the dataset, that is used in the notebook.
        :returns: newly created notebook.
        """
        try:
            user = get_jwt_identity()['email']
            notebook = dataset_notebook_data_access.create(workspace_id, dataset_id, title, description, get_jwt_identity()['email'], type, is_public, version)
            try:
                dataset_logs_data_access.create(dataset_id, {"en":f"A new {notebook.type} notebook was created.", "de":f"Ein neues {notebook.type}-Notebook wurde erstellt."}, "CREATE", user)
            except:
                pass 
            return notebook.serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_notebook()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("title", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
        Argument("is_public", default=None, type=boolean, required=True),
        Argument("version", default=None, type=str, required=True)
    )
    def put(self, workspace_id:str, dataset_id:str, notebook_id:str, title:str, description:str, is_public:bool, version:str):
        """
        API put request to update a notebook.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param notebook_id: id of the notebook.
        :param title: title of the notebook.
        :param description: description of the notebook.
        :param is_public: defined whether the notebook is public or not.
        :param version: version of the dataset, that is used in the notebook.
        :returns: updated notebook.
        """
        try:
            user = get_jwt_identity()['email']
            notebook = dataset_notebook_data_access.update(workspace_id, dataset_id, notebook_id, title, description, is_public, version)
            try:
                dataset_logs_data_access.create(dataset_id, {"en":f"The notebook with the id {notebook.uid} was updated.", "de":f"Das Notebook mit der ID {notebook.uid} wurde verändert."}, "UPDATE", user)
            except:
                pass
            return notebook.serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_delete=True)
    @check_permissions_notebook()
    @parse_params()
    def delete(self, workspace_id:str, dataset_id:str, notebook_id:str):
        """
        API delete request for notebooks. Deletes a notebook associated to a dataset.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param notebook_id: id of the notebook.
        :returns: return 200 or internal error.
        """
        try:
            dataset_notebook_data_access.delete(workspace_id, dataset_id, notebook_id)
            try:
                user = get_jwt_identity()['email']
                dataset_logs_data_access.create(dataset_id, {"en":f"The notebook with the id {notebook_id} was deleted.", "de":f"Das Notebook mit der ID {notebook_id} wurde gelöscht."}, "DELETE", user)
            except:
                pass
            return "", 200 
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")