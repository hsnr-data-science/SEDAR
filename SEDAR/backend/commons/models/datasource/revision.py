from datetime import datetime
from mongoengine.document import EmbeddedDocument
from mongoengine.fields import IntField, DateTimeField, StringField, ListField, EnumField, DictField
from commons.enums import ReadType, WriteType

class Revision(EmbeddedDocument):
    # |----[ general ]------------------------------------------------------------------------------
    # increasing identifier for datasource revision
    number = IntField(default=0)
    # date revision was created
    created = DateTimeField(default=datetime.now())
    # human readable name for the datasource
    name = StringField(required=True)
    # id column name
    id_column = StringField(required=False)
    # extra maven packages
    spark_packages = ListField(StringField(), default=[])
    # |----[ read ]---------------------------------------------------------------------------------
    # source files
    source_files = ListField(StringField(), default=[])
    # ingestion type
    read_type = EnumField(ReadType, required=True)
    # spark read format
    read_format = StringField(required=False)
    # spark read options
    read_options = DictField(default={})
    # |----[ save ]---------------------------------------------------------------------------------
    # datasource id this source is update for
    update_for = StringField(default=None)
    # how to save data
    write_type = EnumField(WriteType, default=WriteType.DEFAULT)
    # spark write format
    write_format = StringField(default=None)
    # spark write options
    write_options = DictField(default={})
    # spark write mode
    write_mode = StringField(default="overwrite")
    # timers
    # |----[ continuation ]-------------------------------------------------------------------------
    continuation_timers = ListField(StringField(), default=[])
    # |----[ plugins ]------------------------------------------------------------------------------
    # plugin packages
    plugin_packages = ListField(StringField(), default=[])
    # plugin files
    plugin_files = ListField(StringField(), default=[])

    def same(self, other) -> bool:
        return (
            isinstance(other, Revision)
            and self.name == other.name
            and self.id_column == other.id_column
            and self.spark_packages == other.spark_packages
            and self.source_files == other.source_files
            and self.read_type == other.read_type
            and self.read_format == other.read_format
            and self.read_options == other.read_options
            and self.update_for == other.update_for
            and self.write_type == other.write_type
            and self.write_format == other.write_format
            and self.write_options == other.write_options
            and self.write_mode == other.write_mode
            and self.continuation_timers == other.continuation_timers
            and self.plugin_packages == other.plugin_packages
            and self.plugin_files == other.plugin_files
        )
