from flask import Blueprint
from flask_restful import Api
from endpoints.v1.datasets.notebooks import Notebooks, notebook_code, add_mlrun_to_notebook
from endpoints.v1.datasets.lineage import Lineage
from endpoints.v1.datasets.favorite import get_favorites, set_favorite
from endpoints.v1.workflow.workflow import WorkFlow
from endpoints.v1.workspaces.search import Search
from endpoints.v1.datasets.attributes import Attributes
from endpoints.v1.datasets.entities import Entities
from endpoints.v1.datasets.files import Files
from endpoints.v1.datasets.logs import Logs
from endpoints.v1.datasets.timer import put_timer
from endpoints.v1.datasets.options import set_public_status, add_user, add_index_data, delete_index_data
from endpoints.v1.datasets.tag import Tags
from endpoints.v1.datasets.datasets import Datasets
from endpoints.v1.datasources import datasource_endpoints
from endpoints.v1.workspaces import Workspaces
from endpoints.v1.users.workspace import Workspaceusers
from endpoints.v1.datasets.recommendations import Recommendations
from endpoints.v1.datasets.source_data import get_deltas_of_version, query_source_data, get_preview, start_profiling
from endpoints.v1.datasets.cleaning import ConstraintValidation, ConstraintSuggestion, Filters

API_V1_WORKSPACE_BP = Blueprint("workspace", __name__, url_prefix="/workspaces")

routes = ["/", "/<workspace_id>"]
Api(API_V1_WORKSPACE_BP).add_resource(Workspaces, *routes)

routes = ["/<workspace_id>/users"]
Api(API_V1_WORKSPACE_BP).add_resource(Workspaceusers, *routes)

routes = ["/<workspace_id>/datasets", "/<workspace_id>/datasets/<dataset_id>"]
Api(API_V1_WORKSPACE_BP).add_resource(Datasets, *routes)

routes = ["/<workspace_id>/datasets/<dataset_id>/logs"]
Api(API_V1_WORKSPACE_BP).add_resource(Logs, *routes)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/create", "create", datasource_endpoints.create_definition, methods=["POST"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/timer", "put_timer", put_timer, methods=["PUT"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/run-ingestion", "run", datasource_endpoints.run_ingestion, methods=["GET"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/update-datasource", "update", datasource_endpoints.update_definition, methods=["PUT"]
)

routes = ["/<workspace_id>/datasets/<dataset_id>/tags", "/<workspace_id>/datasets/<dataset_id>/tags/<tag_id>", "/<workspace_id>/tags"]
Api(API_V1_WORKSPACE_BP).add_resource(Tags, *routes)

routes = ["/<workspace_id>/datasets/<dataset_id>/recommendations"]
Api(API_V1_WORKSPACE_BP).add_resource(Recommendations, *routes)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/status", "status", set_public_status, methods=["PUT"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/users", "user", add_user, methods=["PUT"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/index", "index", add_index_data, methods=["PUT"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/index", "unindex", delete_index_data, methods=["DELETE"]
)

routes = ["/<workspace_id>/datasets/<dataset_id>/attributes/<attribute_id>"]
Api(API_V1_WORKSPACE_BP).add_resource(Attributes, *routes)

routes = ["/<workspace_id>/datasets/<dataset_id>/entities/<entity_id>"]
Api(API_V1_WORKSPACE_BP).add_resource(Entities, *routes)

routes = ["/<workspace_id>/datasets/<dataset_id>/files/<file_id>"]
Api(API_V1_WORKSPACE_BP).add_resource(Files, *routes)

routes = ["/<workspace_id>/search"]
Api(API_V1_WORKSPACE_BP).add_resource(Search, *routes)

routes = ["/<workspace_id>/workflow"]
Api(API_V1_WORKSPACE_BP).add_resource(WorkFlow, *routes)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/favorite", "favorite", set_favorite, methods=["PATCH"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/favorites", "favorites", get_favorites, methods=["GET"]
)

routes = ["/<workspace_id>/datasets/<dataset_id>/lineage"]
Api(API_V1_WORKSPACE_BP).add_resource(Lineage, *routes)

routes = ["/<workspace_id>/datasets/<dataset_id>/notebooks", "/<workspace_id>/datasets/<dataset_id>/notebooks/<notebook_id>"]
Api(API_V1_WORKSPACE_BP).add_resource(Notebooks, *routes)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/notebook-code/<dataset_id>", "notebook-code", notebook_code, methods=["GET"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/deltas", "delta", get_deltas_of_version, methods=["GET"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/query", "query", query_source_data, methods=["POST"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/preview", "get", get_preview, methods=["GET"]
)

API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/datasets/<dataset_id>/profiling", "profiling", start_profiling, methods=["GET"]
)

constraint_validation_routes = ["/<workspace_id>/datasets/<dataset_id>/cleaning/verify"]
Api(API_V1_WORKSPACE_BP).add_resource(ConstraintValidation, *constraint_validation_routes)

constraint_suggestion_routes = ["/<workspace_id>/datasets/<dataset_id>/cleaning/suggest"]
Api(API_V1_WORKSPACE_BP).add_resource(ConstraintSuggestion, *constraint_suggestion_routes)

filter_routes = ["/<workspace_id>/datasets/<dataset_id>/cleaning/filters"]
Api(API_V1_WORKSPACE_BP).add_resource(Filters, *filter_routes)


API_V1_WORKSPACE_BP.add_url_rule(
    "/<workspace_id>/add-mlrun/<dataset_id>", "add_mlrun_to_notebook", add_mlrun_to_notebook, methods=["POST"]
)