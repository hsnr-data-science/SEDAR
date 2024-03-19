import os
import sys
import inspect
currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
sys.path.insert(0, os.path.dirname(currentdir)) 
from flask_cors import CORS
from flask_mongoengine import MongoEngine
from flask import Flask, send_from_directory
from flask_jwt_extended import JWTManager


from routing import ROOT_BLUEPRINT
from database import configure
import commons.configuration.settings as settings
"""
This is the root file of the program. We used PyDocs for documentation of the backend. 
To generate HTML documentation for this module issue the command: pydoc -p <port>.
Be aware that pydoc needs the modules installed in the system itself and not in a virtual environment.
"""



def create_app():
    server = Flask(__name__, static_folder='static', static_url_path='')
    CORS(server, supports_credentials=True)

    settings.load(server)

    MongoEngine(server)
    JWTManager(server)

    server.register_blueprint(ROOT_BLUEPRINT)

    configure.initialize()

    #function to serve frontend if needed
    @server.route('/', methods=['GET'])
    def serve_frontend():
        return send_from_directory('./static', "index.html")

    return server

#------------------------------------
if __name__ == "__main__":
#------------------------------------
    server = create_app()
    
    settings = settings.Settings()
    server.run(debug=True, host="0.0.0.0", port=settings.server.port)