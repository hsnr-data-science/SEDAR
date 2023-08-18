from datetime import datetime
from typing import List

from commons.models.datasource import DatasourceDefinition, Revision, IngestionEvent
from commons.enums import IngestionState, ReadType

from werkzeug.exceptions import NotFound

"""Module for mapping between datasource object and datasource model"""

def save_revision(revision: Revision, datasource: DatasourceDefinition) -> DatasourceDefinition:
    datasource.revisions.append(revision)
    datasource.current_revision = revision.number
    return datasource.save()

def new_event(datasource: DatasourceDefinition) -> DatasourceDefinition:
    event = IngestionEvent(
        number=datasource.next_event_number(),
        state=IngestionState.STARTED,
        revision=datasource.current_revision,
    )
    datasource.ingestions.append(event)
    datasource.last_ingestion = event.number
    return datasource.save()

def update_inegstion_event(
    datasource: DatasourceDefinition, state: IngestionState, error: str = None
) -> DatasourceDefinition:
    event: IngestionEvent = datasource.resolve_latest_ingestion()
    event.state = state
    if state == IngestionState.RUNNING:
        event.started = datetime.now()
    if state == IngestionState.FINISHED or state == IngestionState.STOPPED:
        event.ended = datetime.now()
        if error:
            event.error = error
        else:
            datasource.last_successful_ingestion = event.number
    return datasource.save()

def find_by_id(id: str) -> DatasourceDefinition:
    d = DatasourceDefinition.objects.with_id(id)
    if not d:
        raise Exception("No datasource for id " + id)
    return d

def get_all_datatsources() -> List[DatasourceDefinition]:
    return DatasourceDefinition.objects()

def find_timed() -> List[DatasourceDefinition]:
    return DatasourceDefinition.objects(
        __raw__={"revisions.-1.continuation_timers": {"$not": {"$size": 0}}}
    )

def find_streams() -> List[DatasourceDefinition]:
    return DatasourceDefinition.objects(__raw__={"revisions.-1.read_type": ReadType.STREAM})

def delete(id: str):
    return find_by_id(id).delete()
