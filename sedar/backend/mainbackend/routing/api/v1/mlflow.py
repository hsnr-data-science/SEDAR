from flask import Blueprint
from flask_restful import Api

from endpoints.v1.mlflow.mlflow import listExperiments, createExperiment, deleteExperiment, searchRuns, getAllDatasets, deployRun, listRegisteredModels, handleTransition, getMetrics, getParameters
from endpoints.v1.mlflow.jupyter_code_creation import createJupyterCode

API_V1_MLFLOW_BP = Blueprint("mlflow", __name__, url_prefix="/mlflow")

API_V1_MLFLOW_BP.add_url_rule(
    "listExperiments", "listExperiments", listExperiments, methods=["GET"]
)

API_V1_MLFLOW_BP.add_url_rule(
    "createExperiment", "createExperiment", createExperiment, methods=["POST"]
)

API_V1_MLFLOW_BP.add_url_rule(
    "deleteExperiment", "deleteExperiment", deleteExperiment, methods=["POST"]
)

API_V1_MLFLOW_BP.add_url_rule(
    "searchRuns", "searchRuns", searchRuns, methods=["POST"]
)

API_V1_MLFLOW_BP.add_url_rule(
    "/<workspace_id>/datasets", "datasets", getAllDatasets, methods=["GET"]
)



API_V1_MLFLOW_BP.add_url_rule(
    "deployRun", "deployRun", deployRun, methods=["POST"]
)

API_V1_MLFLOW_BP.add_url_rule(
    "/<workspace_id>/listRegisteredModels", "listRegisteredModels", listRegisteredModels, methods=["GET"]
)


API_V1_MLFLOW_BP.add_url_rule(
    "createJupyterCode", "createJupyterCode", createJupyterCode, methods=["POST"]
)


API_V1_MLFLOW_BP.add_url_rule(
    "handleTransition", "handleTransition", handleTransition, methods=["POST"]
)

API_V1_MLFLOW_BP.add_url_rule(
    "getParameters", "getParameters", getParameters, methods=["GET"]
)
API_V1_MLFLOW_BP.add_url_rule(
    "getMetrics", "getMetrics", getMetrics, methods=["GET"]
)
