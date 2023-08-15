import os
import subprocess
import sys
import inspect

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
sys.path.insert(0, os.path.dirname(os.path.dirname(currentdir))) 

from commons.models.datasource.revision import Revision
from commons.services.data_frame_helper import DataFrameHelper

from datetime import datetime, timezone
from time import sleep
import math

import pycron
from commons.configuration.settings import Settings
from commons.enums import IngestionState
from commons.repositories import datasource_repo
from kafka import KafkaProducer
from mongoengine import base, connect

settings = Settings()

# -----[ setup vars ]-------------------------------------------------------------------------------
print("Connect to kafka")
kafka_connected = False
connect(host=settings.mongodb_management.connection_url)
while not kafka_connected:
    try:
        producer = KafkaProducer(
            bootstrap_servers=settings.kafka.bootstrap_servers,
            value_serializer=lambda s: s.encode("ascii"),
        )
        kafka_connected = True
    except:
        print("Kafka connection failed. Try again in 5 seconds")
        sleep(5)
print("Connected to kafka")

process = subprocess.Popen(["python3.9", "alive.py"]) 

basedate = datetime.now()

# -----[ main loop ]--------------------------------------------------------------------------------
loop_duration = 60
topic = "dls__ingestion__run"


while True:
    loop_start = datetime.now(tz=timezone.utc)
    print(f"[CONTINUATION] Loop start at {loop_start.strftime('%Y-%m-%d')}")

    # check streams
    for definition in datasource_repo.find_streams():
        if definition.get_state() == IngestionState.FINISHED:
            id = str(definition.pk)
            print(f"Run datasource {id}")
            definition = datasource_repo.new_event(definition)
            producer.send(topic, value=id)

    # check timed
    for definition in datasource_repo.find_timed():
        if definition.get_state() in [IngestionState.FINISHED, IngestionState.STOPPED]:
            currentrev = definition.resolve_current_revision() 
            if currentrev != None:
                for timer in currentrev.continuation_timers:
                    #if pycron.is_now(timer, basedate):
                    if pycron.is_now(timer):
                        event = definition.resolve_latest_ingestion()
                        id = str(definition.pk)
                        print(f"Run datasource {id}")
                        # |====[ added by marcel]===================================================================================
                        # create revision
                        rev = definition.revisions[len(definition.revisions)-1]
                        next_revision = Revision(
                            # general
                            number=definition.current_revision+1,
                            created=datetime.now(),
                            name=rev.name,
                            id_column=rev.id_column,
                            spark_packages=rev.spark_packages,
                            # read
                            source_files=rev.source_files,
                            read_type=rev.read_type,
                            read_format=rev.read_format,
                            read_options=rev.read_options,
                            # save
                            update_for=rev.update_for,
                            write_type=rev.write_type,
                            write_format=rev.write_format,
                            write_options=rev.write_options,
                            write_mode=rev.write_mode,
                            # continuation
                            continuation_timers=rev.continuation_timers,
                            # plugins
                            plugin_packages=rev.plugin_packages,
                            plugin_files=rev.plugin_files,
                        )
                        definition = datasource_repo.save_revision(next_revision, definition)
                        # |====[ end added ]===================================================================================
                        definition = datasource_repo.new_event(definition)
                        producer.send(topic, value=id)
                        dfh = DataFrameHelper(None, datasource_id=id, without_session=True)
                        dfh.dataset.range_end=datetime.now()
                        dfh.dataset.save()
                        break

    loop_end = datetime.now(tz=timezone.utc)
    print(f"[CONTINUATION] Loop end at {loop_end.strftime('%Y-%m-%d')}")

    loop_time = math.floor((loop_end - loop_start).total_seconds())
    print(f"[CONTINUATION] Loop took {loop_time}")

    loop_wait = loop_duration - loop_time
    if loop_wait > 0:
        print(f"[CONTINUATION] Loop wait {loop_wait}")
        sleep(loop_wait)