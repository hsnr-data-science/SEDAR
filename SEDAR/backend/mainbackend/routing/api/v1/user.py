from flask import Blueprint
from flask_restful import Api

from endpoints.v1.users import Users
from endpoints.v1.users.current import Current

API_V1_USER_BP = Blueprint("user", __name__, url_prefix="/users")

users_routes = ["/", "/<email>"]
Api(API_V1_USER_BP).add_resource(Users, *users_routes)

users_routes = ["/current/", "/current/<email>"]
Api(API_V1_USER_BP).add_resource(Current, *users_routes)
