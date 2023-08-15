from typing import Optional
from mongoengine.document import Document
from mongoengine.errors import DoesNotExist
from mongoengine.fields import EmbeddedDocumentListField, IntField
from commons.enums import IngestionState
from .revision import Revision
from .ingestion_event import IngestionEvent

class DatasourceDefinition(Document):
    # number of the revisions entry representing the current revision
    current_revision = IntField()
    # list of all revisions
    revisions = EmbeddedDocumentListField(Revision, default=[])
    # number of the event entry representing the latest ingestion
    last_ingestion = IntField()
    # number of the event entry representing the last successful ingestion
    last_successful_ingestion = IntField()
    # list of all events of the datasource
    ingestions = EmbeddedDocumentListField(IngestionEvent, default=[])

    meta = {"collection": "datasources"}

    def resolve_current_revision(self) -> Optional[Revision]:
        try:
            return self.revisions.get(number=self.current_revision)
        except DoesNotExist:
            return None
    
    def resolve_any_revision(self, number) -> Optional[Revision]:
        try:
            return self.revisions.get(number=number)
        except DoesNotExist:
            return None

    def resolve_latest_ingestion(self) -> Optional[IngestionEvent]:
        try:
            return self.ingestions.get(number=self.last_ingestion)
        except DoesNotExist:
            return None

    def resolve_last_successful_ingestion(self) -> Optional[IngestionEvent]:
        try:
            return self.ingestions.get(number=self.last_successful_ingestion)
        except DoesNotExist:
            return None

    def next_revision_number(self) -> int:
        if self.current_revision is not None:
            return self.current_revision + 1
        else:
            return 0

    def next_event_number(self) -> int:
        if self.last_ingestion is not None:
            return self.last_ingestion + 1
        else:
            return 0

    def get_state(self):
        latest = self.resolve_latest_ingestion()
        if latest is None:
            return IngestionState.FINISHED
        else:
            return latest.state