from datetime import datetime
from elasticsearch import Elasticsearch
from werkzeug.exceptions import NotFound
from commons.repositories import datasource_repo
from database.data_access import dataset_notebook_data_access, user_data_access, workspace_data_access, tag_data_access, dataset_logs_data_access
from commons.models.dataset.models import Dataset
from commons.configuration.settings import Settings
from pywebhdfs.webhdfs import PyWebHdfsClient
from commons.enums import WriteType
from commons.enums import ReadType

def get(dataset_id:str, datasource_id:str=None) -> Dataset:
    """
    Get one specific dataset.

    :param dataset_id: id of dataset.
    :returns: a dataset.
    """
    if datasource_id==None:
        dataset = Dataset.nodes.get_or_none(uid__exact=dataset_id)
    else:
        dataset = Dataset.nodes.get_or_none(datasource__exact=datasource_id)

    if not dataset:
        raise NotFound(f"Dataset with id {dataset_id} not found")

    return dataset

def get_all(workspace_id:str, get_unpublished:bool=False, user_id:str=None) -> [Dataset]:
    """
    Get all datasets in the given workspace.

    :param workspace_id: id of workspace.
    :param get_unpublished: only unpublished.
    :param user_id: nedded to filter for unbpublished datasets of user.
    :returns: all published or unpublished datasets in the given workspace.
    """
    workspace = workspace_data_access.get(workspace_id)
    datasets = []
    if get_unpublished == False:
        for data in workspace.datasets.match(is_published=True):
            datasets.append(data)
    else:
        user = user_data_access.get(user_id)
        for data in workspace.datasets.match(is_published=False):
            if data.owner[0].email == user.email:
                datasets.append(data)
    return datasets

def create(title:str, owner_id:str, workspace_id:str, datasource_id:str)  -> Dataset:
    """
    Creates a dataset with the given informations.

    :param title: the title of the dataset.
    :param owner_id: id of the creator.
    :param workspace_id: workspace_id to create the dataset in the specific workspace.
    :param datasource: the datasource object the dataset.
    :returns: a dataset.
    """
    entity = Dataset(title=title, created_on=datetime.now(), last_updated_on=datetime.now(), datasource=datasource_id)
    entity.save()
    workspace = workspace_data_access.get(workspace_id)
    workspace.datasets.connect(entity, {'is_published':False})
    owner=user_data_access.get(owner_id)
    entity.owner.connect(owner)
    dataset_notebook_data_access.create_dataset_jupyter(str(workspace.uid), str(entity.uid))
    return entity

def update(workspace_id:str, dataset_id:str, title:str, description:str, author:str, longitude:str, latitude:str, range_start:datetime, range_end:datetime, license:str, language:str)  -> Dataset:
    """
    Update function for the dataset.

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
    entity = get(dataset_id)
    entity.language = language
    entity.title = title
    entity.description = description
    entity.author = author
    entity.longitude = longitude
    entity.latitude = latitude
    entity.range_start = range_start
    entity.range_end = range_end
    entity.license = license
    entity.last_updated_on = datetime.now()
    entity.save()
    return entity

def patch(workspace_id:str, dataset_id:str)  -> None:
    """
    Patch function for the dataset, to set the dataset as published.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :returns: None
    """
    entity = get(dataset_id)
    rel = workspace_data_access.get(workspace_id).datasets.relationship(entity)
    rel.is_published=True;
    rel.save()
    return

def recusive_delete(attribute):
    if len(attribute.attributes)!=0:
        for attr in attribute.attributes:
            recusive_delete(attr)
        for an in attribute.annotation:
            an.delete() 
        if len(attribute.stats)!=0:
            attribute.stats[0].delete()
        attribute.delete()
    else:
        for an in attribute.annotation:
            an.delete() 
        if len(attribute.stats)!=0:
            attribute.stats[0].delete()
        attribute.delete()

def delete(workspace_id:str, dataset_id:str)  -> None:
    """
    Delete function for the dataset, to set delete the dataset.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :returns: None
    """
    entity = get(dataset_id)
    workspace = workspace_data_access.get(workspace_id)
    try:
        for tag in entity.tags:
            tag_data_access.delete(workspace_id, dataset_id, tag.uid)
    except Exception as ex:
        pass
    try:
        for notebook in entity.notebooks:
            dataset_notebook_data_access.delete(workspace_id, dataset_id, notebook.uid)
    except Exception as ex:
        pass
    try:
        if entity.schema[0].type!='UNSTRUCTURED':
            for e in entity.schema[0].entities:
                for attr in e.attributes:
                    recusive_delete(attr)
                for an in e.annotation:
                    an.delete() 
                for can in e.custom_annotation:
                    can.delete()
                e.delete()
        else:
            for file in entity.schema[0].files:
                for an in file.annotation:
                    an.delete()
                for can in file.custom_annotation:
                    can.delete()
                file.delete()
        entity.schema[0].delete()
    except Exception as ex:
        pass
    if entity.is_indexed==True:
        settings = Settings()
        es = Elasticsearch([f"{settings.es_service.url}"])
        res = es.delete_by_query(index=f"{workspace_id}", body={'query': {'term': {'dataset_id': f'{dataset_id}'}}})
    datasource = datasource_repo.find_by_id(entity.datasource)
    revision = datasource.resolve_current_revision()
    if revision != None:
        settings = Settings()
        hdfs = PyWebHdfsClient(host=settings.hdfs_storage.namenode, port=settings.hdfs_storage.web_port)
        if revision.read_type == ReadType.DATA_FILE:
            hdfs.delete_file_dir(f"/datalake/{workspace_id}/sources/{datasource.id}", recursive=True)
            hdfs.delete_file_dir(f"/datalake/{workspace_id}/data/unstructured/{datasource.id}", recursive=True)
        elif revision.write_type == WriteType.DEFAULT:
            hdfs.delete_file_dir(f"/datalake/{workspace_id}/data/structured/{datasource.id}", recursive=True)
        elif revision.write_type == WriteType.DELTA:
            hdfs.delete_file_dir(f"/datalake/{workspace_id}/data/delta/{datasource.id}", recursive=True)
    datasource.delete()
    try:
        logs = dataset_logs_data_access.get(entity.uid)
        logs.delete()
    except Exception as ex:
        pass
    if len(entity.custom_read_formats)!=0:
        for rf in entity.custom_read_formats:
            rf.delete()
    entity.delete()
    return