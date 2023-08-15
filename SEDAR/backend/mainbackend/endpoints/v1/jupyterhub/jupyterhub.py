from flask import jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params
from pywebhdfs.webhdfs import PyWebHdfsClient
import tarfile
import docker
import uuid
import os
import shutil
import io

from database.data_access import dataset_notebook_data_access
from database.data_access import user_data_access


@jwt_required()
@parse_params(
    Argument("workspace_id", default='', type=str, required=True),
    Argument("session_id", default='', type=str, required=True),
    Argument("dataset_id", default='', type=str, required=True),
    Argument("item_id", default='', type=str, required=True),
    Argument("username", default='', type=str, required=True),
)
def copyNbFromHDFStoContainer(workspace_id:str, session_id:str,dataset_id:str, item_id:str,username:str):
    """
        Copy a Notebook from the HDFS to a Container

        :param workspace_id current workspace
        :param session_id current session
        :param dataset_id dataset to copy to
        :param item_id Id of notebook
        :param username username used for the container to copy on        
    """
    tmpDir = "../../mlflow/tmp/nb/"+session_id+"_"+str(uuid.uuid4().hex)
    if not os.path.exists(tmpDir):
        os.makedirs(tmpDir)

    hdfs = PyWebHdfsClient(host=os.environ['HDFS_NAMENODE'], port=os.environ['HDFS_WEB_PORT'])
    path = f"/datalake/{workspace_id}/notebooks/{dataset_id}/{item_id}.ipynb"
    
    data = hdfs.read_file(path)
    io_bytes = io.BytesIO(data)
    fname = tmpDir+"/"+item_id+".ipynb"
    with open(fname, "wb") as outfile:
        outfile.write(io_bytes.getbuffer())


    try:
        
        client = docker.from_env()
        dst = os.environ['DOCKER_NOTEBOOK_DIR']+"/"+workspace_id+"/"+dataset_id+"/"+item_id+".ipynb"
        containername = "jupyter-"+username
        container = client.containers.get(containername)
        
        if workspace_id not in str(container.exec_run("ls work/").output)[2:-3].split("\\n"):
            container.exec_run("mkdir work/"+workspace_id)
            container.exec_run("chown "+os.environ['DOCKER_NOTEBOOK_DIR'].split("/")[2]+":users work/"+workspace_id)
   
        if dataset_id not in str(container.exec_run("ls work/"+workspace_id).output)[2:-3].split("\\n"):
            container.exec_run("mkdir work/"+workspace_id+"/"+dataset_id)
            container.exec_run("chown "+os.environ['DOCKER_NOTEBOOK_DIR'].split("/")[2]+":users work/"+workspace_id+"/"+dataset_id)

        dataset_notebook_data_access.copy_to_container(container, containername,dst,fname)        

        shutil.rmtree(tmpDir)
    except Exception as ex:
        shutil.rmtree(tmpDir)
        print("Error: "+str(ex))
 
    return ""


@jwt_required()
@parse_params(
    Argument("workspace_id", default='', type=str, required=True),
    Argument("session_id", default='', type=str, required=True),
    Argument("dataset_id", default='', type=str, required=True),
    Argument("item_id", default='', type=str, required=True),
    Argument("username", default='', type=str, required=True),
)
def addNotebookToHDFS(workspace_id:str, session_id:str,dataset_id:str, item_id:str, username:str):
    """
        Add a Notebook to the HDFS

        :param workspace_id current workspace
        :param session_id current session
        :param dataset_id dataset of the notebook
        :param item_id Id of the notebook
        :param username username for the docker-container        
    """
    tmpDir = "../../mlflow/tmp/nb/"+session_id+"_"+str(uuid.uuid4().hex)
    if not os.path.exists(tmpDir):
        os.makedirs(tmpDir)


    topath = tmpDir+"/"+item_id+".ipynb"
    try:
        
        client = docker.from_env()
        frompath = os.environ['DOCKER_NOTEBOOK_DIR']+"/"+workspace_id+"/"+dataset_id+"/"+item_id+".ipynb"
        containername = "jupyter-"+username
        container = client.containers.get(containername)
        
        dataset_notebook_data_access.copy_from_container(container, frompath,topath)                              
    except Exception as ex:
        
        print("Error: "+str(ex))
 
    
    hdfs = PyWebHdfsClient(host=os.environ['HDFS_NAMENODE'], port=os.environ['HDFS_WEB_PORT'])
    path = f"/datalake/{workspace_id}/notebooks/{dataset_id}/{item_id}.ipynb"

    try:
        hdfs.delete_file_dir(path)
    except Exception as ex:
        print("Error: "+str(ex))

    with open(topath) as file_data:
            hdfs.create_file(path, file_data)
    

    shutil.rmtree(tmpDir)
    return ""



@jwt_required()
def checkContainer():
    """
        Check if Container is running 

        :param workspace_id current workspace
        :param session_id current session_id
        :returns: array of status for container
    """
    email = get_jwt_identity()['email']
    user = user_data_access.get(email)
    try:        
        client = docker.from_env()
        if user.username != None:    
            containername = "jupyter-" + user.username
            container = client.containers.get(containername)
            if container != None:
                if container.attrs['State']['Status'] == 'running':
                    return Response("", status=200, mimetype='application/json')

                else:
                    return Response("", status=500, mimetype='application/json')
            else:
                return Response("", status=500, mimetype='application/json')
        else:
            return Response("", status=500, mimetype='application/json')
        
      
    except Exception as ex:
        print(ex)
        return Response("", status=500, mimetype='application/json')
 