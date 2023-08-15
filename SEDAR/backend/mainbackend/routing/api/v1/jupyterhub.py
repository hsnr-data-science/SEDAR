from flask import Blueprint
from flask_restful import Api

from endpoints.v1.jupyterhub.jupyterhub import copyNbFromHDFStoContainer, addNotebookToHDFS, checkContainer


API_V1_JUPYTERHUB_BP = Blueprint("jupyterhub", __name__, url_prefix="/jupyterhub")



API_V1_JUPYTERHUB_BP.add_url_rule(
    "copyNbFromHDFStoContainer", "copyNbFromHDFStoContainer", copyNbFromHDFStoContainer, methods=["POST"]
)

API_V1_JUPYTERHUB_BP.add_url_rule(
    "addNotebookToHDFS", "addNotebookToHDFS", addNotebookToHDFS, methods=["POST"]
)

API_V1_JUPYTERHUB_BP.add_url_rule(
    "/checkContainer", "checkContainer", checkContainer, methods=["GET"]
)

