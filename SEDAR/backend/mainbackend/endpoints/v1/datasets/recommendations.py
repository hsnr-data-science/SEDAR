from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_recommendations_access, dataset_logs_data_access

class Recommendations(Resource):
    """
    Class to manage recommendations fora a dataset.
    """

    @jwt_required()
    @check_permissions_dataset(can_read=True)
    @check_permissions_workspace()
    def get(self, workspace_id:str, dataset_id:str):
        """
        API get request to get all recommened/linked datasets for the given dataset.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :returns: datasets that are linked to the dataset.
        """   
        try:
            email = get_jwt_identity()['email']
            return jsonify([item['data'].serialize(email=email, custom_link=item['custom_description'], is_search=True) for item in dataset_recommendations_access.get(dataset_id, workspace_id)])
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("id_of_linked_dataset", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
    )
    def post(self, workspace_id:str, dataset_id:str, id_of_linked_dataset:str, description:str):
        """
        API post request to link a dataset.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param id_of_linked_dataset: id of the dataset that should be linked.
        :param description: description of the link.
        :returns: recommended datasets.
        """
        try:
            user = get_jwt_identity()['email']
            res = [item['data'].serialize(email=user, custom_link=item['custom_description'], is_search=True) for item in dataset_recommendations_access.post(dataset_id, id_of_linked_dataset, description, workspace_id)]
            try:
                dataset_logs_data_access.create(dataset_id, {"en":f"A dataset ({id_of_linked_dataset}) was added for recommendation.", "de":f"Ein Datensatz ({id_of_linked_dataset}) wurde zur Empfehlung hinzugefügt."}, "CREATE", user)
                dataset_logs_data_access.create(id_of_linked_dataset, {"en":f"A dataset ({dataset_id}) was added for recommendation.", "de":f"Ein Datensatz ({dataset_id}) wurde zur Empfehlung hinzugefügt."}, "CREATE", user)
            except:
                pass
            return jsonify(res)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("id_of_linked_dataset", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
    )
    def put(self, workspace_id:str, dataset_id:str, id_of_linked_dataset:str, description:str):
        """
        API put request to update the link to a dataset.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param id_of_linked_dataset: id of the dataset that should be linked.
        :param description: description of the link.
        :returns: recommended datasets.
        """
        try:
            user = get_jwt_identity()['email']
            res = [item['data'].serialize(email=user, custom_link=item['custom_description'], is_search=True) for item in dataset_recommendations_access.put(dataset_id, id_of_linked_dataset, description, workspace_id)]
            try:
                dataset_logs_data_access.create(dataset_id, {"en":f"The description for the recommendation from {dataset_id} to {id_of_linked_dataset} was updated.", "de":f"Die Beschreibung für die Empfehlung von {dataset_id} zu {id_of_linked_dataset} wurde aktualisiert."}, "UPDATE", user)
                dataset_logs_data_access.create(id_of_linked_dataset, {"en":f"The description for the recommendation from {id_of_linked_dataset} to {dataset_id} was updated.", "de":f"Die Beschreibung für die Empfehlung von {id_of_linked_dataset} zu {dataset_id} wurde aktualisiert."}, "UPDATE", user)
            except:
                pass
            return jsonify(res)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_delete=True)
    @parse_params(
        Argument("id_of_linked_dataset", default=None, type=str, required=True),
    )
    def delete(self, workspace_id:str, dataset_id:str, id_of_linked_dataset:str):
        """
        API delete request to unlink a dataset.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param id_of_linked_dataset: id of the dataset that should be linked.
        :returns: 200 or internal error.
        """
        try:
            user = get_jwt_identity()['email']
            res = [item['data'].serialize(email=user, custom_link=item['custom_description'], is_search=True) for item in dataset_recommendations_access.delete(dataset_id, id_of_linked_dataset, workspace_id)]
            try:
                dataset_logs_data_access.create(dataset_id, {"en":f"The recommendation to the dataset with the following id {id_of_linked_dataset}) was removed.", "de":f"Die Empfehlung für den Datensatz mit der folgenden ID {id_of_linked_dataset}) wurde entfernt."}, "DELETE", user)
                dataset_logs_data_access.create(id_of_linked_dataset, {"en":f"The recommendation to the dataset with the following id {dataset_id}) was removed.", "de":f"Die Empfehlung für den Datensatz mit der folgenden ID {dataset_id}) wurde entfernt."}, "DELETE", user)
            except:
                pass
            return jsonify(res)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")