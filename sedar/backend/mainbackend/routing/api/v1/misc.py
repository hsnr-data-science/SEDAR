from flask import Blueprint
from flask_restful import Api
from endpoints.v1.misc import extract_schema

API_V1_MISC_BP = Blueprint("misc", __name__, url_prefix="/misc")

API_V1_MISC_BP.add_url_rule(
    "/<datasource_id>/extract_schema", "extract_schema", extract_schema, methods=["GET"]
)
