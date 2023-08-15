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

settings = Settings()

print("Connect to kafka")
kafka_connected = False
while not kafka_connected:
    try:
        _consumer = KafkaConsumer(
            settings.kafka.topic_schema_run,
            group_id="schema_servers",
            bootstrap_servers=settings.kafka.bootstrap_servers,
            value_deserializer=lambda v: v.decode("ascii"),
        )
        kafka_connected = True
    except:
        print("Kafka connection failed. Try again in 5 seconds")
        sleep(5)
    print("Connected to kafka")

print("Schema server started")

process = subprocess.Popen(["python3.9", "alive.py"]) 

print("Schema REST-API started")

for message in _consumer:

    id: str = message.value

    try:
        print(f"Run schema extraction for {id}")
        process = subprocess.Popen(["python3.9", "schema.py", id]) 
        # this sleep just for safety if multiple jobs -> result of testing
        sleep(1)
    except Exception as e:
        print(str(e))
