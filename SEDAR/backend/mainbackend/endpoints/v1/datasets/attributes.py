from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_attributes_data_access, dataset_logs_data_access
from flask_restful.inputs import boolean

class Attributes(Resource):
    """
    Class to manage the attributes of the schema in a dataset.
    """

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("datatype", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
        Argument("is_fk", default=None, type=boolean, required=False),
        Argument("is_pk", default=None, type=boolean, required=False),
        Argument("contains_PII", default=None, type=boolean, required=False),
        Argument("is_nullable", default=None, type=boolean, required=False),
    )
    def put(self, workspace_id:str, dataset_id:str, attribute_id:str, datatype:str, description:str, is_fk:bool, is_pk:bool, contains_PII:bool, is_nullable:bool):
        """
        API put request for editing the attributes of a schema.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param attribute_id: id of the attribute.
        :param datatype: name of the datatype.
        :param description: short description to describe the attribute.
        :param is_fk: defines whether the attribute is a foreign key or not.
        :param is_pk: defines whether the attribute is a primary key or not.
        :param contains_PII: defines whether the attribute might contain PII(Personal Identifiable Information).
        :param is_nullable: defines whether the attribute is nullable or not.
        :returns: updated attribute.
        """
        try:
            attr_old = dataset_attributes_data_access.get(attribute_id)
            attr = dataset_attributes_data_access.update(attribute_id, datatype, description, is_fk, is_pk, dataset_id, contains_PII, is_nullable)
            try:
                user = get_jwt_identity()['email']
                dataset_logs_data_access.create(dataset_id, {"en":f"The attribut {attr.name} ({attr.uid}) was updated.", "de":f"Das Attribut {attr.name} ({attr.uid}) wurde verändert."}, "UPDATE", user, dataset_logs_data_access.get_diffs(attr_old.__properties__, attr.__properties__, ['datatype', 'description', 'is_fk', 'is_pk', 'dataset_id', 'contains_PII', 'nullable']))
            except:
                pass
            return attr.serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("annotation", default=None, type=str, required=False),
        Argument("ontology_id", default=None, type=str, required=False),
        Argument("annotation_id", default=None, type=str, required=False),
        Argument("id_of_fk_dataset", default=None, type=str, required=False),
        Argument("id_of_fk_attribute", default=None, type=str, required=False),
        Argument("set_pk", default=False, type=boolean, required=False),
    )
    def patch(self, workspace_id:str, dataset_id:str, attribute_id:str, annotation_id:str, annotation:str, ontology_id:str, id_of_fk_dataset:str, id_of_fk_attribute:str, set_pk:bool):
        """
        API patch request for adding a fk construct to the attribute.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param attribute_id: id of the attribute.
        :param annotation_id: id of the annotation.
        :param annotation: annotation string.
        :param ontology_id: id of the coressponding ontology.
        :param id_of_fk_dataset: id of the fk dataset.
        :param id_of_fk_attribute: id of the attribute for the fks.
        :param set_pk: defined whether the pk should be set or not.
        :returns: updated attribute
        """
        try:
            user = get_jwt_identity()['email']
            attr = dataset_attributes_data_access.patch(attribute_id, id_of_fk_dataset, id_of_fk_attribute, set_pk, annotation_id, annotation, ontology_id, dataset_id=dataset_id)
            if attr!=None:
                try:
                    a = dataset_attributes_data_access.get(attribute_id)
                    if id_of_fk_attribute=='':
                        d = {"en":f"The attribute {a.name} ({a.uid}) was annotated.", "de":f"Das Attribut {a.name} ({a.uid}) wurde annotiert."}
                        state = "CREATE"
                    else:
                        d = {"en":f"For the attribute {a.name} ({a.uid}) a foreign key to {id_of_fk_attribute} was set or unset.", "de":f"Für das Attribut {a.name} ({a.uid}) wurde ein Fremdschlüssel zu {id_of_fk_attribute} gesetzt oder die Verbindung gelöscht."}
                        state = "UPDATE"
                    dataset_logs_data_access.create(dataset_id, d, state, user)
                except:
                    pass
                return attr.serialize(), 201
            else:
                try:
                    a = dataset_attributes_data_access.get(attribute_id)
                    dataset_logs_data_access.create(dataset_id, {"en":f"An annotation was removed from attribute {a.name} ({a.uid}).", "de":f"Eine Annotation wurde von Attribut {a.name} ({a.uid}) entfernt."}, "DELETE", user)
                except:
                    pass
                return attr, 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    