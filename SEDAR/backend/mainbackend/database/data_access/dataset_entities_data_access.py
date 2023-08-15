from werkzeug.exceptions import NotFound
from database.data_access import ontology_data_access
from database.data_access import dataset_data_access
from commons.models.dataset.models import Annotation, Entity
from neomodel import db

def get(entity_id:str) -> Entity:
    """
    Helper function to return a given entity.

    :entity_id: to get the entity.
    :returns: the entity.
    """
    entity = Entity.nodes.get_or_none(uid=entity_id)

    if not entity:
        raise NotFound(f"Entity with id {entity_id} not found")

    return entity


def update(entity_id:str, name:str, description:str) -> Entity:
    """
    Update function for editing the entites of a schema.

    :param entity_id: id of the entity.
    :param name: display name of the entity.
    :param description: short description to describe the attribute.
    :returns: entity object.
    """
    entity = get(entity_id)
    if description:
        entity.description = description
    if name:
        entity.display_name = name
    entity.save()
    return entity

def patch(entity_id:str, annotation_id:str, description:str, annotation:str, ontology_id:str, dataset_id:str, key:str) -> Annotation:
    """
    Patch function for adding or deleting a annotation from the given entity.

    :param entity_id: id of the entity.
    :param annotation_id: id of the annotation.
    :param description: short description to describe the attribute.
    :param annotation: annotation string.
    :param ontology_id: id of the coressponding ontology.
    :param dataset_id: id of the dataset.
    :param key: key for the annotation.
    :returns: annotation object.
    """
    entity = get(entity_id)
    ds = dataset_data_access.get(dataset_id)
    if key==None:
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
                query= "MATCH (f:Entity {uid: '"+entity.uid+"'})-[r:HAS_ANNOTATION]->(a:Annotation{uid:'"+annotation_id+"'}) RETURN COUNT(r)"
                results = db.cypher_query(query)
                if results[0][0][0]==1:
                    an.delete()
                else:
                    query= "MATCH (f:Entity {uid: '"+entity.uid+"'})-[r:HAS_ANNOTATION{version:"+str(ds.current_version_of_schema)+"}]->(a:Annotation{uid:'"+annotation_id+"'}) DELETE r"
                    results = db.cypher_query(query)
            return None
    else:
        if annotation_id != None:
            annotation = Annotation.nodes.get_or_none(uid=annotation_id)
            if ds.current_version_of_schema==0:
                annotation.delete()
            else:
                query= "MATCH (f:Entity {uid: '"+entity.uid+"'})-[r:HAS_CUSTOM_ANNOTATION]->(a:Annotation{uid:'"+annotation_id+"'}) RETURN COUNT(r)"
                results = db.cypher_query(query)
                if results[0][0][0]==1:
                    annotation.delete()
                else:
                    query= "MATCH (f:Entity {uid: '"+entity.uid+"'})-[r:HAS_CUSTOM_ANNOTATION{version:"+str(ds.current_version_of_schema)+"}]->(a:Annotation{uid:'"+annotation_id+"'}) DELETE r"
                    results = db.cypher_query(query)
            return None
        else:
            annotation = Annotation(instance=annotation, description=description, key=key)
            annotation.save()
            ontology = ontology_data_access.get(ontology_id)
            entity.custom_annotation.connect(annotation, {"version":ds.current_version_of_schema})
            annotation.ontology.connect(ontology)
    entity.save()
    return annotation
