from flask_jwt_extended import jwt_required
from services.decorators import check_permissions_workspace, check_permissions_dataset
from flask_restful import Resource
from database.data_access import dataset_data_access
from werkzeug.exceptions import InternalServerError

class Lineage(Resource):
    """
    Class to get the Lineage.
    """
    def lineage(self, dataset, version)->str:
        lineage=dataset.lineage
        if len(lineage)!=0:
            rel = dataset.lineage.relationship(lineage[0].nodes.get(uid__exact=lineage[0].uid))
            children=[]
            code = {
                "name": f"{dataset.title} (Version {version})",
                "attributes": {
                    "name": f"{dataset.title} (Version {version})",
                    "script":f"{rel.script}",
                    "code":f"{rel.code}",
                    "isWorkflow":rel.is_workflow,
                    "version":f"{version}",
                    "id": f"{dataset.uid}"
                },
                "children": children
            }
            for d in lineage:
                rel = dataset.lineage.relationship(d)
                children.append(self.lineage(d, rel.version))
            return code
        else:
            return {
                "name": f"{dataset.title} (Version {version})",
                "attributes": {
                    "name": f"{dataset.title} (Version {version})",
                    "id": f"{dataset.uid}",
                    "version": f"{version}",
                },
                "children": []
            }

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_read=True)
    def get(self, workspace_id, dataset_id):
        """
        API get request to get the lineage of an dataset.

        :returns: lineage as json as needed for react tree.
        """  
        try:
            dataset = dataset_data_access.get(dataset_id)
            lineage = dataset.lineage
            if len(lineage)!=0:
                rel = dataset.lineage.relationship(lineage[0].nodes.get(uid__exact=lineage[0].uid))
                children=[]
                code = {
                    "name": f"{dataset.title}",
                    "attributes": {
                        "name": f"{dataset.title}",
                        "script":f"{rel.script}",
                        "code":f"{rel.code}",
                        "isWorkflow":rel.is_workflow,
                        "id": f"{dataset.uid}"
                    },
                    "children": children
                }
                for d in lineage:
                    rel = dataset.lineage.relationship(d)
                    children.append(self.lineage(d, rel.version))
            else:
                code = {
                    "name": f"{dataset.title}",
                    "attributes": {
                        "name": f"{dataset.title}",
                        "id": f"{dataset.uid}"
                    },
                    "children": []
                }
            return code
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
