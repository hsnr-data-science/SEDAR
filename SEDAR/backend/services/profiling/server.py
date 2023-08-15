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
import json
import ast

settings = Settings()

print("Connect to kafka")
kafka_connected = False
while not kafka_connected:
    try:
        _consumer = KafkaConsumer(
            settings.kafka.topic_profiling_run,
            group_id="profiling_servers",
            bootstrap_servers=settings.kafka.bootstrap_servers,
            value_deserializer=lambda v: v.decode("ascii"),
        )
        kafka_connected = True
    except:
        print("Kafka connection failed. Try again in 5 seconds")
        sleep(5)
    print("Connected to kafka")

print("Profiling server started")

process = subprocess.Popen(["python3.9", "alive.py"]) 

print("Profiling REST-API started")

for message in _consumer:

    object: str = message.value
    d= ast.literal_eval(object)
    id = d['id']
    version = d['version']
    try:
        print(f"Run profiling for {id} version {version}")
        process = subprocess.Popen(["python3.9", "profiling.py", id, version]) 
        # this sleep just for safety if multiple jobs -> result of testing
        sleep(1)
    except Exception as e:
        print(str(e))
