from flask import Flask, jsonify
import os
import sys
import inspect

currentdir = os.path.dirname(os.path.abspath(inspect.getfile(inspect.currentframe())))
sys.path.insert(0, os.path.dirname(os.path.dirname(currentdir))) 

from commons.configuration.settings import Settings

def create_app():
    server = Flask(__name__)

    @server.route('/alive', methods=['GET'])
    def serve_frontend():
        return jsonify({"alive":True})

    return server

#------------------------------------
if __name__ == "__main__":
#------------------------------------
    server = create_app()
    settings = Settings()
    server.run(debug=False, host="0.0.0.0", port=settings.schema_service_alive.port)