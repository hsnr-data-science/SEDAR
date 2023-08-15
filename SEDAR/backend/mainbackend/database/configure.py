import os
from neomodel.util import Database
from werkzeug.exceptions import NotFound
from commons.configuration.settings import Settings
from database.data_access import user_data_access
from commons.models.dataset.models import User, Logs
from commons.models.datasource.definition import DatasourceDefinition
import distutils
from distutils.util import strtobool

class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKCYAN = '\033[96m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'

def initialize():
    db = Database()
    if bool(distutils.util.strtobool(os.environ.get("FORCE_DB_SEED", "False"))) == True and os.environ.get("SERVER_WORKER_NUMBER") == '1':
        drop_databases(db)
        print("DB_SEED TRUE, DATABASE dropped")

    # ===== create user if not exists ==============================================================
    try:
        user_data_access.get("admin")
        print(f"{bcolors.WARNING}db already exists{bcolors.ENDC}")
    except NotFound:
        db.cypher_query('CALL db.index.fulltext.createNodeIndex("fulltext_dataset", ["Dataset"], ["title", "description", "latitude", "longitude", "language", "author", "uid"])')
        db.cypher_query('CALL db.index.fulltext.createNodeIndex("fulltext_schema_semi_and_structured", ["Attribute"], ["name", "data_type", "description"])')
        db.cypher_query('CALL db.index.fulltext.createNodeIndex("fulltext_schema_unstructured", ["File"], ["filename", "description"])')
        db.cypher_query('CALL db.index.fulltext.createNodeIndex("fulltext_notebooks", ["Notebook"], ["title", "description"])')
        for u in (
            ("Admin", "Admin", "admin", os.environ.get("SEDAR_ADMIN_PW"), True, "admin"),
            ("User", "User", "user", os.environ.get("SEDAR_USER_PW"), False, "user"),
            # ("Sayed", "Hoseini", "sayed", "sayed", True, "shoseini"),
            # ("Christoph", "Quix", "christoph", "christoph", True, "cquix"),
        ):
            user = User(
                firstname=u[0],
                lastname=u[1],
                email=u[2],
                password_hash=User.generate_hash(u[3]),
                is_admin=u[4],
                username=u[5]
            )
            user.save()
        print(f"{bcolors.OKGREEN}created db successfully{bcolors.ENDC}")

def drop_databases(db):
    db.cypher_query('CALL apoc.schema.assert({}, {})')
    db.cypher_query('MATCH (n) DETACH DELETE n')
    try:
        for log in Logs.objects():
            log.delete()
    except Exception as ex:
        pass
    try:
        for dsd in DatasourceDefinition.objects():
            dsd.delete()
    except Exception as ex:
        pass
    
    

