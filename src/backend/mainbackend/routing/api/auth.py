from flask import Blueprint
from endpoints.auth import login, logout, gitlablogin

API_AUTH_BP = Blueprint("auth", __name__, url_prefix='/auth')
API_AUTH_BP.add_url_rule("/login", "login", login, methods=["POST"])
API_AUTH_BP.add_url_rule("/logout", "logout", logout, methods=["POST"])
API_AUTH_BP.add_url_rule("/gitlablogin", "gitlablogin", gitlablogin, methods=["POST"])