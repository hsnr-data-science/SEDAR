from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_entities_data_access, dataset_logs_data_access

class Entities(Resource):
    """
    Class to manage the entities of the schema in a dataset.
    """

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("name", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
    )
    def put(self, workspace_id:str, dataset_id:str, entity_id:str, name:str, description:str):
        """
        API put request for editing the entities of a schema.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param entity_id: id of the entity.
        :param name: display name of the entity.
        :param description: short description to describe the entity.
        :returns: updated entity.
        """
        try:
            entity_old = dataset_entities_data_access.get(entity_id)
            entity = dataset_entities_data_access.update(entity_id, name, description)
            try:
                user = get_jwt_identity()['email']
                dataset_logs_data_access.create(dataset_id, {"en":f"The entity {entity.name} ({entity.uid}) was updated.", "de":"Die Entität {entity.name} ({entity.uid}) wurde verändert."}, "UPDATE", user, dataset_logs_data_access.get_diffs(entity_old.__properties__, entity.__properties__, ['display_name', 'description']))
            except:
                pass
            return entity.serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("annotation_id", default=None, type=str, required=False),
        Argument("description", default=None, type=str, required=False),
        Argument("annotation", default=None, type=str, required=False),
        Argument("ontology_id", default=None, type=str, required=False),
        Argument("key", default=None, type=str, required=False),
    )
    def patch(self, workspace_id:str, dataset_id:str, entity_id:str, annotation_id:str, description:str, annotation:str, ontology_id:str, key:str):
        """
        API patch request for adding or deleting a annotation to the entity.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param entity_id: id of the entity.
        :param description: short description to describe the entity.
        :param annotation: annotation string.
        :param ontology_id: id of the coressponding ontology.
        :param key: key for the annotation.
        :returns: created or existing tag.
        """
        try:
            user = get_jwt_identity()['email']
            entity = dataset_entities_data_access.patch(entity_id, annotation_id, description, annotation, ontology_id, dataset_id, key)
            if entity != None:
                try:
                    e = dataset_entities_data_access.get(entity_id)
                    if key!='' and key!=None:
                        d = {"en":f"The entity {e.name} ({e.uid}) was annotated with a custom annotation: {key}: {annotation}.", "de":f"Die Entität {e.name} ({e.uid}) wurde annotiert mit einer benutzerdefinierten Annotation: {key}: {annotation}."}
                    else:
                        d = {"en":f"The entity {e.name} ({e.uid}) was annotated with: {annotation}.", "de":f"Die Entität {e.name} ({e.uid}) wurde annotiert mit: {annotation}."}
                    dataset_logs_data_access.create(dataset_id, d, "CREATE", user)
                except:
                    pass
                return entity.serialize(), 201
            else:
                try:
                    e = dataset_entities_data_access.get(entity_id)
                    if key!='' and key!=None:
                        d = {"en":f"The custom annotation with the id {annotation_id} was removed from the entity {e.name} ({e.uid}).", "de":f"Die benutzerdefinierte Annotation mit der ID {annotation_id} wurde von der Entität {e.name} ({e.uid}) entfernt."}
                    else:
                        d = {"en":f"The annotation with the id {annotation_id} was removed from the entity {e.name} ({e.uid}).", "de":f"Die Annotation mit der ID {annotation_id} wurde von der Entität {e.name} ({e.uid}) entfernt."}
                    dataset_logs_data_access.create(dataset_id, d, "DELETE", user)
                except:
                    pass
                return entity, 201 
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")