from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import tag_data_access, dataset_logs_data_access

class Tags(Resource):
    """
    Class to manage tags of a dataset.
    """

    @jwt_required()
    @check_permissions_workspace()
    def get(self, workspace_id:str, dataset_id:str=None, tag_id:str=None):
        """
        API get request to get all tags of workspace.

        :returns: tags associated to the dataset or workspace.
        """   
        try:
            if tag_id == None:
                return [item.serialize(True) for item in tag_data_access.get_all(workspace_id)]
            else:
                pass
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("title", default=None, type=str, required=True),
        Argument("annotation", default=None, type=str, required=False),
        Argument("ontology_id", default=None, type=str, required=False),
        Argument("tag_id", default=None, type=str, required=False),
    )
    def post(self, workspace_id:str, dataset_id:str, title:str, annotation:str, ontology_id:str, tag_id:str):
        """
        API post request for tags. Creates a new tag if is does not exists already in the workspace.

        :param workspace_id: id of the workspace.
        :param dataset_id: if of the dataset.
        :param title: title of the new workspace.
        :param annotation: annotation string.
        :param ontology_id: id of the coressponding ontology.
        :param tag_id: id of a existing tag.
        :returns: newly created tag or the existing tag.
        """
        try:
            user = get_jwt_identity()['email']
            tag = tag_data_access.create(workspace_id, dataset_id, title, annotation, ontology_id, tag_id)
            try:
                dataset_logs_data_access.create(dataset_id, {"en":f"The tag {tag.title} ({tag.uid}) was added with the annotation: {tag.annotation[0].instance}.", "de":f"Der Tag {tag.title} ({tag.uid}) wurde hinzugefügt mit der Annotation: {tag.annotation[0].instance}."}, "CREATE", user)
            except:
                pass
            return tag.serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()  
    @check_permissions_dataset(can_delete=True)
    def delete(self, workspace_id:str, dataset_id:str, tag_id:str):
        """
        API delete request for tag.

        :param workspace_id: id of the workspace.
        :param dataset_id: if of the dataset.
        :param tag_id: if of the tag.
        :returns: workspaces associated to a user.
        """
        try:
            user = get_jwt_identity()['email']
            tag_data_access.delete(workspace_id, dataset_id, tag_id)
            try:
                dataset_logs_data_access.create(dataset_id, {"en":f"The tag with the id {tag_id} was deleted.", "de":f"Der Tag mit der ID {tag_id} wurde gelöscht."}, "DELETE", user)
            except:
                pass
            return f"deleted tag {tag_id}", 200 
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")