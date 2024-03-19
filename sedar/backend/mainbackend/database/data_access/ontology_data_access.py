import os
from datetime import datetime
from requests import post, delete as delete_request
from werkzeug.exceptions import NotFound, BadRequest, InternalServerError
from commons.models.dataset.models import User
from commons.configuration.settings import Settings
from commons.models.dataset.models import Ontology, Workspace
from werkzeug.exceptions import NotFound, BadRequest
import requests


#------------------------------------------------------------------------------------#
#CRUD
#------------------------------------------------------------------------------------#

def get(ontology_id:str) -> Ontology:
    """
    Get a specific ontologie.

    :param ontology_id: id of the ontology.
    :returns: the specific ontology.
    """
    ontology = Ontology.nodes.get_or_none(uid__exact = ontology_id)

    if not ontology:
        raise NotFound(f"Ontology with id {ontology_id} not found")

    return ontology

def get_all(workspace_id:str) -> [Ontology]:
    """
    Get all ontologies for a specific workspace.

    :param workspace_id: id of workspace.
    :returns: all ontologies for the given workspace.
    """
    workspace = Workspace.nodes.get(uid__exact=workspace_id)
    return workspace.ontologies

def add(title:str, file, workspace_id:str, author:User, description='') -> Ontology:
    """
    Adds new ontology to Fuseki and adds an entry in the database.

    :param title: title of the ontology.
    :param file: file that contains the ontology.
    :param workspace_id: the workspace the file is to be added in Fuseki.
    :param author: current user object.
    :returns: the changed workspace.
    """
    settings = Settings()
    workspace = Workspace.nodes.get(uid__exact=workspace_id)
    if not workspace:
        raise BadRequest()
    if file:
        entity = Ontology(title=title, description=description, created_on=datetime.now(), last_updated_on=datetime.now(), filename=file.filename)
    else:
        entity = Ontology(title=title, description=description, created_on=datetime.now(), last_updated_on=datetime.now(), filename=title)
    entity.save()
    entity.author.connect(author)

    workspace.ontologies.connect(entity)

    if file:
        file_extension = os.path.splitext(file.filename)[1].lower()

        if ".n3" == file_extension:
            headers = {'Content-Type': 'text/n3; charset=utf-8'}
            entity.mimetype="text/n3"
        elif ".rdf" == file_extension:
            headers = {'Content-Type': 'application/rdf+xml; charset=utf-8'}
            entity.mimetype="application/rdf+xml"
        elif ".owl" == file_extension:
            headers = {'Content-Type': 'application/rdf+xml; charset=utf-8'}
            entity.mimetype="application/rdf+xml"
        elif ".jsonld" == file_extension:
            headers = {'Content-Type': 'application/ld+json; charset=utf-8'}
            entity.mimetype="application/ld+json"
        else:
            raise TypeError(file_extension.lower() + " is not supported")
        file = file.read()
        entity.size_in_bytes=str(len(file))
        entity.save()


        p = post(f"http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/{workspace_id}?graph={str(entity.uid)}", data=file, headers=headers)
        if p.status_code == 200 or p.status_code == 201:
            pass 
        else:
            #todo add exception
            raise InternalServerError("Posting the file to fuseki failed:" , p.text)
        
        #https://stackoverflow.com/questions/51288107/sparql-how-to-get-number-of-triples
        querystring = """
        SELECT (COUNT(*) as ?Triples) 
        FROM """+f"<http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/{workspace_id}/{str(entity.uid)}>"+"""    
        WHERE { ?s ?p ?o } 
        """
        g = requests.get(f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' + workspace_id +'/?query='+querystring)
        number_of_triples = str(g.json()['results']['bindings'][0]['Triples']['value'])
        entity.number_of_triples=number_of_triples
    else:
        entity.mimetype="online knowledge base"
        entity.size_in_bytes=str(0)
        entity.number_of_triples=0
    entity.save()
    return entity

def update(workspace_id:str, ontology_id:str, title:str, description:str):
    """
    Update ontology informations stored in the database.

    :param workspace_id: id of workspace.
    :param ontology_id: id of ontology.
    :param title: title of ontology.
    :param description: description of ontology.
    :return: updated ontology.
    """
    entity: Ontology = Ontology.nodes.get(uid__exact=ontology_id)
    
    if not entity:
        raise NotFound()

    entity.title = title
    entity.description = description
    entity.save()

    return entity

def delete(workspace_id:str, ontology_id:str):
    """
    Delete ontology in Fuseki and the database entry.

    :param workspace_id: id of the workspace in the database and in Fuseki.
    :param ontology_id: name of the graph.
    :return:
    """
    entity: Ontology = Ontology.nodes.get_or_none(uid__exact=ontology_id)

    if not entity:
        raise NotFound()
    
    settings = Settings()

    d = delete_request(f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/{workspace_id}?graph={ontology_id}')
    
    if d.status_code != 204:
        #todo throw error
        pass

    entity.delete()

    return

#------------------------------------------------------------------------------------#
#Helperfunctions
#------------------------------------------------------------------------------------#

def create_query_string(graph_name: str, keyword: str):
    """
    This methods generates the query string for the keyword-search in put.

    :param graph_name: graph to be queried, default is "default graph",
        like "<http://localhost:3030/60d5c79a7d2c38ee678e87a8/60d5c79d7d2c38ee678e87a9>"
    :param keyword: keywords to search for or when search-bool is false the query itself
    :returns: the query
    """
    if graph_name == '' or graph_name is None:
        graph_name = '?g'
    query = """ SELECT ?subject ?predicate ?object
                WHERE {
                    GRAPH """ + graph_name + """ {
                        ?subject ?predicate ?object .
                        FILTER (
                            regex(str(?subject), '""" + keyword + """') ||
                            regex(str(?predicate), '""" + keyword + """') ||
                            regex(str(?object),  '""" + keyword + """'))
                    }
                } LIMIT 100"""
    return query
    
def create_workspace_fuseki(id:str):
    """
    Creates a new workspace in Fuseki.

    :param entity: The workspace for which a new workspace shall be added
    :return: The status code of the post request to fuseki
    """
    settings = Settings()

    p = post(f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/$/datasets',
         auth=(settings.fuseki_storage.user, settings.fuseki_storage.password),
         data={'dbName': id, 'dbType': 'tdb'})
    return p.status_code

def get_suggestions(workspace_id:str, search_term:str):
    """
    This function provides multiple suggestions for a auto-completion of ontology-attributes in fuseki. 
    The search_term can either be the rdf:label or the name of the class itself(after the #).

    :returns: a list of maximum 20 suggestions which fit the requirements ordered by the length of the label.
    """
    querystring = """
        PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
        SELECT DISTINCT ?subject ?label ?desc ?graph
        WHERE {
        graph ?graph{
          ?subject a ?x ;
            rdfs:label ?label .
          FILTER (regex(str(?subject), '#""" + search_term + """', 'i') || 
            regex(?label, '""" + search_term + """', 'i'))
        }}
        ORDER BY ?graph
        LIMIT 20 """
    
    settings = Settings()

    p = post(f'http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' + workspace_id,
             auth=(settings.fuseki_storage.user, settings.fuseki_storage.password),
             data={'query': querystring})

    return p.content