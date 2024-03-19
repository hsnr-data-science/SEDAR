from flask import Blueprint
from flask_restful import Api

from endpoints.v1.wiki.wiki import Wiki

API_V1_WIKI_BP = Blueprint("wiki", __name__, url_prefix="/wiki")

wiki_routes = ["/<language>"]
Api(API_V1_WIKI_BP).add_resource(Wiki, *wiki_routes)

