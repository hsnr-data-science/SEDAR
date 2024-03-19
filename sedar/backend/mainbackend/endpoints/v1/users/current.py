from flask import jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import InternalServerError
from services.decorators import parse_params
from database.data_access import user_data_access


class Current(Resource):
    """
    Class to manage the informations of the current user.
    """

    @jwt_required()
    @parse_params()
    def get(self, email:str):
        """
        API get request for getting the data of the current user.

        :param email: email of current user.
        :returns: current user object.
        """
        try:
            if get_jwt_identity()["email"] == email:
                user = user_data_access.get(email)
                return user.serialize()
            return "User does not exist", 500
        except Exception as ex:
            print(ex)
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @parse_params(
        Argument("new_email", required=True, type=str),
        Argument("firstname", required=True, type=str),
        Argument("lastname", required=True, type=str),
        Argument("old_password", required=False, type=str, default=""),
        Argument("new_password", required=False, type=str, default=""),
        Argument("username", required=True, type=str),
    )
    def put(self, email:str, new_email:str, firstname:str, lastname:str, old_password:str, new_password:str, username:str):
        """
        API put request for users. Changes a existing user.

        :param email: old email of user.
        :param new_email: new email of user.
        :param firstname: firstname of user.
        :param lastname: lastname of user.
        :param old_password: the current password. 
        :param new_password: the new password.
        :returns: updated user object.
        """
        try:
            if get_jwt_identity()["email"] == email:
                return user_data_access.update(email, new_email, firstname, lastname, old_password=old_password, new_password=new_password, username=username).serialize()
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

