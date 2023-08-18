c = get_config()  # noqa
import os
# log level
c.Application.log_level = 'DEBUG'


# dummy for testing. Don't use this in production!
c.Authenticator.auto_login = True

####### CustomAuthenticator #######
import sys
sys.path.append('/tmp/customauthenticator')
from customauthenticator import CustomJWTAuthenticator
c.JupyterHub.authenticator_class = CustomJWTAuthenticator
c.CustomJWTAuthenticator.secret = os.environ['JWT_SECRETKEY']

####### GitLabOAuthenticator #######
# c.JupyterHub.authenticator_class = 'oauthenticator.gitlab.GitLabOAuthenticator'
# c.GitLabOAuthenticator.oauth_callback_url = os.environ['OAUTH_CALLBACK_URL']    # http://127.0.0.1:8000/hub/oauth_callback
# c.GitLabOAuthenticator.client_id = os.environ['OAUTH_CLIENT_ID'] 
# c.GitLabOAuthenticator.client_secret = os.environ['OAUTH_CLIENT_SECRET']


c.Authenticator.admin_users = {'service-admin', 'shoseini', 'paqui004'}
c.JupyterHub.api_tokens = {
    os.environ['JUPYTER_SECRET_TOKEN'] : "service-admin",
}

# launch with docker
c.JupyterHub.spawner_class = "docker"

# we need the hub to listen on all ips when it is in a container
c.JupyterHub.hub_ip = '0.0.0.0'
# the hostname/ip that should be used to connect to the hub
# this is usually the hub container's name
c.JupyterHub.hub_connect_ip = 'jupyterhub'

c.JupyterHub.tornado_settings = {
    'headers': {
        'Content-Security-Policy': "frame-ancestors 'self' http://127.0.0.1"
  }
}

c.DockerSpawner.image = 'sedar-spawncontainer'

c.DockerSpawner.network_name = 'sedar_datalake'

# delete containers when the stop
c.DockerSpawner.remove = True

notebook_dir = os.environ['DOCKER_NOTEBOOK_DIR']
c.DockerSpawner.notebook_dir = notebook_dir
c.DockerSpawner.volumes = { 'jupyterhub-user-{username}': notebook_dir }
c.Spawner.mem_limit = '2G'