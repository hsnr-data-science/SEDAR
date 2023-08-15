from datetime import datetime
from enum import Enum
from neomodel import (ArrayProperty, FloatProperty, IntegerProperty, JSONProperty, StructuredNode, StringProperty, BooleanProperty,
    UniqueIdProperty, RelationshipTo, Traversal, INCOMING, StructuredRel, DateTimeProperty)
from passlib.hash import pbkdf2_sha256 as sha256
from commons.repositories import datasource_repo
from . import datasource_dto
from commons.configuration.settings import Settings
from mongoengine.document import Document, EmbeddedDocument
from mongoengine.fields import EmbeddedDocumentListField, DateTimeField, StringField, EnumField, DictField, IntField, ReferenceField

#from mongoengine import CASCADE


class StatsRel(StructuredRel):
    version = IntegerProperty(default=0)
    properties = JSONProperty()

class Stats(StructuredNode):
    TYPES = {'NOMINAL': 'NOMINAL', 'NUMERIC': 'NUMERIC'}
    type=StringProperty(required=True, choices=TYPES)
    uid = UniqueIdProperty()
    completeness=FloatProperty()
    approximate_count_distinct_values=IntegerProperty()
    data_type=StringProperty()
    is_data_type_inferred=BooleanProperty()

    def serialize(self):
        items = {
                "id" : str(self.uid),
                "type": self.type,
                "completeness": self.completeness,
                "approximateCountDistinctValues": self.approximate_count_distinct_values,
                "dataType": self.data_type,
                "isDataTypeInferred": self.is_data_type_inferred,
            }
        if self.type == self.TYPES['NOMINAL']:
            return items
        else:
            items['mean']=self.mean
            items['maximum']=self.maximum
            items['minimum']=self.minimum
            items['sum']=self.sum
            items['standardDeviation']=self.standard_deviation
        return items

class NominalAttributeStats(Stats):
    pass

class NumericAttributeStats(Stats):
    mean = FloatProperty()
    maximum = FloatProperty()
    minimum = FloatProperty()
    sum = FloatProperty()
    standard_deviation = FloatProperty()

class Notebook(StructuredNode):
    TYPES = {'JUPYTER': 'JUPYTER', 'MLFLOW': 'MLFLOW'}
    uid = UniqueIdProperty()
    title = StringProperty(max_length=255)
    description = StringProperty()
    author = RelationshipTo('User', 'IS_AUTHOR')
    type = StringProperty(required=True, choices=TYPES)
    created_on = DateTimeProperty()
    last_updated_on = DateTimeProperty()
    is_public = BooleanProperty(default=False)
    version_of_dataset = StringProperty()
    # Muss dann im Notebook befüllt werden
    mlruns = ArrayProperty()

    def serialize(self):
        return {
            "id" : str(self.uid),
            "title": self.title,
            "description": self.description,
            "author": self.author[0].serialize(),
            "createdOn": self.created_on.strftime("%d.%m.%Y"),
            "lastUpdatedOn": self.last_updated_on.strftime("%d.%m.%Y"),
            "type": self.type,
            "isPublic": self.is_public,
            "version": self.version_of_dataset,
            "mlruns": str(self.mlruns),
        }

class Annotation(StructuredNode):
    uid = UniqueIdProperty()
    key = StringProperty(max_length=255)
    instance = StringProperty()
    description = StringProperty()
    ontology = RelationshipTo('Ontology', 'IS_FROM')

    def serialize(self):
        items = {
            "id" : str(self.uid),
            "instance": self.instance,
            "description": self.description,
            "key": self.key,
            "ontology": {"title":self.ontology[0].title},
        }
        return items

class Tag(StructuredNode):
    uid = UniqueIdProperty()
    title = StringProperty()
    annotation = RelationshipTo('Annotation', 'HAS_ANNOTATION')
    linked = RelationshipTo('Tag', 'IS_LINKED')

    def serialize(self, search=False):
        items =  {
            "id" : str(self.uid),
            "title": self.title,
            "annotation": self.annotation[0].serialize(),
        }
        if search==True:
            l = []
            for link in self.linked:
                l.append(link.uid)
            items['links'] = l
        return items

class AnnotationRel(StructuredRel):
    version = IntegerProperty(default=0)
    properties = JSONProperty()

class File(StructuredNode):
    uid = UniqueIdProperty()
    filename = StringProperty()
    size_in_bytes = IntegerProperty(default=0)
    properties = JSONProperty()
    annotation = RelationshipTo('Annotation', 'HAS_ANNOTATION', model=AnnotationRel)
    custom_annotation = RelationshipTo('Annotation', 'HAS_CUSTOM_ANNOTATION', model=AnnotationRel)
    description = StringProperty()

    def serialize(self, version=0):
        items = {
            "id" : str(self.uid),
            "filename": self.filename,
            "sizeInBytes": self.size_in_bytes,
            "properties": self.properties,
            "description": self.description,
        }

        if len(self.annotation.match(version=version))!=0:
            items["annotation"] = [item.serialize() for item in self.annotation.match(version=version)]
        if len(self.custom_annotation.match(version=version))!=0:
            items["customAnnotation"] = [item.serialize() for item in self.custom_annotation.match(version=version)]
        return items

class AttributeRel(StructuredRel):
    version = IntegerProperty(default=0)
    properties = JSONProperty()

class AttributeFKRel(StructuredRel):
    dataset_uid = StringProperty()
    source_uid = StringProperty()
    
class Attribute(StructuredNode):
    uid = UniqueIdProperty()
    name = StringProperty()
    data_type = StringProperty()
    data_type_internal = StringProperty()
    nullable = BooleanProperty()
    is_array_of_objects = BooleanProperty()
    is_object = BooleanProperty()
    description = StringProperty()
    attributes = RelationshipTo('Attribute', 'HAS_ATTRIBUTE', model=AttributeRel)
    annotation = RelationshipTo('Annotation', 'HAS_ANNOTATION', model=AnnotationRel)
    is_pk = BooleanProperty(default=False)
    is_fk = BooleanProperty(default=False)
    foreign_key_to = RelationshipTo('Attribute', 'FK_TO', model=AttributeFKRel)

    contains_PII = BooleanProperty(default=False)
    stats = RelationshipTo('Stats', 'HAS_STATS', model=StatsRel)

    def serialize(self, version=0):
        items = {
            "id" : str(self.uid),
            "name": self.name,
            "dataType": self.data_type,
            "nullable": self.nullable,
            "isArrayOfObjects": self.is_array_of_objects,
            "isObject": self.is_object,
            "attributes": [item.serialize(version) for item in self.attributes.match(version=version)],
            "isPk": self.is_pk,
            "isFk": self.is_fk,
            "containsPII": self.contains_PII,
            "description": self.description,
            "dataTypeInternal": self.data_type_internal,
        }
        if len(self.annotation.match(version=version))!=0:
            items["annotation"] = [item.serialize() for item in self.annotation.match(version=version)]
        if len(self.stats.match(version=version))!=0:
            items["stats"]=self.stats.match(version=version)[0].serialize()
        if len(self.foreign_key_to)!=0 and self.is_fk==True:
            items["foreignKeysTo"]=[{"attribute":{"name":item.name, "id":item.uid}, "dataset":self.foreign_key_to.relationship(item).dataset_uid} for item in self.foreign_key_to]
        return items

class Entity(StructuredNode):
    uid = UniqueIdProperty()
    name = StringProperty()
    display_name = StringProperty()
    description = StringProperty()
    count_of_rows = IntegerProperty(default=0)
    annotation = RelationshipTo('Annotation', 'HAS_ANNOTATION', model=AnnotationRel)
    custom_annotation = RelationshipTo('Annotation', 'HAS_CUSTOM_ANNOTATION', model=AnnotationRel)
    attributes = RelationshipTo('Attribute', 'HAS_ATTRIBUTE', model=AttributeRel)

    def serialize(self, version=0):
        items = {
            "id" : str(self.uid),
            "internalname": self.name,
            "displayName": self.display_name,
            "attributes":[item.serialize(version=version) for item in self.attributes.match(version=version)],
            "description": self.description,
            "countOfRows": self.count_of_rows,
        }

        if len(self.annotation.match(version=version))!=0:
            items["annotation"] = [item.serialize() for item in self.annotation.match(version=version)]
        if len(self.custom_annotation.match(version=version))!=0:
            items["customAnnotation"] = [item.serialize() for item in self.custom_annotation.match(version=version)]
        return items

class EntityRel(StructuredRel):
    version = IntegerProperty(default=0)
    properties = JSONProperty()

class SchemaRel(StructuredRel):
    version = IntegerProperty(default=0)
    properties = JSONProperty()

class FileRel(StructuredRel):
    version = IntegerProperty(default=0)
    properties = JSONProperty()

class DatasetuserRel(StructuredRel):
    can_read = BooleanProperty(default=True)
    can_write = BooleanProperty(default=True)
    can_delete = BooleanProperty(default=True)

class DatasetVersionRel(StructuredRel):
    version = IntegerProperty(default=0)
    properties = JSONProperty()

class Schema(StructuredNode):
    TYPES = {'STRUCTURED': 'STRUCTURED', 'SEMISTRUCTURED': 'SEMISTRUCTURED', 'UNSTRUCTURED': 'UNSTRUCTURED'}
    type=StringProperty(required=True, choices=TYPES)
    uid = UniqueIdProperty()

    def serialize(self, version):
        items={
            "id" : str(self.uid),
            "type": self.type,
        }
        if self.type == self.TYPES['UNSTRUCTURED']:
            items['files'] = [item.serialize(version=version) for item in self.files.match(version=version)]
        else:
            items['entities'] = [item.serialize(version=version) for item in self.entities.match(version=version)]
        return items

class Structured(Schema):
    entities = RelationshipTo('Entity', 'HAS_ENTITY', model=EntityRel)

class Semistructured(Schema):
    entities = RelationshipTo('Entity', 'HAS_ENTITY', model=EntityRel)

class Unstructured(Schema):
    files = RelationshipTo('File', 'HAS_FILE', model=FileRel)

class Ontology(StructuredNode):
    uid = UniqueIdProperty()
    title = StringProperty(max_length=255)
    description = StringProperty()
    author = RelationshipTo('User', 'IS_AUTHOR')
    created_on = DateTimeProperty()
    last_updated_on = DateTimeProperty()
    size_in_bytes = StringProperty()
    mimetype = StringProperty()
    filename = StringProperty()
    number_of_triples = StringProperty()

    def serialize(self, workspace_id=None):
        items={
            "id" : str(self.uid),
            "title": self.title,
            "description": self.description,
            "author": self.author[0].serialize(),
            "createdOn": self.created_on.strftime("%d.%m.%Y"),
            "lastUpdatedOn": self.last_updated_on.strftime("%d.%m.%Y"),
            "filename": self.filename,
            "mimetype": self.mimetype,
            "sizeInBytes": self.size_in_bytes,
            "countTriples": self.number_of_triples,
            "countUsage":len(Traversal(self, self.__label__, dict(node_class=Annotation, direction=INCOMING, relation_type='IS_FROM')).all()),
        }
        if workspace_id!=None:
            settings = Settings()
            items['graphname']=f'<http://{settings.fuseki_storage.host}:{settings.fuseki_storage.port}/' + workspace_id + '/' + str(self.uid) + '>'
            items['canBeDeleted']=items['countUsage']==0
        return items

class LogType(str, Enum):
    CREATE = "CREATE"
    READ = "READ"
    UPDATE = "UPDATE"
    DELETE = "DELETE"

class Change(EmbeddedDocument):
    key = StringField(required=True)
    changed_from = StringField(required=True)
    changed_to = StringField(required=True)

class DeequData(Document):
    dataset_id = StringField()
    version = IntField()
    profiles = DictField()
    validation_result = DictField()
    suggestions = DictField()

class Mapping(Document):
    workspace_id = StringField(max_length=255)
    mappings_file = StringField()
    name = StringField(max_length=255)
    description = StringField()

class Log(EmbeddedDocument):
    type = EnumField(LogType, required=True)
    changes = EmbeddedDocumentListField(Change, default=[])
    version = IntField()
    description = DictField()
    user = StringField()
    created_on = DateTimeField(default=datetime.now())

class Logs(Document):
    dataset = StringField(unique=True)
    logs = EmbeddedDocumentListField(Log, default=[])
    def serialize(self, download=False, language=None):
        logs = []
        if download==True:
            for log in self.logs:
                d = {
                "description": log.description[language],
                "user": User.nodes.filter(email__exact=log.user)[0].serialize(),
                "createdOn": log.created_on.strftime("%d.%m.%Y %H:%M:%S"),
                "type": log.type,
                "version": log.version,
                }
                if len(log.changes)!=0:
                    d["changes"]= [{
                            "key":item.key,
                            "from":item.changed_from,
                            "to":item.changed_to,
                        } for item in log.changes],
                logs.append(d)
            return logs
        count = self.logs.count()-1
        count_max = -1
        if count>10:
            count_max = count-10
        for i in range(count, count_max, -1):
            log = self.logs[i]
            logs.append({
            "description": log.description,
            "user": User.nodes.filter(email__exact=log.user)[0].serialize(),
            "createdOn": log.created_on.strftime("%d.%m.%Y"),
            "type": log.type,
            "version": log.version,
            "changes": [{
                "key":item.key,
                "from":item.changed_from,
                "to":item.changed_to,
            } for item in log.changes],
        })
        return logs

class DatasetRel(StructuredRel):
    is_published = BooleanProperty(default=False)

class CustomLinkRel(StructuredRel):
    description = StringProperty()

class LineageRel(StructuredRel):
    script = StringProperty(default='')
    code = StringProperty(default='')
    is_workflow = BooleanProperty(default=False)
    version = IntegerProperty()

class CustomReadFormats(StructuredNode):
    uid = UniqueIdProperty()
    read_format = StringProperty()
    read_options = JSONProperty()

class Dataset(StructuredNode):
    uid = UniqueIdProperty()
    title = StringProperty(max_length=255)
    description = StringProperty()
    owner = RelationshipTo('User', 'IS_OWNER')
    created_on = DateTimeProperty()
    last_updated_on = DateTimeProperty()
    datasource = StringProperty(max_length=255)
    schema = RelationshipTo('Schema', 'HAS_SCHEMA', model=SchemaRel)
    current_version_of_schema = IntegerProperty(default=0)
    custom_link = RelationshipTo('Dataset', 'HAS_CUSTOM_LINK', model=CustomLinkRel)

    author = StringProperty(max_length=255)
    longitude = StringProperty(max_length=255)
    latitude = StringProperty(max_length=255)
    range_start = DateTimeProperty()
    range_end = DateTimeProperty()
    license = StringProperty()
    language = StringProperty()

    is_public = BooleanProperty(default=True)
    is_indexed = BooleanProperty(default=False)
    users = RelationshipTo('User', 'HAS_ACCESS', model=DatasetuserRel)
    lineage = RelationshipTo('Dataset', 'HAS_LINEAGE', model=LineageRel)
    tags = RelationshipTo('Tag', 'HAS_TAG')
    polymorph = RelationshipTo('Dataset', 'IS_POLYMORPH')
    version = RelationshipTo('Dataset', 'VERSION', model=DatasetVersionRel)
    notebooks = RelationshipTo('Notebook', 'HAS_NOTEBOOK')
    custom_read_formats = RelationshipTo('CustomReadFormats', 'HAS_CUSTOM_READFORMATS')
    is_update_for = BooleanProperty(default=False)

    def serialize(self, email:str=None, custom_link=None, is_search=False, schema_only=None):
        if is_search==True:
            schema = self.schema.match(version=self.current_version_of_schema)[0]
            items = {
            "id": str(self.uid),
            "title": self.title,
            "owner": self.owner[0].serialize(),
            "createdOn": self.created_on.strftime("%d.%m.%Y"),
            "lastUpdatedOn": self.last_updated_on.strftime("%d.%m.%Y"),
            "tags": [item.serialize() for item in self.tags],
            "isPublic": self.is_public,
            "language": self.language,
            "schema": {
                "id" : str(schema.uid),
                "type": schema.type,}
            }
            if custom_link!=None:
                items['customLinkDescription']=custom_link
            if self.is_public == False:
                rel = self.users.relationship(User.nodes.get(email__exact=email))
                if rel:
                    items["permission"]= {
                        "canRead": rel.can_read,
                        "canWrite": rel.can_write,
                        "canDelete": rel.can_delete
                    }
            return items
        if schema_only == False:
            items = {
                "id" : str(self.uid),
                "title": self.title,
                "description": self.description,
                "owner": self.owner[0].serialize(),
                "createdOn": self.created_on.strftime("%d.%m.%Y"),
                "lastUpdatedOn": self.last_updated_on.strftime("%d.%m.%Y"),
                "datasource": datasource_dto(datasource_repo.find_by_id(self.datasource)),
                "tags": [item.serialize() for item in self.tags],
                "isPublic": self.is_public,
                "isIndexed": self.is_indexed,
                "language": self.language,
                "isUpdateFor": self.is_update_for
            }

            if self.is_public == False:
                rel = self.users.relationship(User.nodes.get(email__exact=email))
                if rel:
                    items["permission"]= {
                        "canRead": rel.can_read,
                        "canWrite": rel.can_write,
                        "canDelete": rel.can_delete
                    }
                items["users"]=[item.serialize(dataset=self) for item in self.users]

            if User.nodes.get(email__exact=email).favorites.get_or_none(uid__exact=self.uid):
                items['isFavorite'] = True
            else:
                items['isFavorite'] = False
            
            if len(self.polymorph)!=0:
                items['polymorph']=[{
                    "title": item.title,
                    "id": item.uid
                } for item in self.polymorph]
            else:
                items['polymorph']=[]
            
            lin=[]
            if len(self.lineage)!=0:
                for l in self.lineage:
                    lin.append(l.uid)
                items["lineage"]=lin

            if len(self.schema.match(version=self.current_version_of_schema))!=0:
                items['schema'] = {
                    "type":self.schema.match(version=self.current_version_of_schema)[0].type
                }
            
            items['author'] = self.author
            items['longitude'] = self.longitude
            items['latitude'] = self.latitude
            if self.range_start != None:
                items['rangeStart'] = self.range_start.isoformat() 
            if self.range_end != None:
                items['rangeEnd'] = self.range_end.isoformat() 
            items['license'] = self.license
            return items
        elif schema_only == True:
            items = {
                "id" : str(self.uid),
                "title": self.title,
            }
            if len(self.schema.match(version=self.current_version_of_schema))!=0:
                items['schema'] = self.schema.match(version=self.current_version_of_schema)[0].serialize(version=self.current_version_of_schema)
        else:
            items = {
                "id" : str(self.uid),
                "title": self.title,
                "description": self.description,
                "owner": self.owner[0].serialize(),
                "createdOn": self.created_on.strftime("%d.%m.%Y"),
                "lastUpdatedOn": self.last_updated_on.strftime("%d.%m.%Y"),
                "datasource": datasource_dto(datasource_repo.find_by_id(self.datasource)),
                "tags": [item.serialize() for item in self.tags],
                "isPublic": self.is_public,
                "isIndexed": self.is_indexed,
                "language": self.language,
                "isUpdateFor": self.is_update_for
            }

            if self.is_public == False:
                rel = self.users.relationship(User.nodes.get(email__exact=email))
                if rel:
                    items["permission"]= {
                        "canRead": rel.can_read,
                        "canWrite": rel.can_write,
                        "canDelete": rel.can_delete
                    }
                items["users"]=[item.serialize(dataset=self) for item in self.users]

            if User.nodes.get(email__exact=email).favorites.get_or_none(uid__exact=self.uid):
                items['isFavorite'] = True
            else:
                items['isFavorite'] = False
            
            if len(self.polymorph)!=0:
                items['polymorph']=[{
                    "title": item.title,
                    "id": item.uid
                } for item in self.polymorph]
            else:
                items['polymorph']=[]
            
            lin=[]
            if len(self.lineage)!=0:
                for l in self.lineage:
                    lin.append(l.uid)
                items["lineage"]=lin
            
            if len(self.schema.match(version=self.current_version_of_schema))!=0:
                items['schema'] = self.schema.match(version=self.current_version_of_schema)[0].serialize(version=self.current_version_of_schema)
            items['author'] = self.author
            items['longitude'] = self.longitude
            items['latitude'] = self.latitude
            if self.range_start != None:
                items['rangeStart'] = self.range_start.isoformat() 
            if self.range_end != None:
                items['rangeEnd'] = self.range_end.isoformat() 
            items['license'] = self.license
        return items

class WorkspaceRel(StructuredRel):
    can_read = BooleanProperty(default=True)
    can_write = BooleanProperty(default=True)
    can_delete = BooleanProperty(default=True)

class Workspace(StructuredNode):
    uid = UniqueIdProperty()
    title = StringProperty(max_length=255)
    description = StringProperty()
    owner = RelationshipTo('User', 'IS_OWNER')
    ontologies = RelationshipTo(Ontology, 'HAS_ONTOLOGY')
    datasets = RelationshipTo('Dataset', 'HAS_DATASET', model=DatasetRel)
    created_on = DateTimeProperty()
    last_updated_on = DateTimeProperty()
    is_default = BooleanProperty(default=False)
    tags = RelationshipTo(Tag, 'HAS_TAG')

    def serialize(self, minimal=False, user=None):
        if minimal:
            rel = user.workspaces.relationship(self)
            return {
                "id" : str(self.uid),
                "title": self.title,
                "permission": {
                    "canRead": rel.can_read,
                    "canWrite": rel.can_write,
                    "canDelete": rel.can_delete
                }
            }
        else:
            return {
                "id" : str(self.uid),
                "title": self.title,
                "users": [item.serialize(self) for item in Traversal(self, self.__label__, dict(node_class=User, direction=INCOMING, relation_type='HAS_ACCESS_TO', model=WorkspaceRel)).all()],
                "description": self.description,
                "owner": self.owner[0].serialize(),
                "ontologies": [item.serialize(str(self.uid)) for item in self.ontologies],
                "createdOn": self.created_on.strftime("%d.%m.%Y"),
                "lastUpdatedOn": self.last_updated_on.strftime("%d.%m.%Y"),
                "tags": [item.serialize() for item in self.tags],
                "countDatasets": str(len(self.datasets)),
                "isDefault": self.is_default
            }

class User(StructuredNode):
    email = StringProperty(unique_index=True, max_length=255)
    firstname = StringProperty(max_length=255)
    lastname = StringProperty(max_length=255)
    password_hash = StringProperty()
    is_admin = BooleanProperty(default=False)
    workspaces = RelationshipTo(Workspace, 'HAS_ACCESS_TO', model = WorkspaceRel)
    favorites = RelationshipTo(Dataset, 'IS_FAVORITE')
    username = StringProperty(max_length=255)

    def generate_hash(password):
        return sha256.hash(password)

    def verify_hash(self, password):
        return sha256.verify(password, self.password_hash)

    def serialize(self, workspace=None, dataset=None):
        items = {
            "email": self.email,
            "firstname": self.firstname,
            "lastname": self.lastname,
            "isAdmin": self.is_admin,
            "username": self.username
        }
        if workspace:
            rel = self.workspaces.relationship(workspace)
            if rel:
                items['workspacePermissions']= {
                "canRead": rel.can_read,
                "canWrite": rel.can_write,
                "canDelete": rel.can_delete
                }
                items['countDatasets']=len(Traversal(self, self.__label__, dict(node_class=Dataset, direction=INCOMING, relation_type='IS_OWNER')).all())
        if dataset:
            rel = dataset.users.relationship(self)
            items['datasetPermissions']= {
            "canRead": rel.can_read,
            "canWrite": rel.can_write,
            "canDelete": rel.can_delete
            }
        return items

class TestCase(StructuredNode):
    STATES = {'RUNNING': 'RUNNING', 'FAILED': 'FAILED', 'ENDED': 'ENDED'}
    uid = UniqueIdProperty()
    readable_id = IntegerProperty(max_length=255)
    description = StringProperty()
    started = DateTimeProperty()
    ended = DateTimeProperty()
    status = StringProperty(choices=STATES)
    error = StringProperty()

    def serialize(self):
        items = {
            "id": str(self.readable_id),
            "description": self.description,
            "status": self.status,
            "error": self.error,
        }
        if self.started!=None:
            items["started"]=self.started.strftime("%d.%m.%Y, %H:%M:%S")
        if self.ended!=None:
            items["ended"]=self.ended.strftime("%d.%m.%Y, %H:%M:%S")
        if self.started != None and self.ended != None:
            items["delta"]=(self.ended-self.started).total_seconds()
        return items

class Test(StructuredNode):
    STATES = {'RUNNING': 'RUNNING', 'FAILED': 'FAILED', 'ENDED': 'ENDED'}
    uid = UniqueIdProperty()
    status = StringProperty(choices=STATES)
    started = DateTimeProperty()
    ended = DateTimeProperty()
    test_cases = RelationshipTo(TestCase, 'HAS_TESTCASE')
    started_by = RelationshipTo('User', 'STARTED_BY')
    number_of_test_cases = IntegerProperty()
    error = StringProperty()

    def serialize(self):
        items = {
            "id": self.uid,
            "status": self.status,
            "numberOfTestCases": str(self.number_of_test_cases),
            "error": self.error,
        }
        if len(self.started_by)==1:
            items["startedBy"]=self.started_by[0].serialize()
        if self.started!=None:
            items["started"]=self.started.strftime("%d.%m.%Y, %H:%M:%S")
        if self.ended!=None:
            items["ended"]=self.ended.strftime("%d.%m.%Y, %H:%M:%S")
        if self.started != None and self.ended != None:
            items["delta"]=str(int((self.ended-self.started).total_seconds()))
        if len(self.test_cases)!=0:
            items['testCases']=[item.serialize() for item in self.test_cases.order_by('-readable_id')]
        else:
            items['testCases']=[]
        return items


