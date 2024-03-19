import os
from flask import jsonify
from flask_jwt_extended import jwt_required
from flask_restful import Resource
from flask_restful.reqparse import Argument
from services.decorators import parse_params, check_credentials
from werkzeug.exceptions import InternalServerError

class Wiki(Resource):
    """
    Class to manage the notebook wiki.
    """

    @jwt_required()
    def get(self, language):
        """
        API get request for workspaces.

        :param language: language.
        :returns: markdown associated to the wiki.
        """   
        try:
            path = f'./endpoints/v1/wiki/wiki_{language}.md'
            if not os.path.exists(path):
                open(path, "w+").close()
                with open('./endpoints/v1/wiki/default.md', 'r') as file:
                    data = file.read()
                with open(path, 'r+') as file:
                    file.seek(0)
                    file.write(data)
                    file.truncate()
            with open(path, 'r') as file:
                data = file.read()
            return jsonify({'markdown':data})
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")

    @jwt_required()
    @check_credentials()
    @parse_params(
        Argument("markdown", default=None, type=str, required=True),
    )
    def put(self, language:str, markdown:str):
        """
        API put request for updating the markdown.

        :param language: language.
        :param markdown: the markdown.
        :returns: 200 or internal error.
        """
        try:
            path = f'./endpoints/v1/wiki/wiki_{language}.md'
            with open(path, 'r+') as file:
                file.seek(0)
                file.write(markdown)
                file.truncate()
            return '', 200
        except Exception as ex:
            raise InternalServerError(f"Exception: \n\t {ex}")
    
    
