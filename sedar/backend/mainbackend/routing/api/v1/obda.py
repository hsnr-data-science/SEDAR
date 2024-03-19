from flask import Blueprint
from flask_restful import Api
from endpoints.v1.obda import Mappings
from endpoints.v1.obda.ontop import OnTopConfigurations, CheckOnTop, Initialize_OnTop, OnTop_MappingParser

API_V1_OBDA_BP = Blueprint("obda", __name__)

# ===== mappings CRUD ===================================================================================
mapping_routes = ["/workspaces/<workspace_id>/obda/mappings"]
Api(API_V1_OBDA_BP).add_resource(Mappings, *mapping_routes)

# ===== OBDA ===================================================================================





# ===== ONTOP ===================================================================================
ontop_configurations_routes = ["/workspaces/<workspace_id>/obda/OnTopConfigurations"]
Api(API_V1_OBDA_BP).add_resource(OnTopConfigurations, *ontop_configurations_routes)

check_ontop_routes = ["/workspaces/<workspace_id>/obda/CheckOnTop"]
Api(API_V1_OBDA_BP).add_resource(CheckOnTop, *check_ontop_routes)

initialize_routes = ["/workspaces/<workspace_id>/obda/initialize_hive"]
Api(API_V1_OBDA_BP).add_resource(Initialize_OnTop, *initialize_routes)

mapping_parser_routes = ["/workspaces/<workspace_id>/obda/ontop/mapping_parser"]
Api(API_V1_OBDA_BP).add_resource(OnTop_MappingParser, *mapping_parser_routes)