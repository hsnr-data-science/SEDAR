from flask import jsonify
import os
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
import requests
from services.decorators import check_credentials
from werkzeug.exceptions import Unauthorized, InternalServerError
from datetime import datetime
from commons.configuration.settings import Settings
import psycopg2
import docker
from database.data_access import user_data_access

def check(url:str, is_postgres:bool=False, hive_metastore:bool=False, hive_metastore_postgresql:bool=False, jupyter_single_user:bool=False) -> bool: 
    """
    Returns True if component responds with 200.

    :param url: url that is used for the request.
    :param is_postgres: defines if it is necessary to use psycopg2.
    :return: True or False
    """

    if is_postgres==False and hive_metastore==False and hive_metastore_postgresql==False:
        try:
            if jupyter_single_user:
                access_token = create_access_token(identity={'email':get_jwt_identity()["email"]})
                r = requests.get(url, timeout=2, cookies={"access_token_cookie":access_token})
                return r.status_code==200
            else:
                return requests.get(url, timeout=2).status_code==200
        except:
            return False
    elif is_postgres==False and hive_metastore==True and hive_metastore_postgresql==False:
        client = docker.DockerClient()
        try:
            hive_metastore = client.containers.get("hive-metastore")
            return True
        except:
            return False
    elif is_postgres==False and hive_metastore==False and hive_metastore_postgresql==True:
        client = docker.DockerClient()
        try:
            hive_metastore_postgresql = client.containers.get("hive-metastore-postgresql")
            return True
        except:
            return False
    elif is_postgres==True and hive_metastore==False and hive_metastore_postgresql==False:
        settings = Settings()
        postgresql = settings.postgresql_storage
        connection = None
        try:
            connection = psycopg2.connect(
                f"host='{postgresql.host}' user='{postgresql.user}' password='{postgresql.password}'" +
                f" port='{postgresql.port}'",
                connect_timeout=2
            )
            return True
        except psycopg2.OperationalError as err:
            return False

@jwt_required()
@check_credentials()
def alive():
    """
    API to check if all components are alive.

    :return: json with all required informations.
    """
    backend_url = os.getenv("MAIN_BACKEND_URL")
    try:
        email = get_jwt_identity()['email']
        username = user_data_access.get(email).username
        settings = Settings()
        routes = {
            "components":[ 
                {
                    "name":"HDFS",
                    "isAlive": check(f"http://{settings.hdfs_storage.namenode}:{settings.hdfs_storage.web_port}"),
                    "url": f"http://{settings.hdfs_storage.namenode}:{settings.hdfs_storage.web_port}"
                },
                {
                    "name":"Apache Jena Fuseki",
                    "isAlive": check(f"http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/$/ping"), 
                    "url": f"http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}"
                },
                {
                    "name":"Elasticsearch",
                    "isAlive": check(f"{settings.es_service.url}"),
                    "url": f"{settings.es_service.url}" 
                },
                {
                    "name":"MongoDB",
                    "isAlive": check(f"http://{settings.mongodb_management.host}:{settings.mongodb_management.port}"),
                    "url": f"http://{settings.mongodb_management.host}:{settings.mongodb_management.port}"
                },
                {
                    "name":"PostgreSQL",
                    "isAlive": check(f"", is_postgres=True, hive_metastore=False, hive_metastore_postgresql=False),
                    "url": f"http://{settings.postgresql_storage.host}:{settings.postgresql_storage.port}" 
                },
                {
                    "name":"Neo4j",
                    "isAlive": check(f"http://{settings.neo4j_management.host}:7474"),
                    "url": f"http://{settings.neo4j_management.host}:7474"  
                },
                {
                    "name":"Apache Tika",
                    "isAlive": check(f"{settings.tika_service.url}"),
                    "url": f"{settings.tika_service.url}"
                },
                {
                    "name":"JupyterHub",
                    "isAlive": check(f"{settings.jupyter_service.url}/hub/api"),
                    "url": f"{settings.jupyter_service.url}" 
                },
                {
                    "name":"Jupyter - SingleUser",
                    "isAlive": check(f"{backend_url}/api/v1/jupyterhub/checkContainer", jupyter_single_user=True),
                    "url": f"{settings.jupyter_service.url}/user/{username}/tree?" 
                },
                {
                    "name":"WebVOWL",
                    "isAlive": check(f"{settings.webvowl_service.url}"),
                    "url": f"{settings.webvowl_service.url}"
                },                             
            ]        
        }
        if settings.server.ingestion_service_with_schema_service_in_one==True:
             routes["components"].append({
                "name":"Ingestion, Schema & Metadata - Service",
                "isAlive": check(f"http://{settings.ingestion_service_alive.host}:{settings.ingestion_service_alive.port}/alive"),
                "url": f"http://{settings.ingestion_service_alive.host}:{settings.ingestion_service_alive.port}/alive"
            })
        else:
            routes["components"].append({
                "name":"Ingestion - Service",
                "isAlive": check(f"http://{settings.ingestion_service_alive.host}:{settings.ingestion_service_alive.port}/alive"),
                "url": f"http://{settings.ingestion_service_alive.host}:{settings.ingestion_service_alive.port}/alive"
            })
            routes["components"].append({
                "name":"Schema & Metadata - Service",
                "isAlive": check(f"http://{settings.schema_service_alive.host}:{settings.schema_service_alive.port}/alive"),
                "url": f"http://{settings.schema_service_alive.host}:{settings.schema_service_alive.port}/alive"
            })
        routes["components"].append({
            "name":"Continuation - Service",
            "isAlive": check(f"http://{settings.continuation_service_alive.host}:{settings.continuation_service_alive.port}/alive"),
            "url": f"http://{settings.continuation_service_alive.host}:{settings.continuation_service_alive.port}/alive"
        })
        routes["components"].append({
            "name":"Profiling - Service",
            "isAlive": check(f"http://{settings.profiling_service_alive.host}:{settings.profiling_service_alive.port}/alive"),
            "url": f"http://{settings.profiling_service_alive.host}:{settings.profiling_service_alive.port}/alive"
        })  
        for route in settings.server.alive_routes:
            routes["components"].append({
                "name":route['name'],
                "isAlive": check(f"{route['url']}"),
                "url": f"{route['url']}"
            })  
        return routes, 200
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception while checking components: \n\t {ex}")



@jwt_required()
@check_credentials()
def alive_hive():
    """
    API to check if all components are alive.

    :return: json with all required informations.
    """
    try:
        settings = Settings()
        routes = {
            "components":[ 
                {
                    "name":"Hive-Server",
                    "isAlive": check(f"http://{settings.hive.host}:{settings.hive.server_port}"),
                    "url": f"http://{settings.hive.host}:{settings.hive.server_port}"
                },
                {
                    "name":"Hive-Metastore",
                    "isAlive": check(f"", is_postgres=False, hive_metastore=True, hive_metastore_postgresql=False), 
                    "url": f"http://{settings.hive.host}:{settings.hive.metastore_port}"
                },
                {
                    "name":"Hive-PostgreSQL",
                    "isAlive": check(f"", is_postgres=False, hive_metastore=False, hive_metastore_postgresql=True),
                    "url": f"http://{settings.hive.host}:{settings.hive.metastorepostgres_port}"
                },
                {
                    "name":"Thrift-Server",
                    "isAlive": check(f"http://{settings.hive.host}:{settings.hive.thrift_port}"),
                    "url": f"http://{settings.hive.host}:{settings.hive.thrift_port}"
                }                           
            ]        
        }
        return routes, 200
    except Exception as ex:
        raise InternalServerError(f"Exception while checking components: \n\t {ex}")