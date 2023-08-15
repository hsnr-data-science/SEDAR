from flask import Blueprint
from endpoints.logs import error, error_download, access, access_download

API_LOGS_BP = Blueprint("logs", __name__, url_prefix='/logs')

API_LOGS_BP.add_url_rule(
    "/error", "error-log", error, methods=["GET"]
)

API_LOGS_BP.add_url_rule(
    "/error/download", "error-log-download", error_download, methods=["GET"]
)

API_LOGS_BP.add_url_rule(
    "/access", "access-log", access, methods=["GET"]
)

API_LOGS_BP.add_url_rule(
    "/access/download", "access-log-download", access_download, methods=["GET"]
)