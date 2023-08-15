import os
from flask import send_from_directory
from flask_jwt_extended import jwt_required
from services.decorators import check_credentials
from werkzeug.exceptions import InternalServerError

@jwt_required()
@check_credentials()
def error():
    """
    API to get error logs.

    :return: logs as string.
    """
    try:
        return '\n'.join([i for i in open(os.path.dirname(__file__).replace('/logs','').replace('/endpoints', '')+"/error.log", "r").readlines()[-10:]]), 200
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception while getting error logs: \n\t {ex}")

@jwt_required()
@check_credentials()
def error_download():
    """
    API to download the full error logs.

    :return: logs as file.
    """
    try:
        return send_from_directory(directory=os.path.dirname(__file__).replace('/logs','').replace('endpoints', ''), path="error.log", attachment_filename='error.logs', mimetype='text/plain')
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception: \n\t {ex}")

@jwt_required()
@check_credentials()
def access():
    """
    API to get access logs.

    :return: logs as string.
    """
    try:
        return '\n'.join([i for i in open(os.path.dirname(__file__).replace('/logs','').replace('/endpoints', '')+"/access.log", "r").readlines()[-10:]]), 200
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception while getting access logs: \n\t {ex}")

@jwt_required()
@check_credentials()
def access_download():
    """
    API to download the full access logs.

    :return: logs as file.
    """
    try:
        return send_from_directory(directory=os.path.dirname(__file__).replace('/logs','').replace('endpoints', ''), path="access.log", attachment_filename='access.logs', mimetype='text/plain')
    except Exception as ex:
        print(ex)
        raise InternalServerError(f"Exception: \n\t {ex}")