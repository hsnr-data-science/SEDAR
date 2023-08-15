#from asyncio.windows_events import NULL
from time import sleep
from flask import request, jsonify
from flask_jwt_extended import (
    unset_jwt_cookies, get_jwt_identity, create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies, jwt_required
)
import warnings
from flask_restful import Resource
from flask_restful.reqparse import Argument
#from requests import request

from werkzeug.exceptions import Unauthorized, InternalServerError

from services.decorators import parse_params, check_permissions_workspace
from services.decorators import check_credentials
import requests
import os
import sys

from urllib.request import urlopen
import json
from requests.structures import CaseInsensitiveDict
from database.data_access import dataset_data_access
from flask_restful.inputs import boolean


import pandas as pd
import numpy as np
from sklearn.metrics import *
from sklearn.model_selection import train_test_split
#from sklearn import linear_model
import sklearn.linear_model
import sklearn.cluster

from commons.models.dataset.models import Dataset
from database.data_access import dataset_data_access
from commons.services.data_frame_helper import DataFrameHelper
import tarfile
import docker
import uuid
import io
import cv2
from sklearn.preprocessing import LabelEncoder
from sklearn.preprocessing import MinMaxScaler
import h5py
import mahotas
import shutil
"""
from ......mlflow.code.mlflow.mlflow import *
#from ......mlflow.code.mlflow import mlflow
from ......mlflow.code.mlflow.mlflow import sklearn
from ......mlflow.code.mlflow.mlflow.tracking import MlflowClient
from ......mlflow.code.mlflow.mlflow.exceptions import RestException
"""
import psycopg2
import mlflow
import mlflow.sklearn
import mlflow.entities

from mlflow.tracking import MlflowClient
from mlflow.exceptions import RestException

from pywebhdfs.webhdfs import PyWebHdfsClient
from mlflow import MlflowClient
from mlflow.entities import ViewType

import sklearn.neighbors
import sklearn.svm
import sklearn.gaussian_process
import sklearn.tree
import sklearn.ensemble
import sklearn.neural_network
import sklearn.ensemble
import sklearn.naive_bayes
import sklearn.discriminant_analysis

def listExperiments():
    """
        Lists all existing Experiments
    """
    url = os.environ['MLFLOW_TRACKING_URI']+"/api/2.0/mlflow/experiments/search?max_results=10000"
    head = CaseInsensitiveDict()
    head["Accept"] = "application/json"
    #y = requests.get(url, headers=head)
    return None #y.text

@jwt_required()
@check_permissions_workspace()
@parse_params(
)
def listRegisteredModels(workspace_id:str):
    """
        List all registered Models within the given workspace

        :param workspace_id currently used workspace workspace
        :returns: JSON-String for registered models
    """
    client = MlflowClient()
    reg = client.search_registered_models()    
    erg = []
    for rm in reg:
        tmp = {}        
        tmp["name"] = str(rm.name)
        run_id = str(rm.latest_versions[0].run_id)
        tmp["run_id"] = run_id
        tmp["source"] = str(rm.latest_versions[0].source)
        tmp["status"] = str(rm.latest_versions[0].status)
        tmp["version"] = str(rm.latest_versions[0].version)
        tmp["stage"] = str(rm.latest_versions[0].current_stage)

        runtags = client.get_run(run_id).data.tags
        if "art" in runtags:
            tmp["art"] = str(runtags["art"])        
        if "workspace_id" in rm.tags:
            tmp["workspace_id"] = str(rm.tags["workspace_id"])
            if(tmp["workspace_id"] == workspace_id):
                erg.append(tmp)
    test = "{'models':"+str(erg)+"}"
    test2= test.replace("'","\"")    
    return test2
        



@jwt_required()
@parse_params(
    Argument("workspace_id", default='', type=str, required=True),
    Argument("name", default='', type=str, required=True), 
)
def createExperiment(workspace_id:str, name:str):
    """
        Creates an Experiment for Machine Learning

        :param workspace_id currently used workspace
        :param name name of the experiment
    """

    remote_server_uri = os.environ['MLFLOW_TRACKING_URI']
    mlflow.set_tracking_uri(remote_server_uri) 
    client = MlflowClient()
    try:
        experiment_id = client.create_experiment(name)
        client.set_experiment_tag(experiment_id, "workspace_id", workspace_id)
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception while checking components: \n\t {ex}")
    return {}




@jwt_required()
@parse_params(
    Argument("experiment_id", default='', type=str, required=True),
)
def deleteExperiment(experiment_id: str):
    """
        Deletes an Experiment

        :param experiment_id Id of the experiment
        :returns: verification-object
    """  
    url = os.environ['MLFLOW_TRACKING_URI']+"/api/2.0/mlflow/experiments/delete"
    params = {'experiment_id':experiment_id}
    head = CaseInsensitiveDict()
    head["Accept"] = "application/json"
    
    y = requests.post(url, json=params, headers=head)
    
    return y.text


@jwt_required()
@parse_params(
    Argument("experiment_id", default='', type=str, required=True),
)
def searchRuns(experiment_id: str):

    """
        Gather Information for Runs within an Experiment

        :param experiment_id Id of Experiment for the Runs
        :returns: JSON-String with Run-Information
    """
    if experiment_id != None and experiment_id != '':
        print("experiment ID: " + experiment_id)
        remote_server_uri = os.environ['MLFLOW_TRACKING_URI']
        mlflow.set_tracking_uri(remote_server_uri) 
        try:
            client = MlflowClient()
            runs = client.search_runs(
                experiment_ids=experiment_id,
                filter_string="",
                run_view_type=ViewType.ALL,
            ).to_list()
            response =  [item.to_dictionary() for item in runs]
            return jsonify(response)
        except Exception as ex:
            print(ex)
            raise InternalServerError(f"Exception while checking components: \n\t {ex}")
    else:
        raise InternalServerError("Experiment ID missing!")


@jwt_required()
@check_permissions_workspace()
@parse_params(
        Argument("get_unpublished", default=False, type=boolean, required=False),
    )
def getAllDatasets(workspace_id:str, get_unpublished:bool):
    """
        Get Information of all Datasets within the workspace

        :param workspace_id
        :returns: Json of serialized data of the datasets
    """
    try:
        email = get_jwt_identity()['email']
        return jsonify([item.serialize(email=email) for item in dataset_data_access.get_all(workspace_id, get_unpublished, user_id=email)])
        
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")


def getParameter(parameter:str):
    """
        Parse Parameter-String to JSON-Format

        :param parameter Parameter-String, given from the frontend
        :returns: Parameter-JSON
    """
    par = json.loads(parameter)
    new = "{"
    f = False
    for a in par:
        if(f):
            new += ","
        else:
            f = True
        new += "\""+a["key"]+"\":"+"\""+a["value"]+"\""
    new += "}"
    tp = json.loads(new)
    return tp



@jwt_required()
@parse_params(
        Argument("workspace_id", default='', type=str, required=True),
        Argument("run_id", default='', type=str, required=True),
        Argument("artifact_uri", default='', type=str, required=True),    
        Argument("model_name", default='', type=str, required=True),
    )
def deployRun(workspace_id:str, run_id:str,artifact_uri:str, model_name:str):
    """
        Deploys a given run.

        :param workspace_id current workspace
        :param run_id deployable run
        :param artifact_uri location of the run in artifact-store(hdfs)
        :param model_name new name of the deploy model
    """
    remote_server_uri = os.environ['MLFLOW_TRACKING_URI'] # set to your server URI
    mlflow.set_tracking_uri(remote_server_uri) 
    client = MlflowClient()
    tags = {"workspace_id": workspace_id}
    try:
        registered_model = client.create_registered_model(model_name,tags)        
    except RestException:
        print(f"Model '{model_name}' already exists in registry.")
    result = mlflow.register_model(
        f"runs:/{run_id}/model",
        f"{model_name}"
    )
    return ""





   




  


@jwt_required()
@parse_params(
    Argument("name", default='', type=str, required=True),
    Argument("version", default='', type=str, required=True),
    Argument("stage", default='', type=str, required=True),
)
def handleTransition(name:str, version:str, stage:str):
    """
        Funktion to transition an registred model to a different stage

        :param name name of registred model
        :param version of regeistred model
        :param stage stage to transition to 
    """
    remote_server_uri = os.environ['MLFLOW_TRACKING_URI']
    mlflow.set_tracking_uri(remote_server_uri) 
    client = MlflowClient()
    mv = client.transition_model_version_stage(name, version, stage)

    return {}

def getMetrics():
    """
        Get all the Metrics used in the system in Mlflow
        :returns: array with names of all metrics
    """
    conn = psycopg2.connect(
    user=os.environ['POSTGRES_USER'],
    password=os.environ['POSTGRES_PASSWORD'],
    host=os.environ['POSTGRES_HOST'],
    port=os.environ['POSTGRES_PORT']
    )
    cur = conn.cursor()
    cur.execute("SELECT DISTINCT(key) FROM public.metrics")
    rows = cur.fetchall()
    erg = []
    for row in rows:
        erg.append(row[0])
    cur.close()
    conn.close()
    return str(erg).replace("'","\"")

def getParameters():
    """
        Get all Parameters used in Mlflow

        :returns: Array with names of all parameters
    """
    conn = psycopg2.connect(
    user=os.environ['POSTGRES_USER'],
    password=os.environ['POSTGRES_PASSWORD'],
    host=os.environ['POSTGRES_HOST'],
    port=os.environ['POSTGRES_PORT']
    )

    cur = conn.cursor()
    cur.execute("SELECT DISTINCT(key) FROM public.params")
    rows = cur.fetchall()

    erg = []
    for row in rows:
        erg.append(row[0])
    cur.close()
    conn.close()
    return str(erg).replace("'","\"")