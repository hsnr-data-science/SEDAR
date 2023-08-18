import io
from flask import send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params, check_permissions_workspace, check_permissions_dataset
from database.data_access import dataset_files_data_access, dataset_logs_data_access

class Files(Resource):
    """
    Class to manage the files of the schema in a dataset.
    """

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_read=True)
    def get(self, workspace_id:str, dataset_id:str, file_id:str):
        """
        API get request to download the file.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param file_id: id of the fileproperty.
        :returns: file for download.
        """
        try:
            file = dataset_files_data_access.get_file(dataset_id, file_id)
            f = file['file']
            name = file['filename']
            return send_file(io.BytesIO(f), attachment_filename=name)
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("description", default=None, type=str, required=False),
        Argument("annotation", default=None, type=str, required=False),
        Argument("ontology_id", default=None, type=str, required=False),
    )
    def put(self, workspace_id:str, dataset_id:str, file_id:str, description:str, annotation:str, ontology_id:str):
        """
        API put request for editing the file of a schema.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param file_id: id of the fileproperty.
        :param description: short description to describe the entity.
        :returns: created or existing fileproperty.
        """
        try:
            file_old = dataset_files_data_access.get(file_id)
            file = dataset_files_data_access.update(file_id, description, dataset_id)
            try:
                user = get_jwt_identity()['email']
                dataset_logs_data_access.create(dataset_id, {"en":f"The file {file.filename} ({file.uid}) was updated.", "de":"Die Datei {file.name} ({file.uid}) wurde verändert."}, "UPDATE", user, dataset_logs_data_access.get_diffs(file_old.__properties__, file.__properties__, ['description']))
            except:
                pass
            return file.serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_permissions_workspace()
    @check_permissions_dataset(can_write=True)
    @parse_params(
        Argument("annotation_id", default=None, type=str, required=False),
        Argument("description", default=None, type=str, required=False),
        Argument("annotation", default=None, type=str, required=False),
        Argument("ontology_id", default=None, type=str, required=False),
        Argument("key", default=None, type=str, required=False),
    )
    def patch(self, workspace_id:str, dataset_id:str, file_id:str, annotation_id:str, description:str, annotation:str, ontology_id:str, key:str):
        """
        API patch request for adding or deleting a annotation from the given fileproperty.

        :param workspace_id: id of the workspace.
        :param dataset_id: id of the dataset.
        :param file_id: id of the entity.
        :param description: short description to describe the entity.
        :param annotation: annotation string.
        :param ontology_id: id of the coressponding ontology.
        :param key: key for the annotation.
        :returns: created or existing tag.
        """
        try:
            user = get_jwt_identity()['email']
            file = dataset_files_data_access.patch(file_id, annotation_id, description, annotation, ontology_id, dataset_id, key)
            if file != None:
                try:
                    f = dataset_files_data_access.get(file_id)
                    if key!='' and key!=None:
                        d = {"en":f"The file {f.filename} ({f.uid}) was annotated with a custom annotation: {key}: {annotation}.", "de":f"Die Datei {f.filename} ({f.uid}) wurde annotiert mit einer benutzerdefinierten Annotation: {key}: {annotation}."}
                    else:
                        d = {"en":f"The file {f.filename} ({f.uid}) was annotated with: {annotation}.", "de":f"Die Datei {f.filename} ({f.uid}) wurde annotiert mit: {annotation}."}
                    dataset_logs_data_access.create(dataset_id, d, "CREATE", user)
                except:
                    pass
                return file.serialize(), 201
            else:
                try:
                    f = dataset_files_data_access.get(file_id)
                    if key!='' and key!=None:
                        d = {"en":f"The custom annotation with the id {annotation_id} was removed from the file {f.filename} ({f.uid}).", "de":f"Die benutzerdefinierte Annotation mit der ID {annotation_id} wurde von der Datei {f.filename} ({f.uid}) entfernt."}
                    else:
                        d = {"en":f"The annotation with the id {annotation_id} was removed from the file {f.filename} ({f.uid}).", "de":f"Die Annotation mit der ID {annotation_id} wurde von der Datei {f.filename} ({f.uid}) entfernt."}
                    dataset_logs_data_access.create(dataset_id, d, "DELETE", user)
                except:
                    pass
                return file, 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")