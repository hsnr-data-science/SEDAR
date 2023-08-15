from mongoengine.document import EmbeddedDocument
from mongoengine.fields import IntField, DateTimeField, StringField, EnumField
from commons.enums import IngestionState

class IngestionEvent(EmbeddedDocument):
    # increasing identifier for event
    number = IntField()
    # current state of this event
    state = EnumField(IngestionState)
    # number of the revision the ingestion was started with
    revision = IntField()
    # dates for start and end
    started = DateTimeField()
    ended = DateTimeField()
    # error message if ther where any
    error = StringField(default=None)