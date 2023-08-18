import io
import json
from flask import jsonify, Response, send_file
from flask_restful import Resource
from flask_restful.reqparse import Argument
import requests
from werkzeug.exceptions import InternalServerError
from werkzeug.datastructures import FileStorage
from flask_jwt_extended import jwt_required, get_jwt_identity
from database.data_access import user_data_access
from commons.models.dataset.models import Ontology
from flask_restful.inputs import boolean
from commons.configuration.settings import Settings
from services.decorators import parse_params, check_permissions_workspace
from database.data_access import ontology_data_access


class Ontologies(Resource):
    """
    Class for managing ontologies.
    """

    @jwt_required()
    @check_permissions_workspace(can_read=True)
    def get(self, workspace_id: str):
        """
        API get request for ontologies.

        :param workspace_id: id of workspace.
        :returns: all ontologies of a given workspace in JSON format.
        """
        try:
            return jsonify([item.serialize(workspace_id) for item in ontology_data_access.get_all(workspace_id)])
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace(can_read=True, can_write=True)
    @parse_params(
        Argument("file", type=FileStorage, location='files', required=True),
        Argument("title", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
    )
    def post(self, file: FileStorage, title: str, description: str, workspace_id: str):
        """
        API post request to add a new ontology.

        :param name: Name of new ontology.
        :param file: The file containing the ontology.
        :param workspace_id: id of workspace the file is to be added.
        :returns: newly added ontology.
        """
        try:
            email = get_jwt_identity()['email']
            return ontology_data_access.add(title, file, workspace_id, user_data_access.get(email), description).serialize(workspace_id=workspace_id), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace(can_read=True, can_write=True)
    @parse_params(
        Argument("title", default=None, type=str, required=True),
        Argument("description", default=None, type=str, required=False),
    )
    def put(self, workspace_id: str, ontology_id: str, title: str, description: str):
        """
        API put request for updating a ontology in a workspace.

        :param workspace_id: id of workspace.
        :param ontology_id: id of ontology.
        :param title: title of ontology.
        :param description: description of ontology.
        :return: updated ontology.
        """
        try:
            return ontology_data_access.update(workspace_id, ontology_id, title, description).serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace(can_read=True, can_delete=True)
    def delete(self, workspace_id: str, ontology_id: str):
        """
        API delete request for deleting an ontology from a workspace.

        :param workspace_id: id of workspace.
        :param ontology_id: id of ontology in MongoDB.
        :return: HTTP-Code 200 if the deletion was successful and failure-code otherwise.
        """
        try:
            ontology_data_access.delete(workspace_id, ontology_id)
            return Response(status=204)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")


class OntologiesSearch(Resource):
    """ Provides requests to search or query ontologies in fuseki directly. """

    @jwt_required()
    @check_permissions_workspace(can_read=True, can_write=True)
    @parse_params(
        Argument("querystring", required=True, type=str),
        Argument("graph_name", default='?g', type=str),
        Argument("is_query", default=False, type=boolean)
    )
    def get(self, workspace_id: str, querystring: str, graph_name: str, is_query: bool):
        """
        Get request to query fuseki.

        :param workspace_id: ID of workspace.
        :param querystring: A keyword or the query itself.
        :param graph_name: ID of Graph in Fuseki, not the entire URL.
        :param is_query: A bool value if a query or keyword is given in querystring.
        :return: The results in either triple(subject, predicate, object) format or as described in the user query.
        """
        try:
            settings = Settings()

            if is_query:
                # query fuseki with user defined query
                if "LIMIT" not in querystring:
                    querystring += str("LIMIT 100")
                g = requests.get(
                    f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' + workspace_id + '/?query='+querystring)
                return g.json()

            if not (graph_name == '?g'):  # name of graph is adjusted to as is in fuseki
                graph_name = f'<http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' + \
                    workspace_id + '/' + graph_name + '>'
            g = requests.get(f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' +
                             workspace_id + '/?query='+ontology_data_access.create_query_string(graph_name, querystring))
            return g.json()
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")


@parse_params()
def iri(workspace_id: str, graph_id: str):
    """
    Get API for the ontology iri.

    :param workspace_id: id of current workspace.
    :param graph_id: id of the graph that should be visualized.
    :returns: the content from fuseki.
    """
    settings = Settings()
    g = requests.get(
        f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' + workspace_id + '/?graph='+graph_id)
    try:
        return g.content
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")


@parse_params(
    Argument("querystring", required=True, type=str),
)
def construct(workspace_id: str, querystring: str):
    """
    Get API for the construct query.

    :param workspace_id: id of current workspace.
    :param querystring: construct query.
    :returns: the content from fuseki.
    """
    settings = Settings()
    g = requests.get(
        f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' + workspace_id + '/?query='+querystring)
    try:
        return g.content
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")


@check_permissions_workspace(can_read=True)
@parse_params()
def download(workspace_id: str, graph_id: str):
    """
    Get API for the download of a ontology.

    :param workspace_id: id of current workspace.
    :param graph_id: id of the graph/ontology that should be downloaded.
    :returns: the content from fuseki.
    """
    settings = Settings()
    entity: Ontology = ontology_data_access.get(graph_id)
    g = requests.get(f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' +
                     workspace_id + '/?graph='+graph_id, headers={'Accept': f'{entity.mimetype} charset=utf-8'})
    try:
        return send_file(io.BytesIO(g.content), attachment_filename=entity.filename, mimetype=entity.mimetype)
    except Exception as ex:
        raise InternalServerError(f"Exception: \n\t {ex}")


class Completion(Resource):
    """
    Class for search and suggestion requests.
    """
    @jwt_required()
    @check_permissions_workspace()
    @parse_params(
        Argument('search_term', required=True, type=str),
        Argument('knowledge_base', required=False, type=str)
    )
    def get(self, workspace_id: str, search_term: str = '', knowledge_base=None):
        """
        Get API for auto completion feature.

        :param workspace_id: id of current workspace
        :param search_term: keyword to be auto completed.
        :returns: ontology-attribute with according label and graphname(ontology id) or failure http-code
        """
        try:
            results = []
            if knowledge_base == None:
                ret = json.loads(ontology_data_access.get_suggestions(
                    workspace_id, search_term).decode('utf-8'))

                last_ontlogy = None
                last_ontology_id = ''
                if ret is not None:
                    for i in ret['results']['bindings']:
                        if last_ontlogy == None:
                            last_ontology_id = i['graph']['value'].split(
                                '/')[len(i['graph']['value'].split('/'))-1]
                            last_ontlogy = ontology_data_access.get(
                                last_ontology_id)
                        if last_ontology_id != i['graph']['value'].split('/')[len(i['graph']['value'].split('/'))-1]:
                            last_ontology_id = i['graph']['value'].split(
                                '/')[len(i['graph']['value'].split('/'))-1]
                            last_ontlogy = ontology_data_access.get(
                                last_ontology_id)
                        res = {
                            "text": i['label']['value'],
                            "description": i['desc']['value'] if 'desc' in i else None,
                            "value": "<" + i['subject']['value'] + ">",
                            "graph": last_ontology_id,
                            "graphName": last_ontlogy.title
                        }
                        print(res)
                        results.append(res)
                    return jsonify(results)
                else:
                    Response(status=404)
        except Exception as ex:
            return ex, 500
