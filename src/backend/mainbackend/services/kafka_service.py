from commons.configuration.settings import Settings
from kafka import KafkaProducer

settings = Settings()

def start_ingestion(id: str):
    _producer.send(settings.kafka.topic_ingestion_run, value=id)

def start_profiling(id: str, version:str):
    object = str({"id":id, "version":version})
    _producer.send(settings.kafka.topic_profiling_run, value=object)

_producer = KafkaProducer(
    #api_version="0.10.2", # unnecessary?
    bootstrap_servers=settings.kafka.bootstrap_servers,
    value_serializer=lambda v: v.encode("ascii")
)
