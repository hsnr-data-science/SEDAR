from .api import API_BP
from flask.blueprints import Blueprint

ROOT_BLUEPRINT = Blueprint("root", __name__, url_prefix="")
ROOT_BLUEPRINT.register_blueprint(API_BP)
