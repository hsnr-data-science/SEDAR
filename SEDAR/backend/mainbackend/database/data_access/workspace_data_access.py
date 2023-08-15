import os
import psycopg2
import pymongo
from datetime import datetime
from requests import post, delete as delete_request
from werkzeug.exceptions import NotFound, BadRequest
from werkzeug.datastructures import FileStorage
from neomodel import INCOMING, Traversal
from database.data_access import dataset_notebook_data_access
from commons.models.dataset.models import User
from database.data_access import user_data_access, ontology_data_access, dataset_data_access
from commons.models.dataset.models import Workspace
from commons.configuration.settings import Settings
from elasticsearch import Elasticsearch
from pywebhdfs.webhdfs import PyWebHdfsClient
from pathlib import PurePath


#------------------------------------------------------------------------------------#
# Workspace CRUD
#------------------------------------------------------------------------------------#

def get(workspace_id:str) -> Workspace:
    """
    Get one specific workspace.

    :param workspace_id: id.
    :returns: a workspace.
    """
    workspace = Workspace.nodes.get_or_none(uid__exact=workspace_id)
     
    if not workspace:
        raise NotFound(f"Workspace with id {workspace_id} not found")

    return workspace

def get_all(user:User) -> [Workspace]:
    """
    Get all workspaces for a specific user.

    :param user: user.
    :returns: all workspace for a specific user.
    """
    u = user_data_access.get(user.email)
    if len(u.workspaces)==0:
        workspaces = Workspace.nodes.filter()
        if len(workspaces) == 0:
            settings = Settings()
            print("Creating Default Workspace")
            workspaces = [create(settings.server.title_of_default_workspace, user, settings.server.description_of_default_workspace, True)]
        else:
            w = Workspace.nodes.get(is_default=True)
            u.workspaces.connect(w, {'can_read':True, 'can_write':True, 'can_delete':True})
            w.save()
            workspaces = u.workspaces
    else:
        workspaces = u.workspaces
    return workspaces
    
def create(title:str, user:User, description:str, is_default:bool=False)  -> Workspace:
    """
    Create a new workspaces for a specific user. This will create a new postgres database
    and add a the standard ontology. 

    :param user: user.
    :param title: title of the new workspace.
    :returns: Workspace object.
    """
    entity = Workspace(title=title, description=description, created_on=datetime.now(), last_updated_on=datetime.now(), is_default=is_default)
    entity.save()
    entity.owner.connect(user)
    user.workspaces.connect(entity)

    settings = Settings()

    try:
        # get path of resource folder
        file_location = os.path.join(os.getcwd(), "resources", settings.server.filename_of_default_ontology)
        print("Default: "+settings.server.filename_of_default_ontology)
        print(file_location)

        # create dataset in fuseki
        ontology_data_access.create_workspace_fuseki(str(entity.uid))

        with open(file_location, 'rb') as fp:
            file = FileStorage(fp)
            path = PurePath(file.filename)
            file.filename = path.name
            ontology_data_access.add(settings.server.title_of_default_ontology, file, str(entity.uid), user, description=settings.server.description_of_default_ontology)

    except Exception as ex:
        print(f"[ONTOLOGY] error while creating:\n\t{ex}")
    # create database in postgres based on workspace_id
    postgresql = settings.postgresql_storage
    connection = None
    try:
        connection = psycopg2.connect(
            f"host='{postgresql.host}' user='{postgresql.user}' password='{postgresql.password}'" +
            f" port='{postgresql.port}'"
        )
    except psycopg2.OperationalError as err:
        print(f"[POSTGRES] error while creating:\n\t{err}")

    if connection is not None:
        connection.autocommit = True
        cur = connection.cursor()
        cur.execute("SELECT datname FROM pg_database;")
        list_database = cur.fetchall()
        if (entity.id,) not in list_database:
            cur.execute(f"CREATE DATABASE " + "workspace_" + str(entity.uid))
            print(f"[POSTGRES] created storage database")
        connection.close()
    
    # create index in es
    es = Elasticsearch([f"{settings.es_service.url}"])
    es.indices.create(index=f'{str(entity.uid)}', ignore=400)

    # create workspace in jupyter
    containername = "jupyter-"+user.username
    dataset_notebook_data_access.create_workspace_jupyter(str(entity.uid), containername, user)

    return entity

def update(workspace_id:str, title:str, description:str)  -> Workspace:
    """
    Updates the given workspace. 

    :param title: title of the workspace.
    :param description: description of the workspace.
    :returns: updated workspace object.
    """
    entity = Workspace.nodes.get_or_none(uid__exact=workspace_id)

    if not entity:
        raise NotFound(f"Workspace with id {workspace_id} not found")

    entity.title = title
    entity.description = description
    entity.last_updated_on=datetime.now()
    entity.save()
    return entity

def delete(workspace_id:str, user:User)->None:
    """
    Delete a given workspaces for a specific user. This will delete the associated 
    Postgres Fuseki MongoDB databases.

    :param workspace_id: id of the workspace.
    :param user: user.
    :returns: Workspace object.
    """

    entity: Workspace = Workspace.nodes.get(uid__exact=workspace_id)

    if not entity:
        raise NotFound(f"Workspace with this id {workspace_id} not found")
    
    #leave the workspace if the loggedin user is not the owner. Also make sure that no one can delete the default workspace.
    if entity.owner[0] != user or (entity.owner[0]==user and entity.is_default):
        user.workspaces.disconnect(entity)
        return
    
    settings = Settings()

    # delete workspace in jupyter
    containername = "jupyter-"+user.username
    dataset_notebook_data_access.delete_workspace_jupyter(workspace_id, containername)

    # delete workspace in fuseki
    delete_request(f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/$/datasets/{workspace_id}',
                   auth=(settings.fuseki_storage.user, settings.fuseki_storage.password))

    # delete database in MongoDB based on workspace_id
    uri = f"mongodb://{settings.mongodb_management.user}:{settings.mongodb_management.password}@{settings.mongodb_management.host}:{settings.mongodb_management.port}/?authSource=admin"
    mongo_client = pymongo.MongoClient(uri)
    mongo_client.drop_database(workspace_id)

    # delete database in postgres based on workspace_id
    postgresql = settings.postgresql_storage
    connection = None
    try:
        connection = psycopg2.connect(
            f"host='{postgresql.host}' user='{postgresql.user}' password='{postgresql.password}'" +
            f" port='{postgresql.port}'"
        )
    except psycopg2.OperationalError as err:
        print(f"[POSTGRES] error while creating:\n\t{err}")

    if connection is not None:
        connection.autocommit = True
        cur = connection.cursor()
        cur.execute("DROP DATABASE workspace_" + workspace_id + ";")
        connection.close()

    # delete ontology entries in Neo4j
    for ontology in entity.ontologies:
        ontology.delete()

    # delete dataset entries in Neo4j
    for dataset in entity.datasets:
        try:
            dataset_data_access.delete(workspace_id, dataset.uid)
        except Exception as ex:
            pass
        
    # delete es index
    es = Elasticsearch([f"{settings.es_service.url}"])
    es.indices.delete(index=f'{workspace_id}', ignore=[400, 404])

    # delete hdfs folder
    hdfs = PyWebHdfsClient(host=settings.hdfs_storage.namenode, port=settings.hdfs_storage.web_port)
    hdfs.delete_file_dir(f"/datalake/{workspace_id}", recursive=True)

    entity.delete()
    return

#------------------------------------------------------------------------------------#
# Workspaceusers CRUD
#------------------------------------------------------------------------------------#

def get_all_users(workspace_id:str) -> [User]:
    """
    Getting all users of the current workspace.

    :param workspace_id: id of the workspace.
    :returns: all users that are in the workspace.
    """
    workspace = get(workspace_id)
    return Traversal(workspace, workspace.__label__, dict(node_class=User, direction=INCOMING, relation_type='HAS_ACCESS_TO')).all()

def add_user(workspace_id:str, add:bool, email:str, can_read:bool, can_write:bool, can_delete:bool) -> User:
    """
    Add user to the current workspace.

    :param workspace_id: id of the workspace.
    :param email: email of user that should be removed or added.
    :param can_read: defines wether the user can read or not.
    :param can_write: defines wether the user can write or not.
    :param can_delete: defines wether the user can delete or not.
    :returns: the user.
    """
    workspace = get(workspace_id)
    user = user_data_access.get(email)
    if add == True:
        user.workspaces.connect(workspace, {'can_read':can_read, 'can_write':can_write, 'can_delete':can_delete})
    elif add == False:
        user.workspaces.disconnect(workspace)
    else:
        rel = user.workspaces.relationship(workspace)
        rel.can_read=can_read;
        rel.can_write=can_write;
        rel.can_delete=can_delete;
        rel.save()
    return user