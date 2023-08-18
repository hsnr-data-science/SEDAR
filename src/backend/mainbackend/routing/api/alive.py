from flask import Blueprint
from endpoints.alive import alive, alive_hive

API_ALIVE_BP = Blueprint("alive", __name__, url_prefix='/alive')
API_ALIVE_BP.add_url_rule("/", "alive", alive, methods=["GET"])

API_ALIVE_HIVE_BP = Blueprint("alive-hive", __name__, url_prefix='/alive-hive')
API_ALIVE_HIVE_BP.add_url_rule("/", "alive-hive", alive_hive, methods=["GET"])