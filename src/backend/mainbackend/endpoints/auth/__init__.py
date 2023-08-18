from flask import jsonify
from flask_jwt_extended import (
    unset_jwt_cookies, get_jwt_identity, create_access_token, create_refresh_token, set_access_cookies, set_refresh_cookies
)
from flask_restful import Resource
from flask_restful.reqparse import Argument
from werkzeug.exceptions import Unauthorized, InternalServerError

from services.decorators import parse_params
from database.data_access import user_data_access

import requests
import os
import ssl
import certifi
from urllib.request import urlopen
import json
from requests.structures import CaseInsensitiveDict
import random
import string

def generate_random_string(length):
    # choose from all lowercase letter
    letters = string.ascii_lowercase
    result_str = ''.join(random.choice(letters) for i in range(length))
    return result_str

@parse_params(
    Argument("code", required=True, type=str),
    Argument("state", required=True, type=str),
)
def gitlablogin(code: str, state: str):
    """
        Get Access-Token from GitLab and retrieve user info

        :param code authorization code
        :param state status-state
        :returns: userinfo
    """
    url = os.environ['AUTHENTICATION_TOKEN_URL']
    params = {'client_id':os.environ['REACT_APP_CLIENT_ID'], 
              'code': code, 
              'grant_type':'authorization_code', 
              'redirect_uri':os.environ['REACT_APP_AUTHENTICATION_REDIRECT_URI'],
              'code_verifier':os.environ['REACT_APP_AUTHENTICATION_VERIFIER']
              }
    x = requests.post(url, json=params, verify=False,headers={"Accept":"application/json"})
    res = json.loads(x.text)
    try:
        access_token = res["access_token"]
    except:
        print(res)
        raise KeyError
    
    url2 = os.environ['AUTHENTICATION_USER_API']
    head = CaseInsensitiveDict()
    head["Accept"] = "application/json"
    head["Authorization"] = "Bearer "+str(access_token)
    
    y = requests.get(url2, verify=False,headers=head)
    
    userinfo = json.loads(y.text)

    email = userinfo["email"]
    firstname = userinfo["name"].split(" ")[0]
    lastname = userinfo["name"].split(" ")[-1]
    is_admin = userinfo["is_admin"]
    username = userinfo["username"]
    
    userflag = user_data_access.check(email)
    
    if not userflag:
        user_data_access.add(email, firstname, lastname, generate_random_string(8), is_admin, username)
    

    return userinfo

@parse_params(
    Argument("email", required=True, type=str),
    Argument("password", required=True, type=str),
)
def login(email: str, password: str):
    """
    API for the login.

    :param email: valid emailaddress of user.
    :param password: cleartext password from user.
    :return: response with access token and refresh token.
    """

    user = user_data_access.get(email)
    if password != '':
        if not user.verify_hash(password):
            raise Unauthorized("Wrong email or password!")
    user_serialized = user.serialize()
    access_token = create_access_token(identity=user_serialized)
    refresh_token = create_refresh_token(identity=user_serialized)

    response = jsonify({
        "user": user_serialized
    })

    set_access_cookies(response, access_token)
    set_refresh_cookies(response, refresh_token)

    return response

def logout():
    """
    API for the logout.

    :return: response with request for the browser to unset the cookie.
    """
    try:
        response = jsonify({
            "logged out": True
        })
        unset_jwt_cookies(response)
        return response
    except Exception as ex:
        raise InternalServerError(f"Exception while logging out: \n\t {ex}")
