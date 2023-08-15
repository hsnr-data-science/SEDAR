from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from endpoints.v1.misc import index_sourcedata
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_data_access, dataset_logs_data_access
from flask_restful.inputs import boolean
from flask_restful import inputs
from apscheduler.schedulers.background import BackgroundScheduler
from services.kafka_service import start_profiling as s_p

class Datasets(Resource):
    """
    Class to manage datasets in a workspace.
    """

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_read=True)
    @parse_params(
        Argument("get_unpublished", default=False, type=boolean, required=False),
        Argument("schema_only", default=None, type=boolean, required=False),
    )
    def get(self, workspace_id:str, get_unpublished:bool, schema_only:bool, dataset_id:str = None):
        """
        API get request to get a dataset in a given workspace.

        :param get_unpublished: needed for ingestion page.
        :param dataset_id: defines wether the schema or only the dataset is send back. This is need for better performance.
        :returns: dataset that is in the given workspace.
        """   
        try:
            email = get_jwt_identity()['email']
            if dataset_id==None:
                return jsonify([item.serialize(email=email) for item in dataset_data_access.get_all(workspace_id, get_unpublished, user_id=email)])
            else:
                return dataset_data_access.get(dataset_id).serialize(email=email, schema_only=schema_only)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_read=True, can_write=True)
    @parse_params(
        Argument("title", default=None, type=str, required=False),
        Argument("description", default=None, type=str, required=False),
        Argument("author", default=None, type=str, required=False),
        Argument("longitude", default=None, type=str, required=False),
        Argument("latitude", default=None, type=str, required=False),
        Argument("range_start", default=None, type=inputs.datetime_from_iso8601, required=False),
        Argument("range_end", default=None, type=inputs.datetime_from_iso8601, required=False),
        Argument("license", default=None, type=str, required=False),
        Argument("language", default=None, type=str, required=False),
    )
    def put(self, workspace_id:str, dataset_id:str, title:str, description:str, author:str, longitude:str, latitude:str, range_start, range_end, license:str, language:str):
        """
        API put request to update the dataset.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param title: title of dataset.
        :param description: description of dataset.
        :param author: author of the associated data.
        :param longitude: longitude of the associated data.
        :param latitude: latitude of the associated data.
        :param range_start: range_start of the associated data.
        :param range_end: range_end of the associated data.
        :param license: license of the associated data.
        :param language: language of the dataset.
        :returns: updated dataset.
        """
        try:
            user = get_jwt_identity()['email']
            ds_old = dataset_data_access.get(dataset_id)
            ds = dataset_data_access.update(workspace_id, dataset_id, title, description, author, longitude, latitude, range_start, range_end, license, language)
            try:
                dataset_logs_data_access.create(dataset_id, {"en":"The dataset was updated.", "de":"Der Datensatz wurde verändert."}, "UPDATE", user, dataset_logs_data_access.get_diffs(ds_old.__properties__, ds.__properties__, ['workspace_id', 'dataset_id', 'title', 'description', 'author', 'longitude', 'latitude', 'range_start', 'range_end', 'license', 'language']))
            except:
                pass
            return ds.serialize(email = user), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(author_only=True)
    @parse_params(
        Argument("index", default=False, type=boolean, required=False),
        Argument("with_thread", default=True, type=boolean, required=False),
        Argument("profile", default=False, type=boolean, required=False)
    )
    def patch(self, workspace_id:str, dataset_id:str, index:bool, with_thread:bool, profile:bool):
        """
        API patch request to set the dataset as published.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param index: wheter the data should be indexed or not.
        :param with_thread: is needed for testing only.
        :param profile: wheter the data should be profiled or not.
        :returns: 200 or internal error.
        """
        try:
            user = get_jwt_identity()['email']
            dataset_data_access.patch(workspace_id, dataset_id)
            try:
                dataset_logs_data_access.create(dataset_id, {"en":"The dataset was published.", "de":"Der Datensatz wurde veröffentlicht."}, "UPDATE", user)
            except:
                pass
            if index == True:
                if with_thread==True:
                    scheduler = BackgroundScheduler()
                    scheduler.add_job(lambda: index_sourcedata(workspace_id, dataset_id))
                    scheduler.start()
                else:
                    index_sourcedata(workspace_id, dataset_id)
                try:
                    dataset_logs_data_access.create(dataset_id, {"en":f"The dataset was indexed.", "de":f"Der Datensatz wurde indexiert."}, "UPDATE", user)
                except:
                    pass  
            if profile == True:
                s_p(dataset_id, str(0)) 
                try:
                    user = get_jwt_identity()['email']
                    dataset_logs_data_access.create(dataset_id, {"en":f"Started profiling.", "de":f"Profiling wurde gestartet."}, "CREATE", user)
                except:
                    pass
            return '', 200
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(author_only=True)
    def delete(self, workspace_id:str, dataset_id:str):
        """
        API delete request to delete the dataset and everything related.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :returns: 200 or internal error.
        """
        try:
            dataset_data_access.delete(workspace_id, dataset_id)
            return '', 200
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")