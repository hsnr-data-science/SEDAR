
from flask import Blueprint
from .user import API_V1_USER_BP
from .workspace import API_V1_WORKSPACE_BP
from .ontology import API_V1_ONTOLOGY_BP
from .misc import API_V1_MISC_BP
from .wiki import API_V1_WIKI_BP
from .obda import API_V1_OBDA_BP
from .mlflow import API_V1_MLFLOW_BP
from .jupyterhub import API_V1_JUPYTERHUB_BP

API_V1_BP = Blueprint("v1", __name__, url_prefix="/v1")
API_V1_BP.register_blueprint(API_V1_USER_BP)
API_V1_BP.register_blueprint(API_V1_WORKSPACE_BP)
API_V1_BP.register_blueprint(API_V1_ONTOLOGY_BP)
API_V1_BP.register_blueprint(API_V1_MISC_BP)
API_V1_BP.register_blueprint(API_V1_WIKI_BP)
API_V1_BP.register_blueprint(API_V1_OBDA_BP)
API_V1_BP.register_blueprint(API_V1_MLFLOW_BP)
API_V1_BP.register_blueprint(API_V1_JUPYTERHUB_BP)
