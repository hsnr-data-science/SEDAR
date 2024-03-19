from functools import wraps
from werkzeug.exceptions import Unauthorized
from flask_restful import reqparse
from flask_jwt_extended import get_jwt_identity
from flask_restful.inputs import boolean

from commons.models.dataset.models import User, Workspace, Dataset, Notebook

def parse_params(*arguments):
    """
    Decorator to parse the arguments and parameters.
    """
    def parse(func):
        @wraps(func)
        def resource_verb(*args, **kwargs):
            parser = reqparse.RequestParser()
            for argument in arguments:
                parser.add_argument(argument)
            kwargs.update(parser.parse_args())
            return func(*args, **kwargs)
        return resource_verb
    return parse

def check_credentials():
    """
    Decorator to check if the user is a admin.
    """
    def check(func):
        @wraps(func)
        def check_credentials(*args, **kwargs):
            try:
                current_user = User.nodes.get(email__exact=get_jwt_identity()["email"])
            except Exception as ex:
                raise Unauthorized(f"No permission")  
            if current_user.is_admin == False:
                raise Unauthorized(f"No permission")  
            return func(*args, **kwargs)
        return check_credentials
    return check

def check_permissions_workspace(can_read=None, can_write=None, can_delete=None, author_only=False):
    """
    Decorator to check if the user has access to the workspace and also check the permissions if required.
    """
    def check(func):
        @wraps(func)
        def check_permissions_workspace(*args, **kwargs):
            if can_read != None or can_write != None or can_delete != None or author_only != False:
                try:
                    if len(Workspace.nodes.all())>0:
                        if "workspace_id" in kwargs:
                            current_workspace = Workspace.nodes.get(uid__exact=kwargs['workspace_id'])
                            if current_workspace.is_default==True:
                                pass
                            else:
                                current_user = User.nodes.get(email__exact=get_jwt_identity()["email"])
                                if current_workspace.owner[0]==current_user:
                                    pass
                                else:
                                    if author_only == True:
                                        raise Exception()
                                    rel = current_user.workspaces.relationship(current_workspace)
                                    if can_read:
                                        if can_read==rel.can_read:
                                            pass
                                        else:
                                            raise Exception()
                                    if can_write:
                                        if can_write==rel.can_write:
                                            pass
                                        else:
                                            raise Exception()
                                    if can_delete:
                                        if can_delete==rel.can_delete:
                                            pass
                                        else:
                                            raise Exception()
                        elif args[0].endpoint!='workspaces':
                            return
                        else:
                            pass
                except Exception as ex:
                    raise Unauthorized(f"No permission") 
            else:
                try:
                    current_workspace = Workspace.nodes.get(uid__exact=kwargs['workspace_id'])
                    current_user = User.nodes.get(email__exact=get_jwt_identity()["email"])
                    if current_workspace.owner[0]==current_user:
                        pass
                    else:
                        if current_user.workspaces.relationship(current_workspace) == None:
                            raise Exception()
                except Exception as ex:
                    raise Unauthorized(f"No permission") 
            return func(*args, **kwargs)
        return check_permissions_workspace
    return check

def check_permissions_dataset(can_read=None, can_write=None, can_delete=None, author_only=False):
    """
    Decorator to check if the user has access to the dataset and also check the permissions if required.
    """
    def check(func):
        @wraps(func)
        def check_permissions_dataset(*args, **kwargs):
            if can_read != None or can_write != None or can_delete != None or author_only != False:
                try:
                    if "dataset_id" in kwargs:
                        current_dataset = Dataset.nodes.get(uid__exact=kwargs['dataset_id'])
                        if current_dataset.is_public==True:
                            pass
                        else:
                            current_user = User.nodes.get(email__exact=get_jwt_identity()["email"])
                            if current_dataset.owner[0]==current_user:
                                pass
                            else:
                                if author_only == True:
                                    raise Exception()
                                rel = current_dataset.users.relationship(current_user)
                                if can_read:
                                    if can_read==rel.can_read:
                                        pass
                                    else:
                                        raise Exception()
                                if can_write:
                                    if can_write==rel.can_write:
                                        pass
                                    else:
                                        raise Exception()
                                if can_delete:
                                    if can_delete==rel.can_delete:
                                        pass
                                    else:
                                        raise Exception()
                    else:
                        parser = reqparse.RequestParser()
                        parser.add_argument('get_unpublished', type=boolean)
                        if parser.parse_args()['get_unpublished']==True:
                            pass
                        else:
                            raise Exception()
                except Exception as ex:
                    raise Unauthorized(f"No permission")
            else:
                try:
                    current_dataset = Dataset.nodes.get(uid__exact=kwargs['dataset_id'])
                    current_user = User.nodes.get(email__exact=get_jwt_identity()["email"])
                    if current_dataset.is_public==True:
                        pass
                    elif current_dataset.owner[0]==current_user:
                        pass
                    else:
                        if current_dataset.users.relationship(current_user) == None:
                            raise Exception()
                except Exception as ex:
                    raise Unauthorized(f"No permission")
            return func(*args, **kwargs)
        return check_permissions_dataset
    return check

def check_permissions_notebook():
    """
    Decorator to check if the user is the author of the notebook.
    """
    def check(func):
        @wraps(func)
        def check_permissions_notebook(*args, **kwargs):
            try:
                if "notebook_id" in kwargs:
                    current_notebook= Notebook.nodes.get(uid__exact=kwargs['notebook_id'])
                    current_user = User.nodes.get(email__exact=get_jwt_identity()["email"])
                    if current_notebook.author[0]==current_user:
                        pass
                    else:
                        raise Exception()
                else:
                    raise Exception()
            except Exception as ex:
                raise Unauthorized(f"No permission")
            return func(*args, **kwargs)
        return check_permissions_notebook
    return check