from datetime import datetime
import os
import sys
import inspect
from kafka import KafkaProducer

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
sys.path.insert(0, os.path.dirname(os.path.dirname(currentdir))) 

from commons.services.data_frame_helper import DataFrameHelper
from commons.models.datasource.revision import Revision

import socket
import os
from typing import Union

from pyspark.sql.readwriter import DataFrameReader
from pywebhdfs.webhdfs import PyWebHdfsClient

from apscheduler.schedulers.background import BackgroundScheduler
from commons.enums import IngestionState, ReadType, WriteType
from commons.repositories import datasource_repo
from delta import *
from kafka.consumer.group import KafkaConsumer
from mongoengine.connection import connect
from pyspark.sql import DataFrame
from pyspark.sql.session import SparkSession
from pyspark.sql.streaming import DataStreamReader, StreamingQuery

import plugin_helper
from dataframe_delta import get_change_data, merge_change_data_to_dataframe
from commons.configuration.settings import Settings

settings = Settings()

spark_session: SparkSession = None
error: str = None

# ||================================================================================================
#
# ||================================================================================================
def _listen_for_stop(id: str, query: StreamingQuery):
    consumer = KafkaConsumer(
        "dls__ingestion__stop_stream",
        bootstrap_servers=settings.kafka.bootstrap_servers,
        value_deserializer=lambda m: m.decode("ascii"),
    )

    for message in consumer:
        if message.value == id:
            query.stop()
            datasource_repo.update_inegstion_event(datasource, IngestionState.STOPPED)


try:
    # ||============================================================================================
    # || INITIALIZATION
    # ||============================================================================================
    scheduler = BackgroundScheduler()
    connect(host=settings.mongodb_management.connection_url)

    datasource_id = sys.argv[1]
    datasource = datasource_repo.find_by_id(datasource_id)
    revision = datasource.resolve_current_revision()
    datasource_repo.update_inegstion_event(datasource, IngestionState.RUNNING)
    # |====[ added by marcel]===================================================================================
    workspace_id = DataFrameHelper("", datasource_id=datasource_id, without_session=True).workspace_id
    # ||============================================================================================

    # ||============================================================================================
    # || COPY INGESTION
    # ||============================================================================================
    hdfs = PyWebHdfsClient(host=settings.hdfs_storage.namenode, port=settings.hdfs_storage.web_port)

    if revision.read_type == ReadType.DATA_FILE:
        for file in revision.source_files:
            sources_path = f"/datalake/{workspace_id}/sources/{datasource_id}/{file}"
            target_path = f"/datalake/{workspace_id}/data/unstructured/{datasource_id}/{file[5:]}"  # [5:] removes 'rXXX_' from filename
            data = hdfs.read_file(sources_path)
            hdfs.create_file(target_path, data, overwrite=True)

    # ||============================================================================================
    # || SPARK INGESTION
    # ||============================================================================================
    else:
        # |=========================================================================================
        # | PHASE 1 - PREPARATION
        # |=========================================================================================
        plugin_helper.load_plugins(datasource, workspace_id)

        jars = revision.spark_packages + ["io.delta:delta-core_2.12:1.0.0"]
        configs = {
            "spark.master": settings.spark_master,
            "spark.app.name": f"ingestion-{revision.name}",
            "spark.sql.extensions": "io.delta.sql.DeltaSparkSessionExtension",
            "spark.sql.catalog.spark_catalog": "org.apache.spark.sql.delta.catalog.DeltaCatalog",
            "spark.submit.deployMode": "client",
            "spark.jars.packages": ",".join(jars),
            "spark.driver.bindAddress": "0.0.0.0",
            # can adjust for your cluster resources
            "spark.cores.max": "4",
            "spark.executor.memory": "20G",
            "spark.driver.maxResultSize": "0",
            "spark.pyspark.driver.python": sys.executable,
            # needed for large operations on weak cluster
            "spark.executor.heartbeatInterval": "60s",
            "spark.network.timeoutInterval": "300s",
            "spark.network.timeout": "300s",
            "spark.sql.broadcastTimeout": "10000",
            "spark.driver.host": socket.gethostbyname(socket.gethostname()),
            "fs.defaultFS": f"hdfs://{settings.hdfs_storage.namenode}:{settings.hdfs_storage.fs_port}",
            "dfs.client.use.datanode.hostname": "true",
            "dfs.datanode.use.datanode.hostname": "true",
        }
        builder = SparkSession.builder
        for k, v in configs.items():
            builder = builder.config(k, v)
        spark_session = builder.getOrCreate()

        # |=========================================================================================
        # | PHASE 2 - LOAD
        # |=========================================================================================
        dataframe: DataFrame = None
        if plugin_helper.load_plugin:
            dataframe = plugin_helper.load_plugin(spark_session)
        else:
            reader: Union[DataFrameReader, DataStreamReader] = None
            if revision.read_type == ReadType.STREAM:
                reader = spark_session.readStream.format(revision.read_format)
            else:
                reader = spark_session.read.format(revision.read_format)

            for option in revision.read_options:
                reader = reader.option(option, revision.read_options[option])

            if revision.read_type == ReadType.SOURCE_FILE:
                sources_path = f"/datalake/{workspace_id}/sources/{datasource_id}"
                load = 0
                for f in revision.source_files:
                    if dataframe is None:
                        dataframe = reader.load(f"{sources_path}/{f}")
                    else:
                        dataframe = dataframe.union(reader.load(f"{sources_path}/{f}"))
                    load += 1
                dataframe.show()
            else:
                dataframe = reader.load()

        for plugin in plugin_helper.after_load_plugins:
            dataframe = plugin(dataframe)

        # |=========================================================================================
        # | PHASE 3 - CHANGE DATA
        # |=========================================================================================
        change_data: DataFrame = None
        is_update = revision.update_for != None and revision.update_for != ""
        is_first = datasource.last_successful_ingestion == None
        if revision.read_type != ReadType.STREAM:
            if is_update:
                change_data = dataframe
            elif not is_first and revision.write_type == WriteType.DELTA:
                delta_table = DeltaTable.forPath(
                    spark_session, f"/datalake/{workspace_id}/data/delta/{datasource_id}"
                )
                change_data = get_change_data(delta_table.toDF(), dataframe, revision.id_column)

        # |=========================================================================================
        # | PHASE 4 - SAVE
        # |=========================================================================================
        structured_path = f"/datalake/{workspace_id}/data/structured/{datasource_id}.parquet"
        delta_path = f"/datalake/{workspace_id}/data/delta/{datasource_id}"

        # ||----[ save streams ]--------------------------------------------------------------------
        if revision.read_type == ReadType.STREAM:
            query: StreamingQuery = None
            writer = dataframe.writeStream.option(
                "checkpointLocation", f"/datalake/{workspace_id}/checkpoints/{datasource_id}"
            )

            if revision.write_type == WriteType.DEFAULT:
                query = writer.format("parquet").outputMode("append").start(structured_path)

            elif revision.write_type == WriteType.DELTA:
                query = (
                    writer.format("delta")
                    .outputMode("append")
                    .option("mergeSchema", "true")
                    .start(delta_path)
                )

            elif revision.write_type == WriteType.CUSTOM:
                writer = writer.format(revision.write_format).outputMode(
                    "append" if revision.write_mode == "overwrite" else revision.write_mode
                )
                for key, value in revision.write_options.items():
                    writer = writer.option(key, value)
                query = writer.start()

            else:
                raise ValueError(f"Unknown SaveType: {revision.write_type}")
            # |----[ listen for stop ]--------------------------------------------------------------
            scheduler.add_job(_listen_for_stop, args=[datasource_id, query])
            if not scheduler.running:
                scheduler.start()
            query.awaitTermination()

        # ||----[ save batch ]----------------------------------------------------------------------
        else:
            if revision.write_type == WriteType.DEFAULT:
                # apply change data to current data
                if is_update:
                    # have tow write to tmp dir first
                    # cannot overwrite parquet file which is read too
                    structured_path = f"/datalake/{workspace_id}/data/structured/{revision.update_for}.parquet"
                    tmp_path = f"/datalake/{workspace_id}/data/structured/{datasource_id}.parquet"
                    target = spark_session.read.format("parquet").load(structured_path)
                    merge_change_data_to_dataframe(
                        target, change_data, revision.id_column
                    ).write.format("parquet").save(tmp_path)
                    hdfs.delete_file_dir(structured_path, recursive=True)
                    hdfs.rename_file_dir(tmp_path, structured_path)
                else:
                    writer = dataframe.write.format("parquet")
                    if not is_first:
                        writer = writer.mode("overwrite")
                    writer.save(structured_path)

            elif revision.write_type == WriteType.DELTA:
                if is_first and not is_update:
                    dataframe.write.format("delta").option("path", delta_path).save()
                else:
                    if is_update:
                        current_datasource = datasource_repo.find_by_id(revision.update_for)
                        current_path = f"/datalake/{workspace_id}/data/delta/{revision.update_for}"
                    else:
                        current_path = delta_path                   
                    current = DeltaTable.forPath(spark_session, current_path)
                    update_set = {
                        c: f"change_data.{c}" for c in change_data.columns if c != "cd_deleted"
                    }
                    current.alias("table").merge(
                        change_data.alias("change_data"),
                        f"table.{revision.id_column} = change_data.{revision.id_column}",
                    ).whenMatchedDelete(
                        condition="change_data.cd_deleted = true"
                    ).whenMatchedUpdate(
                        set=update_set
                    ).whenNotMatchedInsert(
                        condition="change_data.cd_deleted = false", values=update_set
                    ).execute()
                    
            elif revision.write_type == WriteType.CUSTOM:
                if is_update:
                    raise Exception("Cannot save change_data to custom storage")

                writer = dataframe.write.format(revision.write_format).mode(revision.write_mode)
                for key, value in revision.write_options.items():
                    writer = writer.option(key, value)
                writer.save()

            else:
                raise ValueError(f"Unknown SaveType: {revision.write_type}")
    datasource_repo.update_inegstion_event(datasource, IngestionState.FINISHED, error)
    
    # |====[ added by marcel]===================================================================================
    try:
        '''
        Basically only needed to count up the version of the source definition correctly.  
        This is especially important for "delta", "default" would not be so important, because there is no real dependency.
        Nevertheless it should be used for "default", because this will count up the version correctly and the data will be collected again.
        '''
        if is_update==True:
            if datasource_id != revision.update_for:
                current_datasource = datasource_repo.find_by_id(revision.update_for)
                current_revision = current_datasource.resolve_current_revision()
                next_revision = current_revision.number + 1

                # create revision
                rev = Revision(
                    # general
                    number=next_revision,
                    created=datetime.now(),
                    name=current_revision.name,
                    id_column=current_revision.id_column,
                    spark_packages=current_revision.spark_packages,
                    # read
                    source_files=current_revision.source_files,
                    read_type=current_revision.read_type,
                    read_format=current_revision.read_format,
                    read_options=current_revision.read_options,
                    # save
                    update_for=current_revision.update_for,
                    write_type=current_revision.write_type,
                    write_format=current_revision.write_format,
                    write_options=current_revision.write_options,
                    write_mode=current_revision.write_mode,
                    # continuation
                    continuation_timers=current_revision.continuation_timers,
                    # plugins
                    plugin_packages=current_revision.plugin_packages,
                    plugin_files=current_revision.plugin_files,
                )
                current_datasource.revisions.append(rev)
                current_datasource.current_revision = rev.number
                current_datasource.save()
                current_datasource = datasource_repo.new_event(current_datasource)
                datasource_repo.update_inegstion_event(current_datasource, IngestionState.RUNNING)
                datasource_repo.update_inegstion_event(current_datasource, IngestionState.FINISHED, error)
                datasource_id = revision.update_for             
    except Exception as ex: 
        pass
    if settings.server.ingestion_service_with_schema_service_in_one==True:
        dfh = DataFrameHelper("", datasource_id=datasource_id, connect_to_mongo=True, without_session=True)
        dfh.spark_session = spark_session
        dfh.start_exctracting_schema()
    else:
        _producer = KafkaProducer(
            bootstrap_servers=settings.kafka.bootstrap_servers,
            value_serializer=lambda v: v.encode("ascii"),
        )
        _producer.send(settings.kafka.topic_schema_run, value=datasource_id).get()
    print("Schema extraction started")
    # |====[ end added]===================================================================================
    
except Exception as e:
    error = str(e)
    print(error)
    datasource_repo.update_inegstion_event(datasource, IngestionState.FINISHED, error)

finally:
    if spark_session:
        spark_session.stop()
    if scheduler.running:
        scheduler.shutdown(wait=False)
