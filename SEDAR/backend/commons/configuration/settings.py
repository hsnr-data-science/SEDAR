import inspect
import os
from dotenv import load_dotenv 
import distutils
from distutils.util import strtobool
from neomodel import install_all_labels
import neomodel
_loaded = False

class Server:
    def __init__(self, host, port, title_of_default_workspace, description_of_default_workspace, title_of_default_ontology, description_of_default_ontology, filename_of_default_ontology, alive):
        self.host = host
        self.port = port
        self.title_of_default_workspace = title_of_default_workspace
        self.description_of_default_workspace = description_of_default_workspace
        self.title_of_default_ontology = title_of_default_ontology
        self.description_of_default_ontology = description_of_default_ontology
        self.filename_of_default_ontology = filename_of_default_ontology
        self.fileendings_semistructured = []
        self.only_struct_types = bool(distutils.util.strtobool(os.getenv("ONLY_STRUCT_TYPES", "False")))
        self.workflow_always_set_pk = bool(distutils.util.strtobool(os.getenv("WORKFLOW_ALWAYS_SET_PK", "False")))
        self.ingestion_service_with_schema_service_in_one = bool(distutils.util.strtobool(os.getenv("INGESTION_SERVICE_WITH_SCHEMA_SERVICE_IN_ONE", "False")))  
        self.alive_routes = []
        for route in alive.split(';'):
            r = route.split('|')
            if len(r)==2:
                self.alive_routes.append({
                    "url": r[0],
                    "name": r[1]
                })

class Neo4jManagement:
    def __init__(self, host, port, database, user=None, password=None, protocol="bolt"):
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password
        self.protocol = protocol

class PostgresqlStorage:
    def __init__(self, host, port, database, user, password):
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password

class MongodbManagement:
    def __init__(self, host, port, database, user=None, password=None):
        self.host = host
        self.port = port
        self.database = database
        self.user = user
        self.password = password

        auth_source = "admin"

        credentials = ""
        if self.user and self.password:
            credentials = f"{self.user}:{self.password}@"

        self.connection_url = f"mongodb://{credentials}{self.host}:{self.port}/{self.database}"

        if auth_source:
            self.connection_url = f"{self.connection_url}?authSource={auth_source}"

class HdfsStorage:
    def __init__(self, namenode, web_port, fs_port, ingestion_directory, storage_directory):
        self.namenode = namenode
        self.web_port = web_port
        self.fs_port = fs_port
        self.ingestion_directory = ingestion_directory
        self.storage_directory = storage_directory

class FusekiStorage:
    def __init__(self, host, port, user, password):
        self.host = host
        self.port = port
        self.user = user
        self.password = password
    
class TikaService:
    def __init__(self, url):
        self.url = url

class ElasticsearchService:
    def __init__(self, url):
        self.url = url

class Jupyter:
    def __init__(self, url, secret_token):
        self.url = url
        self.secret_token = secret_token

class Ontop:
    def __init__(self, port):
        self.port = port

class WebVOWL:
    def __init__(self, url):
        self.url = url

class Kafka:
    def __init__(self, server_configs):
        servers = []
        for cfg in server_configs:
            servers.append(f"{cfg}")
        self.bootstrap_servers = ",".join(servers)
        self.topic_ingestion_run = "dls__ingestion__run"
        self.topic_schema_run = "dls__schema__run"
        self.topic_profiling_run = "dls__profiling__run"

class ServiceAlive:
    def __init__(self, host, port):
        self.host = host
        self.port = port

class Hive:
    def __init__(self, host, server_port, metastore_port, metastorepostgres_port, thrift_port):
        self.host = host
        self.server_port = server_port
        self.metastore_port = metastore_port
        self.metastorepostgres_port = metastorepostgres_port
        self.thrift_port = thrift_port

class Settings(object):
    
    __instance = None

    def __new__(cls, *args, **kwargs):
        if not cls.__instance:
            cls.__instance = super(Settings, cls).__new__(cls, *args, **kwargs)
        return cls.__instance

    spark_master = ""
    spark_master_notebooks = ""
    spark_worker_cores = ""
    spark_worker_memory = ""

    server: Server = None
    postgresql_storage: PostgresqlStorage = None
    mongodb_management: MongodbManagement = None
    hdfs_storage: HdfsStorage = None
    fuseki_storage: FusekiStorage = None
    hive: Hive = None
    neo4j_management: Neo4jManagement = None
    tika_service: TikaService = None
    es_service: ElasticsearchService = None
    jupyter_service: Jupyter = None
    ontop_service: Ontop = None
    webvowl_service: WebVOWL = None
    kafka: Kafka = None
    ingestion_service_alive: ServiceAlive = None
    continuation_service_alive: ServiceAlive = None
    schema_service_alive: ServiceAlive = None
    profiling_service_alive: ServiceAlive = None
  

def load(server):
    path = os.getcwd()
    env_path = os.path.abspath((os.path.join(path, '../../.env')))
    # if run outside docker
    if os.path.exists(env_path):
        print("ENV PATH: ", env_path)
    else:
        env_path = os.path.abspath((os.path.join(path, '../../../.env')))
        if os.path.exists(env_path):
            print("ENV PATH: ", env_path)
        else:
            raise FileNotFoundError(f"The file does not exist at the location: {env_path}")
            
    
    load_dotenv(env_path)
    
    if server != None:
        server.config.update(
            SECRET_KEY=os.getenv("JWT_SECRETKEY"),
            JWT_SECRET_KEY=os.getenv("JWT_SECRETKEY"),
            JWT_TOKEN_LOCATION=[os.getenv("JWT_TOKENLOCATION")],
            JWT_ACCESS_CSRF_HEADER_NAME=os.getenv("JWT_ACCESS_CSRF_HEADERNAME"),
            JWT_COOKIE_CSRF_PROTECT=bool(distutils.util.strtobool(os.getenv("JWT_COOKIE_CSRF_PROTECT"))),
            JWT_ACCESS_TOKEN_EXPIRES=int(os.getenv("JWT_ACCESSTOKEN_EXPIRES_IN")),
            JWT_REFRESH_TOKEN_EXPIRES=int(os.getenv("JWT_REFRESHTOKEN_EXPIRES_IN")),
            JWT_COOKIE_SECURE=bool(distutils.util.strtobool(os.getenv("JWT_SECURE"))),
            JWT_COOKIE_SAMESITE=os.getenv("JWT_SAMESITE"),
            MONGODB_SETTINGS={
                "host": f"mongodb://{os.getenv('MONGODB_HOST')}:{os.getenv('MONGODB_PORT')}/{os.getenv('MONGODB_DATABASE')}",
                "username": os.getenv('MONGO_INITDB_ROOT_USERNAME'),
                "password": os.getenv('MONGO_INITDB_ROOT_PASSWORD'),
                "authentication_source": "admin"
            }
        )
    settings = Settings()

    settings.spark_master = os.getenv('SPARKMASTER')
    settings.spark_master_notebooks = os.getenv('SPARKMASTER_NOTEBOOKS')
    settings.spark_worker_cores = os.getenv('SPARK_WORKER_CORES')
    settings.spark_worker_memory = os.getenv('SPARK_WORKER_MEMORY')
    
    settings.server = Server(
        os.getenv('BACKEND_HOST'),
        int(os.getenv('BACKEND_PORT')),
        os.getenv('TITLE_OF_DEFAULT_WORKSPACE'),
        os.getenv('DESCRIPTION_OF_DEFAULT_WORKSPACE'),
        os.getenv('TITLE_OF_DEFAULT_ONTOLOGY'),
        os.getenv('DESCRIPTION_OF_DEFAULT_ONTOLOGY'),
        os.getenv('FILENAME_OF_DEFAULT_ONTOLOGY'),
        os.getenv('CUSTOM_ALIVE_URLS'),
    )

    for fe in os.getenv('FILEENDINGS_SEMISTRUCTURED').split(';'):
        if fe != '':
            settings.server.fileendings_semistructured.append(fe)
    
    settings.neo4j_management = Neo4jManagement(
        os.getenv('NEO4J_HOST'),
        int(os.getenv('NEO4J_PORT')),
        os.getenv('NEO4J_DATABASE'),
        os.getenv('NEO4J_USERNAME'),
        os.getenv('NEO4J_PASSWORD'),
        os.getenv('NEO4J_PROTOCOL'),
    )

    neomodel.config.DATABASE_URL = f'{settings.neo4j_management.protocol}://{settings.neo4j_management.user}:{settings.neo4j_management.password}@{settings.neo4j_management.host}:{settings.neo4j_management.port}'
    if server != None:
        install_all_labels()

    settings.postgresql_storage = PostgresqlStorage(
        os.getenv('POSTGRES_HOST'),
        int(os.getenv('POSTGRES_PORT')),
        os.getenv('POSTGRES_DATABASE'),
        os.getenv('POSTGRES_USER'),
        os.getenv('POSTGRES_PASSWORD'),
    )

    settings.mongodb_management = MongodbManagement(
        os.getenv('MONGODB_HOST'),
        int(os.getenv('MONGODB_PORT')),
        os.getenv('MONGODB_DATABASE'),
        os.getenv('MONGO_INITDB_ROOT_USERNAME'),
        os.getenv('MONGO_INITDB_ROOT_PASSWORD'),
    )

    settings.hdfs_storage = HdfsStorage(
        os.getenv('HDFS_NAMENODE'),
        int(os.getenv('HDFS_WEB_PORT')),
        int(os.getenv('HDFS_FS_PORT')),
        os.getenv('HDFS_INGESTION_DIRECTORY'),
        os.getenv('HDFS_STORAGE_DIRECTORY'),
    )

    settings.fuseki_storage = FusekiStorage(
        os.getenv('FUSEKI_HOST'),
        int(os.getenv('FUSEKI_PORT')),
        os.getenv('FUSEKI_USER'),
        os.getenv('FUSEKI_PASSWORD'),
    )

    settings.hive = Hive(
        os.getenv('HIVE_HOST'),
        os.getenv('HIVE_SERVER_PORT'),
        os.getenv('HIVE_METASTORE_PORT'),
        os.getenv('HIVE_METASTOREPOSTGRES_PORT'),
        os.getenv('THRIFT_PORT'),
    )

    settings.tika_service = TikaService(
        os.getenv('TIKA_URL'),
    )

    settings.es_service = ElasticsearchService(
        os.getenv("ELASTICSEACH_URL"),
    )

    settings.jupyter_service = Jupyter(
        os.getenv('JUPYTERHUB_URL'),
        os.getenv('JUPYTER_SECRET_TOKEN'),

    )

    settings.ontop_service = Ontop(
        os.getenv('ONTOP_PORT'),
    )

    settings.webvowl_service = WebVOWL(
        os.getenv('WEBVOWL_URL'),
    )

    settings.kafka = Kafka(
        os.getenv('BOOTSTRAP_SERVERS').split(';'),
    )

    settings.ingestion_service_alive = ServiceAlive(
        os.getenv('INGESTION_SERVICE_HOST'),
        os.getenv('INGESTION_SERVICE_PORT'),
    )

    settings.continuation_service_alive  = ServiceAlive(
        os.getenv('CONTINUATION_SERVICE_HOST'),
        os.getenv('CONTINUATION_SERVICE_PORT'),
    )

    settings.schema_service_alive = ServiceAlive(
        os.getenv('SCHEMA_SERVICE_HOST'),
        os.getenv('SCHEMA_SERVICE_PORT'),
    )
    
    settings.profiling_service_alive = ServiceAlive(
        os.getenv('PROFILING_SERVICE_HOST'),
        os.getenv('PROFILING_SERVICE_PORT'),
    )
    
    _loaded = True

if not _loaded:
    load(None)
