from werkzeug.exceptions import NotFound
from database.data_access import ontology_data_access
from database.data_access import dataset_data_access
from commons.models.dataset.models import Annotation, Attribute
from neomodel import db

def get(attribute_id:str) -> Attribute:
    """
    Helper function to return a given attribute.

    :attribute_id: to get the attribute.
    :returns: the attribute.
    """
    attribute = Attribute.nodes.get_or_none(uid=attribute_id)

    if not attribute:
        raise NotFound(f"Attribute with id {attribute_id} not found")

    return attribute


def update(attribute_id:str, datatype:str, description:str, is_fk:bool, is_pk:bool, dataset_id:str, contains_PII:bool, is_nullable:bool)  -> Attribute:
    """
    Update function for editing the attributes of a schema.

    :param attribute_id: id of the attribute.
    :param datatype: name of the datatype.
    :param description: short description to describe the attribute.
    :param is_fk: defines whether the attribute is a foreign key or not.
    :param is_pk: defines whether the attribute is a primary key or not.
    :param dataset_id: id of the dataset.
    :param contains_PII: defines whether the attribute might contain PII(Personal Identifiable Information).
    :param is_nullable: defines whether the attribute is nullable or not.
    :returns: attribute object.
    """
    entity = get(attribute_id)
    if description!=None:
        entity.description = description
    entity.data_type = datatype
    if is_nullable!=None:
        entity.nullable = is_nullable
    if is_fk!=None:
        entity.is_fk = is_fk
    if entity.is_fk==False:
        if len(entity.foreign_key_to)!=0:
            for f in entity.foreign_key_to:
                entity.foreign_key_to.disconnect(f)
    if is_pk!=None:
        entity.is_pk = is_pk
    if contains_PII!=None:
        entity.contains_PII = contains_PII
    entity.save()
    return entity

def patch(attribute_id:str, id_of_fk_dataset:str, id_of_fk_attribute:str, set_pk:bool, annotation_id:str=None, annotation:str=None, ontology_id:str=None, is_workflow:bool=False, dataset_id=None)  -> Attribute:
    """
    Update function for editing the attributes of a schema.

    :param annotation_id: id of the annotation.
    :param annotation: annotation string.
    :param ontology_id: id of the coressponding ontology.
    :param attribute_id: id of the attribute.
    :param id_of_fk_dataset: id of the fk dataset.
    :param id_of_fk_attribute: id of the attribute for the fks.
    :param set_pk: defined whether the pk should be set or not.
    :param is_workflow: if is workflow skip other logic.
    :returns: attribute object.
    """
    entity = get(attribute_id)
    if is_workflow==False:
        ds = dataset_data_access.get(dataset_id)
        if annotation!=None and ontology_id!=None:
            an = Annotation(instance=annotation)
            an.save()
            ontology = ontology_data_access.get(ontology_id)
            entity.annotation.connect(an, {"version":ds.current_version_of_schema})
            an.ontology.connect(ontology)
            return an
        if annotation_id!=None:
            an = Annotation.nodes.get_or_none(uid=annotation_id)
            if ds.current_version_of_schema==0:
                an.delete()
            else:
                query= "MATCH (f:Attribute {uid: '"+entity.uid+"'})-[r:HAS_ANNOTATION]->(a:Annotation{uid:'"+annotation_id+"'}) RETURN COUNT(r)"
                results = db.cypher_query(query)
                if results[0][0][0]==1:
                    an.delete()
                else:
                    query= "MATCH (f:Attribute {uid: '"+entity.uid+"'})-[r:HAS_ANNOTATION{version:"+str(ds.current_version_of_schema)+"}]->(a:Annotation{uid:'"+annotation_id+"'}) DELETE r"
                    results = db.cypher_query(query)
            return None
        else:
            fk_attr = get(id_of_fk_attribute)
            rel = entity.foreign_key_to.relationship(fk_attr)
            if rel!=None:
                entity.foreign_key_to.disconnect(fk_attr)
            else:
                entity.is_fk=True
                if fk_attr.is_pk != True and set_pk==True:
                    fk_attr.is_pk = True
                    fk_attr.save()
                entity.foreign_key_to.connect(fk_attr, {"dataset_uid": id_of_fk_dataset, "source_uid": dataset_id})
    else:
        fk_attr = get(id_of_fk_attribute)
        rel = entity.foreign_key_to.relationship(fk_attr)
        if rel==None:
            entity.is_fk=True
            if fk_attr.is_pk != True and set_pk==True:
                fk_attr.is_pk = True
                fk_attr.save()
            entity.foreign_key_to.connect(fk_attr, {"dataset_uid": id_of_fk_dataset, "source_uid": dataset_id})
    entity.save()
    return entity
