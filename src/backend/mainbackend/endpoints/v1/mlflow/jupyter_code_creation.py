from flask import request, jsonify
from flask_jwt_extended import (
    unset_jwt_cookies, get_jwt_identity, create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies, jwt_required
)
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import Unauthorized, InternalServerError

from services.decorators import parse_params, check_permissions_workspace
from services.decorators import check_credentials
import requests
import os
import sys

from urllib.request import urlopen
import json
from requests.structures import CaseInsensitiveDict
from pywebhdfs.webhdfs import PyWebHdfsClient
from flask_restful.inputs import boolean


from commons.models.dataset.models import Dataset
from commons.services.data_frame_helper import DataFrameHelper
import tarfile
import docker
import uuid
import io

import shutil


import nbformat as nbf

from database.data_access import dataset_notebook_data_access, dataset_logs_data_access, workspace_data_access, dataset_data_access
from database.data_access import user_data_access

def filter_string(string):
    return string.replace("[", "").replace("(", "").replace("{", "").replace(" ", "").replace("]", "").replace(")", "").replace("}", "").replace("`", "").replace(" ", "")

    

@jwt_required()
@parse_params(
    Argument("workspace_id", default='', type=str, required=True),
    Argument("session_id", default='', type=str, required=True),
    Argument("experiment_id", default='', type=str, required=False),
    Argument("method", default='', type=str, required=False),
    Argument("model", default='', type=str, required=False),
    Argument("datasets", default='', type=str, required=True),
    Argument("title", default=None, type=str, required=True),
    Argument("description", default=None, type=str, required=False),
    Argument("is_public", default=None, type=boolean, required=False),
    Argument("withDeploy", default=None, type=boolean, required=False)
)
def createJupyterCode(workspace_id: str,session_id:str,experiment_id: str,method:str, model:str, datasets:str, title:str, description:str,is_public:bool, withDeploy:bool):
    """
        Creates a JupyterNotebook for MLFlow-Use with the selected Configuration

        :param workspace_id current workspace
        :param session_id current session
        :param experiment_id used experiment
        :param method used ML-Learning-Method
        :param model used ML-model/algorithm
        :param datasets seleced dataset
        :param title chosen title
        :param description chosen description
        :param is_public bool if notebook ist public
        :returns: serialized Notebook as a json
    """
    #=======================================================================
    #=======================================================================
    tmpDir = "../../mlflow/tmp/nb/"+session_id+"_"+str(uuid.uuid4().hex)
    if not os.path.exists(tmpDir):
        os.makedirs(tmpDir)
    datasetsJSON = json.loads(datasets)
    pflag = True
    primary_dataset_id = ""
    user = get_jwt_identity()['email']
    username = user_data_access.get(user).username
    workspace_title = filter_string(workspace_data_access.get(workspace_id).title)
    dataset_idarray = [] 
    dfh_notebook_strings = []
    notebook_id = str(uuid.uuid4()) 
    for entry in datasetsJSON:
        dataset_id = entry.split("!_!seperator!_!")[0]
        dataset_title = filter_string(dataset_data_access.get(dataset_id).title)
        dataset_idarray.append(dataset_title + "|" + dataset_id )
        if(pflag):
            primary_dataset_id = dataset_id
            pflag = False
        dfh = DataFrameHelper(str(dataset_id), session_id)
        dfh_notebook_strings.append(dfh.get_notebook_string().replace(
            """df.show()
#--------------------
#your code comes here
#--------------------
""", f"{dataset_title} = df.toPandas()"
        ))

    #=======================================================================
    #========================== Template Creation =========================
    #=======================================================================
    imports = """
import os
import warnings
import pandas as pd
import numpy as np
from sklearn.metrics import *
from sklearn.model_selection import train_test_split
import sklearn.linear_model
import sklearn.cluster
import mlflow
import mlflow.sklearn
import json
import tarfile
import cv2
import mahotas
import requests
from mlflow.tracking import MlflowClient
    """
    alg = model.split("!_!seperator!_!")[0]

    mlflow_start = """
experiment_id = \"""" + experiment_id + """\"
remote_server_uri = "http://mlflow:"""+os.environ['MLFLOW_TRACKING_URI'].split(":")[2]+""""
mlflow.set_tracking_uri(remote_server_uri) 
mlflow.set_experiment(experiment_id=experiment_id)
    """
    dataset_list = ",".join(["{}".format(d) for d in dataset_idarray])
    mlflow_run_super_1 ="""
# Register runs in MLFLOW through with-block
with mlflow.start_run() as run:
    mlflow.set_tag("workspace",\""""+ workspace_title + ","   + workspace_id + "\"" + """)
    mlflow.set_tag("notebook",\""""+ title + ".ipynb" + ","   + notebook_id + "\"" + """)
    mlflow.set_tag("is_public",\""""+ "{public}".format(public="true" if is_public else "false") + "\"" + """)
    mlflow.set_tag("datasets", \""""+ dataset_list +"""")
    mlflow.set_tag("username", \""""+str(username)+"""")
    # mlflow.set_tag("XXX",XXXX) # add further tags here

    model = """ + alg + """()

    model.fit(train_x, train_y)      

    predicted_qualities = model.predict(test_x)

    mlflow.log_param(key="XX", value=XX) # add model (hyper)parameters here
    mlflow.log_metric(key="XX", value=XX) # add model evaluation metrics here
    """

    mlflow_run_super_2 ="""
    # mlflow.log_artifact(FILE) # add any further artifacts
    mlflow.sklearn.log_model(model, "model") # log your model with name "model"
    run_id = run.info.run_id
    """

    mlflow_run_unsuper_1 ="""
# Register runs in MLFLOW through with-block
with mlflow.start_run() as run:
    mlflow.set_tag("workspace",\""""+ workspace_title + ","   + workspace_id + "\"" + """)
    mlflow.set_tag("notebook",\""""+ title + ".ipynb" + ","   + notebook_id + "\"" + """)
    mlflow.set_tag("is_public",\""""+ "{public}".format(public="true" if is_public else "false") + "\"" + """)
    mlflow.set_tag("datasets", \""""+ dataset_list +"""")
    mlflow.set_tag("username", \""""+str(username)+"""")
    # mlflow.set_tag("XXX",XXXX) # add further tags here

    model = """ + alg +"""()

    model.fit(data)

    mlflow.log_param(key="XX", value=XX) # add model (hyper)parameters here
    mlflow.log_metric(key="XX", value=XX) # add model evaluation metrics here        
    """
    
    mlflow_run_unsuper_2 ="""
    mlflow.log_artifact(FILE)
    mlflow.sklearn.log_model(model, "model")
    run_id = run.info.run_id
    """     

    mlflow_run_unsuper =""
    mlflow_run_super =""
    mlflow_run_unsuper = mlflow_run_unsuper_1+mlflow_run_unsuper_2
    mlflow_run_super = mlflow_run_super_1 + mlflow_run_super_2


    add_run_to_nb = """
data = {
        "notebook_id":\"""" + f"{notebook_id}" + "\"" """,
        "run_id":run_id,
        "experiment_id":experiment_id
       }
res = requests.post(url = "http://"""+ os.environ['BACKEND_HOST'] +  ":"+ os.environ['BACKEND_PORT'] +"""/api/v1/workspaces/"""+workspace_id+"""/add-mlrun/"""+primary_dataset_id+"""", data=data)    
    """

    deploycode = """
client = MlflowClient()
tags = {"workspace_id": \""""+workspace_id+""""}
model_name = "model" # model name defined above
try:
    registered_model = client.create_registered_model(model_name, tags)        
except RestException:
    print(f"Model '{model_name}' already exists in registry.")
result = mlflow.register_model(
    f"runs:/{run_id}/model",
    f"{model_name}"
)
    """
    #=======================================================================
    #======================== Create Notebook =============================
    #=======================================================================

    nb = nbf.v4.new_notebook()
    intro = "# Create a Run"
    
    nb['cells'] = [nbf.v4.new_markdown_cell(intro)]

    nb['cells'].append(nbf.v4.new_code_cell(imports))
    for item in dfh_notebook_strings:
        nb['cells'].append(nbf.v4.new_code_cell(item))
    
    nb['cells'].append(nbf.v4.new_code_cell(mlflow_start))
    
    if(method == "Supervised Learning"):
        load_data = """
# helper function for splitting into train/test and feature/target 
def load_data(data, column):
    train, test = train_test_split(data)
    train_x = train.drop([column], axis=1)
    test_x = test.drop([column], axis=1)
    train_y = train[[column]]
    test_y = test[[column]]
    return train_x, train_y, test_x, test_y

target_column = XXX # define target column here
        """
        nb['cells'].append(nbf.v4.new_code_cell(load_data))
        train = """train_x, train_y, test_x, test_y = load_data("""+f"{dataset_title}" + """, target_column)"""
        nb['cells'].append(nbf.v4.new_code_cell(train))
        nb['cells'].append(nbf.v4.new_code_cell(mlflow_run_super))


    if(method == "Unsupervised Learning"):
        trainload = """
train, test = train_test_split("""+ f"{dataset_title}" +""")
        """
        nb['cells'].append(nbf.v4.new_code_cell(trainload))
        nb['cells'].append(nbf.v4.new_code_cell(mlflow_run_unsuper))


    
    nb['cells'].append(nbf.v4.new_code_cell(add_run_to_nb))
    
    if(withDeploy):
        nb['cells'].append(nbf.v4.new_code_cell(deploycode))

    #=======================================================================
    #================= Copy Notebook to Container ===========================
    #=======================================================================
    #
    fname = tmpDir+"/" +  title + ".ipynb"

    with open(fname, 'w') as f:
        nbf.write(nb, f)        
    containername = "jupyter-"+username
    
    client = docker.from_env()
    container = client.containers.get(containername)

    dst = os.environ['DOCKER_NOTEBOOK_DIR'] + "/" +  workspace_title + "/" + dataset_title

    if dataset_title not in str(container.exec_run(f"ls {workspace_title}").output)[2:-3].split("\\n"):
        container.exec_run(f"mkdir {workspace_title}/{dataset_title}")
        container.exec_run("chown "+os.environ['DOCKER_NOTEBOOK_DIR'].split("/")[2]+ f":users {workspace_title}/{dataset_title}")

    if workspace_title not in str(container.exec_run("ls").output)[2:-3].split("\\n"):
        container.exec_run("mkdir " + workspace_title)
        container.exec_run("chown "+os.environ['DOCKER_NOTEBOOK_DIR'].split("/")[2]+":users " + workspace_title)

    try:             
        notebook = dataset_notebook_data_access.create(workspace_id, primary_dataset_id, title, description, get_jwt_identity()['email'], "MLFLOW", is_public, "LATEST", fname, notebook_id = notebook_id)
        try:
            dataset_logs_data_access.create(primary_dataset_id, {"en":f"A new {notebook.type} notebook was created.", "de":f"Ein neues {notebook.type}-Notebook wurde erstellt."}, "CREATE", user)
        except:
            pass 

        jsonresult = notebook.serialize()
        
        jsonresult["dataset"] = primary_dataset_id
        jsonresult["dataset_title"] = dataset_title
        shutil.rmtree(tmpDir)
        
        return jsonresult, 201
    except Exception as ex:
        print(ex)
        shutil.rmtree(tmpDir)
        raise InternalServerError(f"Exception: \n\t {ex}")