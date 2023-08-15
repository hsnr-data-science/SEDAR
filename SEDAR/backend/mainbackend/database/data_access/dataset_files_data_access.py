from werkzeug.exceptions import NotFound
from commons.services.data_frame_helper import DataFrameHelper
from database.data_access import ontology_data_access
from database.data_access import dataset_data_access
from commons.models.dataset.models import Annotation, File
from neomodel import db
from pywebhdfs.webhdfs import PyWebHdfsClient

def get(file_id:str) -> File:
    """
    Helper function to return a given entity.

    :entity_id: to get the entity.
    :returns: the entity.
    """
    file = File.nodes.get_or_none(uid=file_id)

    if not file:
        raise NotFound(f"Fileproperty with id {file_id} not found")

    return file


def update(file_id:str, description:str, dataset_id:str) -> File:
    """
    Update function for editing the file of a schema.

    :param file_id: id of the file.
    :param description: short description to describe the attribute.
    :param dataset_id: id of the dataset.
    :returns: attribute object.
    """
    entity = get(file_id)
    if description:
        entity.description = description
    entity.save()
    return entity

def patch(file_id:str, annotation_id:str, description:str, annotation:str, ontology_id:str, dataset_id:str, key:str) -> Annotation:
    """
    Patch function for adding or deleting a annotation from the given fileproperty.

    :param file_id: id of the file.
    :param annotation_id: id of the annotation.
    :param description: short description to describe the attribute.
    :param annotation: annotation string.
    :param ontology_id: id of the coressponding ontology.
    :param dataset_id: id of the dataset.
    :param key: key for the annotation.
    :returns: annotation object.
    """
    entity = get(file_id)
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
                query= "MATCH (f:File {uid: '"+entity.uid+"'})-[r:HAS_ANNOTATION]->(a:Annotation{uid:'"+annotation_id+"'}) RETURN COUNT(r)"
                results = db.cypher_query(query)
                if results[0][0][0]==1:
                    an.delete()
                else:
                    query= "MATCH (f:File {uid: '"+entity.uid+"'})-[r:HAS_ANNOTATION{version:"+str(ds.current_version_of_schema)+"}]->(a:Annotation{uid:'"+annotation_id+"'}) DELETE r"
                    results = db.cypher_query(query)
            return None
    else:
        if annotation_id != None:
            annotation = Annotation.nodes.get_or_none(uid=annotation_id)
            if ds.current_version_of_schema==0:
                annotation.delete()
            else:
                query= "MATCH (f:File {uid: '"+entity.uid+"'})-[r:HAS_CUSTOM_ANNOTATION]->(a:Annotation{uid:'"+annotation_id+"'}) RETURN COUNT(r)"
                results = db.cypher_query(query)
                if results[0][0][0]==1:
                    annotation.delete()
                else:
                    query= "MATCH (f:File {uid: '"+entity.uid+"'})-[r:HAS_CUSTOM_ANNOTATION{version:"+str(ds.current_version_of_schema)+"}]->(a:Annotation{uid:'"+annotation_id+"'}) DELETE r"
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

def get_file(dataset_id:str, file_id:str):
    dfh = DataFrameHelper(dataset_id, without_session=True)
    f = get(file_id)
    hdfs = PyWebHdfsClient(host=dfh.settings.hdfs_storage.namenode, port=dfh.settings.hdfs_storage.web_port)
    for file in dfh.revision.source_files:
        if f.filename == file[5:]:
            return ({
                "file":hdfs.read_file(f"/datalake/{dfh.workspace_id}/sources/{dfh.dataset.datasource}/{file}"),
                "filename": file[5:]
            })
            