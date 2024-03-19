import docker
import os
import re
import uuid
import socket
import requests
from requests import post
from flask import jsonify, Response
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
import subprocess
from werkzeug.exceptions import BadRequest

from services.decorators import parse_params, check_permissions_workspace
from commons.configuration.settings import Settings
from commons.services.data_frame_helper import DataFrameHelper
from database.data_access import dataset_data_access, ontology_data_access, mapping_data_access
from commons.models.dataset.models import Ontology

def mapper(model, workspace_id):
    return {
        "id": str(model.uid),
        "name": model.title,
        "workspace_id": workspace_id
    }

class OnTopConfigurations(Resource):
    #@jwt_required
    def get(self, workspace_id):
        conf = {}
        conf['mappings'] = mapping_data_access.get_list(workspace_id).values_list('id', 'workspace_id', 'name')
        conf['ontologies'] = [mapper(item, workspace_id) for item in ontology_data_access.get_all(workspace_id).all()]

        return jsonify(conf)


class CheckOnTop(Resource):
    #@jwt_required
    def get(self, workspace_id):
        flag = False
        client = docker.from_env()
        try:
            ontop_container = client.containers.get('ontop')
            for i in range(10):
                logs = ontop_container.logs().decode("utf-8")
                if "Started OntopEndpointApplication" in logs:
                    started = True
            status = ontop_container.status
            if status == 'running' and started == True:
                flag = True  
            else:
                print(ontop_container.logs(tail=5).decode("utf-8"))               
            
        except Exception as e:
            flag = False
        return jsonify({'is_running': flag})


class Initialize_OnTop(Resource):
    #@jwt_required
    def post(self, workspace_id):
        try:
            bashCommand = "docker-compose -f hive.yml up -d"
            path = os.getcwd()
            path = os.path.join(path, "sedar")
            process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE, cwd=path)

            output, error = process.communicate()  
            return 200
        except Exception as e:
            print(f"Exception, error:{e}")

    def delete(self, workspace_id):
        try:
            bashCommand = "docker rm -f thriftserver hive-server hive-metastore hive-metastore-postgresql"
            process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE)

            output, error = process.communicate()  
            return 200
        except Exception as e:
            print(f"Exception, error:{e}")

class OnTop_MappingParser(Resource):
    def __init__(self):
        self.settings = Settings()
        self.ontop_container = None
        self.client = docker.from_env()
        self.ontology_id = None
        self.obda_output_path = os.path.abspath(os.path.join(os.getcwd(), "sedar", "/ontop/input/"))

    @parse_params(
        Argument("mappings", type=str, required=True),
        Argument("ontology_id", type=str, required=True),
    )
    def post(self, workspace_id, mappings, ontology_id):
        """

        """
        self.workspace_id = workspace_id
        self.ontology_id = ontology_id
        self.mappings = mapping_data_access.get_by_id(mappings).mappings_file
        self.first_data_set_title = None

        self.client = docker.DockerClient()
        try:
            ontop_container = self.client.containers.get("ontop")
            ontop_container.stop()
            ontop_container.remove()
            print("ontop container removed")
        except Exception as e:
            print(e)
            print("Ontop container not found. Moving on.")
            pass

        try:
            mapping_file_path = self.obda_output_path + "mapping.obda"
            mapping_file = open(mapping_file_path, "w+")

            lines = self.mappings.split('\n')

            datasets = dataset_data_access.get_all(self.workspace_id)
            for index, line in enumerate(lines):
                try:
                    line = line + '\n'
                    if "sourcePoint" in line:
                        self.first_data_set_title = line.split(
                            '=')[-1].split(']')[0]
                        for item in datasets:
                            if item.title == self.first_data_set_title:
                                uid = item.uid
                                break
                            else:
                                raise
                except Exception as e:
                    print(e, "No matching datamart found in workspace!")
                    raise BadRequest()

            self.spark_helper = DataFrameHelper(uid, hive="true")
            self.spark_helper.create_hive_database()

            for index, line in enumerate(lines):
                line = line + '\n'
                if "sourcePoint" in line:
                    data_set_title = line.split('=')[-1].split(']')[0]
                    mapping_id = lines[index + 1].split('\t')[1][:-1]
                    target = lines[index + 2].split('\t')[2][:-1]
                    source = lines[index + 3].split('\t')[2][:-1]
                    mapping = Mapping(data_set_title, mapping_id,
                                      target, source, workspace_id, self.spark_helper)
                    mapping.convert()
                    mapping_file.write(mapping.toString())

                elif not (any(ele in line for ele in ['mappingId\t', 'target\t', 'source\t'])):
                    mapping_file.write(line)

            mapping_file.close()
            self.write_ontology(workspace_id, ontology_id)
            self.write_connection()
            self.start_ontop()
            self.spark_helper.spark_session.stop()
            return 200

        except Exception as e:
            self.spark_helper.spark_session.stop()
            print(e, "Exception occured at MappingParser")
            raise BadRequest()

    @jwt_required()
    @parse_params(
        Argument("query_string", type=str, required=True),
        Argument("title", type=str, required=True),
    )
    def put(self, workspace_id, query_string, title):

        self.workspace_id = workspace_id
        self.query_string = query_string
        plugin_string = self.create_plugin_file_string(query_string)
        plugin_file_path = self.obda_output_path + "plugin.py"
        plugin_file = open(plugin_file_path, "w")
        plugin_file.write(plugin_string)
        plugin_file.close()

        filename = 'plugin'


        access_token = create_access_token(identity={'email': 'admin'})
        string = """{"name": "plugin","read_type": "PULL","plugin_files": ["plugin"],"write_type": "DELTA"}"""
        datasourcedefinition = {"datasource_definition": string}
        title_dict = {"title": title}
        session = requests.Session()
        with open(plugin_file_path, 'rb') as f:
            resp = session.post(
                f"http://{self.settings.server.host}:{self.settings.server.port}/api/v1/workspaces/{workspace_id}/datasets/create",
                files={filename: f},
                data={**datasourcedefinition, **title_dict},
                cookies={"access_token_cookie": access_token}
            )
        return resp.json()

    def start_ontop(self):

        print("################# Start OnTop #####################")
        try:
            bashCommand = "docker-compose -f docker-compose-ontop.yml up -d"
            process = subprocess.Popen(bashCommand.split(), stdout=subprocess.PIPE, cwd=os.path.abspath(
                os.path.join(__file__, "../../../../../..")))
        except Exception as e:
            print(f"Exception, error:{e}")

    def write_ontology(self, workspace_id, ontology_id):

        entity: Ontology = ontology_data_access.get(ontology_id)

        g = requests.get(f'http://{self.settings.fuseki_storage.host}:{self.settings.fuseki_storage.port}/' +
                         workspace_id + '/?graph='+ontology_id, headers={'Accept': f'{entity.mimetype} charset=utf-8'})
        #g = requests.get(f'http://{self.settings.fuseki_storage.host}:{self.settings.fuseki_storage.port}/' + workspace_id, headers={'Accept': f'{entity.mimetype} charset=utf-8'})
        os.environ["OBDA_ONTOLOGY_FILENAME"] = entity.filename
        ontology_file_path = self.obda_output_path + entity.filename
        ontology_file = open(ontology_file_path, "wb")
        ontology_file.write(g.content)
        ontology_file.close()

        return ontology_file_path

    def write_connection(self):
        connection_string = """
jdbc.url=jdbc:hive2://{}:10000/{}
jdbc.driver=org.apache.hive.jdbc.HiveDriver
jdbc.user=hive
jdbc.name=
jdbc.password=hive
"""
        connection_file_path = self.obda_output_path + "prop.properties"
        connection_file = open(connection_file_path, "w")

        connection_file.write(connection_string.format(
            'thriftserver', "workspace_" + self.workspace_id))
        connection_file.close()

        return connection_file_path

    def create_plugin_file_string(self, query_string):

        # hive_ip = self.get_docker_ip(str("hive-metastore"))
        query_string = '"""\n' + query_string + '\n"""'
        self.socket = socket.gethostbyname(socket.gethostname())
        self.sparql_endpoint = f'http://{self.socket}:{self.settings.ontop_service.port}/sparql'
        plugin_string1 = """
from pyspark.sql.session import SparkSession, DataFrame
from PySPARQL.Wrapper import PySPARQLWrapper

def load(spark: SparkSession) -> DataFrame:
    configs = {""" 

        plugin_string2 = """
        "spark.master": "{spark_master}",
        "spark.app.name": "OBDA",
        "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
        "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog",
        "spark.submit.deployMode": "client",
        "spark.jars.packages": "io.delta:delta-core_2.12:1.0.0",
        "spark.driver.bindAddress": "0.0.0.0",
        "spark.cores.max": "4",
        "spark.driver.memory": "16G",
        "spark.executor.memory": "16G",
        "spark.driver.maxResultSize": "0",
        "spark.executor.heartbeatInterval": "60s",
        "spark.network.timeoutInterval": "300s",
        "spark.network.timeout": "300s",
        "spark.sql.broadcastTimeout": "10000",
        "spark.driver.host": "{socket}",
        "fs.defaultFS": "hdfs://{namenode}:{fs_port}",
        "dfs.client.use.datanode.hostname": "true",
        "dfs.datanode.use.datanode.hostname": "true",
        "spark.sql.catalogImplementation": "hive",
        "spark.sql.warehouse.dir": "hdfs://{namenode}:{fs_port}",
        "spark.hadoop.hive.metastore.uris": "thrift://{hive_ip}:9083"
    """.format_map({'socket': self.socket, 'spark_master': self.settings.spark_master, 'namenode': self.settings.hdfs_storage.namenode, 'fs_port': self.settings.hdfs_storage.fs_port, 'hive_ip': 'hive-metastore'})

        plugin_string3 = """ 
    builder = SparkSession.builder
    for k, v in configs.items():
        builder = builder.config(k, v)
    spark = builder.enableHiveSupport().getOrCreate()

    query = {query_string}
    sparql_endpoint = "{fuseki}"
    wrapper = PySPARQLWrapper(spark, sparql_endpoint)
    result = wrapper.query(query)
    df = result.dataFrame
    df.show()
    return df""".format_map({'query_string': query_string, 'fuseki': self.sparql_endpoint})
        return plugin_string1  + plugin_string2 + '}' + plugin_string3


class Mapping:
    def __init__(self, data_set_title, mappingId, target, source, workspace_id, spark_helper):
        self.data_set_title = data_set_title
        self.mapping_id = mappingId
        self.target = target
        self.source = source
        self.workspace_id = workspace_id
        self.target_string = ""
        self.session_id = str(uuid.uuid4())
        self.spark_helper = spark_helper

    def convert(self):
        try:
            targets = self.get_target_variables()

            # self.spark_helper = DataFrameHelper(uid, hive=True)
            df = self.spark_helper.get_source_df()

            for t in df.dtypes:
                if (t[1].startswith('struct')):
                    print(
                        "################## nested structure found! Flattening data! ##############################")
                    df = self.spark_helper.flatten(df)

            df.createOrReplaceTempView(self.data_set_title)
            df = self.spark_helper.spark_session.sql(self.source)

            data = df.select(targets).distinct()
            data.show()

            self.write_to(data, "Hive")
            self.spark_helper.spark_session.catalog.dropTempView(
                self.data_set_title)
            self.spark_helper.spark_session.catalog.clearCache()

        except Exception as e:
            print(e, "Exception occured at Convert")
            raise BadRequest()

    def toString(self):
        table = ''.join(e for e in self.mapping_id if e.isalnum())
        table = f"""workspace_{self.workspace_id}.{table}"""
        source_string = """select * from  """ + table
        mapping_id = "mappingId\t" + self.mapping_id + "\n"
        target = "target\t\t" + self.target_string + "\n"
        source = "source\t\t" + source_string + "\n"
        return mapping_id + target + source

    def get_target_variables(self):
        regex = re.compile('{(.+?)}', re.S)
        self.target_string = regex.sub(
            lambda m: m.group().replace('.', "_"), self.target)

        targets = re.findall('{(.+?)}', self.target_string)
        return list(set(targets))

    def write_to(self, data, target='Hive'):

        try:
            table = ''.join(e for e in self.mapping_id if e.isalnum())
            table = f"""workspace_{self.workspace_id}.{table}"""
            print(table)
            data.createOrReplaceTempView("tempTable")
            self.spark_helper.spark_session.sql(
                f"create table {table} as select * from tempTable")
        except Exception as e:
            print(e)


