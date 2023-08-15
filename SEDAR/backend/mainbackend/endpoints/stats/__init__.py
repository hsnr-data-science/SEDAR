from flask_jwt_extended import jwt_required
from commons.models.dataset.models import User, Workspace, Ontology, Dataset
from services.decorators import check_credentials
from werkzeug.exceptions import InternalServerError
from commons.configuration.settings import Settings

@jwt_required()
@check_credentials()
def stats():
    """
    API to get all basic stats for the dashboard.

    :return: json with all required informations.
    """
    try:
        stats = {
            "labels":{"de":['Datensätze', 'Benutzer', 'Arbeitsbereiche', 'Ontologien'], "en":['Datasets', 'Users', 'Workspaces', 'Ontologies']},
            "values":[
                len(Dataset.nodes.all()), len(User.nodes.all()), len(Workspace.nodes.all()), len(Ontology.nodes.all())
            ]
        }
        return stats, 200
    except Exception as ex:
        raise InternalServerError(f"Exception while checking components: \n\t {ex}")

