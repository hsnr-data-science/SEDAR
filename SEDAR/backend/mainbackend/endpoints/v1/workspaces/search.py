import json
import os
from elasticsearch import Elasticsearch
from neomodel import db
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask import jsonify
from flask_restful.reqparse import Argument
from mainbackend.database.data_access import dataset_data_access, ontology_data_access
from commons.configuration.settings import Settings
from commons.models.dataset.models import Dataset
from services.decorators import parse_params, check_permissions_workspace
from werkzeug.exceptions import InternalServerError
from flask_restful import inputs

class Search(Resource):
    
    @jwt_required()
    @check_permissions_workspace()
    @parse_params(
        Argument("query", default=None, type=str, required=True),
        Argument("source_search", default=None, type=bool, required=True),
        Argument("semantic_search", default=None, type=bool, required=True),
        Argument("author", default=None, type=str, required=False),
        Argument("schema", default=None, type=str, required=False),
        Argument("zone", default=None, type=str, required=False),
        Argument("tags", default=None, type=str, required=False, action="append"),
        Argument("sort_target", default=None, type=str, required=False),
        Argument("sort_direction", default=None, type=str, required=False),
        Argument("status", default=None, type=str, required=False),
        Argument("limit", default='10', type=str, required=False),
        Argument("rows_min", default=None, type=str, required=False),
        Argument("rows_max", default=None, type=str, required=False),
        Argument("datetime_start", default=None, type=inputs.datetime_from_iso8601, required=False),
        Argument("datetime_end", default=None, type=inputs.datetime_from_iso8601, required=False),
        Argument("with_auto_wildcard", default=True, type=bool, required=True),
        Argument("search_schema_element", default=False, type=bool, required=False),
        Argument("filter_schema", default=False, type=bool, required=False),
        Argument("is_pk", default=False, type=bool, required=False),
        Argument("is_fk", default=False, type=bool, required=False),
        Argument("size_min", default=None, type=str, required=False),
        Argument("size_max", default=None, type=str, required=False),
        Argument("notebook_search", default=None, type=bool, required=False),
        Argument("notebook_type", default=None, type=str, required=False),
    )
    def post(self, workspace_id:str, query:str, source_search:bool, semantic_search:bool, author:str, schema:str, zone:str, tags:[str], sort_target:str, sort_direction:str, status:str, limit:str, rows_min:str, rows_max:str, datetime_start, datetime_end, with_auto_wildcard:bool, search_schema_element:bool, filter_schema:bool, is_pk:bool, is_fk:bool, size_min:str, size_max:str, notebook_search:bool, notebook_type:str):
        """
        API get request to get fulltext search results.

        :param workspace_id: id of the workspace.
        :param query: the search query as string.
        :param source_search: whether the search is on es or neo4j index.
        :param semantic_search: whether the search enriched with semantic or not.
        :param author: email of the author for search.
        :param schema: type of schema for search.
        :param zone: type of zone for search.
        :param tags: tags for search.
        :param sort_target: target attribute for sorting.
        :param sort_direction: sort direction for sorting.
        :param status: status of dataset.
        :param limit: limit for search results.
        :param rows_min: minimum count rows.
        :param rows_max: maximum count rows.
        :param datetime_start: datetime_start.
        :param datetime_end: datetime_end.
        :param with_auto_wildcard: defines whether a default wildcard should be applied or not.
        :param search_schema_element: whether the search is on the schema elements (like name of attribute or data type) or on the dataset itself.
        :param filter_schema: defines whether the schema should be filtered or not.
        :param is_pk: defines whether the filtered attribute is a primary key or not.
        :param is_fk: defines whether the filtered attribute is a foreign key or not.
        :param size_min: minimum size of file.
        :param size_max: maximum size of file.
        :param notebook_search: whether the search is for notebooks or datasets.
        :param notebook_type: type of the notebook.
        :returns: neo4j or es results.
        """   
        try:
            if source_search == False:
                a = ''
                s = ''
                z = ''
                t = ''
                so = ''
                st = ''
                l = f'LIMIT {limit}'
                li = ''
                d = ''
                if author:
                    a = ' MATCH (hit)-[:IS_OWNER]->(u:User{email:"'+author+'"}) '
                if schema:
                    s = ' MATCH (hit)-[:HAS_SCHEMA]->(s:Schema{type:"'+schema+'"}) '
                if tags:
                    t = 'WITH ['
                    for index, i in enumerate(tags):
                        if index!=0:
                            t=t+','
                        t=t+f'"{i}"'
                    t = t+'] AS ids MATCH (hit:Dataset)-[:HAS_TAG]->(t:Tag) WHERE any (i IN ids WHERE t.uid = i) '
                if zone:
                    if zone=='RAW':
                        z = ' MATCH(hit) Where NOT(hit)-[:HAS_LINEAGE]->() '
                    else:
                        z = ' MATCH(hit) Where (hit)-[:HAS_LINEAGE]->() '
                if status:
                    if status=='PUBLIC':
                        st = ' MATCH(hit) Where hit.is_public=true '
                    else:
                        st = ' MATCH(hit) Where hit.is_public=false '
                if sort_target:
                    if sort_direction=='' or sort_direction=='ASC':
                        so = f' ORDER BY hit.{sort_target} '
                    else:
                        so = f' ORDER BY hit.{sort_target} DESC '
                if rows_min or rows_max:
                    li = f' MATCH (hit)-[:HAS_SCHEMA]->(s:Schema)-[:HAS_ENTITY]->(e:Entity) WHERE '
                    if rows_min:
                        li = li + f'e.count_of_rows>={rows_min}'
                    if rows_min and rows_max:
                        li = li + f' AND '
                    if rows_max:
                        li = li + f'e.count_of_rows<={rows_max}'
                    li = li+' '
                if datetime_start or datetime_end:
                    d = f'MATCH(hit) Where '
                    if datetime_start:
                        d = d + f'hit.range_start>={datetime_start.timestamp()}'
                    if datetime_start and datetime_end:
                        d = d + f' AND '
                    if datetime_end:
                        d = d + f'hit.range_end<={datetime_end.timestamp()}'
                    d = d+' '
                if semantic_search:
                    ret = json.loads(ontology_data_access.get_suggestions(workspace_id, query).decode('utf-8'))
                    qu='WITH ['
                    for index, i in enumerate(ret['results']['bindings']):
                        if index!=0:
                            qu=qu+','
                        qu=qu+'"<' + i['subject']['value'] + '>"'
                    qu=qu+'] AS subs MATCH (hit:Dataset)<-[:HAS_DATASET {is_published:true}]-(w:Workspace{uid:"'+workspace_id+'"}) MATCH (hit)-[:HAS_TAG]->()-[:HAS_ANNOTATION]->(a:Annotation) WHERE any (an IN subs WHERE a.instance CONTAINS an) '+st+t+z+s+li+a+d+'RETURN DISTINCT hit '+ so + l
                elif notebook_search:
                    if with_auto_wildcard==True:
                        query= f'*{query}*'
                    ton = ''
                    if notebook_type:
                        ton = f' AND notebook.type="{notebook_type}" '
                    qu='CALL db.index.fulltext.queryNodes("fulltext_notebooks", "'+query+'") YIELD node as notebook MATCH (notebook) WHERE notebook.is_public=true '+ton+' MATCH (notebook)<-[:HAS_NOTEBOOK]-(hit:Dataset)<-[:HAS_DATASET {is_published:true}]-(w:Workspace{uid:"'+workspace_id+'"}) '+st+t+z+s+li+a+d+'RETURN DISTINCT hit ' + so + l
                else:
                    if with_auto_wildcard==True:
                        query= f'*{query}*'
                    if schema and search_schema_element==True:
                        if schema=='UNSTRUCTURED':
                            size = ''
                            if size_min or size_max:
                                size = f' MATCH(file) WHERE '
                                if size_min:
                                    size = size + f'file.size_in_bytes>={size_min}'
                                if size_min and size_max:
                                    size = size + f' AND '
                                if size_max:
                                    size = size + f'file.size_in_bytes<={size_max}'
                                size = size+' '
                            qu='CALL db.index.fulltext.queryNodes("fulltext_schema_unstructured", "'+query+'") YIELD node as file '+size+' MATCH (file)<-[:HAS_FILE]-(:Schema)<-[:HAS_SCHEMA]-(hit:Dataset)<-[:HAS_DATASET {is_published:true}]-(w:Workspace{uid:"'+workspace_id+'"}) '+st+t+z+s+li+a+d+'RETURN DISTINCT hit ' + so + l
                        else:
                            depth=''
                            filter=''
                            if schema=='SEMISTRUCTURED':
                                depth='*1..10000'
                            if filter_schema==True:
                                filter = f'is_pk:{"true" if is_pk==True else "false"}, is_fk:{"true" if is_fk==True else "false"}'
                            qu='CALL db.index.fulltext.queryNodes("fulltext_schema_semi_and_structured", "'+query+'") YIELD node as attr MATCH (attr {'+filter+'})<-[:HAS_ATTRIBUTE'+depth+']-(:Entity)<-[:HAS_ENTITY]-(:Schema)<-[:HAS_SCHEMA]-(hit:Dataset)<-[:HAS_DATASET {is_published:true}]-(w:Workspace{uid:"'+workspace_id+'"}) '+st+t+z+s+li+a+d+'RETURN DISTINCT hit ' + so + l
                    else:
                        qu='CALL db.index.fulltext.queryNodes("fulltext_dataset", "'+query+'") YIELD node as hit MATCH (hit)<-[:HAS_DATASET {is_published:true}]-(w:Workspace{uid:"'+workspace_id+'"}) '+st+t+z+s+li+a+d+'RETURN DISTINCT hit ' + so + l
                    
                results = db.cypher_query(qu)
                hits = []
                for row in results:
                    if len(row)>0 and row[0]!='hit':
                        for r in row:
                            hits.append(Dataset.inflate(r[0]))
                return jsonify([item.serialize(email=get_jwt_identity()['email'], is_search=True) for item in hits])
            else:
                if with_auto_wildcard==True:
                    query= f'*{query}*'
                settings = Settings()
                es = Elasticsearch([f"{settings.es_service.url}"])
                data = { 
                    "query_string": {
                        "query": f"{query}",
                    }
                }
                res = es.search(index=f'{workspace_id}', query=data, filter_path=['hits.hits._source.dataset_id'])
                hits = []
                if res == {}:
                    return jsonify(hits)
                else:
                    for hit in res['hits']['hits']:
                        hits.append(dataset_data_access.get(hit["_source"]["dataset_id"]))
                return jsonify([item.serialize(email=get_jwt_identity()['email'], is_search=True) for item in hits])
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")