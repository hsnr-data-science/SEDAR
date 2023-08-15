from time import strftime, strptime
from typing import List

from commons.enums import ReadType, WriteType
from commons.models.datasource import DatasourceDefinition, Revision, IngestionEvent
from flask import json
from datetime import datetime

class DatasourceDefinitionInput:
    
    FIELD_NAME = "name"
    FIELD_ID_COLUMN = "id_column"
    FIELD_SPARK_PACKAGES = "spark_packages"
    FIELD_SOURCE_FILES = "source_files"
    FIELD_READ_TYPE = "read_type"
    FIELD_READ_FORMAT = "read_format"
    FIELD_READ_OPTIONS = "read_options"
    FIELD_UPDATE_FOR = "update_for"
    FIELD_WRITE_TYPE = "write_type"
    FIELD_WRITE_FORMAT = "write_format"
    FIELD_WRITE_OPTIONS = "write_options"
    FIELD_WRITE_MODE = "write_mode"
    FIELD_CONTINUATION_TIMERS = "continuation_timers"
    FIELD_PLUGIN_PACKAGES = "plugin_packages"
    FIELD_PLUGIN_FILES = "plugin_files"

    # general
    name: str
    id_column: str
    spark_packages: List[str]
    # read
    source_files: List[str]
    read_type: ReadType
    read_format: str
    read_options: dict
    # save
    update_for: str
    write_type: WriteType
    write_format: str
    write_options: dict
    write_mode: str
    # continuation
    continuation_timers: List[str]
    # plugins
    plugin_packages: List[str]
    plugin_files: List[str]

    def __init__(self, json_str: str = None):
        if json_str:
            data = json.loads(json_str)
            # general
            self.name = data.get(DatasourceDefinitionInput.FIELD_NAME)
            self.id_column = data.get(DatasourceDefinitionInput.FIELD_ID_COLUMN)
            self.spark_packages = data.get(DatasourceDefinitionInput.FIELD_SPARK_PACKAGES, [])
            # read
            self.source_files = data.get(DatasourceDefinitionInput.FIELD_SOURCE_FILES, [])
            self.read_type = data.get(DatasourceDefinitionInput.FIELD_READ_TYPE)
            self.read_format = data.get(DatasourceDefinitionInput.FIELD_READ_FORMAT)
            self.read_options = data.get(DatasourceDefinitionInput.FIELD_READ_OPTIONS, {})
            # save
            self.update_for = data.get(DatasourceDefinitionInput.FIELD_UPDATE_FOR)
            self.write_type = data.get(DatasourceDefinitionInput.FIELD_WRITE_TYPE)
            self.write_format = data.get(DatasourceDefinitionInput.FIELD_WRITE_FORMAT)
            self.write_options = data.get(DatasourceDefinitionInput.FIELD_WRITE_OPTIONS, {})
            self.write_mode = data.get(DatasourceDefinitionInput.FIELD_WRITE_MODE)
            # continuation
            self.continuation_timers = data.get(
                DatasourceDefinitionInput.FIELD_CONTINUATION_TIMERS, []
            )
            # plugins
            self.plugin_packages = data.get(DatasourceDefinitionInput.FIELD_PLUGIN_PACKAGES, [])
            self.plugin_files = data.get(DatasourceDefinitionInput.FIELD_PLUGIN_FILES, [])
        else:
            return None


def _revision_dto(revision: Revision):
    return {
        # general
        "id_column": revision.id_column,
        "number": revision.number,
        "created": revision.created.strftime("%d/%m/%Y, %H:%M:%S"),
        "name": revision.name,
        "spark_packages": revision.spark_packages,
        # read
        "source_files": revision.source_files,
        "read_type": revision.read_type,
        "read_format": revision.read_format,
        "read_options": revision.read_options,
        # save
        "update_for": revision.update_for,
        "write_type": revision.write_type,
        "write_format": revision.write_format,
        "write_options": revision.write_options,
        "write_mode": revision.write_mode,
        # continuation
        "continuation_timers": revision.continuation_timers,
        # plugins
        "plugin_files": revision.plugin_files,
        "plugin_packages": revision.plugin_packages,
    }


def _ingestion_event_dto(event: IngestionEvent):
    if event == None:
        return event
    return {
        "number": event.number,
        "state": event.state,
        "revision": event.revision,
        "started": event.started.strftime("%Y-%m-%d %H:%M:%S") if event.started else "",
        "ended": event.ended.strftime("%Y-%m-%d %H:%M:%S") if event.ended else "",
        "error": event.error,
    }


def datasource_dto(datasource: DatasourceDefinition):
    revisions = list(map(_revision_dto, datasource.revisions))
    ingestions = list(map(_ingestion_event_dto, datasource.ingestions))
    return {
        "id": str(datasource.pk),
        "currentRevision": datasource.current_revision,
        "revisions": revisions,
        "lates_ingestion": datasource.last_ingestion,
        "last_successful_ingestion": datasource.last_successful_ingestion,
        "ingestions": ingestions,
    }