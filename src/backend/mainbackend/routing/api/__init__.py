from flask import Blueprint
from .v1 import API_V1_BP
from .auth import API_AUTH_BP
from .alive import API_ALIVE_BP, API_ALIVE_HIVE_BP
from .logs import API_LOGS_BP
from .test import API_TEST_BP
from .stats import API_STATS_BP

API_BP = Blueprint("api", __name__, url_prefix="/api")
API_BP.register_blueprint(API_V1_BP)
API_BP.register_blueprint(API_AUTH_BP)
API_BP.register_blueprint(API_ALIVE_BP)
API_BP.register_blueprint(API_ALIVE_HIVE_BP)
API_BP.register_blueprint(API_LOGS_BP)
API_BP.register_blueprint(API_TEST_BP)
API_BP.register_blueprint(API_STATS_BP)


