from flask import Blueprint
from flask_restful import Api

from endpoints.v1.ontologies import Ontologies, OntologiesSearch, Completion, construct, iri, download

API_V1_ONTOLOGY_BP = Blueprint("ontology", __name__)

search_routes = ["/workspaces/<workspace_id>/ontologies/search"]
Api(API_V1_ONTOLOGY_BP).add_resource(OntologiesSearch, *search_routes)

routes = ["/workspaces/<workspace_id>/ontologies", "/workspaces/<workspace_id>/ontologies/<ontology_id>"]
Api(API_V1_ONTOLOGY_BP).add_resource(Ontologies, *routes)

API_V1_ONTOLOGY_BP.add_url_rule("/workspaces/<workspace_id>/ontologies/construct", "construct", construct, methods=["GET"])
API_V1_ONTOLOGY_BP.add_url_rule("/workspaces/<workspace_id>/ontologies/iri/<graph_id>", "iri", iri, methods=["GET"])
API_V1_ONTOLOGY_BP.add_url_rule("/workspaces/<workspace_id>/ontologies/<graph_id>/download", "download", download, methods=["GET"])

completion_routes = ["/workspaces/<workspace_id>/ontologies/completion"]
Api(API_V1_ONTOLOGY_BP).add_resource(Completion, *completion_routes)