from datetime import datetime
from werkzeug.exceptions import NotFound
from database.data_access import user_data_access
from database.data_access import workspace_data_access
from commons.services.data_frame_helper import DataFrameHelper
from commons.models.dataset.models import User
from database.data_access import dataset_data_access
from commons.models.dataset.models import Notebook
from commons.configuration.settings import Settings
from neomodel import Q
import requests


import os
import docker
import tarfile
import shutil
import nbformat as nbf
from pywebhdfs.webhdfs import PyWebHdfsClient



def filter_string(string):
    return string.replace("[", "").replace("(", "").replace("{", "").replace(" ", "").replace("]", "").replace(")", "").replace("}", "").replace("`", "").replace(" ", "")


def copy_from_container(container, frompath, topath):
    """
        Copy a file from a running docker-container

        :param container container-object
        :param frompath location in container
        :param topath destination
    """

    strm, stat = container.get_archive(frompath)    
    fname = topath+".tar"
    with open(fname, 'wb') as outfile:
        for d in strm:
            outfile.write(d)
    ret = os.getcwd()
    os.chdir(os.path.dirname(os.path.abspath(topath)))    
    tar = tarfile.open(os.path.basename(fname))    
    tar.extractall()
    tar.close()
    os.chdir(ret)
  


def copy_to_container(container, name, dst, source):
    """
        Copy a file to a running docker-container

        :param container container-object
        :param name name of the container
        :param dst destination in the container
        :param source source on the original system
    """
  
    ret = os.getcwd()
    src = os.path.abspath(source)
    os.chdir(os.path.dirname(src))
    srcname = os.path.basename(src)
    tar = tarfile.open(srcname + '.tar', mode='w')
    try:
        tar.add(srcname)
    finally:
        tar.close()
    data = open(src + '.tar', 'rb').read()
    container.put_archive(os.path.dirname(dst), data)
    os.system("docker exec "+name+" chown -R "+os.environ['DOCKER_NOTEBOOK_DIR'].split("/")[2]+":users "+dst)
    os.chdir(ret)

def notebook_code(dataset_id:str, notebook_type:str)->str:
    """
    Helper function to create a specific workspace for jupyter.

    :dataset_id: the id of the current dataset.
    :notebook_type: the type of the workspace.
    :returns: str
    """
    dfh = DataFrameHelper(dataset_id, without_session=True)
    return dfh.get_notebook_string(type=notebook_type)

def add_mlrun_to_notebook(notebook_id:str, run_id:str, experiment_id:str)->str:
    
    entity = get(notebook_id)
   
    if entity.mlruns == None:
        entity.mlruns = [run_id+":"+experiment_id]
    else:
        entity.mlruns.append(run_id+":"+experiment_id) 
        
 
    
    entity.save()
    return entity

def create_workspace_jupyter(workspace_id:str, containername:str, user:User)->None:
    """
    Helper function to create a specific workspace for jupyter.

    :param workspace_id: the id of the current workspace.
    :param param dataset_id: the id of the current dataset.
    :param notebook_id: the id of the current notebook.
    :returns: None
    """
    s = Settings()
    client = docker.from_env()
    workspace = workspace_data_access.get(workspace_id)
    try:
        r = requests.post(s.jupyter_service.url + '/hub/api/users/'+ user.username + '/server',
        headers={
            'Authorization': f'token {s.jupyter_service.secret_token}',
            }
        )
        if r.status_code in (200, 201, 400):
            container = client.containers.get(containername)
            container.exec_run("install -d -m 0775 -o "+os.environ['DOCKER_NOTEBOOK_DIR'].split("/")[2]+" -g users "+os.environ['DOCKER_NOTEBOOK_DIR']+"/"+filter_string(workspace.title))        
    except Exception as ex:
        print("Error: "+str(ex))
    
    return 


def create_jupyter_notebook(workspace_id:str, dataset_id:str, title:str, notebook_id:str, version:str, containername:str, is_public:bool)->None:
    """
    Helper function to create a specific jupyter notebook.

    :param workspace_id: the id of the current workspace.
    :param dataset_id: the id of the current dataset.
    :param notebook_id: the id of the current notebook.
    :param title: the title of the current notebook.
    :param version: version of the data.
    :param containername: name of container for the notebook
    :param is_public: bool if notebook is public
    :returns: None
    """
    
    dfh = DataFrameHelper(dataset_id, without_session=True)
    code = dfh.get_notebook_string("JUPYTER", version)    
    nb = nbf.v4.new_notebook()
    nb['cells'].append(nbf.v4.new_code_cell(code))
    workspace = workspace_data_access.get(workspace_id)
    dataset = dataset_data_access.get(dataset_id)
    tmpDir = "../../mlflow/tmp/nb/" + filter_string(workspace.title) + "_" + filter_string(title)
    if not os.path.exists(tmpDir):
        os.makedirs(tmpDir)
    fname = tmpDir+"/" + filter_string(title) + ".ipynb"

    with open(fname, 'w') as f:
        nbf.write(nb, f)
    

    try:    
        client = docker.from_env()
        dst = os.environ['DOCKER_NOTEBOOK_DIR'] + "/" + filter_string(workspace.title) + "/" + filter_string(dataset.title) + "/" + filter_string(title) + ".ipynb"    
        container = client.containers.get(containername)    
        copy_to_container(container, containername,dst,fname)    
        if(is_public):
            hdfs = PyWebHdfsClient(host=os.environ['HDFS_NAMENODE'], port=os.environ['HDFS_WEB_PORT'])
            path = f"/notebooks/{workspace_id}/{dataset_id}/{notebook_id}.ipynb"
            with open(fname, "rb") as f:
                hdfs.create_file(path, f)
        shutil.rmtree(tmpDir)
    except Exception as ex:
        shutil.rmtree(tmpDir)
        print("Error: "+str(ex))
    
    return
   
def create_mlflow_notebook(workspace_id:str, dataset_id:str, title:str, notebook_id:str, version:str, containername:str, is_public:bool, notebookpath:str)->None:
    """
        Helper function to create a mlflow jupyter notebook.

        :param workspace_id: the id of the current workspace.
        :param dataset_id: the id of the current dataset.
        :param notebook_id: the id of the current notebook.
        :param version: version of the data.
        :param containername: name of container for the notebook
        :param is_public: bool if notebook is public
        :param notebookpath: source path of the notebook with templates
        
        :returns: None
    """
    workspace = workspace_data_access.get(workspace_id)
    dataset = dataset_data_access.get(dataset_id)
    try:
        client = docker.from_env()
        dst = os.environ['DOCKER_NOTEBOOK_DIR']+"/"+filter_string(workspace.title)+"/"+filter_string(dataset.title)+"/"+filter_string(title)+".ipynb"    
        container = client.containers.get(containername)
        newnb = os.path.dirname(notebookpath)+"/" + filter_string(title) + ".ipynb"
        if os.path.exists(newnb) == False:    
            os.system("mv "+notebookpath+" "+newnb)        
        copy_to_container(container, containername,dst,newnb)        
        if(is_public):
            hdfs = PyWebHdfsClient(host=os.environ['HDFS_NAMENODE'], port=os.environ['HDFS_WEB_PORT'])
            path = f"/notebooks/{workspace_id}/{dataset_id}/{notebook_id}.ipynb"
            with open(notebookpath, "rb") as f:
                hdfs.create_file(path, f)
                
    except Exception as ex:
        print("Error: "+str(ex))
        
    return
    
def create_dataset_jupyter(workspace_id:str, dataset_id:str, containername:str = "")->None:
    """
    Helper function to create a specific jupyter notebook.

    :param workspace_id: the id of the current workspace.
    :param dataset_id: the id of the current dataset.
    :returns: None
    """
    if(containername != ""):    
        client = docker.from_env()
        workspace = workspace_data_access.get(workspace_id)
        dataset = dataset_data_access.get(dataset_id) 
        try:
            container = client.containers.get(containername)
            container.exec_run("install -d -m 0775 -o "+os.environ['DOCKER_NOTEBOOK_DIR'].split("/")[2]+" -g users "+os.environ['DOCKER_NOTEBOOK_DIR']+"/"+filter_string(workspace.title)+"/"+filter_string(dataset.title))
                    
        except Exception as ex:
            print("Error: "+str(ex))
    
    return

def delete_workspace_jupyter(workspace_id:str, containername:str)->None:
    """
    Helper function to delete a specific jupyter notebook.

    :param workspace_id: the id of the current workspace.
    :returns: None
    """
    client = docker.from_env()
    workspace = workspace_data_access.get(workspace_id)
    try:
        container = client.containers.get(containername)
        container.exec_run("rm -rf "+os.environ['DOCKER_NOTEBOOK_DIR']+"/"+workspace.title)
        
    
    except Exception as ex:
        print("Error: "+str(ex))
    
    return

def get(notebook_id:str) -> Notebook:
    """
    Helper function to return a specific notebook.

    :param notebook_id: the id of the current workspace.
    :returns: notebook
    """
    notebook = Notebook.nodes.get_or_none(uid=notebook_id)

    if not notebook:
        raise NotFound(f"Notebook with id {notebook_id} not found")

    return notebook

def get_all(dataset_id:str, email_of_current_user:str) -> [Notebook]:
    """
    Helper function to return all public and own notebook.

    :param dataset_id: the id of the current workspace.
    :param email_of_current_user: to filter for his notebooks.
    :returns: all notebooks.
    """
    user = user_data_access.get(email_of_current_user)
    dataset = dataset_data_access.get(dataset_id)
    notebooks = []
    if len(dataset.notebooks)!=0:
        for d in dataset.notebooks:
            if d.is_public == True or d.author[0].email == user.email:
                notebooks.append(d)
    return notebooks


def create(workspace_id:str, dataset_id:str, title:str, description:str, author:str, type:str, is_public:str, version:str, notebookpath:str = "", notebook_id = "")  -> Notebook:
    """
    Function to create a notebook.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param notebook_id: id of the notebook.
    :param title: title of the notebook.
    :param description: description of the notebook.
    :param author: email of author of the notebook.
    :param type: type of the notebook (JUPYTER or ZEPPELIN).
    :param is_public: defined whether the notebook is public or not.
    :param version: version of the dataset, that is used in the notebook.
    :param notebookpath: location of notebook-source
    :returns: updated notebook.
    """
    try:
        author = user_data_access.get(author)
        containername = "jupyter-"+author.username
        dataset = dataset_data_access.get(dataset_id)
        entity = Notebook(title=title, description=description, type=type, is_public=is_public, created_on=datetime.now(), last_updated_on=datetime.now(), version_of_dataset=version)
        if notebook_id != "":
            entity.uid = notebook_id
        entity.save()
        entity.author.connect(author)
        if entity.type == entity.TYPES['JUPYTER']:
            create_workspace_jupyter(workspace_id, containername, author)
            create_dataset_jupyter(workspace_id,dataset_id,containername)
            create_jupyter_notebook(workspace_id, dataset_id, title, str(entity.uid), version,containername, is_public)
        elif entity.type == entity.TYPES['MLFLOW']:
            create_workspace_jupyter(workspace_id, containername, author)
            create_dataset_jupyter(workspace_id,dataset_id,containername)
            create_mlflow_notebook(workspace_id, dataset_id, title, str(entity.uid), version, containername, is_public, notebookpath)
        else:
            pass
        dataset.notebooks.connect(entity)
    except Exception as ex:
        print(ex)
        entity.delete()
    return entity

def update(workspace_id:str, dataset_id:str, notebook_id:str, title:str, description:str, is_public:str, version:str)  -> Notebook:
    """
    Update function to update a notebook.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param notebook_id: id of the notebook.
    :param title: title of the notebook.
    :param description: description of the notebook.
    :param is_public: defined whether the notebook is public or not.
    :param version: version of the dataset, that is used in the notebook.
    :returns: updated notebook.
    """
    entity = get(notebook_id)
    entity.title = title
    entity.description = description
    entity.is_public = is_public
    entity.version_of_dataset = version
    entity.save()
    return entity

def delete(workspace_id:str, dataset_id:str, notebook_id:str)->None:
    """
    Delete function to delete a notebook.

    :param workspace_id: id of the workspace.
    :param dataset_id: id of the dataset.
    :param notebook_id: id of the notebook.
    :returns: None
    """
    entity = get(notebook_id)
    settings = Settings()

    p = requests.delete(f"{settings.jupyter_service.url}/api/contents/work/{workspace_id}/{dataset_id}/{str(entity.uid)}.ipynb")
    if p.status_code == 204 or p.status_code == 404:
        entity.delete() 
    else:
        pass
