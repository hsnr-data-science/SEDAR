import os
import sys
import inspect

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
sys.path.insert(0, os.path.dirname(os.path.dirname(currentdir))) 

import subprocess

from kafka import KafkaConsumer
from mongoengine import connect
from commons.enums import IngestionState
from commons.models.datasource import IngestionEvent
from commons.repositories import datasource_repo
from time import sleep
from commons.configuration.settings import Settings

print("hello")
settings = Settings()
print("hello")
connect(host=settings.mongodb_management.connection_url)
print("hello")
print("Connect to kafka")
kafka_connected = False
print(settings.kafka.topic_ingestion_run, "\n")
print(settings.kafka.bootstrap_servers, "\n")
while not kafka_connected:
    try:
        _consumer = KafkaConsumer(
            settings.kafka.topic_ingestion_run,
            group_id="ingestion_servers",
            bootstrap_servers=settings.kafka.bootstrap_servers,
            value_deserializer=lambda v: v.decode("ascii"),
        )
        kafka_connected = True
    except:
        print("Kafka connection failed. Try again in 5 seconds")
        sleep(5)
    
print("Connected to kafka")

print("Ingestion server started")

process = subprocess.Popen(["python3.9", "alive.py"]) 

print("Ingestion REST-API started")

# TODO: move all to process
# start ingestion if not started or running
for message in _consumer:

    id: str = message.value

    try:
        datasource = datasource_repo.find_by_id(id)
        latest_ingestion: IngestionEvent = datasource.resolve_latest_ingestion()

        # ingestion must be started before run
        if latest_ingestion and latest_ingestion.state == IngestionState.STARTED:
            print(f"Run ingestion for {id}")
            process = subprocess.Popen(["python3.9", "ingestion.py", id])
            # this sleep just for safety if multiple jobs -> result of testing
            sleep(1)
    except Exception as e:
        print(str(e))
