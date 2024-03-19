from tornado.escape import url_escape
from tornado.httpclient import HTTPRequest
from tornado.httputil import url_concat

from jupyterhub.handlers import BaseHandler
from jupyterhub.auth import Authenticator
from jupyterhub.utils import url_path_join
from tornado import gen, web
from traitlets import Unicode, Bool

import jwt

class CustomJWTLoginHandler(BaseHandler):


    def get(self):
        secret = self.authenticator.secret
      
        auth_cookie_content = self.get_cookie("access_token_cookie", "")
        
        token = auth_cookie_content

        msg = "No Cookie, try accessing through SEDAR"
        if not token:
            raise web.HTTPError(status_code=400, log_message=msg)
               
        claims = ""
        if secret:

           claims = jwt.decode(token, secret, algorithms=["HS256"])
        else:
           raise web.HTTPError(401)
        
        username = claims["sub"]["username"]
        is_admin = claims["sub"]["isAdmin"]

        return username
            

class CustomJWTAuthenticator(Authenticator):
    
    secret = Unicode(
        config=True,
        help="""Secret""")

    def authenticate(self,handler, *args):
        secret = self.secret
      
        auth_cookie_content = handler.get_cookie("access_token_cookie", "")
        
        token = auth_cookie_content

        msg = "No Cookie, try accessing through SEDAR"
        if not token:
            raise web.HTTPError(status_code=400, log_message=msg)
       
        claims = ""
        if secret:
           claims = jwt.decode(token, secret, algorithms=["HS256"])
        else:
           raise web.HTTPError(401)

        username = claims["sub"]["username"]
        is_admin = claims["sub"]["isAdmin"]

        return username
