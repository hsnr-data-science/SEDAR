import json
import os
from time import sleep

from numpy import False_

from database.data_access import user_data_access, workspace_data_access, ontology_data_access
from commons.models.dataset.models import Test, TestCase
from flask_jwt_extended import create_access_token
from datetime import datetime
from commons.configuration.settings import Settings
import requests
from neomodel import db

class TestService():
    #general
    test = None
    current_test_case = None
    test_cases = []
    settings = None
    data_holder = {}
    delete_results = True

    #api
    access_token=None
    api_version=None

    def __init__(self, test:Test, email:str):
        #general
        self.test = test
        self.test.status='RUNNING'
        self.test.error = ''
        self.test.ended=None
        self.test.started=datetime.now()
        self.test.save()
        for u in self.test.started_by:
            self.test.started_by.disconnect(u)
        self.test.started_by.connect(user_data_access.get(email))
        self.settings = Settings()
        self.data_holder = {}
        self.abort_counter=200

        #api
        self.access_token=create_access_token(identity={'email':email})
        self.api_version=os.getenv('MAIN_BACKEND_API_VERSION')

        self.test_cases=[]
        self.test_cases.append({
            'id':'',
            'description':'Testing to add a user to the system.',
            'function': (self.add_user, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to login and logout with the newly added user.',
            'function': (self.user_login_and_logout, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add the user again, this should not work.',
            'function': (self.add_user_again, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit the user.',
            'function': (self.edit_user, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add a workspace to the system.',
            'function': (self.add_workspace, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit the workspace.',
            'function': (self.edit_workspace, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add a user to the workspace.',
            'function': (self.add_user_to_workspace, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit permission for a user in the workspace.',
            'function': (self.edit_permission_from_user_in_workspace, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add a new ontology.',
            'function': (self.add_ontology, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit the ontology.',
            'function': (self.edit_ontology, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to search for a keyword on the ontology.',
            'function': (self.keyword_search_on_ontology, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to query the ontology.',
            'function': (self.query_ontology, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run a construct query on the ontology.',
            'function': (self.construct_query_on_ontology, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to ingest a file.',
            'function': (self.ingest_file, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to ingest multiple files.',
            'function': (self.ingest_files, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to ingest a csv with write_type:default.',
            'function': (self.ingest_csv, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to ingest a json with write_type:delta.',
            'function': (self.ingest_json, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to ingest the neo4j data with write_type:delta.',
            'function': (self.ingest_neo4j, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to ingest a json file to mongodb with write_type:custom.',
            'function': (self.ingest_custom, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to create a dataset and update it.',
            'function': (self.create_and_update_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add tags to a dataset. Also checking if tags are linked correctly.',
            'function': (self.add_tags_to_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to publish a dataset. Also index source data.',
            'function': (self.publish_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to search the dataset via title.',
            'function': (self.search_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to search the dataset via schema.',
            'function': (self.search_dataset_schema, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to search the dataset via data source.',
            'function': (self.search_dataset_source, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to do a semantic search.',
            'function': (self.sematic_search_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove the dataset form the es index.',
            'function': (self.remove_dataset_from_es_index, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to readd the dataset to the es index.',
            'function': (self.readd_dataset_to_es_index, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add jupyter notebook.',
            'function': (self.add_jupyter_notebook, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit jupyter notebook.',
            'function': (self.edit_jupyter_notebook, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to search a jupyter notebook.',
            'function': (self.search_jupyter_notebook, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to delete jupyter notebook.',
            'function': (self.remove_jupyter_notebook, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to get the wiki.',
            'function': (self.get_wiki, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to change the status of the dataset.',
            'function': (self.change_status_of_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add a user to a user to the dataset.',
            'function': (self.add_user_to_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit the permission of a user that has access to the dataset.',
            'function': (self.edit_permission__of_user_from_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove a user from the dataset.',
            'function': (self.remove_user_from_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit a attribute.',
            'function': (self.edit_attribute, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add semantic annotation to a attribute.',
            'function': (self.annotation_attribute, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove semantic annotation from a attribute.',
            'function': (self.remove_annotation_attribute, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit a entity.',
            'function': (self.edit_entity, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add semantic annotations to a entity.',
            'function': (self.annotation_entity, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove a semantic annotations from a entity.',
            'function': (self.remove_annotation_entity, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add custom semantic annotations to a entity.',
            'function': (self.custom_annotation_entity, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove a custom semantic annotations from a entity.',
            'function': (self.remove_custom_annotation_entity, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to create and publish a unstructured dataset for testing to annotate a file.',
            'function': (self.create_and_publish_unstructured_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to edit a file.',
            'function': (self.edit_file, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add semantic annotations to a file.',
            'function': (self.annotation_file, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove a semantic annotations from a file.',
            'function': (self.remove_annotation_file, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to add custom semantic annotations to a file.',
            'function': (self.custom_annotation_file, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove a custom semantic annotations from a file.',
            'function': (self.remove_custom_annotation_file, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to update the source data of a dataset.',
            'function': (self.update_source_data_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to get the diff between two version of a dataset.',
            'function': (self.get_diffs, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to set a continuation timer.',
            'function': (self.set_continuation_timer, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to unset the continuation timer.',
            'function': (self.unset_continuation_timer, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run the profiling.',
            'function': (self.get_profiling, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run a workflow.',
            'function': (self.run_workflow, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run a workflow and check automatically detected polymorphy.',
            'function': (self.run_workflow_auto_poly, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run a workflow and check the own set polymorphy.',
            'function': (self.run_workflow_custom_poly, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run a workflow and check automatically detected and set fk.',
            'function': (self.run_workflow_auto_fk, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run a workflow and check the own set fk.',
            'function': (self.run_workflow_custom_fk, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to run a query.',
            'function': (self.run_query, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to save a query result as new datase.',
            'function': (self.run_query_and_save, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Check newly generated dataset for polymorphy and lineage.',
            'function': (self.polymorphy_and_lineage, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to ingest a file with lineage informations.',
            'function': (self.ingest_file_with_lineage, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Mark dataset as favorite.',
            'function': (self.mark_dataset_as_favorite, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Get the logs of a dataset.',
            'function': (self.get_logs_of_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Add recommendation.',
            'function': (self.add_recommendation, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Edit recommendation.',
            'function': (self.edit_recommendation, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Remove recommendation.',
            'function': (self.remove_recommendation, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Check all dashboard functions.',
            'function': (self.check_dashboard, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Mark dataset as favorite.',
            'function': (self.unmark_dataset_as_favorite, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Schema and metadata test aswell as profiling for the spotify dataset (data.csv) -> https://www.kaggle.com/datasets/bricevergnou/spotify-recommendation.',
            'function': (self.spotify_csv_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Schema and metadata test aswell as profiling for the spotify dataset (good.json) -> https://www.kaggle.com/datasets/bricevergnou/spotify-recommendation.',
            'function': (self.spotify_good_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Schema and metadata test aswell as profiling for the spotify dataset (dislike.json) -> https://www.kaggle.com/datasets/bricevergnou/spotify-recommendation.',
            'function': (self.spotify_dislike_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Schema and metadata test for different papers that was used in the master thesis.',
            'function': (self.used_papers_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Schema and metadata test aswell as profiling for the woogles.io json dataset -> https://www.kaggle.com/datasets/mrisdal/raw-wooglesio-games?select=woogles.json.',
            'function': (self.woogles_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Schema and metadata test aswell as profiling for the steam csv dataset -> https://www.kaggle.com/datasets/nikdavis/steam-store-games.',
            'function': (self.steam_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Schema and metadata test for the sedar paper and the sedar video.',
            'function': (self.sedar_dataset, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove the published datasets.',
            'function': (self.remove_published_datasets, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove the unpublished datasets.',
            'function': (self.remove_unpublished_datasets, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove the user form the workspace.',
            'function': (self.removing_user_from_workspace, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove the workspace.',
            'function': (self.remove_workspace, None)
        })
        self.test_cases.append({
            'id':'',
            'description':'Testing to remove the user.',
            'function': (self.remove_user, None)
        })
        self.test.number_of_test_cases=len(self.test_cases)
        self.test.save()

    def create_test_case(self, id:int, description:str):
        self.current_test_case = None
        self.current_test_case = TestCase(readable_id=id, description=description, started=datetime.now(), status="RUNNING");
        self.current_test_case.save()
        self.test.test_cases.connect(self.current_test_case)

    def update_test_case(self, failed:bool, error:str):
        self.current_test_case.ended = datetime.now()
        if failed==True:
            self.current_test_case.status = 'FAILED'
            self.current_test_case.error = error
        else:
            self.current_test_case.status = 'ENDED'
        self.current_test_case.save()
        self.test.save()

    def clean(self):
        print('cleaning')
        try:
            self.removing_user_from_workspace(None)
        except:
            pass
        try:
            self.remove_workspace(None)
        except:
            pass

    def start(self):
        try:
            for i, tc in enumerate(self.test_cases):
                try:
                    if tc['id']!='':
                        id = int(tc['id'])
                    else:
                        id = i+1
                    self.create_test_case(id, tc['description'])
                    tc['function'][0](*tc['function'][1:])
                    self.update_test_case(False, None)
                except Exception as ex:
                    #Failed to read from defunct connection IPv4Address comes from self.publish_dataset and can be ignored
                    if "Failed to read from defunct connection" not in str(ex):
                        self.update_test_case(True, str(ex))
                    else:
                        self.update_test_case(False, None)
            self.test.status='ENDED'
        except Exception as ex:
            print(str(ex))
            self.test.error = str(ex)
            self.test.status='FAILED'
        finally:
            self.test.ended=datetime.now()
            self.test.save();
            self.clean();
    
    def delete(self, path, cookies=None):
        if cookies == None:
            cookies = {"access_token_cookie":self.access_token}
        resp = requests.delete(
            f"http://{self.settings.server.host}:{self.settings.server.port}{path}",
            cookies=cookies
        )
        return resp

    def get(self, path, cookies=None, timeout=60, preparams=None):
        if cookies == None:
            cookies = {"access_token_cookie":self.access_token}
        if preparams==None:
            preparams = f"http://{self.settings.server.host}:{self.settings.server.port}"
        resp = requests.get(
            preparams+f"{path}",
            cookies=cookies,
            timeout=timeout
        )
        return resp
    
    def put(self, path, data={}, json={}, cookies=None, timeout=60, files=None):
        if cookies == None:
            cookies = {"access_token_cookie":self.access_token}
        resp = requests.put(
            f"http://{self.settings.server.host}:{self.settings.server.port}{path}",
            data=data,
            json=json,
            files=files,
            cookies=cookies,
            timeout=timeout
        )
        return resp
    
    def patch(self, path, data={}, json={}, cookies=None, timeout=60):
        if cookies == None:
            cookies = {"access_token_cookie":self.access_token}
        resp = requests.patch(
            f"http://{self.settings.server.host}:{self.settings.server.port}{path}",
            data=data,
            json=json,
            cookies=cookies,
            timeout=timeout
        )
        return resp
    
    def post(self, path, data={}, json={}, files=None, cookies=None, timeout=60):
        resp = None
        if cookies == None:
            cookies = {"access_token_cookie":self.access_token}
        if files != None:
            resp = requests.post(
                f"http://{self.settings.server.host}:{self.settings.server.port}{path}",
                json=json,
                data=data,
                files=files,
                cookies=cookies,
                timeout=timeout
            )
        else:
            resp = requests.post(
                f"http://{self.settings.server.host}:{self.settings.server.port}{path}",
                json=json,
                data=data,
                cookies=cookies,
                timeout=timeout
            )
        return resp

    def add_user(self, params):
        self.data_holder['user']={'email': 'tester@test.com',
            'firstname': 'tester',
            'lastname': 'test',
            'password': '1234',
            'is_admin': False}
        resp = self.post(path=f"/api/v{self.api_version}/users/", json=self.data_holder['user'])
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = self.data_holder['user'].copy()
        del d['password']
        d["isAdmin"]=d['is_admin']
        del d['is_admin']
        if d==j:
            print("okay")
        else:
            raise Exception("result data is not the same as input")
    
    def add_user_again(self, params):
        resp = self.post(path=f"/api/v{self.api_version}/users/", json=self.data_holder['user'])
        if not resp.ok:
            print("okay")
        else:
            raise Exception("user was added again, this is uncorrect")

    def user_login_and_logout(self, params):
        with requests.Session() as s:
            path = "/api/auth/login"
            resp = s.post(f"http://{self.settings.server.host}:{self.settings.server.port}{path}", json={'email':self.data_holder['user']['email'], 'password':self.data_holder['user']['password']})
            if not resp.ok:
                raise Exception(resp.text)
            path= f"/api/v{self.api_version}/users/current/{self.data_holder['user']['email']}"
            resp = s.get(f"http://{self.settings.server.host}:{self.settings.server.port}{path}")
            if not resp.ok:
                raise Exception(resp.text)
            path=f"/api/auth/logout"
            resp = s.post(f"http://{self.settings.server.host}:{self.settings.server.port}{path}")
            if not resp.ok:
                raise Exception(resp.text)
            path= f"/api/v{self.api_version}/users/current/{self.data_holder['user']['email']}"
            resp = s.get(f"http://{self.settings.server.host}:{self.settings.server.port}{path}")
            if not resp.ok:
                print("okay")
            else:
                raise Exception("logout does not works")

    def edit_user(self, params):
        result = self.data_holder['user'].copy()
        del result['email']
        del result['password']
        result['new_email'] = 'tester1@test1.com'
        result['firstname'] = 'tester1'
        result['lastname'] = 'test1'
        result['is_admin'] = True
        result['old_password'] = self.data_holder['user']['password']
        result['new_password'] = self.data_holder['user']['password']+'1234'
        resp = self.put(path=f"/api/v{self.api_version}/users/{self.data_holder['user']['email']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        d['email'] = d['new_email']
        del d['new_email']
        del d['new_password']
        del d['old_password']
        d["isAdmin"]=d['is_admin']
        del d['is_admin']
        if d==j:
            print("okay")
            self.data_holder['user'].clear() 
            self.data_holder['user'] = j
        else:
            raise Exception("result data is not the same as input")
    
    def remove_user(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/users/{self.data_holder['user']['email']}")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/users/{self.data_holder['user']['email']}")
        if not resp.ok:
            print("okay")
            return
        raise Exception("result user was not deleted")
    
    def add_workspace(self, params):
        result = {
            'title': 'test_workspace',
            'description':  'this is a workspace auto generated from the test.',
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{resp.json()['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['title'] == d['title'] and j['description'] == d['description']:
            if len(j['ontologies'])==1:
                print("okay")
                self.data_holder['workspace'] = resp.json()
        else: 
            raise Exception("result data is not the same as input")

    def edit_workspace(self, params):
        result = {
            'title': self.data_holder['workspace']['title']+'1234',
            'description':  self.data_holder['workspace']['description']+'1234',
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{resp.json()['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['title'] == d['title'] and j['description'] == d['description']:
            print("okay")
            self.data_holder['workspace']['title'] = j['title']
            self.data_holder['workspace']['description'] = j['description']
        else: 
            raise Exception("result data is not the same as input")
    
    def add_user_to_workspace(self, params):
        result = {
            'email':self.data_holder['user']['email'],
            'add':True,
            'can_read':True,
            'can_write':True,
            'can_delete':True,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/users", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['email'] == d['email'] and j['workspacePermissions']['canRead'] == d['can_read'] and j['workspacePermissions']['canWrite'] == d['can_write'] and j['workspacePermissions']['canWrite'] == d['can_write'] and j['workspacePermissions']['canDelete'] == d['can_delete']:
            print("okay")
        else: 
            raise Exception("result data is not the same as input")
        
    def edit_permission_from_user_in_workspace(self, params):
        result = {
            'email':self.data_holder['user']['email'],
            'can_read':True,
            'can_write':False,
            'can_delete':False,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/users", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['email'] == d['email'] and j['workspacePermissions']['canRead'] == d['can_read'] and j['workspacePermissions']['canWrite'] == d['can_write'] and j['workspacePermissions']['canWrite'] == d['can_write'] and j['workspacePermissions']['canDelete'] == d['can_delete']:
            print("okay")
        else: 
            raise Exception("result data is not the same as input")
    
    def removing_user_from_workspace(self, params):
        result = {
            'email':self.data_holder['user']['email'],
            'add':False,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/users", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j['users'])==1:
            print("okay")
        else: 
            raise Exception("user was not deleted")

    def add_ontology(self, params):
        result = {
            'title': 'test_ontology',
            'description':  'this is a ontology auto generated from the test.',
        }
        files = {'file': ('pizza.owl', open(os.path.dirname(__file__) + '/test/pizza.owl', 'rb'))}
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/ontologies", data=result, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['title'] == d['title'] and j['description'] == d['description'] and j['mimetype']=='application/rdf+xml' and j['sizeInBytes']!='' and j['sizeInBytes']!='0':
            print("okay")
            self.data_holder['ontology']=resp.json()
        else: 
            raise Exception("result data is not the same as input")

    def edit_ontology(self, params):
        result = {
            'title': self.data_holder['ontology']['title']+'1234',
            'description':  self.data_holder['ontology']['description']+'1234',
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/ontologies/{self.data_holder['ontology']['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['title'] == d['title'] and j['description'] == d['description']:
            print("okay")
            self.data_holder['ontology']['title'] = j['title']
            self.data_holder['ontology']['description'] = j['description']
        else: 
            raise Exception("result data is not the same as input")
    
    def query_ontology(self, params):
        graphname = f"<http://{self.settings.fuseki_storage.host}:{self.settings.fuseki_storage.port}/{self.data_holder['workspace']['id']}/{self.data_holder['ontology']['id']}>"
        query="SELECT ?subject ?predicate ?object WHERE " +"{"+f" GRAPH {graphname} "+"{"+" ?subject ?predicate ?object }}LIMIT 2"
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/ontologies/search?querystring={query}&is_query=True")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = {'head': {'vars': ['subject', 'predicate', 'object']}, 'results': {'bindings': [{'subject': {'type': 'uri', 'value': 'http://purl.org/dc/elements/1.1/title'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'}, 'object': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#AnnotationProperty'}}, {'subject': {'type': 'uri', 'value': 'http://purl.org/dc/elements/1.1/description'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'}, 'object': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#AnnotationProperty'}}]}}
        if j==d:
            print("okay")
        else: 
            raise Exception("result data is not the same as input")

    def keyword_search_on_ontology(self, params):
        query="Ham"
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/ontologies/search?querystring={query}&graph_name={self.data_holder['ontology']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = {'head': {'vars': ['subject', 'predicate', 'object']}, 'results': {'bindings': [{'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#ParmaHamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'}, 'object': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#Class'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#ParmaHamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2000/01/rdf-schema#label'}, 'object': {'type': 'literal', 'xml:lang': 'pt', 'value': 'CoberturaDePrezuntoParma'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#ParmaHamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2000/01/rdf-schema#label'}, 'object': {'type': 'literal', 'xml:lang': 'en', 'value': 'ParmaHamTopping'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#ParmaHamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2000/01/rdf-schema#subClassOf'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#ParmaHamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2000/01/rdf-schema#subClassOf'}, 'object': {'type': 'bnode', 'value': 'b0'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#ParmaHamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2004/02/skos/core#prefLabel'}, 'object': {'type': 'literal', 'xml:lang': 'en', 'value': 'Parma Ham'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type'}, 'object': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#Class'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2000/01/rdf-schema#label'}, 'object': {'type': 'literal', 'xml:lang': 'pt', 'value': 'CoberturaDePresunto'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2000/01/rdf-schema#label'}, 'object': {'type': 'literal', 'xml:lang': 'en', 'value': 'HamTopping'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2000/01/rdf-schema#subClassOf'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#MeatTopping'}}, {'subject': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2004/02/skos/core#prefLabel'}, 'object': {'type': 'literal', 'xml:lang': 'en', 'value': 'Ham'}}, {'subject': {'type': 'bnode', 'value': 'b1'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b2'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b3'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b4'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#someValuesFrom'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b5'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#someValuesFrom'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b6'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#someValuesFrom'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b7'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b8'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/1999/02/22-rdf-syntax-ns#first'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}, {'subject': {'type': 'bnode', 'value': 'b9'}, 'predicate': {'type': 'uri', 'value': 'http://www.w3.org/2002/07/owl#someValuesFrom'}, 'object': {'type': 'uri', 'value': 'http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping'}}]}}
        if j==d:
            print("okay")
        else: 
            raise Exception("result data is not the same as input")
    
    def construct_query_on_ontology(self, params):
        graphname = f"<http://{self.settings.fuseki_storage.host}:{self.settings.fuseki_storage.port}/{self.data_holder['workspace']['id']}/{self.data_holder['ontology']['id']}>"
        query="Construct { ?subject ?predicate ?object } WHERE { GRAPH "+f"{graphname}"+" { ?subject ?predicate ?object } . } LIMIT 25"
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/ontologies/construct?querystring={query}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.text
        if j!='':
            print("okay")
        else: 
            raise Exception("result data is not the same as input")

    def remove_ontology(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/ontologies/{self.data_holder['ontology']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        try:
            ontology_data_access.get(self.data_holder['ontology']['id'])
        except:
            print("okay")
            return
        raise Exception("workspace was not deleted")
            
    def remove_workspace(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        try:
            workspace_data_access.get(self.data_holder['workspace']['id'])
        except:
            print("okay")
            return
        raise Exception("workspace was not deleted")
    
    def ingest_file(self, params, save=False, iteration='', without_start=False):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_File", 
                "read_type": "DATA_FILE", 
                "source_files": [ "logo" ], 
            }),
            "title":"[TEST]Test_File",
        }
        files = {'logo': ('logo.png', open(os.path.dirname(__file__) + '/test/logo.png', 'rb'))}
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        if without_start==False:
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
            dataset['datasource'] = resp.json()
            if not resp.ok:
                raise Exception(resp.text)
            abort = 0
            while "schema" not in dataset and abort!=self.abort_counter:
                print('waiting')
                resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
                if not resp.ok:
                    raise Exception(resp.text)
                dataset = resp.json()[0]
                error = dataset['datasource']['ingestions'][0]['error']
                if error!=None:
                    raise Exception(error)
                abort+=1
                sleep(4)
            if dataset['schema']['type']=="UNSTRUCTURED" and len(dataset['schema']['files'])==1 and dataset['schema']['files'][0]['filename']=='logo.png':
                print("okay")
            else: 
                raise Exception("result is classified uncorrect or the files were not added correctly")
        if save==True:
            self.data_holder[f"dataset_file_lineage_{iteration}"]=dataset
            return 
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)

    def ingest_files(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_Files", 
                "read_type": "DATA_FILE", 
                "source_files": [ "logo", "pizza" ], 
            }),
            "title":"[TEST]Test_Files",
        }
        files = {
            'logo': ('logo.png', open(os.path.dirname(__file__) + '/test/logo.png', 'rb')),
            'pizza': ('pizza.owl', open(os.path.dirname(__file__) + '/test/pizza.owl', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="UNSTRUCTURED" and len(dataset['schema']['files'])==2:
            for file in dataset['schema']['files']:
                if file['filename'] != 'pizza.owl' and file['filename'] != 'logo.png':
                    raise Exception("result is classified uncorrect or not all files are added correct")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all files are added correct")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
    
    def ingest_csv(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_CSV_Default",
                "id_column": "Identifier",
                "read_type": "SOURCE_FILE",
                "read_format": "csv",
                "read_options": {"delimiter": ";", "header": "true", "inferSchema": "true"},
                "source_files": ["usernames"],
                "write_type": "DEFAULT"
            }),
            "title":"[TEST]Ingestion_CSV_Default",
        }
        files = {
            'usernames': ('usernames.csv', open(os.path.dirname(__file__) + '/test/usernames.csv', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if (dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1 and '.csv' in self.settings.server.fileendings_semistructured) or (dataset['schema']['type']=="STRUCTURED" and len(dataset['schema']['entities'])==1 and '.csv' not in self.settings.server.fileendings_semistructured):
            if len(dataset['schema']['entities'][0]['attributes'])==4 and dataset['schema']['entities'][0]['countOfRows']==4:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='Identifier':
                        if attr['isPk']==True:
                            if self.delete_results==True:
                                resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
                                if not resp.ok:
                                    raise Exception(resp.text)
                            print("okay")
                            return
        raise Exception("result is classified uncorrect or not all files are added correct")

    def ingest_json(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_JSON_Delta",
                "id_column": "description.id",
                "read_type": "SOURCE_FILE",
                "read_format": "json",
                "read_options": {"multiLine": "true"},
                "source_files": ["colors"],
                "plugin_files": ["plugin"],
                "write_type": "DELTA"
            }),
            "title":"[TEST]Ingestion_JSON_Delta",
        }
        files = {
            'colors': ('colors.json', open(os.path.dirname(__file__) + '/test/colors.json', 'rb')),
            'plugin': ('plugin.py', open(os.path.dirname(__file__) + '/test/plugin_json.py', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1:
            if len(dataset['schema']['entities'][0]['attributes'])==3 and dataset['schema']['entities'][0]['countOfRows']==4:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='description':
                        for a in attr['attributes']:
                            if a['name']=='id':
                                if a['isPk']==True:
                                    if self.delete_results==True:
                                        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
                                        if not resp.ok:
                                            raise Exception(resp.text)
                                    print("okay")
                                    return
        raise Exception("result is classified uncorrect or not all files are added correct")

    def ingest_neo4j(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_Neo4j_Delta",
                "id_column": "uid",
                "spark_packages": ["neo4j-contrib:neo4j-connector-apache-spark_2.12:4.0.1_for_spark_3"],
                "read_type": "PULL",
                "read_format": "org.neo4j.spark.DataSource",
                "read_options": {
                    "url": f"bolt://{self.settings.neo4j_management.host}:{self.settings.neo4j_management.port}",
                    "labels": ":TestCase"
                },
                "write_type": "DELTA"
            }),
            "title":"[TEST]Ingestion_JSON_Delta",
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if (dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1 and self.settings.server.only_struct_types==False) or (dataset['schema']['type']=="STRUCTURED" and len(dataset['schema']['entities'])==1 and self.settings.server.only_struct_types==True) :
            if len(dataset['schema']['entities'][0]['attributes'])!=0:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='uid':
                        if attr['isPk']==True:
                            if self.delete_results==True:
                                resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
                                if not resp.ok:
                                    raise Exception(resp.text)
                                print("okay")
                                return
        raise Exception("result is classified uncorrect or not all files are added correct")
    
    def ingest_custom(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "Ingestion_JSON_MONGODB_CUSTOM",
                "id_column": "colors.description.id",
                "spark_packages": ["org.mongodb.spark:mongo-spark-connector_2.12:3.0.0"],
                "read_type": "SOURCE_FILE",
                "read_format": "json",
                "read_options": {"multiLine": "true"},
                "source_files": ["colors"],
                "custom_read_format": "com.mongodb.spark.sql.DefaultSource",
                "custom_read_options": {
                    "spark.mongodb.input.uri": f"mongodb://{self.settings.mongodb_storage.user}:{self.settings.mongodb_storage.password}@{self.settings.mongodb_storage.host}:{self.settings.mongodb_storage.port}/{self.settings.mongodb_storage.database}.functionalTest?authSource=admin"
                },
                "write_format": "com.mongodb.spark.sql.DefaultSource",
                "write_mode": "append",
                "write_options": {
                    "uri": f"mongodb://{self.settings.mongodb_storage.user}:{self.settings.mongodb_storage.password}@{self.settings.mongodb_storage.host}:{self.settings.mongodb_storage.port}",
                    "database": f"{self.settings.mongodb_storage.database}",
                    "collection": "functionalTest"
                },
                "write_type": "CUSTOM"
                }),
            "title":"[TEST]Ingestion_JSON_MONGODB_CUSTOM",
        }
        files = {
            'colors': ('colors.json', open(os.path.dirname(__file__) + '/test/colors.json', 'rb')),
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if (dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1 and self.settings.server.only_struct_types==False) or (dataset['schema']['type']=="STRUCTURED" and len(dataset['schema']['entities'])==1 and self.settings.server.only_struct_types==True) :
            if len(dataset['schema']['entities'][0]['attributes'])!=0:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='colors':
                        for at in attr['attributes']:
                            if at['name']=='description':
                                for a in at['attributes']:
                                    if a['name']=='id':
                                        if a['isPk']==True:
                                            print('okay')
                                            if self.delete_results==True:
                                                resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
                                                if not resp.ok:
                                                    raise Exception(resp.text)
                                            return
        raise Exception("result is classified uncorrect or not all files are added correct")
        
    
    def create_and_update_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "Ingestion_Update_And_Publish",
                "id_column": "Identifier",
                "read_type": "SOURCE_FILE",
                "read_format": "csv",
                "read_options": {"delimiter": ";", "header": "true"},
                "source_files": ["usernames"],
                "write_type": "DELTA"
            }),
            "title":"Ingestion_Update_And_Publish",
        }
        files = {
            'usernames': ('usernames.csv', open(os.path.dirname(__file__) + '/test/usernames.csv', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        result={
            'title': f'1234{data["title"]}',
            'description': '# Test description',
            'author': 'Marcel Thiel',
            'license': '# Test license',
            'latitude': '51.31649666550848', 
            'longitude': '6.569960413211841',
            'range_start': datetime.now().isoformat()+'Z',
            'range_end': datetime.now().isoformat()+'Z',
            'language': 'English',
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        del result['range_start']
        del result['range_end']
        for key in result:
            if j[key] != result[key]:
                raise Exception('update was not successful')
        self.data_holder['dataset']=resp.json()
        print("okay")

    def add_tags_to_dataset(self, params):
        result = {
            'annotation': '<http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping>',
            'ontology_id': f'{self.data_holder["ontology"]["id"]}',
            'title': "test"
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/tags", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        result = {
            'annotation': '<http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping>',
            'ontology_id': f'{self.data_holder["ontology"]["id"]}',
            'title': "test1"
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/tags", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        result = {
            'annotation': '<http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping>',
            'ontology_id': f'{self.data_holder["ontology"]["id"]}',
            'title': "test1"
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/tags", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j['tags'])==2:
            print('okay')
        else:
            raise Exception(resp.text)
    
    def publish_dataset(self, params):
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}", json={'index':True, 'with_thread':False}, timeout=300)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j != []:
            raise Exception('dataset was not published')
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        print('okay')
    
    def search_dataset(self, params):
        result = {
            'query': f'{self.data_holder["dataset"]["title"]}',
            'source_search': False,
            'semantic_search': False,
            'tags': [],
            'with_auto_wildcard': True,
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=1 or j[0]["title"]!=self.data_holder["dataset"]["title"]:
            raise Exception('dataset not found')
        result['schema']=f'{self.data_holder["dataset"]["schema"]["type"]}'
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=1 or j[0]["title"]!=self.data_holder["dataset"]["title"]:
            raise Exception('dataset not found')
        result['zone']='PROCESSED'
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=0:
            raise Exception('dataset not found')
        print("okay")

    def search_dataset_schema(self, params):
        result = {
            'query': 'Identifier',
            'source_search': False,
            'semantic_search': False,
            'tags': [],
            'with_auto_wildcard': True,
            'search_schema_element': True,
            'schema': self.data_holder['dataset']['schema']['type'],
            'filter_schema': True,
            'is_pk': True,
            'is_fk': False,
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=1 or j[0]["title"]!=self.data_holder["dataset"]["title"]:
            raise Exception('dataset not found')
        result['query']='Username'
        result['is_pk']=False
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=1 or j[0]["title"]!=self.data_holder["dataset"]["title"]:
            raise Exception('dataset not found')
        print('okay')
    
    def search_dataset_source(self, params):
        result = {
            'query': 'Sayed',
            'source_search': True,
            'semantic_search': False,
            'tags': [],
            'with_auto_wildcard': True,
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=1 or j[0]["title"]!=self.data_holder["dataset"]["title"]:
            raise Exception('dataset not found')
        result['query']='abcdefghij'
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==0:
            print("okay")
        else:
            raise Exception('dataset not found')
    
    def sematic_search_dataset(self, params):
        result = {
            'query': 'Ham',
            'source_search': False,
            'semantic_search': True,
            'tags': [],
            'with_auto_wildcard': False,
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==1 and j[0]["title"]==self.data_holder["dataset"]["title"]:
            print('okay')
        else: 
            raise Exception('dataset not found')
    
    def remove_dataset_from_es_index(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/index")
        if not resp.ok:
            raise Exception(resp.text)
        try:
            self.search_dataset_source(None)
            raise Exception("dataset was not removed from es index")
        except:
            print("okay")

    def readd_dataset_to_es_index(self, params):
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/index?with_thread=False", timeout=300)
        if not resp.ok:
            raise Exception(resp.text)
        sleep(4)
        try:
            self.search_dataset_source(None)
            print("okay")
        except:
            raise Exception("dataset is not index correctly to es")
    
    def add_jupyter_notebook(self, params):
        result = {
            'title': 'This is a title for the notebook.',
            'description': 'This is a description for the notebook.',
            'type': 'JUPYTER',
            'is_public': False,
            'version': 0,
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/notebooks", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if result['type']!=j['type'] or result['title']!=j['title'] or result['description']!=j['description']:
            raise Exception('notebook is not correct')
        resp = self.get(path=f"/notebooks/work/{self.data_holder['workspace']['id']}/{self.data_holder['dataset']['id']}/{j['id']}.ipynb", preparams=f'{self.settings.jupyter_service.url}')
        if not resp.ok:
            raise Exception(resp.text)
        self.data_holder['jupyter_notebook']=j
        print('okay')
    
    def edit_jupyter_notebook(self, params):
        result = {
            'title': self.data_holder['jupyter_notebook']['title']+'1234',
            'description': self.data_holder['jupyter_notebook']['description']+'1234',
            'is_public': True,
            'version': 0,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/notebooks/{self.data_holder['jupyter_notebook']['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if result['is_public']!=j['isPublic'] or result['title']!=j['title'] or result['description']!=j['description']:
            raise Exception('notebook is not correct')
        self.data_holder['jupyter_notebook']['title']=j['title']
        self.data_holder['jupyter_notebook']['description']=j['description']
        self.data_holder['jupyter_notebook']['isPublic']=j['isPublic']
        print('okay')
    
    def search_jupyter_notebook(self, params):
        result = {
            'query': f"{self.data_holder['jupyter_notebook']['title']}",
            'source_search': False,
            'semantic_search': False,
            'tags': [],
            'with_auto_wildcard': True,
            'notebook_search': True,
            'notebook_type': 'JUPYTER',
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=1 or j[0]["title"]!=self.data_holder["dataset"]["title"]:
            raise Exception('dataset not found')
        result['notebook_type'] = 'ZEPPELIN' 
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==0:
            print('okay')
            return
        raise Exception('dataset not found')
        
    def remove_jupyter_notebook(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/notebooks/{self.data_holder['jupyter_notebook']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/notebooks/work/{self.data_holder['workspace']['id']}/{self.data_holder['dataset']['id']}/{self.data_holder['jupyter_notebook']['id']}.ipynb", preparams=f'{self.settings.jupyter_service.url}')
        if not resp.ok:
            del self.data_holder['jupyter_notebook']
            print('okay')
        else:
            raise Exception(resp.text)
    
    def add_zeppelin_notebook(self, params):
        result = {
            'title': 'This is a title for the notebook.',
            'description': 'This is a description for the notebook.',
            'type': 'ZEPPELIN',
            'is_public': False,
            'version': 0,
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/notebooks", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if result['type']!=j['type'] or result['title']!=j['title'] or result['description']!=j['description']:
            raise Exception('notebook is not correct')
        #resp = self.get(path=f"/#/notebook/{j['zeppelinNotebookId']}", preparams=f'{self.settings.zeppelin_service.url}')
        #if not resp.ok:
        #    raise Exception(resp.text)
        #cannot check the real response because zeppelin is build a spa 
        self.data_holder['zeppelin_notebook']=j
        print('okay')
    
    def edit_zeppelin_notebook(self, params):
        result = {
            'title': self.data_holder['zeppelin_notebook']['title']+'1234',
            'description': self.data_holder['zeppelin_notebook']['description']+'1234',
            'is_public': True,
            'version': 0,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/notebooks/{self.data_holder['zeppelin_notebook']['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if result['is_public']!=j['isPublic'] or result['title']!=j['title'] or result['description']!=j['description']:
            raise Exception('notebook is not correct')
        self.data_holder['zeppelin_notebook']['title']=j['title']
        self.data_holder['zeppelin_notebook']['description']=j['description']
        self.data_holder['zeppelin_notebook']['isPublic']=j['isPublic']
        print('okay')
    
    def search_zeppelin_notebook(self, params):
        result = {
            'query': f"{self.data_holder['zeppelin_notebook']['title']}",
            'source_search': False,
            'semantic_search': False,
            'tags': [],
            'with_auto_wildcard': True,
            'notebook_search': True,
            'notebook_type': 'ZEPPELIN',
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)!=1 or j[0]["title"]!=self.data_holder["dataset"]["title"]:
            raise Exception('dataset not found')
        result['notebook_type'] = 'JUPYTER' 
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/search", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==0:
            print('okay')
            return
        raise Exception('dataset not found')
    
    def remove_zeppelin_notebook(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/notebooks/{self.data_holder['zeppelin_notebook']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        #resp = self.get(path=f"/#/notebook/{self.data_holder['zeppelin_notebook']['zeppelinNotebookId']}", preparams=f'{self.settings.zeppelin_service.url}')
        #cannot check the real response because zeppelin is build a spa 
        del self.data_holder['zeppelin_notebook']
        print('okay')
    
    def get_wiki(self, params):
        resp = self.get(path=f"/api/v{self.api_version}/wiki/en")
        if not resp.ok:
            raise Exception(resp.text)
        print('okay')
    
    def change_status_of_dataset(self, params, once=False):
        i = 2
        if once==True:
            i = 1
        for x in range(i):
            resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/status")
            if not resp.ok:
                raise Exception(resp.text)
            j = resp.json()
            if self.data_holder['dataset']['isPublic'] == True and len(j)==1:
                print('okay')
                self.data_holder['dataset']['isPublic']=not self.data_holder['dataset']['isPublic']
            elif self.data_holder['dataset']['isPublic'] == False:
                print('okay')
                self.data_holder['dataset']['isPublic']=not self.data_holder['dataset']['isPublic']
            else:
                raise Exception(resp.text)
    
    def add_user_to_dataset(self, params):
        if self.data_holder['dataset']['isPublic']==True:
            self.change_status_of_dataset(None, True)
        result = {
            'email':self.data_holder['user']['email'],
            'add':True,
            'can_read':True,
            'can_write':True,
            'can_delete':True,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/users", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['email'] == d['email'] and j['datasetPermissions']['canRead'] == d['can_read'] and j['datasetPermissions']['canWrite'] == d['can_write'] and j['datasetPermissions']['canWrite'] == d['can_write'] and j['datasetPermissions']['canDelete'] == d['can_delete']:
            print("okay")
        else: 
            raise Exception("result data is not the same as input")

    def edit_permission__of_user_from_dataset(self, params):
        result = {
            'email':self.data_holder['user']['email'],
            'can_read':True,
            'can_write':False,
            'can_delete':False,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/users", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        d = result.copy()
        if j['email'] == d['email'] and j['datasetPermissions']['canRead'] == d['can_read'] and j['datasetPermissions']['canWrite'] == d['can_write'] and j['datasetPermissions']['canWrite'] == d['can_write'] and j['datasetPermissions']['canDelete'] == d['can_delete']:
            print("okay")
        else: 
            raise Exception("result data is not the same as input")

    def remove_user_from_dataset(self, params):
        result = {
            'email':self.data_holder['user']['email'],
            'add':False,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/users", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j['users'])==1:
            print("okay")
        else: 
            raise Exception("user was not deleted")

    def edit_attribute(self, params):
        attribute = self.data_holder['dataset']['schema']['entities'][0]['attributes'][0].copy()
        result = {
            "description": 'This is a test description',
            "datatype": 'String',
            "is_pk": True,
            "is_fk": True,
            "contains_PII": True,
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/attributes/{attribute['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['description'] == result['description'] and j['dataType'] == result['datatype'] and j['isPk'] == result['is_pk'] and j['isFk'] == result['is_fk'] and j['containsPII'] == result['contains_PII']:
            print('okay')
        else:
           raise Exception("result data is not the same as input")
    
    def annotation_attribute(self, params):
        attribute = self.data_holder['dataset']['schema']['entities'][0]['attributes'][0].copy()
        result = {
            'annotation_id':'',
            'annotation': '<http://xmlns.com/foaf/0.1/Person>',
            'ontology_id': self.data_holder['ontology']['id'],
            'id_of_fk_dataset': '',
            'id_of_fk_attribute': '',
            'set_pk': False,
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/attributes/{attribute['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['instance'] == result['annotation'] and j['ontology']['title'] == self.data_holder['ontology']['title']:
            self.data_holder['annotation_attribute'] = j
            print('okay')
        else:
           raise Exception("result data is not the same as input")
    
    def remove_annotation_attribute(self, params):
        attribute = self.data_holder['dataset']['schema']['entities'][0]['attributes'][0].copy()
        result = {
            'annotation_id':self.data_holder['annotation_attribute']['id'],
            'annotation': None,
            'ontology_id': None,
            'id_of_fk_dataset': '',
            'id_of_fk_attribute': '',
            'set_pk': False,
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/attributes/{attribute['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j==None:
            del self.data_holder['annotation_attribute']
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def edit_entity(self, params):
        entity = self.data_holder['dataset']['schema']['entities'][0].copy()
        result = {
            "description": 'This is a test description',
            "name": 'name for displaying',
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/entities/{entity['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['description'] == result['description'] and j['displayName'] == result['name']:
            print('okay')
        else:
           raise Exception("result data is not the same as input")
    
    def annotation_entity(self, params):
        entity = self.data_holder['dataset']['schema']['entities'][0].copy()
        result = {
            'description': '',
            'key': None,
            'annotation_id':'',
            'annotation': '<http://xmlns.com/foaf/0.1/Person>',
            'ontology_id': self.data_holder['ontology']['id'],
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/entities/{entity['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['instance'] == result['annotation'] and j['ontology']['title'] == self.data_holder['ontology']['title']:
            self.data_holder['annotation_entity'] = j
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def remove_annotation_entity(self, params):
        entity = self.data_holder['dataset']['schema']['entities'][0].copy()
        result = {
            'description': None,
            'key': None,
            'annotation_id':self.data_holder['annotation_entity']['id'],
            'annotation': None,
            'ontology_id': None,
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/entities/{entity['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j==None:
            del self.data_holder['annotation_entity']
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def custom_annotation_entity(self, params):
        entity = self.data_holder['dataset']['schema']['entities'][0].copy()
        result = {
            'description': 'This is a example annotation.',
            'key': 'test',
            'annotation_id':None,
            'annotation': '<http://xmlns.com/foaf/0.1/Person>',
            'ontology_id': self.data_holder['ontology']['id'],
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/entities/{entity['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['instance'] == result['annotation'] and j['ontology']['title'] == self.data_holder['ontology']['title'] and j['description'] == result['description']and j['key'] == result['key']:
            self.data_holder['custom_annotation_entity'] = j
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def remove_custom_annotation_entity(self, params):
        entity = self.data_holder['dataset']['schema']['entities'][0].copy()
        result = {
            'description': '',
            'key': '',
            'annotation_id':self.data_holder['custom_annotation_entity']['id'],
            'annotation': None,
            'ontology_id': None,
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/entities/{entity['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j==None:
            del self.data_holder['custom_annotation_entity']
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def create_and_publish_unstructured_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_File", 
                "read_type": "DATA_FILE", 
                "source_files": [ "logo" ], 
            }),
            "title":"[TEST]Test_File",
        }
        files = {'logo': ('logo.png', open(os.path.dirname(__file__) + '/test/logo.png', 'rb'))}
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="UNSTRUCTURED" and len(dataset['schema']['files'])==1 and dataset['schema']['files'][0]['filename']=='logo.png':
            result = {
                'annotation': '<http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping>',
                'ontology_id': f'{self.data_holder["ontology"]["id"]}',
                'title': "test"
            }
            resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/tags", json=result)
            if not resp.ok:
                raise Exception(resp.text)
            resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}", json={'index':False, 'with_thread':False}, timeout=300)
            if not resp.ok:
                raise Exception(resp.text)
            self.data_holder['dataset_unstructured']=dataset
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or the files were not added correctly")
        
    def edit_file(self, params):
        file = self.data_holder['dataset_unstructured']['schema']['files'][0].copy()
        result = {
            "description": 'This is a test description',
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/files/{file['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['description'] == result['description']:
            print('okay')
        else:
           raise Exception("result data is not the same as input")
    
    def annotation_file(self, params):
        file = self.data_holder['dataset_unstructured']['schema']['files'][0].copy()
        result = {
            'description': '',
            'key': None,
            'annotation_id':'',
            'annotation': '<http://xmlns.com/foaf/0.1/Person>',
            'ontology_id': self.data_holder['ontology']['id'],
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/files/{file['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['instance'] == result['annotation'] and j['ontology']['title'] == self.data_holder['ontology']['title']:
            self.data_holder['annotation_file'] = j
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def remove_annotation_file(self, params):
        file = self.data_holder['dataset_unstructured']['schema']['files'][0].copy()
        result = {
            'description': None,
            'key': None,
            'annotation_id':self.data_holder['annotation_file']['id'],
            'annotation': None,
            'ontology_id': None,
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/files/{file['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j==None:
            del self.data_holder['annotation_file']
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def custom_annotation_file(self, params):
        file = self.data_holder['dataset_unstructured']['schema']['files'][0].copy()
        result = {
            'description': 'This is a example annotation.',
            'key': 'test',
            'annotation_id':None,
            'annotation': '<http://xmlns.com/foaf/0.1/Person>',
            'ontology_id': self.data_holder['ontology']['id'],
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/files/{file['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['instance'] == result['annotation'] and j['ontology']['title'] == self.data_holder['ontology']['title'] and j['description'] == result['description']and j['key'] == result['key']:
            self.data_holder['custom_annotation_file'] = j
            print('okay')
        else:
           raise Exception("result data is not the same as input")
    
    def remove_custom_annotation_file(self, params):
        file = self.data_holder['dataset_unstructured']['schema']['files'][0].copy()
        result = {
            'description': '',
            'key': '',
            'annotation_id':self.data_holder['custom_annotation_file']['id'],
            'annotation': None,
            'ontology_id': None,
        }
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/files/{file['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j==None:
            del self.data_holder['custom_annotation_file']
            print('okay')
        else:
           raise Exception("result data is not the same as input")
    
    def update_source_data_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "Ingestion_Update_And_Publish",
                "id_column": "Identifier",
                "read_type": "SOURCE_FILE",
                "read_format": "csv",
                "read_options": {"delimiter": ";", "header": "true"},
                "source_files": ["usernames"],
                "write_type": "DELTA"
            }),
        }
        files = {
            'usernames': ('usernames.csv', open(os.path.dirname(__file__) + '/test/update/usernames.csv', 'rb'))
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/update-datasource", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while dataset['datasource']['ingestions'][1]['state']!='FINISHED' and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()
            error = dataset['datasource']['ingestions'][1]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        error = dataset['datasource']['ingestions'][1]['error']
        if error!=None:
            raise Exception(error)
        print('okay')
        self.data_holder['dataset'] = dataset

    def get_diffs(self, params):
        sleep(30)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/deltas?session_id=-&version=1&version_to_compare=0", timeout=600)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j['body'])==1:
            if j['body'][0]['Identifier']=='1' and j['body'][0]['cd_deleted']==True:
                print('okay')
                return
        raise Exception('the delta calculation was not successful')
    
    def set_continuation_timer(self, params):
        result = {
            'timer':['*/22 * * * *']
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/timer", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        for rev in j['datasource']['revisions']:
            if len(rev['continuation_timers'])!=0:
                if rev['continuation_timers'][0]==result['timer'][0]:
                    print('okay')
                    return 
        raise Exception(resp.text)

    def unset_continuation_timer(self, params):
        result = {
            'timer':[]
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/timer", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        for rev in j['datasource']['revisions']:
            if len(rev['continuation_timers'])!=0:
                raise Exception(resp.text)
        print('okay')

    def get_profiling(self, params):
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/profiling")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        abort = 0
        attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
        while "stats" not in attribute and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()
            attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
            abort+=1
            sleep(4)
        if attribute['stats']:
            for attr in dataset['schema']['entities'][0]['attributes']:
                if attr['name'] == 'Identifier':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['maximum']==3 and attr['stats']['isDataTypeInferred']==False:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
            print("okay")
        else:
            raise Exception("the profiling was not successful")

    def run_workflow(self, params):
        name = "Dataset from workflow"
        result = [{"type":"export","x":491,"y":138,"name":name,"target":"HDFS","isPolymorph":False,"setFk":False,"setPk":False,"auto":True,"write_type":"DEFAULT","input":[{"type":"data_source","x":193,"y":59,"uid":self.data_holder['dataset']['id']}]}]
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/workflow", json=result, timeout=600)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==1:
            if j[0]['title']==name:
                print('okay')
                if self.delete_results==True:
                    resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{j[0]['id']}")
                    if not resp.ok:
                        raise Exception(resp.text)
                return
        raise Exception("workflow was not successful, the dataset was not created")

    def run_workflow_auto_poly(self, params):
        name = "Dataset from workflow"
        result = [{"type":"export","x":491,"y":138,"name":name,"target":"HDFS","isPolymorph":False,"setFk":False,"setPk":False,"auto":True,"write_type":"DEFAULT","input":[{"type":"data_source","x":193,"y":59,"uid":self.data_holder['dataset']['id']}]}]
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/workflow", json=result, timeout=600)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==1:
            if j[0]['title']==name:
                if j[0]['polymorph'][0]['id']==self.data_holder['dataset']['id']:
                    print('okay')
                    if self.delete_results==True:
                        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{j[0]['id']}")
                        if not resp.ok:
                            raise Exception(resp.text)
                    return 
        raise Exception("workflow was not successful, the dataset was not created")
    
    def run_workflow_custom_poly(self, params):
        name = "Dataset from workflow"
        result = [{"type":"export","x":491,"y":138,"name":name,"target":"HDFS","isPolymorph":False,"setFk":False,"setPk":False,"auto":False,"write_type":"DEFAULT","input":[{"type":"data_source","x":193,"y":59,"uid":self.data_holder['dataset']['id']}]}]
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/workflow", json=result, timeout=600)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==1:
            if j[0]['title']==name:
                if len(j[0]['polymorph'])==0:
                    print('okay')
                    if self.delete_results==True:
                        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{j[0]['id']}")
                        if not resp.ok:
                            raise Exception(resp.text)
                    return 
        raise Exception("workflow was not successful, the dataset was not created")
    
    def run_workflow_auto_fk(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "Ingestion_Update_And_Publish",
                "read_type": "SOURCE_FILE",
                "read_format": "csv",
                "read_options": {"delimiter": ";", "header": "true"},
                "source_files": ["usernames"],
                "write_type": "DELTA"
            }),
            "title":"Ingestion_Update_And_Publish",
        }
        files = {
            'usernames': ('usernames.csv', open(os.path.dirname(__file__) + '/test/usernames.csv', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}", json={'index':False, 'with_thread':False}, timeout=300)
        if not resp.ok:
            raise Exception(resp.text)
        self.data_holder['workflow_join_dataset']=dataset
        column_id_1 = None
        column_id_2 = None
        for attr in self.data_holder['dataset']['schema']['entities'][0]['attributes']:
            if attr['name']=='Identifier':
                column_id_1 = attr['id']
        for attr in self.data_holder['workflow_join_dataset']['schema']['entities'][0]['attributes']:
            if attr['name']=='Identifier':
                column_id_2 = attr['id']
        name = "Dataset from workflow"
        result = [{"type":"export","x":561,"y":119,"name":"1234","target":"HDFS","isPolymorph":False,"setFk":False,"setPk":False,"auto":True,"write_type":"DEFAULT","input":[{"type":"join","x":314,"y":133,"input":[{"input":[{"type":"data_source","x":139,"y":52,"uid":self.data_holder['workflow_join_dataset']['id']}],"column":"Identifier","columnID":column_id_2,"isJoinInput":True},{"input":[{"type":"data_source","x":207,"y":229,"uid":self.data_holder['dataset']['id']}],"column":"Identifier","columnID":column_id_1,"isJoinInput":True}]}]}]
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/workflow", json=result, timeout=600)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['workflow_join_dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        for attr in dataset['schema']['entities'][0]['attributes']:
            if attr['name']=='Identifier':
                if attr['isFk'] == True and attr['foreignKeysTo'][0]['dataset'] == self.data_holder['dataset']['id'] and attr['foreignKeysTo'][0]['attribute']['id'] == column_id_1:
                    print('okay') 
                    if self.delete_results==True:
                        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
                        if not resp.ok:
                            raise Exception(resp.text)
                    return
        raise Exception("workflow was not successful, the dataset was not created")

    def run_workflow_custom_fk(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "Ingestion_Update_And_Publish",
                "read_type": "SOURCE_FILE",
                "read_format": "csv",
                "read_options": {"delimiter": ";", "header": "true"},
                "source_files": ["usernames"],
                "write_type": "DELTA"
            }),
            "title":"Ingestion_Update_And_Publish",
        }
        files = {
            'usernames': ('usernames.csv', open(os.path.dirname(__file__) + '/test/usernames.csv', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}", json={'index':False, 'with_thread':False}, timeout=300)
        if not resp.ok:
            raise Exception(resp.text)
        self.data_holder['workflow_join_dataset']=dataset
        column_id_1 = None
        column_id_2 = None
        for attr in self.data_holder['dataset']['schema']['entities'][0]['attributes']:
            if attr['name']=='Identifier':
                column_id_1 = attr['id']
        for attr in self.data_holder['workflow_join_dataset']['schema']['entities'][0]['attributes']:
            if attr['name']=='Identifier':
                column_id_2 = attr['id']
        name = "Dataset from workflow"
        result = [{"type":"export","x":561,"y":119,"name":"1234","target":"HDFS","isPolymorph":False,"setFk":False,"setPk":False,"auto":False,"write_type":"DEFAULT","input":[{"type":"join","x":314,"y":133,"input":[{"input":[{"type":"data_source","x":139,"y":52,"uid":self.data_holder['workflow_join_dataset']['id']}],"column":"Identifier","columnID":column_id_2,"isJoinInput":True},{"input":[{"type":"data_source","x":207,"y":229,"uid":self.data_holder['dataset']['id']}],"column":"Identifier","columnID":column_id_1,"isJoinInput":True}]}]}]
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/workflow", json=result, timeout=600)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['workflow_join_dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        for attr in dataset['schema']['entities'][0]['attributes']:
            if attr['name']=='Identifier':
                if attr['isFk'] == False:
                    print('okay')
                    if self.delete_results==True:
                        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
                        if not resp.ok:
                            raise Exception(resp.text)
                    return
        raise Exception("workflow was not successful, the dataset was not created")

    def run_query(self, params):
        result = {
            'session_id': '',
            'query': f"SELECT * FROM {self.data_holder['dataset']['id']}",
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/query", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if j['header'] == ['Username', 'Identifier', 'Firstname', 'Lastname'] and len(j['body']) != 0:
            print('okay')
        else:
           raise Exception("result data is not the same as input")

    def run_query_and_save(self, params):
        result = {
            'session_id': '',
            'query': f"SELECT * FROM {self.data_holder['dataset']['id']}",
            'is_save':True,
            'datasetname':'Querytest',
            'is_polymorph':True,
            'write_type':'DELTA',
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/query", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = None
        for ds in resp.json():
            if ds['title']==result['datasetname']:
                dataset = ds
        if dataset != None:
            self.data_holder['dataset_lineage'] = dataset
            print('okay')
            return
        raise Exception('saving query was not successful')

    def polymorphy_and_lineage(self, params):
        if self.data_holder['dataset']['id'] in self.data_holder['dataset_lineage']['lineage'] and self.data_holder['dataset_lineage']['polymorph'][0]['id']==self.data_holder['dataset']['id']:
            print('okay')
            return
        raise Exception('lineage and ploymorphism are not correctly detected')
    
    def ingest_file_with_lineage(self, params):
        self.ingest_file(None, True, '1', False)
        self.ingest_file(None, True, '2', True)

        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset_file_lineage_1']['id']}/tags", json={
            'annotation': '<http://www.co-ode.org/ontologies/pizza/pizza.owl#HamTopping>',
            'ontology_id': f'{self.data_holder["ontology"]["id"]}',
            'title': "test"
        })
        if not resp.ok:
            raise Exception(resp.text)

        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset_file_lineage_1']['id']}", json={'index':False, 'with_thread':False}, timeout=300)
        if not resp.ok:
            raise Exception(resp.text)

        file = self.data_holder['dataset_file_lineage_1']['schema']['files'][0].copy()
        result = {
            "description": 'This is a test description',
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset_file_lineage_1']['id']}/files/{file['id']}", json=result)
        if not resp.ok:
            raise Exception(resp.text)

        db.cypher_query("MATCH (a:Dataset), (b:Dataset) WHERE a.uid = '"+self.data_holder['dataset_file_lineage_2']['id']+"' AND b.uid = '"+self.data_holder['dataset_file_lineage_1']['id']+"' CREATE (a)-[r:HAS_LINEAGE{version:0}]->(b)")
        
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset_file_lineage_2']['id']}/run-ingestion")
        dataset = {}
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="UNSTRUCTURED" and len(dataset['schema']['files'])==1 and dataset['schema']['files'][0]['filename']=='logo.png' and dataset['schema']['files'][0]['description']==result['description'] and dataset['lineage'][0]==self.data_holder['dataset_file_lineage_1']['id']:
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or the files were not added correctly")
        
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset_file_lineage_1']['id']}")
            if not resp.ok:
                raise Exception(resp.text)

    def mark_dataset_as_favorite(self, params):
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/favorite")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/favorites")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==1:
            print('okay')
        else:
            raise Exception('favorite was not set correctly')
    
    def get_logs_of_dataset(self, params):
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/logs")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==0:
            raise Exception('the logging is not working properly')
        else:
            print('okay')

    def add_recommendation(self, params):
        result = {
            'id_of_linked_dataset': self.data_holder['dataset_unstructured']['id'],
            'description': "Test description",
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/recommendations", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        for rec in j:
            if rec['customLinkDescription']==result['description'] and rec['id']==self.data_holder['dataset_unstructured']['id']:
                print('okay')
                return 
        raise Exception('the linking was not successful')
    
    def edit_recommendation(self, params):
        result = {
            'id_of_linked_dataset': self.data_holder['dataset_unstructured']['id'],
            'description': "Test description1234",
        }
        resp = self.put(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/recommendations", json=result)
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        for rec in j:
            if rec['customLinkDescription']==result['description'] and rec['id']==self.data_holder['dataset_unstructured']['id']:
                print('okay')
                self.data_holder['link_description']=result['description']
                return 
        raise Exception('the change of the description for the link was not successful')

    def remove_recommendation(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/recommendations?id_of_linked_dataset={self.data_holder['dataset_unstructured']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        for rec in j:
            if rec['customLinkDescription']==self.data_holder['link_description'] and rec['id']==self.data_holder['dataset_unstructured']['id']:
                raise Exception('the link was not removed successful')
        print('okay')
        del self.data_holder['link_description']
    
    def check_dashboard(self, params):
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/favorites")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/logs/error")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/logs/access")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/alive")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/stats")
        if not resp.ok:
            raise Exception(resp.text)
    
    def unmark_dataset_as_favorite(self, params):
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}/favorite")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/favorites")
        if not resp.ok:
            raise Exception(resp.text)
        j = resp.json()
        if len(j)==0:
            print('okay')
        else:
            raise Exception('favorite was not set correctly')
    
    def remove_unpublished_datasets(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset_lineage']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        print("okay")

    def remove_published_datasets(self, params):
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        print("okay")
        resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{self.data_holder['dataset_unstructured']['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        print("okay")
    
    def steam_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_CSV_Default",
                "id_column": "appid",
                "read_type": "SOURCE_FILE",
                "read_format": "csv",
                "read_options": {"delimiter": ",", "header": "true", "inferSchema": "true"},
                "source_files": ["steam"],
                "write_type": "DEFAULT"
            }),
            "title":"[TEST]Ingestion_CSV_Default",
        }
        files = {
            'steam': ('steam.csv', open(os.path.dirname(__file__) + '/test/datasets/steam/steam.csv', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if (dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1 and '.csv' in self.settings.server.fileendings_semistructured) or (dataset['schema']['type']=="STRUCTURED" and len(dataset['schema']['entities'])==1 and '.csv' not in self.settings.server.fileendings_semistructured):
            if len(dataset['schema']['entities'][0]['attributes'])==18 and dataset['schema']['entities'][0]['countOfRows']==27075:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='appid':
                        if attr['isPk']==False:
                            raise Exception("result is classified uncorrect or not all attributes were added correctly")
            else:
                raise Exception("result is classified uncorrect or not all attributes were added correctly")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all attributes were added correctly")
        resp = self.patch(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}", json={'index':False, 'with_thread':False}, timeout=300)
        if not resp.ok:
            raise Exception(resp.text)

        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/profiling")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        abort = 0
        attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
        while "stats" not in attribute and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()
            attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
            abort+=1
            sleep(4)
        if attribute['stats']:
            for attr in dataset['schema']['entities'][0]['attributes']:
                if attr['name'] == 'developer':
                    if attr['stats']['type']=='NOMINAL' and attr['stats']['completeness']==1.0 and attr['stats']['dataType']=='String':
                        pass
                    else:
                        raise Exception("the profiling was not successful")
                if attr['name'] == 'genres':
                    if attr['stats']['type']=='NOMINAL' and attr['stats']['completeness']==1.0 and attr['stats']['dataType']=='String':
                        pass
                    else:
                        raise Exception("the profiling was not successful")
                if attr['name'] == 'appid':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['dataType']=='Integral' and attr['stats']['mean']==596203.5086611265 and attr['stats']['maximum']==1069460 and attr['stats']['minimum']==10 and attr['stats']['sum']==16142209997:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
                if attr['name'] == 'average_playtime':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['dataType']=='Integral' and attr['stats']['mean']==149.8625300092336 and attr['stats']['maximum']==190625 and attr['stats']['minimum']==0 and attr['stats']['sum']==4057528:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
            print("okay")
        else:
            raise Exception("the profiling was not successful")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
    
    def woogles_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_JSON_Delta",
                "id_column": "players.user_id",
                "read_type": "SOURCE_FILE",
                "read_format": "json",
                "read_options": {"multiLine": "true"},
                "source_files": ["woogles"],
                "write_type": "DELTA"
            }),
            "title":"[TEST]Ingestion_JSON_Delta",
        }
        files = {
            'woogles': ('woogles.json', open(os.path.dirname(__file__) + '/test/datasets/woogles/woogles.json', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1:
            if len(dataset['schema']['entities'][0]['attributes'])==13 and dataset['schema']['entities'][0]['countOfRows']==500:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='players':
                        for a in attr['attributes']:
                            if a['name']=='user_id':
                                if a['isPk']==False:
                                    raise Exception("result is classified uncorrect or not all files are added correct")
            else:
                raise Exception("result is classified uncorrect or not all attributes were added correctly")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all attributes were added correctly")
        
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/profiling")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        abort = 0
        attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
        while "stats" not in attribute and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()
            attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
            abort+=1
            sleep(4)
        if attribute['stats']:
            for attr in dataset['schema']['entities'][0]['attributes']:
                if attr['name'] == 'game_request':
                    for a in attr['attributes']:
                        if a['name'] == 'player_vs_bot':
                            if a['stats']['type']=='NOMINAL' and a['stats']['completeness']==1.0 and a['stats']['dataType']=='Boolean':
                                pass
                            else:
                                raise Exception("the profiling was not successful")
                        if a['name'] == 'max_overtime_minutes':
                            if a['stats']['type']=='NUMERIC' and a['stats']['completeness']==1.0 and a['stats']['dataType']=='Integral' and a['stats']['mean']==1.756 and a['stats']['minimum']==0 and a['stats']['maximum']==10 and a['stats']['sum']==3512:
                                pass
                            else:
                                raise Exception("the profiling was not successful")
                if attr['name'] == 'time_control_name':
                    if attr['stats']['type']=='NOMINAL' and attr['stats']['completeness']==1.0:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
                if attr['name'] == 'game_id':
                    if attr['stats']['type']=='NOMINAL' and attr['stats']['dataType']=='String':
                        pass
                    else:
                        raise Exception("the profiling was not successful")
            print("okay")
        else:
            raise Exception("the profiling was not successful")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)

    def sedar_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_Files", 
                "read_type": "DATA_FILE", 
                "source_files": [ "sedar", "sedar_paper" ], 
            }),
            "title":"[TEST]Test_Files",
        }
        files = {
            'sedar': ('sedar.mp4', open(os.path.dirname(__file__) + '/test/datasets/sedar/SEDAR.mp4', 'rb')),
            'sedar_paper': ('sedar_paper.pdf', open(os.path.dirname(__file__) + '/test/datasets/sedar/SEDAR_PAPER.pdf', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="UNSTRUCTURED" and len(dataset['schema']['files'])==2:
            for file in dataset['schema']['files']:
                if file['filename'] != 'sedar_paper.pdf' and file['filename'] != 'sedar.mp4':
                    raise Exception("result is classified uncorrect or not all files are added correct")
                if file['filename'] == 'sedar_paper.pdf':
                    if file['properties']['dc:format'] == 'application/pdf; version=1.5' and file['properties']['dc:creator'] == 'Sayed Hoseini, Marcel Thiel, Alexander Martin, and Christoph Quix' and file['properties']['dc:title'] == 'SEDAR: A Semantic Data Reservoir for Heterogeneous Datasets with Versioning and Semantic Linking':
                        pass
                    else:
                        raise Exception("result is classified uncorrect or not all files are added correct")
                if file['filename'] == 'sedar.mp4':
                    if file['properties']['Content-Type'] == 'video/mp4' and file['properties']['xmpDM:duration'] == '300.54':
                        pass
                    else:
                        raise Exception("result is classified uncorrect or not all files are added correct")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all files are added correct")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)

    
    def spotify_good_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_JSON_Delta",
                "id_column": "audio_features.id",
                "read_type": "SOURCE_FILE",
                "read_format": "json",
                "read_options": {"multiLine": "true"},
                "source_files": ["good"],
                "write_type": "DELTA"
            }),
            "title":"[TEST]Ingestion_JSON_Delta",
        }
        files = {
            'good': ('good.json', open(os.path.dirname(__file__) + '/test/datasets/spotify_recommendation/good.json', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1:
            if len(dataset['schema']['entities'][0]['attributes'])==1 and dataset['schema']['entities'][0]['countOfRows']==1:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='audio_features':
                        for a in attr['attributes']:
                            if a['name']=='id':
                                if a['isPk']==False:
                                    raise Exception("result is classified uncorrect or not all files are added correct")
            else:
                raise Exception("result is classified uncorrect or not all attributes were added correctly")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all attributes were added correctly")
        
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/profiling")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        abort = 0
        attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
        while "stats" not in attribute and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()
            attribute = dataset['schema']['entities'][0]['attributes'][0]['attributes'][0].copy()
            abort+=1
            sleep(4)
        if attribute['stats']:
            for attr in dataset['schema']['entities'][0]['attributes'][0]['attributes']:
                if attr['name'] == 'valence':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['dataType']=='Fractional' and attr['stats']['mean']==0.5635479999999999:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
                if attr['name'] == 'duration_ms':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['maximum']==356347.0 and attr['stats']['standardDeviation']==42034.410610901876:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
            print("okay")
        else:
            raise Exception("the profiling was not successful")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
    
    def spotify_dislike_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_JSON_Delta",
                "id_column": "audio_features.id",
                "read_type": "SOURCE_FILE",
                "read_format": "json",
                "read_options": {"multiLine": "true"},
                "source_files": ["dislike"],
                "write_type": "DELTA"
            }),
            "title":"[TEST]Ingestion_JSON_Delta",
        }
        files = {
            'dislike': ('dislike.json', open(os.path.dirname(__file__) + '/test/datasets/spotify_recommendation/dislike.json', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1:
            if len(dataset['schema']['entities'][0]['attributes'])==1 and dataset['schema']['entities'][0]['countOfRows']==1:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='audio_features':
                        for a in attr['attributes']:
                            if a['name']=='id':
                                if a['isPk']==False:
                                    raise Exception("result is classified uncorrect or not all files are added correct")
            else:
                raise Exception("result is classified uncorrect or not all attributes were added correctly")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all attributes were added correctly")
        
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/profiling")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        abort = 0
        attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
        while "stats" not in attribute and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()
            attribute = dataset['schema']['entities'][0]['attributes'][0]['attributes'][0].copy()
            abort+=1
            sleep(4)
        if attribute['stats']:
            for attr in dataset['schema']['entities'][0]['attributes'][0]['attributes']:
                if attr['name'] == 'valence':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['dataType']=='Fractional' and attr['stats']['mean']==0.4200357894736844:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
                if attr['name'] == 'duration_ms':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['maximum']==655213.0 and attr['stats']['standardDeviation']==78815.79314084587:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
            print("okay")
        else:
            raise Exception("the profiling was not successful")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
    
    def spotify_csv_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_CSV_Default",
                "id_column": "appid",
                "read_type": "SOURCE_FILE",
                "read_format": "csv",
                "read_options": {"delimiter": ",", "header": "true", "inferSchema": "true"},
                "source_files": ["data"],
                "write_type": "DEFAULT"
            }),
            "title":"[TEST]Ingestion_CSV_Default",
        }
        files = {
            'data': ('data.csv', open(os.path.dirname(__file__) + '/test/datasets/spotify_recommendation/data.csv', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if (dataset['schema']['type']=="SEMISTRUCTURED" and len(dataset['schema']['entities'])==1 and '.csv' in self.settings.server.fileendings_semistructured) or (dataset['schema']['type']=="STRUCTURED" and len(dataset['schema']['entities'])==1 and '.csv' not in self.settings.server.fileendings_semistructured):
            if len(dataset['schema']['entities'][0]['attributes'])==14 and dataset['schema']['entities'][0]['countOfRows']==195:
                for attr in dataset['schema']['entities'][0]['attributes']:
                    if attr['name']=='energy':
                        if attr['dataType']=='DoubleType' and attr['dataTypeInternal']=='DoubleType' and attr['containsPII']==False:
                            pass
                        else:
                            raise Exception("result is classified uncorrect or not all attributes were added correctly")
                    if attr['name']=='liked':
                        if attr['dataType']=='IntegerType' and attr['dataTypeInternal']=='IntegerType' and attr['containsPII']==False:
                            pass
                        else:
                            raise Exception("result is classified uncorrect or not all attributes were added correctly")
            else:
                raise Exception("result is classified uncorrect or not all attributes were added correctly")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all attributes were added correctly")
        
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/profiling")
        if not resp.ok:
            raise Exception(resp.text)
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        abort = 0
        attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
        while "stats" not in attribute and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()
            attribute = dataset['schema']['entities'][0]['attributes'][0].copy()
            abort+=1
            sleep(4)
        if attribute['stats']:
            for attr in dataset['schema']['entities'][0]['attributes']:
                if attr['name'] == 'tempo':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['dataType']=='Fractional' and attr['stats']['sum']==23611.80400000002:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
                if attr['name'] == 'energy':
                    if attr['stats']['type']=='NUMERIC' and attr['stats']['maximum']==0.996 and attr['stats']['standardDeviation']==0.25942804599061037:
                        pass
                    else:
                        raise Exception("the profiling was not successful")
            print("okay")
        else:
            raise Exception("the profiling was not successful")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)
    

    def used_papers_dataset(self, params):
        data = {"datasource_definition": json.dumps({
                "name": "[TEST]Ingestion_Files", 
                "read_type": "DATA_FILE", 
                "source_files": [ "bizer-heath-berners-lee-ijswis-linked-data", "Coining_goldMEDAL", "Metadata_Systems_for_Data_Lakes", "On_Data_Lake_Architectures"], 
            }),
            "title":"[TEST]Test_Files",
        }
        files = {
            'bizer-heath-berners-lee-ijswis-linked-data': ('bizer-heath-berners-lee-ijswis-linked-data.pdf', open(os.path.dirname(__file__) + '/test/datasets/papers/bizer-heath-berners-lee-ijswis-linked-data.pdf', 'rb')),
            'Coining_goldMEDAL': ('Coining_goldMEDAL.pdf', open(os.path.dirname(__file__) + '/test/datasets/papers/Coining_goldMEDAL.pdf', 'rb')),
            'Metadata_Systems_for_Data_Lakes': ('Metadata_Systems_for_Data_Lakes.pdf', open(os.path.dirname(__file__) + '/test/datasets/papers/Metadata_Systems_for_Data_Lakes.pdf', 'rb')),
            'On_Data_Lake_Architectures': ('On_Data_Lake_Architectures.pdf', open(os.path.dirname(__file__) + '/test/datasets/papers/On_Data_Lake_Architectures.pdf', 'rb'))
        }
        resp = self.post(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/create", data=data, files=files)
        if not resp.ok:
            raise Exception(resp.text)
        dataset = resp.json()
        resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}/run-ingestion")
        dataset['datasource'] = resp.json()
        if not resp.ok:
            raise Exception(resp.text)
        abort = 0
        while "schema" not in dataset and abort!=self.abort_counter:
            print('waiting')
            resp = self.get(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets?get_unpublished=True")
            if not resp.ok:
                raise Exception(resp.text)
            dataset = resp.json()[0]
            error = dataset['datasource']['ingestions'][0]['error']
            if error!=None:
                raise Exception(error)
            abort+=1
            sleep(4)
        if dataset['schema']['type']=="UNSTRUCTURED" and len(dataset['schema']['files'])==4:
            for file in dataset['schema']['files']:
                if file['filename'] != 'bizer-heath-berners-lee-ijswis-linked-data.pdf' and file['filename'] != 'Coining_goldMEDAL.pdf' and file['filename'] != 'Metadata_Systems_for_Data_Lakes.pdf' and file['filename'] != 'On_Data_Lake_Architectures.pdf':
                    raise Exception("result is classified uncorrect or not all files are added correct")
                if file['filename'] == 'bizer-heath-berners-lee-ijswis-linked-data.pdf':
                    if file['properties']['dc:format'] == 'application/pdf; version=1.4' and file['properties']['dc:title'] == 'Linked Data - The Story So Far' and file['properties']['xmpTPg:NPages']=='26':
                        pass
                    else:
                        raise Exception("result is classified uncorrect or not all files are added correct")
                if file['filename'] == 'Coining_goldMEDAL.pdf':
                    if file['properties']['dc:format'] == 'application/pdf; version=1.5' and file['properties']['dc:title'] == 'Coining goldMEDAL: A New Contribution toData Lake Generic Metadata Modeling' and file['properties']['dc:creator'] =='Étienne Scholly, Pegdwendé N. Sawadogo, Pengfei Liu, Javier A. Espinosa-Oviedo, Cécile Favre, Sabine Loudcher, Jérôme Darmont, and Camille Noûs':
                        pass
                    else:
                        raise Exception("result is classified uncorrect or not all files are added correct")
                if file['filename'] == 'Metadata_Systems_for_Data_Lakes.pdf':
                    if file['properties']['dc:format'] == 'application/pdf; version=1.4' and len(file['properties']['dc:subject'])==2 and file['properties']['dc:title']=='Metadata Systems for Data Lakes: Models and Features' and file['properties']['dc:creator'] == 'Pegdwendé Sawadogo, Etienne Scholly, Cécile Favre, Eric Ferey, Sabine Loudcher, Jérôme Darmont':
                        pass
                    else:
                        raise Exception("result is classified uncorrect or not all files are added correct")
                if file['filename'] == 'On_Data_Lake_Architectures.pdf':
                    if file['properties']['dc:format'] == 'application/pdf; version=1.5' and file['properties']['xmpTPg:NPages'] == '25':
                        pass
                    else:
                        raise Exception("result is classified uncorrect or not all files are added correct")
            print("okay")
        else: 
            raise Exception("result is classified uncorrect or not all files are added correct")
        if self.delete_results==True:
            resp = self.delete(path=f"/api/v{self.api_version}/workspaces/{self.data_holder['workspace']['id']}/datasets/{dataset['id']}")
            if not resp.ok:
                raise Exception(resp.text)