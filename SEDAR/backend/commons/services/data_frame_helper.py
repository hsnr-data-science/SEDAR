import json
import socket
import textwrap
import uuid
import pydeequ3
from pyspark.sql.session import SparkSession
from pyspark.sql.types import ArrayType, StructType
from pywebhdfs.webhdfs import PyWebHdfsClient
from commons.enums import WriteType
from commons.enums import ReadType
from commons.repositories import datasource_repo
from commons.models.dataset.models import Dataset, DeequData, Attribute, Entity, File, Semistructured, Structured, Unstructured,  NominalAttributeStats, NumericAttributeStats, Annotation, DatasetRel, Workspace
from commons.configuration.settings import Settings
from tika import parser
from pyspark.sql.functions import col, explode_outer
from pyspark.sql.types import ArrayType, StructType
from elasticsearch import Elasticsearch
from pydeequ3.profiles import *
from neomodel import (db, Traversal, INCOMING)
from mongoengine.connection import connect, disconnect
from werkzeug.exceptions import InternalServerError
import docker


class DataFrameHelper():
    """
    Class for centralizing the access on source data via a dataframe. 
    """

    dataset = None
    workspace_id = None
    datasource = None
    revision = None
    settings = None
    spark_session = None
    dataset_id = None


    def __init__(self, dataset_id=None, session_id:str=None, without_session:bool=False, datasource_id:str=None, connect_to_mongo:bool=False, hive:bool=False):
        print("################ DATAFRAMEHELPER ################") 
        if datasource_id!=None:
            self.dataset = Dataset.nodes.get_or_none(datasource__exact=datasource_id)
        elif dataset_id!=None:
            self.dataset = Dataset.nodes.get_or_none(uid__exact=dataset_id)
        self.workspace_id = self.get_workspace_id()
        self.settings = Settings() 
        if connect_to_mongo == True:
            try:
                disconnect(alias='default')
                connect('mongo', host=self.settings.mongodb_management.connection_url, alias='default')
            except KeyError:
                connect('mongo', host=self.settings.mongodb_management.connection_url, alias='default')
        if dataset_id!=None:
            self.datasource = datasource_repo.find_by_id(self.dataset.datasource)
            self.revision = self.datasource.resolve_current_revision()
        if(without_session==False and self.revision.read_type != ReadType.DATA_FILE):
            self.init_spark_session(session_id, hive)
        
    def init_spark_session(self, session_id:str, hive):
        
        if not session_id:
            session_id = str(uuid.uuid4())
        

        if hive:
            hive_ip = self.get_docker_ip(str("hive-metastore"))
            thriftURI = f"thrift://{hive_ip}:9083"
            namenodeURI = f"hdfs://{self.settings.hdfs_storage.namenode}:{self.settings.hdfs_storage.fs_port}/user/hive/warehouse"
            hive_dict = {
                "spark.sql.catalogImplementation": "hive",
                "spark.sql.warehouse.dir": namenodeURI,
                "spark.hadoop.hive.metastore.uris": thriftURI
            }

        jars = self.revision.spark_packages + ["io.delta:delta-core_2.12:1.0.0", "com.amazon.deequ:deequ:2.0.0-spark-3.1"]
        configs = {
            "spark.master": self.settings.spark_master,
            "spark.app.name": f"{session_id}",
            "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
            "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog",
            "spark.submit.deployMode": "client",
            "spark.jars.packages": ",".join(jars),
            "spark.jars.excludes": pydeequ3.f2j_maven_coord,
            "spark.driver.bindAddress": "0.0.0.0",
            "spark.shuffle.service.enabled": "false",
            "spark.dynamicAllocation.enabled": "false",
            # can adjust for your cluster resources
            # "spark.cores.max": "2",
            # "spark.num.executors": "2",
            # "spark.driver.memory": "16G",
            "spark.executor.memory": self.settings.spark_worker_memory,
            "spark.executor.cores": self.settings.spark_worker_cores,
            # "spark.driver.maxResultSize": "0",
            #"spark.pyspark.driver.python": sys.executable,
            # needed for large operations on weak cluster
            "spark.executor.heartbeatInterval": "60s",
            "spark.network.timeoutInterval": "300s",
            "spark.network.timeout": "300s",
            "spark.sql.broadcastTimeout": "10000",
            "spark.driver.host": socket.gethostbyname(socket.gethostname()),
            "fs.defaultFS": f"hdfs://{self.settings.hdfs_storage.namenode}:{self.settings.hdfs_storage.fs_port}",
            "dfs.client.use.datanode.hostname": "true",
            "dfs.datanode.use.datanode.hostname": "true"
        }

        if hive:
            configs = {**configs, **hive_dict}
            
        builder = SparkSession.builder
        for k, v in configs.items():
            builder = builder.config(k, v)
        
        self.spark_session = builder.getOrCreate()
    
    def get_workspace_id(self)->str:
        """
        Function for getting the id of the workspace.
        :return: id as str.
        """
        return Traversal(self.dataset, self.dataset.__label__, dict(node_class=Workspace, direction=INCOMING, relation_type='HAS_DATASET', model=DatasetRel)).all()[0].uid

    @staticmethod
    def flatten(df):
        """
        This functions is given by: https://gist.github.com/nmukerje/e65cde41be85470e4b8dfd9a2d6aed50
        Flattens a complex json/xml dataframe to tabular data
        :param df: pyspark dataframe object
        :return: pyspark dataframe object
        """
        # compute Complex Fields (Lists and Structs) in Schema
        complex_fields = dict([(field.name, field.dataType)
                            for field in df.schema.fields
                            if type(field.dataType) == ArrayType or type(field.dataType) == StructType])
        while len(complex_fields) != 0:
            col_name = list(complex_fields.keys())[0]
            print("Processing :" + col_name + " Type : " + str(type(complex_fields[col_name])))

            # if StructType then convert all sub element to columns.
            # i.e. flatten structs
            if type(complex_fields[col_name]) == StructType:
                expanded = [col(col_name + '.' + k).alias(col_name + '_' + k) for k in
                            [n.name for n in complex_fields[col_name]]]
                df = df.select("*", *expanded).drop(col_name)

            # if ArrayType then add the Array Elements as Rows using the explode function
            # i.e. explode Arrays
            elif type(complex_fields[col_name]) == ArrayType:
                df = df.withColumn(col_name, explode_outer(col_name))

            # recompute remaining Complex Fields in Schema
            complex_fields = dict([(field.name, field.dataType)
                                for field in df.schema.fields
                                if type(field.dataType) == ArrayType or type(field.dataType) == StructType])
        return df

    def get_file_lineage(self, lineage, filename:str)->[str]:
        """
        Function for checking all lineage elements for a given file.

        :param lineage: a list of dicts {'data':data, 'version':version}.
        :param filename: name of the file for the search.
        :return: list of attributes.
        """
        result = []
        for l in lineage:
            for fp in l['data'].dataset.schema[0].files.match(version=l['version']):
                if(fp.filename==filename):
                    result.append({'version':l['version'],'data':fp}) 
        return result
    
    def get_attribute_lineage(self, lineage, column_name):
        """
        Function for checking all lineage elements for a given attribute.
        :param lineage: a list of dicts {'data':data, 'version':version}.
        :param column_name: name of the column for the search.
        :return: list of attributes.
        """
        result = []
        for l in lineage:
            for e in l['data'].dataset.schema[0].entities.match(version=l['version']):
                query = "MATCH (e:Entity{uid:'"+e.uid+"'})-[r:HAS_ATTRIBUTE*1..10000{version:"+str(l['version'])+"}]->(a:Attribute) WHERE a.name = '"+column_name+"' RETURN DISTINCT a"
                results = db.cypher_query(query)
                for row in results:
                    if len(row)>0 and row[0]!='a':
                        for r in row:
                            result.append({'version':l['version'],'data':Attribute.inflate(r[0])}) 
        return result

    def get_source_df(self, flattened:bool=False, version:str=None)->DataFrame:
        """
        Function for loading the source data into a dataframe.
        :param flattened: defines whether the data should be flattened or not.
        :param version: version to load a specific version, if not given the latest revision is loaded.
        :return: dataframe.
        """

        df = None
        if version == None:
            version = self.datasource.current_revision

        if self.revision.write_type == WriteType.DEFAULT:
            if flattened == True:
                df = self.flatten(self.spark_session.read.format("parquet").load(f"/datalake/{self.workspace_id}/data/structured/{self.datasource.id}.parquet"))
            else:
                df = self.spark_session.read.format("parquet").load(f"/datalake/{self.workspace_id}/data/structured/{self.datasource.id}.parquet")
        elif self.revision.write_type == WriteType.DELTA:
            if flattened == True:
                df = self.flatten(self.spark_session.read.format("delta").option("versionAsOf", version).load(f"/datalake/{self.workspace_id}/data/delta/{self.datasource.id}"))
            else:
                df = self.spark_session.read.format("delta").option("versionAsOf", version).load(f"/datalake/{self.workspace_id}/data/delta/{self.datasource.id}")
        else:
            reader = self.spark_session.read.format(self.dataset.custom_read_formats[0].read_format)
            for key, value in self.dataset.custom_read_formats[0].read_options.items():
                reader = reader.option(key, value)
            if flattened == True:
                df = self.flatten(reader.load())
            else:
                df = reader.load()
        return df
    
    def start_profiling(self, version:str)->None:
        """
        Function to start the profiling for the source data.
        :return: None.
        """
        self.profiling(self.get_source_df(version=version), version=version)
        
    def start_exctracting_schema(self)->None:
        """
        Function to start the schema extraction.

        :return: None.
        """
        if self.revision.read_type == ReadType.DATA_FILE:
            self.extract_and_save_unstructured()
        else:
            self.extract_and_save_structured_or_semistructured(self.get_source_df())
        print("Schema extraction ended!")
    
    def remove_sourcedata_from_index(self)->None:
        """
        Function to remove the source data from the elasticsearch index.

        :return: None.
        """
        settings = Settings()
        es = Elasticsearch([f"{settings.es_service.url}"])
        res = es.delete_by_query(index=f"{self.workspace_id}", body={'query': {'term': {'dataset_id': f'{self.dataset.uid}'}}})
        self.dataset.is_indexed=False
        self.dataset.save()

    def start_indexing_sourcedata(self)->None:
        """
        Function to start the indexing of the source data to the elasticsearch index.

        :return: None.
        """
        self.index_sourcedata(self.get_source_df())
    
    def index_sourcedata(self, df:DataFrame)->None:
        """
        Function to index the source data to the elasticsearch index.

        :param df: the source data as dataframe.
        :return: None.
        """
        settings = Settings()
        es = Elasticsearch([f"{settings.es_service.url}"])
        self.dataset.is_indexed=True
        self.dataset.save()
        data = {
            "dataset_id":str(self.dataset.uid),
            "data":df.toJSON().map(lambda d: json.loads(d)).collect()
        }
        es.index(index=f'{self.workspace_id}', body=data)
    
    def get_correct_rel(self, rels, version:str, is_profiling:bool=False):
        """
        Function to get the correct relationship. This function is required, because
        sometimes it happens, that a relationship is not correctly delivered, what is resulting in 
        wrong versioning.

        :param rels: all relationships between two nodes.
        :param version: version of the relationship that is required.
        :param is_profiling: -
        :return: None.
        """
        if is_profiling==False:
            rel = None
            if rels[0].version == version:
                rel = rels[0]
            elif rels[len(rels)-1].version == version:
                rel = rels[len(rels)-1]
            else:
                for r in rels:
                    if r.version==version:
                        rel=r
        else:
            for r in rels:
                if r.properties==None:
                    rel=r
        return rel

    def extract_and_save_structured_or_semistructured(self, df:DataFrame)->None:
        """
        Function to classify the schema and start the extraction 
        for the schema of structured and semistructured data.

        :param df: the source data as dataframe.
        :return: None.
        """
        try:
            print("###################schema extraction ######################")
            name_of_entity = str(self.datasource.id)
            is_update = False
            has_lineage = False
            lineage = []
            id_column = self.datasource.resolve_current_revision().id_column
            if len(self.dataset.lineage)!=0 and len(self.dataset.schema)==0:
                has_lineage = True
                for l in self.dataset.lineage:
                    dfh = DataFrameHelper(l.uid, without_session=True)
                    rel = self.dataset.lineage.relationship(dfh.dataset)
                    lineage.append({'data':dfh, 'version':rel.version})
            if len(self.dataset.schema)!=0:
                is_update = True
                self.dataset.current_version_of_schema=self.dataset.current_version_of_schema+1
                self.dataset.save()
            if self.settings.server.only_struct_types==False:
                nested_fields = dict([(field.name, field.dataType)
                                        for field in df.schema.fields
                                        if type(field.dataType) == ArrayType or type(field.dataType) == StructType])
            else:
                nested_fields = dict([(field.name, field.dataType)
                                    for field in df.schema.fields
                                    if (type(field.dataType) == ArrayType and (type(field.dataType.elementType)==StructType or type(field.dataType.elementType) == ArrayType)) or type(field.dataType) == StructType])

            schema = None
            if len(nested_fields)==0 and is_update==False:
                if len(nested_fields)==0 and has_lineage == False:
                    if len(nested_fields)==0 and len(self.revision.source_files)!=0:
                        suffixes = tuple(self.settings.server.fileendings_semistructured)
                        if self.revision.source_files[0].lower().endswith(suffixes):
                            schema = Semistructured(type='SEMISTRUCTURED')

            if len(nested_fields)==0 and schema == None:
                if len(self.revision.source_files)!=0:
                    name_of_entity = self.revision.source_files[0].split('.')[0][5:]
                schema = Structured(type='STRUCTURED')
                entity = Entity(name=name_of_entity)
                if is_update==True:
                    schema = self.dataset.schema[0]
                    entity = schema.entities[0]
                schema.save()
                entity.save()
                for column in df.schema.fields:
                    if is_update==True:
                        attr = []
                        for a in entity.attributes.match(version=self.dataset.current_version_of_schema-1):
                            if a.name==column.name:
                                attr.append(a)
                        if len(attr)==1:
                            rel = self.get_correct_rel(entity.attributes.all_relationships(attr[0]), self.dataset.current_version_of_schema-1)
                            rel.properties = json.dumps(attr[0].__properties__)
                            rel.save()
                            attr[0].data_type_internal=str(column.dataType)
                            attr[0].save()
                            entity.attributes.connect(attr[0], {'version':self.dataset.current_version_of_schema})
                            if len(attr[0].annotation.match(version=self.dataset.current_version_of_schema-1))!=0:
                                for a in attr[0].annotation.match(version=self.dataset.current_version_of_schema-1):
                                    attr[0].annotation.connect(a, {'version':self.dataset.current_version_of_schema})
                            continue
                    if has_lineage==True:
                        attr = self.get_attribute_lineage(lineage, column.name)
                        if len(attr)==1:
                            attr_version = attr[0]['version']
                            attr = attr[0]['data']
                            attribute = Attribute(name=attr.name, description=attr.description, data_type=attr.data_type, data_type_internal=str(column.dataType), nullable=attr.nullable, is_pk=attr.is_pk, contains_PII=attr.contains_PII)
                            attribute.save()
                            entity.attributes.connect(attribute)
                            if len(attr.annotation.match(version=attr_version))!=0:
                                for a in attr.annotation.match(version=attr_version):
                                    annotation = Annotation(instance=a.instance)
                                    annotation.save()
                                    annotation.ontology.connect(a.ontology[0])
                                    attribute.annotation.connect(annotation)
                            continue
                    attribute = Attribute(name=column.name, data_type=str(column.dataType), data_type_internal=str(column.dataType), nullable=column.nullable, is_pk=(column.name == id_column))
                    attribute.save()
                    entity.attributes.connect(attribute, {'version':self.dataset.current_version_of_schema})
                if is_update==True:
                    for ca in entity.custom_annotation.match(version=self.dataset.current_version_of_schema-1):
                        entity.custom_annotation.connect(ca, {'version':self.dataset.current_version_of_schema})
                    for a in entity.annotation.match(version=self.dataset.current_version_of_schema-1):
                        entity.annotation.connect(a, {'version':self.dataset.current_version_of_schema})
                    rel = self.get_correct_rel(schema.entities.all_relationships(entity), self.dataset.current_version_of_schema-1)
                    rel.properties = json.dumps(entity.__properties__)
                    rel.save()
                entity.count_of_rows=df.count()
                entity.save()
                schema.entities.connect(entity, {'version':self.dataset.current_version_of_schema})
                self.dataset.schema.connect(schema, {'version':self.dataset.current_version_of_schema})
                if is_update==True:
                    self.dataset.version.connect(self.dataset, {'version':self.dataset.current_version_of_schema-1, 'properties':json.dumps(self.dataset.__properties__, default=str)})
            else: 
                if len(self.revision.source_files)!=0:
                    name_of_entity = self.revision.source_files[0].split('.')[0][5:]
                schema = Semistructured(type='SEMISTRUCTURED')
                entity = Entity(name=name_of_entity)
                if is_update==True:
                    schema = self.dataset.schema[0]
                    entity = schema.entities[0]
                schema.save()    
                entity.save()
                self.recusive_schema(df.schema.fields, entity, id_column, is_update, '', has_lineage, lineage)
                if is_update==True:
                    for ca in entity.custom_annotation.match(version=self.dataset.current_version_of_schema-1):
                        entity.custom_annotation.connect(ca, {'version':self.dataset.current_version_of_schema})
                    for a in entity.annotation.match(version=self.dataset.current_version_of_schema-1):
                        entity.annotation.connect(a, {'version':self.dataset.current_version_of_schema})
                    rel = self.get_correct_rel(schema.entities.all_relationships(entity), self.dataset.current_version_of_schema-1)
                    rel.properties = json.dumps(entity.__properties__)
                    rel.save()
                entity.count_of_rows=df.count()
                entity.save()
                schema.entities.connect(entity, {'version':self.dataset.current_version_of_schema})
                self.dataset.schema.connect(schema, {'version':self.dataset.current_version_of_schema})
                if is_update==True:
                    self.dataset.version.connect(self.dataset, {'version':self.dataset.current_version_of_schema-1, 'properties':json.dumps(self.dataset.__properties__, default=str)})
            if is_update:
                if self.dataset.is_indexed==True:
                    self.remove_sourcedata_from_index()
                    self.start_indexing_sourcedata()
            print("###################schema extraction ended######################")
        except Exception as e:
            raise print(e)

    
    def recusive_schema(self, fields, last_attribute_or_entity, id_column:str, is_update:bool, prefix:str, has_lineage:bool, lineage)->None:
        """
        Recusive function to extract the schema of semistructured data.

        :param fields: all fields on the current level of iteration in the schema.
        :param last_attribute_or_entity: last entity or attribute for connecting.
        :param id_column: name of the attribute that is the primary key.
        :param is_update: -.
        :param prefix: the prefix that is automatically generated every recusive call.
        :param has_lineage: defines whether the dataset has lineage informations or not.
        :param lineage: list of lineage elements if the dataset has lineage informations.
        :return: None.
        """
        for field in fields:
            is_array=False
            is_struct=False
            if type(field.dataType) == StructType:
                is_struct=True
            if type(field.dataType) == ArrayType:
                new_fields = field.dataType
                while type(new_fields.elementType) == ArrayType:
                    new_fields = new_fields.elementType
                if type(new_fields.elementType) == StructType:
                    is_array = True
                    new_fields = new_fields.elementType
            if is_array==True:
                d = str(field.dataType).replace(str(new_fields), 'StructType')
            else:
                d = str(field.dataType)
            if is_update==True:
                attr = []
                for a in last_attribute_or_entity.attributes.match(version=self.dataset.current_version_of_schema-1):
                    if a.name==str(field.name):
                        attr.append(a)
                if len(attr)==1:
                    rel = self.get_correct_rel(last_attribute_or_entity.attributes.all_relationships(attr[0]), self.dataset.current_version_of_schema-1)
                    rel.properties = json.dumps(attr[0].__properties__)
                    rel.save()
                    attr[0].data_type_internal=d
                    attr[0].save()
                    last_attribute_or_entity.attributes.connect(attr[0], {'version':self.dataset.current_version_of_schema})
                    if len(attr[0].annotation.match(version=self.dataset.current_version_of_schema-1))!=0:
                        for a in attr[0].annotation.match(version=self.dataset.current_version_of_schema-1):
                            attr[0].annotation.connect(a, {'version':self.dataset.current_version_of_schema})
                    if is_struct==True or is_array==True:
                        if is_array==True:
                            f = new_fields.fields 
                        else:
                            f = field.dataType.fields
                        self.recusive_schema(f, attr[0], id_column, is_update, (prefix + f'{attr[0].name}.'), has_lineage, lineage)
                    continue
            if has_lineage==True:
                attr = self.get_attribute_lineage(lineage, field.name)
                if len(attr)==1:
                    attr_version = attr[0]['version']
                    attr = attr[0]['data']
                    attribute = Attribute(name=attr.name, description=attr.description, data_type=attr.data_type, data_type_internal=d, nullable=attr.nullable, is_pk=attr.is_pk, contains_PII=attr.contains_PII, is_object=is_struct, is_array_of_objects=is_array)
                    attribute.save()
                    last_attribute_or_entity.attributes.connect(attribute)
                    if len(attr.annotation.match(version=attr_version))!=0:
                        for a in attr.annotation.match(version=attr_version):
                            annotation = Annotation(instance=a.instance)
                            annotation.save()
                            annotation.ontology.connect(a.ontology[0])
                            attribute.annotation.connect(annotation)
                    if is_struct==True or is_array==True:
                        if is_array==True:
                            f = new_fields.fields 
                        else:
                            f = field.dataType.fields
                        self.recusive_schema(f, attribute, id_column, is_update, (prefix + f'{attribute.name}.'), has_lineage, lineage)
                    continue
            attribute = Attribute(name=field.name, data_type=d, data_type_internal=d, nullable=field.nullable, is_pk=(id_column==(prefix + field.name)), is_object=is_struct, is_array_of_objects=is_array)
            attribute.save()
            last_attribute_or_entity.attributes.connect(attribute, {'version':self.dataset.current_version_of_schema})    
            if is_struct==True or is_array==True:
                if is_array==True:
                    f = new_fields.fields 
                else:
                    f = field.dataType.fields
                self.recusive_schema(f, attribute, id_column, is_update, (prefix + f'{attribute.name}.'), has_lineage, lineage)

    def extract_and_save_unstructured(self)->None:
        """
        Function for the schema and metadata extraction of unstructured data.

        :return: None.
        """
        is_update = False
        has_lineage = False
        lineage = []
        schema = Unstructured(type='UNSTRUCTURED')
        if len(self.dataset.lineage)!=0 and len(self.dataset.schema)==0:
            has_lineage = True
            for l in self.dataset.lineage:
                dfh = DataFrameHelper(l.uid, without_session=True)
                rel = self.dataset.lineage.relationship(dfh.dataset)
                lineage.append({'data':dfh, 'version':rel.version})
        if len(self.dataset.schema)!=0:
            is_update = True
            self.dataset.current_version_of_schema=self.dataset.current_version_of_schema+1
            self.dataset.save()
            schema = self.dataset.schema[0]
        hdfs = PyWebHdfsClient(host=self.settings.hdfs_storage.namenode, port=self.settings.hdfs_storage.web_port)
        schema.save()
        settings = Settings()
        for file in self.revision.source_files:
            path = f"/datalake/{self.workspace_id}/data/unstructured/{self.datasource.id}/{file[5:]}"
            data = hdfs.read_file(path)
            string_parsed = parser.from_buffer(data, f'{settings.tika_service.url}')
            if is_update==True:
                fp = []
                for f in schema.files.match(version=self.dataset.current_version_of_schema-1):
                    if f.filename==file[5:]:
                        fp.append(f)
                if len(fp)==1:
                    fp = fp[0]
                    rel = self.get_correct_rel(schema.files.all_relationships(fp), self.dataset.current_version_of_schema-1)
                    rel.properties = json.dumps(fp.__properties__)
                    rel.save()
                    fp.properties=string_parsed['metadata']
                    fp.size_in_bytes=len(data)
                    fp.save()
                    for ca in fp.custom_annotation.match(version=self.dataset.current_version_of_schema-1):
                        fp.custom_annotation.connect(ca, {'version':self.dataset.current_version_of_schema})
                    for a in fp.annotation.match(version=self.dataset.current_version_of_schema-1):
                        fp.annotation.connect(a, {'version':self.dataset.current_version_of_schema})
                    schema.files.connect(fp, {'version':self.dataset.current_version_of_schema})
                    continue
            if has_lineage==True:
                files = self.get_file_lineage(lineage, file[5:])
                if len(files)==1:
                    files_version = files[0]['version']
                    files = files[0]['data']
                    fp = File(filename=file[5:], properties=string_parsed['metadata'], description=files.description, size_in_bytes=len(data))
                    fp.save()
                    if len(files.annotation.match(version=files_version))!=0:
                        for a in files.annotation.match(version=files_version):
                            annotation = Annotation(instance=a.instance)
                            annotation.save()
                            annotation.ontology.connect(a.ontology[0])
                            fp.annotation.connect(annotation)
                    if len(files.custom_annotation.match(version=files_version))!=0:
                        for a in files.custom_annotation.match(version=files_version):
                            annotation = Annotation(instance=a.instance, description=a.description, key=a.key)
                            annotation.save()
                            annotation.ontology.connect(a.ontology[0])
                            fp.custom_annotation.connect(annotation)
                    schema.files.connect(fp, {'version':self.dataset.current_version_of_schema})
                    continue
            fp = File(filename=file[5:], properties=string_parsed['metadata'], size_in_bytes=len(data))
            fp.save()
            schema.files.connect(fp, {'version':self.dataset.current_version_of_schema})
        self.dataset.schema.connect(schema, {'version':self.dataset.current_version_of_schema})
        if(self.dataset.current_version_of_schema!=0):
            self.dataset.version.connect(self.dataset, {'version':self.dataset.current_version_of_schema-1, 'properties':json.dumps(self.dataset.__properties__, default=str)})


    def get_notebook_string(self, type:str="JUPYTER", version:str="LATEST")->str:
        """
        Function for getting the needed code as string for the notebooks.

        :param type: type of the notebook.
        :param version: version of the data that should be loaded.
        :return: the required code as string.
        """
        if type=="JUPYTER":
            if self.revision.read_type == ReadType.DATA_FILE:
                code = textwrap.dedent('''
                import sys
                !{sys.executable} -m pip install pywebhdfs

                from pywebhdfs.webhdfs import PyWebHdfsClient
                
                hdfs = PyWebHdfsClient(host='namenode', port=9870)''')
                files = self.revision.source_files 
                if version != 'LATEST':
                    files = self.datasource.resolve_any_revision(int(version)).source_files 
                for index, file in enumerate(files):
                    if version =='LATEST':
                        path = f'"/datalake/{self.workspace_id}/data/unstructured/{self.datasource.id}/{file[5:]}"'
                    else:
                        path = f'"/datalake/{self.workspace_id}/sources/{self.datasource.id}/{file}"'
                    code = code + textwrap.dedent(f'''
                    path = {path}
                    data{index} = hdfs.read_file(path)
                    print(data{index})''')
                return code
            elif self.revision.write_type == WriteType.DEFAULT:
                code = textwrap.dedent('''
                import sys
                !{sys.executable} -m pip install pyspark==3.1.2

                from pyspark.sql.session import SparkSession
                import socket
                jars = ["io.delta:delta-core_2.12:1.0.0"]

                configs = {''')
                code = code + textwrap.dedent(f'''
                    "spark.master": "{self.settings.spark_master_notebooks}",
                    "spark.app.name": "{str(uuid.uuid4())}",
                    "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
                    "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog",
                    "spark.submit.deployMode": "client",
                    "spark.jars.packages": ",".join(jars),
                    "spark.driver.bindAddress": "0.0.0.0",
                    # can adjust for your cluster resources
                    "spark.cores.max": "2",
                    "spark.executor.memory": "16G",
                    "spark.driver.maxResultSize": "0",
                    #"spark.pyspark.driver.python": sys.executable,
                    # needed for large operations on weak cluster
                    "spark.executor.heartbeatInterval": "60s",
                    "spark.network.timeoutInterval": "300s",
                    "spark.network.timeout": "300s",
                    "spark.sql.broadcastTimeout": "10000",
                    "spark.driver.host": socket.gethostbyname(socket.gethostname()),
                    "fs.defaultFS": "hdfs://{self.settings.hdfs_storage.namenode}:{self.settings.hdfs_storage.fs_port}",
                    "dfs.client.use.datanode.hostname": "true",
                    "dfs.datanode.use.datanode.hostname": "true",'''
                    +'''
                }'''+f'''
                builder = SparkSession.builder
                for k, v in configs.items():
                    builder = builder.config(k, v)
                spark_session = builder.getOrCreate()
                df = spark_session.read.format("parquet").load("/datalake/{self.workspace_id}/data/structured/{self.datasource.id}.parquet")
                df.show()
                #--------------------
                #your code comes here
                #--------------------
                ''')
                return code
            elif self.revision.write_type == WriteType.DELTA:
                code = textwrap.dedent('''
                import sys
                !{sys.executable} -m pip install pyspark==3.1.2
                
                from pyspark.sql.session import SparkSession
                import socket
                jars = ["io.delta:delta-core_2.12:1.0.0"]

                configs = {''')
                if version =='LATEST':
                    path = f'spark_session.read.format("delta").load(f"/datalake/{self.workspace_id}/data/delta/{self.datasource.id}")'
                else:
                    path = f'spark_session.read.format("delta").option("versionAsOf", {version}).load(f"/datalake/{self.workspace_id}/data/delta/{self.datasource.id}")'
                code = code + textwrap.dedent(f'''
                    "spark.master": "{self.settings.spark_master_notebooks}",
                    "spark.app.name": "{str(uuid.uuid4())}",
                    "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
                    "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog",
                    "spark.submit.deployMode": "client",
                    "spark.jars.packages": ",".join(jars),
                    "spark.driver.bindAddress": "0.0.0.0",
                    # can adjust for your cluster resources
                    "spark.cores.max": "2",
                    "spark.executor.memory": "16G",
                    "spark.driver.maxResultSize": "0",
                    #"spark.pyspark.driver.python": sys.executable,
                    # needed for large operations on weak cluster
                    "spark.executor.heartbeatInterval": "60s",
                    "spark.network.timeoutInterval": "300s",
                    "spark.network.timeout": "300s",
                    "spark.sql.broadcastTimeout": "10000",
                    "spark.driver.host": socket.gethostbyname(socket.gethostname()),
                    "fs.defaultFS": "hdfs://{self.settings.hdfs_storage.namenode}:{self.settings.hdfs_storage.fs_port}",
                    "dfs.client.use.datanode.hostname": "true",
                    "dfs.datanode.use.datanode.hostname": "true",'''
                    +'''
                }'''+f'''
                builder = SparkSession.builder
                for k, v in configs.items():
                    builder = builder.config(k, v)
                spark_session = builder.getOrCreate()
                df = {path}
                df.show()
                #--------------------
                #your code comes here
                #--------------------
                ''')
                return code
            else:
                code = textwrap.dedent('''
                import sys
                !{sys.executable} -m pip install pyspark==3.1.2

                from pyspark.sql.session import SparkSession
                import socket
                ''')+textwrap.dedent(f'''
                jars = ["io.delta:delta-core_2.12:1.0.0", {(','.join(map(lambda x: '"'+ str(x)+'",', self.revision.spark_packages)))[:-1]}]
                ''')+textwrap.dedent('''
                configs = {''')
                code = code + textwrap.dedent(f'''
                    "spark.master": "{self.settings.spark_master_notebooks}",
                    "spark.app.name": "{str(uuid.uuid4())}",
                    "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
                    "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog",
                    "spark.submit.deployMode": "client",
                    "spark.jars.packages": ",".join(jars),
                    "spark.driver.bindAddress": "0.0.0.0",
                    # can adjust for your cluster resources
                    "spark.cores.max": "2",
                    "spark.executor.memory": "16G",
                    "spark.driver.maxResultSize": "0",
                    #"spark.pyspark.driver.python": sys.executable,
                    # needed for large operations on weak cluster
                    "spark.executor.heartbeatInterval": "60s",
                    "spark.network.timeoutInterval": "300s",
                    "spark.network.timeout": "300s",
                    "spark.sql.broadcastTimeout": "10000",
                    "spark.driver.host": socket.gethostbyname(socket.gethostname()),
                    "fs.defaultFS": "hdfs://{self.settings.hdfs_storage.namenode}:{self.settings.hdfs_storage.fs_port}",
                    "dfs.client.use.datanode.hostname": "true",
                    "dfs.datanode.use.datanode.hostname": "true",'''
                    +'''
                }'''+f'''
                builder = SparkSession.builder
                for k, v in configs.items():
                    builder = builder.config(k, v)
                spark_session = builder.getOrCreate()
                reader = spark_session.read.format("{self.dataset.custom_read_formats[0].read_format}")
                ''')
                for key, value in self.dataset.custom_read_formats[0].read_options.items():
                    code = code +textwrap.dedent(f'''reader = reader.option("{key}", "{value}")
                    ''')
                code = code +textwrap.dedent('''
                df = reader.load()
                df.show()
                #--------------------
                #your code comes here
                #--------------------
                ''')
                return code
        else:
            pass

    def profiling(self, df:DataFrame, version:str)->None:
        """
        Function for the profiling of source data.

        :return: None.
        """
        df = self.flatten(df)
        result = ColumnProfilerRunner(self.spark_session) \
            .onData(df) \
            .run()
        
        schema = self.dataset.nodes.get(uid=self.dataset.uid).schema.match(version=version)
        for entity in schema[0].entities.match(version=version):
            self.recusive_profiling(result, entity, '', version)


        profile_dict = {}
        for col, profile in result.profiles.items():
            profile_dict[col] = {
                "approximateNumDistinctValues": profile.approximateNumDistinctValues,
                "completeness": profile.completeness,
                "dataType": profile.dataType,
                "isDataTypeInferred": profile.isDataTypeInferred,
                "typeCounts": profile.typeCounts,
                "histogram": profile.histogram
            }
            if isinstance(profile, NumericColumnProfile):
                profile_dict[col]["kll"] = profile.kll
                profile_dict[col]["mean"] = profile.mean
                profile_dict[col]["maximum"] = profile.maximum
                profile_dict[col]["minimum"] = profile.minimum
                profile_dict[col]["sum"] = profile.sum
                profile_dict[col]["stdDev"] = profile.stdDev
                profile_dict[col]["approxPercentiles"] = profile.approxPercentiles

        try:      
            entity = DeequData(dataset_id=self.dataset.uid, version=version, profiles=profile_dict)
            try:
                entity.save()
                print("Deequ Data saved!")
                return entity
            except:
                # update document in collection
                DeequData.objects(dataset_id=self.dataset.uid, version=version).update(profiles=profile_dict)
        except Exception as e:
            raise print(e)

    
    
    def recusive_profiling(self, result, attributes, prefix:str, version:str)->None:
        """
        Function for the mapping of the profiling results to the attributes.

        :param result: results form the profiling.
        :param attributes: all attributes of the current iteration level.
        :param prefix: the prefix that is build automatically doing the recusive calls.
        :param version: the current version of the schema.
        :return: None.
        """
        for attribute in attributes.attributes.match(version=self.dataset.current_version_of_schema):
            if attribute.is_object==True:
                self.recusive_profiling(result, attribute, prefix+attribute.name+'_', version)
            elif attribute.is_array_of_objects==True:
                self.recusive_profiling(result, attribute, prefix+attribute.name+'_', version)
            else:
                r = result.profiles[prefix + attribute.name].all
                if r['dataType'] == 'String' or r['dataType'] == 'Boolean' or r['dataType'] == 'Unknown':
                    if version==0:
                        stat = NominalAttributeStats(type='NOMINAL',
                            data_type=r['dataType'],
                            completeness=r['completeness'], 
                            approximate_count_distinct_values=r['approximateNumDistinctValues'],
                            is_data_type_inferred=r['isDataTypeInferred']
                        )
                        stat.save()
                        attribute.stats.connect(stat, {'version':version})
                    else:
                        try:
                            stat = attribute.stats[0]
                            if len(attribute.stats.match(version=version-1))!=0:
                                rel = self.get_correct_rel(attribute.stats.all_relationships(stat), version-1)
                                rel.properties = json.dumps(stat.__properties__)
                                rel.save()
                            else:
                                rel = self.get_correct_rel(attribute.stats.all_relationships(stat), None, True)
                                rel.properties = json.dumps(stat.__properties__)
                                rel.save()
                            stat.data_type=r['dataType']
                            stat.completeness=r['completeness'] 
                            stat.approximate_count_distinct_values=r['approximateNumDistinctValues']
                            stat.is_data_type_inferred=r['isDataTypeInferred']
                            stat.save()   
                            attribute.stats.connect(stat, {'version':self.dataset.current_version_of_schema})
                        except:
                            stat = NominalAttributeStats(type='NOMINAL',
                                data_type=r['dataType'],
                                completeness=r['completeness'], 
                                approximate_count_distinct_values=r['approximateNumDistinctValues'],
                                is_data_type_inferred=r['isDataTypeInferred']
                            )
                            stat.save()
                            attribute.stats.connect(stat, {'version':version})
                            pass
                else:
                    if version == 0:
                        stat = NumericAttributeStats(type='NUMERIC',
                            data_type=r['dataType'],
                            completeness=r['completeness'], 
                            approximate_count_distinct_values=r['approximateNumDistinctValues'],
                            is_data_type_inferred=r['isDataTypeInferred'],
                            mean = r['mean'],
                            maximum = r['maximum'],
                            minimum = r['minimum'],
                            sum = r['sum'],
                            standard_deviation = r['stdDev'],
                        )
                        stat.save()
                        attribute.stats.connect(stat, {'version':version})
                    else:
                        try:
                            stat = attribute.stats[0]
                            if len(attribute.stats.match(version=version-1))!=0:
                                rel = self.get_correct_rel(attribute.stats.all_relationships(stat), version-1)
                                rel.properties = json.dumps(stat.__properties__)
                                rel.save()
                            else:
                                rel = self.get_correct_rel(attribute.stats.all_relationships(stat), None, True)
                                rel.properties = json.dumps(stat.__properties__)
                                rel.save()
                            stat.type='NUMERIC'
                            stat.data_type=r['dataType']
                            stat.completeness=r['completeness']
                            stat.approximate_count_distinct_values=r['approximateNumDistinctValues']
                            stat.is_data_type_inferred=r['isDataTypeInferred']
                            stat.mean = r['mean']
                            stat.maximum = r['maximum']
                            stat.minimum = r['minimum']
                            stat.sum = r['sum']
                            stat.standard_deviation = r['stdDev']
                            stat.save()   
                            attribute.stats.connect(stat, {'version':version})
                        except:
                            stat = NumericAttributeStats(type='NUMERIC',
                                data_type=r['dataType'],
                                completeness=r['completeness'], 
                                approximate_count_distinct_values=r['approximateNumDistinctValues'],
                                is_data_type_inferred=r['isDataTypeInferred'],
                                mean = r['mean'],
                                maximum = r['maximum'],
                                minimum = r['minimum'],
                                sum = r['sum'],
                                standard_deviation = r['stdDev'],
                            )
                            stat.save()
                            attribute.stats.connect(stat, {'version':version})


    def get_docker_ip(self, docker_name):
        """
        Function for 
        """
        client = docker.DockerClient()
        container = client.containers.get(docker_name)
        ip_add = container.attrs['NetworkSettings']['Networks']['application_datalake']['IPAddress']

        return ip_add
    
    def create_hive_database(self):
        """
        Function for 
        """
        self.spark_session.sql(f"""DROP DATABASE IF EXISTS {"workspace_" + self.workspace_id} CASCADE;""")
        self.spark_session.sql(f"""CREATE DATABASE IF NOT EXISTS {"workspace_" + self.workspace_id};""")
                        
