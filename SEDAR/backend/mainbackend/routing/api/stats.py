from flask import Blueprint
from endpoints.stats import stats

API_STATS_BP = Blueprint("stats", __name__, url_prefix='/stats')
API_STATS_BP.add_url_rule("/", "stats", stats, methods=["GET"])