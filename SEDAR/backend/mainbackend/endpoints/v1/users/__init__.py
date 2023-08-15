from flask import jsonify
from flask_jwt_extended import jwt_required
from flask_jwt_extended.utils import get_jwt_identity
from flask_restful import Resource
from flask_restful.reqparse import Argument
from flask_restful.inputs import boolean
from services.decorators import check_credentials, parse_params
from database.data_access import user_data_access
from werkzeug.exceptions import InternalServerError

class Users(Resource):
    """
    Class to manage users.
    """

    @jwt_required()
    @check_credentials()
    @parse_params()
    def get(self, email:str="admin"):
        """
        API get request for users.
        
        :param email: email of the user.
        :returns: list of users.
        """
        try:
            if email:
                return user_data_access.get(email).serialize()
            else:
                return jsonify([item.serialize() for item in user_data_access.get_all(get_jwt_identity()["email"])])
        except Exception as ex:
            print(ex)
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_credentials()
    @parse_params(
        Argument("new_email", required=True, type=str),
        Argument("firstname", required=True, type=str),
        Argument("lastname", required=True, type=str),
        Argument("username", required=True, type=str),
        Argument("is_admin", required=False, type=bool),
    )
    def put(self, email:str, new_email:str, firstname:str, lastname:str, username:str, is_admin:bool):
        """
        API put request for users. Changes a existing user.

        :param email: old email of user.
        :param new_email: new email of user.
        :param firstname: firstname of user.
        :param lastname: lastname of user.
        :param username: username of user.
        :param is_admin: defines if the user is admin or not.
        :returns: updated user object.
        """
        try:
            return user_data_access.update(email, new_email, firstname, lastname, username, is_admin=is_admin).serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_credentials()
    @parse_params(
        Argument("email", required=True, type=str),
        Argument("password", required=True, type=str),
        Argument("firstname", required=True, type=str),
        Argument("lastname", required=True, type=str),
        Argument("username", required=True, type=str),
        Argument("is_admin", required=True, type=bool),
    )
    def post(self, email:str, password:str, firstname:str, lastname:str, username:str, is_admin:bool):
        """
        API post request for users. Adds a new user.

        :param email: email of user.
        :param password: password for user.
        :param firstname: firstname of user.
        :param lastname: lastname of user.
        :param is_admin: defines if the user is admin or not.
        :returns: newly postet user. 
        """
        try:
            return user_data_access.add(email, firstname, lastname, password, username, is_admin).serialize(), 201
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_credentials()
    def delete(self, email:str):
        """
        API delete request for users. Deletes a existing user.

        :param email:
        :return:
        """
        try:
            user_data_access.delete(email)
            return f"deleted user {email}", 204
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
