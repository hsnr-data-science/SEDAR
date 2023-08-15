from enum import Enum

class ReadType(str, Enum):
    PULL = "PULL"
    SOURCE_FILE = "SOURCE_FILE"
    DATA_FILE = "DATA_FILE"
    STREAM = "STREAM"

class WriteType(str, Enum):
    DEFAULT = "DEFAULT"
    DELTA = "DELTA"
    CUSTOM = "CUSTOM"

class IngestionState(str, Enum):
    FINISHED = "FINISHED"
    STARTED = "STARTED"
    RUNNING = "RUNNING"
    STOPPED = "STOPPED"
