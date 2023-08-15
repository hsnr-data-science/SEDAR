from flask import Blueprint

from endpoints.test import get, post

API_TEST_BP = Blueprint("test", __name__, url_prefix='/test')

API_TEST_BP.add_url_rule(
    "/", "get", get, methods=["GET"]
)

API_TEST_BP.add_url_rule(
    "/start", "start", post, methods=["POST"]
)