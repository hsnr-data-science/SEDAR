import { action, computed, IObservableArray, makeObservable, observable } from 'mobx'
import React from 'react'
import { AutocompleteItem } from '../../../models/autocomplete'
import ContentStore from '../../../models/contentStore'
import { IDataset, ITag } from '../../../models/dataset'
import { IDatasource } from '../../../models/datasource'
import { IFileUpload } from '../../../models/fileUpload'
import { IAttribute } from '../../../models/schema'
import StoreStatus from '../../../models/storeStatus.enum'
import { IUser } from '../../../models/user'
import searchStore from '../../../stores/search.store'
import workspacesStore from '../../../stores/workspaces.store'
import View from './main.component'
import { IWorkspace } from "../../../models/workspace";
import { toJS } from 'mobx'
import { IOntology } from "../../../models/ontology";
import axios from "axios";
/**
* ViewModel for the ingestion view.
*/
class ViewModel extends ContentStore {
  datasets: IObservableArray<IDataset> = undefined;
  users: IObservableArray<IUser> = undefined;
  lineage: IObservableArray<IDataset> = undefined;
  @observable datasourceDefinition: string = '';
  @observable datasetTitle: string = '';
  @observable datasetId: string = '';
  @observable example: string = '';
  @observable datasetPublish: IDataset = {} as IDataset;
  @observable customView: boolean = false;
  data: IFileUpload[];
  plugin: IFileUpload[];
  private refreshIntervalId: number | null = null;
  @observable progress: number = 0;

  @observable tagOntologyProperty: AutocompleteItem | null = null;
  @observable tag: ITag = {} as ITag;
  @observable ontologyToVisualize: string = '';
  @observable iriOfOntologyToVisualize: string = process.env.WEBVOWL_URL;
  @observable currentWorkspace: IWorkspace = undefined;

  @action setTagOntologyProperty(newValue: AutocompleteItem | null) {
    this.tagOntologyProperty = newValue;
  }

  @action async setProgress(value: number) {
    this.progress = value;
  }

  /*
  ------------------------------------------------------------------
  Init
  ------------------------------------------------------------------
  */

  constructor() {
    super()
    makeObservable(this);
    this.datasets = observable.array([] as IDataset[]);
    this.users = observable.array([] as IUser[]);
    this.lineage = observable.array([] as IDataset[]);
    this.currentWorkspace = workspacesStore.currentWorkspace;
    this.initialize();
  }

  async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
        await this.getDatasources();
        await this.getOntologies();
        this.setStatus(StoreStatus.ready);
        this.getAllUsersOfWorkspace();
    } catch (ex) {
        this.setStatus(StoreStatus.failed);
    }
  }
  
  /**
  * Function for deregister the hook on exit.
  */
  public deregisterIntevals() {
    if (this.refreshIntervalId !== null)
      window.clearInterval(this.refreshIntervalId);
    this.refreshIntervalId = null;
  }
  
  /**
  * Function to register a hook to refresh the list of datasets
  * every 10 seconds. 
  * This function will be called by effect, to register the hook.
  */
  public registerIntevals() {
    this.deregisterIntevals();
    this.refreshIntervalId = window.setInterval(
      this.getDatasources.bind(this),
      1000
    );
  }

  /**
  * Function that computes if all required informations are given 
  * and the user can proceed with the dialog.
  */
  @computed get pageOneAndTwoDisabled() {
    if(this.datasetPublish!=undefined){
      if(this?.datasetPublish?.title!='' && this?.datasetPublish?.description!=''&& this?.datasetPublish?.tags?.length>0){
        return false;
      }
      else{
        return true;
      }
    }
    else{
      return false;
    }
  }

  /**
  * Function that computes if all required informations are given 
  * and the user can proceed with the dialog.
  */
  @computed get pageThreeDisabled() {
    if(this.datasetPublish!=undefined){
      if(this.pageOneAndTwoDisabled == false && this?.datasetPublish.schema!=undefined){
        return false;
      }
      else{
        return true;
      }
    }
    else{
      return false;
    }
  }

  /**
  * Function for getting all ontologies of the current workspace.
  */
   public async  getOntologies(){
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/ontologies`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const o = await response.json();
    this.currentWorkspace.ontologies = o as IOntology[];
  }

    /**
  * Function for setting the current ontology.
  * @param {string} newValue name of the ontology.
  */
     setOntologyToVisualize(newValue: string){
      this.ontologyToVisualize = newValue;
      this.iriOfOntologyToVisualize=process.env.WEBVOWL_URL+"/#iri="+process.env.IRI_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/workspaces/'+workspacesStore.currentWorkspace.id+"/ontologies/iri/"+newValue;
    }

  /**
  * Function for getting all unpublished datasets 
  * for the current loggedin user.
  */
  async getDatasources() {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets?get_unpublished=True`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())
    this.datasets.replace(json as IDataset[]);
    if(this.datasetPublish.id!=undefined){
      const data = this.datasets.find((d)=>d.id==this.datasetPublish.id)
      if(data.schema != undefined && this.datasetPublish.schema == undefined){
        this.datasetPublish.schema = data.schema
      }
    }
  }

  

  /**
  * Function for starting the ingestion. 
  * @param {string} id id of the dataset that should start.
  */
  async runIngestion(id:string) {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${id}/run-ingestion`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    if(this.refreshIntervalId<9000){
      const json = (await response.json())
      this.datasets.find((d) => d.id==id).datasource=json as IDatasource;
    }
  }

  /**
  * Function for adding a datasource definition and create a new dataset. 
  */
  async postDatasource() {
    try {
      const formData = new FormData();
      formData.append("title", this.datasetTitle);
      this.data.forEach((d) =>{
        formData.append(d.name, d.data);
      })
      this.plugin.forEach((p) =>{
        formData.append(p.name, p.data);
      })
      formData.append("datasource_definition", JSON.stringify(JSON.parse(this.datasourceDefinition.toString())));
      const response = await axios.request({
        url: process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/create`,
        method: "POST",
        headers: {
          Accept: "application/json",
          },
        onUploadProgress: (progressEvent) => {
            const progress = (progressEvent.loaded / progressEvent.total);
            this.progress = progress;
          },
        withCredentials: true,
        data: formData,
      });
      if (!response.status) throw new Error(response.statusText);
      this.datasourceDefinition = '';
      const json = (await response.data)
      if(this.refreshIntervalId<9000){
        this.datasets.push(json as IDataset);
        this.datasets.reverse();
      }
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for getting the data of a parent dataset. 
  * @param {string} id id of the dataset that should loaded.
  */
  async getDatasetsForLineage(id:string) {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+id+'?schema_only=False',
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.lineage.push(json as IDataset);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for editing the schema attribute of a dataset. 
  * @param {string} attribute_id id of the attribute in the schema.
  * @param {string} datatype datatype of the attribute.
  */
  async putAttribute(attribute_id:string, datatype:string){
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id+'/attributes/'+attribute_id,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            datatype: datatype,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json()) as IAttribute;
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for editing the dataset. 
  */
  async putDataset() {
    try {
      const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id,
      {
        method: "PUT",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: this.datasetPublish.title,
          description: this.datasetPublish.description,
          author: this.datasetPublish.author,
          license: this.datasetPublish.license,
          latitude: this.datasetPublish.latitude,
          longitude: this.datasetPublish.longitude,
          range_start: this.datasetPublish.rangeStart,
          range_end: this.datasetPublish.rangeEnd,
          language: this.datasetPublish.language,
        }),
        credentials: 'include',
      }
      );
      if (!response.ok) throw new Error(response.statusText);
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for deleting a dataset. 
  * @param {string} id id of the dataset that should be deleted.
  */
  async deleteDataset(id:string) {
    try {
      const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+id,
      {
        method: "DELETE",
        credentials: 'include',
      }
      );
      if (!response.ok) throw new Error(response.statusText);
      this.datasets.remove(this.datasets.find((d)=>d.id==id))
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for publishing a dataset. 
  * @param {boolean} index defines whether the dataset should be indexed or not.
  * @param {boolean} profile defines whether the dataset should be profiled or not.
  */
  async publishDataset(index:boolean, profile:boolean) {
    try {
      const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id,
      {
        method: "PATCH",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          index:index,
          profile:profile,
        }),
        credentials: 'include',
      }
      );
      if (!response.ok) throw new Error(response.statusText);
      this.datasets.remove(this.datasets.find((d)=>d.id==this.datasetPublish.id));
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  General Tab
  ------------------------------------------------------------------
  */
  
  /**
  * Function to add a tag to the dataset. 
  * @param {string} id id of the tag.
  */
  async postTag(id:string='') {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id+'/tags',
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: id==''?JSON.stringify({
            title: this.tag.title,
            annotation: this.tagOntologyProperty.value,
            ontology_id: this.tagOntologyProperty.graph
          }):JSON.stringify({
            tag_id: id,
            title: '',
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const tag = (await response.json());
      this.datasetPublish.tags.push(tag as ITag);
      /*if(searchStore.tags.find((t)=>t.id==tag.id)==undefined){
        searchStore.tags.push(tag)
      }*/
      searchStore.getTags();
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function to delete a tag from the dataset. 
  * @param {string} id id of the tag.
  */
  async deleteTag(id:string) {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id+'/tags/'+id,
        {
          method: "DELETE",
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      let t = this.datasetPublish.tags as IObservableArray<ITag>;
      t.remove(this.datasetPublish.tags.find((item) => item.id == id));
      searchStore.getTags();
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  Access Tab
  ------------------------------------------------------------------
  */

  /**
  * Function to get all user of the workspace. 
  */
  public async getAllUsersOfWorkspace(){
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/users`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const users = (await response.json())
      this.users.replace(users as IUser[]);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function to set the status of the dataset. 
  * This can be public or private. If the dataset is
  * private, users in the workspace can be added.
  */
  public async setDatasetStatus(){
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id+'/status', {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      this.datasetPublish.isPublic=!this.datasetPublish.isPublic
      if(this.datasetPublish.isPublic!=true){
        const users = await response.json()
        this.datasetPublish.users = observable.array(users as IUser[]);
        this.datasetPublish.permission = {canRead:true, canWrite:true, canDelete:true};
      }
      else{
        let u = this.datasetPublish.users as IObservableArray;
        u.replace([] as IUser[]);
        this.datasetPublish.permission = undefined;
      }
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }
  
  /**
  * Function to set the status of the dataset. 
  * @param {string} selectedUser email of the user that should be added.
  * @param {boolean} canRead defines whether the user can read or not.
  * @param {boolean} canWrite defines whether the user can write or not.
  * @param {boolean} canDelete defines whether the user can delete or not.
  */
  public async addUserToDataset(selectedUser:string, canRead:boolean, canWrite:boolean, canDelete:boolean) {
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id+'/users', {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email":selectedUser,
          "add":true,
          "can_read":canRead,
          "can_write":canWrite,
          "can_delete":canDelete,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      const user = (await response.json())
      this.datasetPublish.users.push(user as IUser);
    } catch (ex) {
      console.log(ex);
      throw new Error(ex.statusText);
    }
  }
  
  /**
  * Function to remove the access of a given user from the dataset. 
  * @param {string} userToDelete email of the user that should be removed.
  */
  async removeUserFromDataset(userToDelete:string){
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id+'/users', {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email":userToDelete,
          "add":false,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      let u = this.datasetPublish.users as IObservableArray;
      u.remove(this.datasetPublish.users.find((u) => u.email == userToDelete));
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function to edit the permission of a user in the dataset. 
  * @param {string} selectedUser email of the user that should be edited.
  * @param {boolean} canRead defines whether the user can read or not.
  * @param {boolean} canWrite defines whether the user can write or not.
  * @param {boolean} canDelete defines whether the user can delete or not.
  */
  public async updatePermissionForUser(selectedUser:string, canRead:boolean, canWrite:boolean, canDelete:boolean) {
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/`+this.datasetPublish.id+'/users', {
        method: "PUT",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          "email":selectedUser,
          "can_read":canRead,
          "can_write":canWrite,
          "can_delete":canDelete,
        }),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      const user = (await response.json())
      let u = this.datasetPublish.users as IObservableArray;
      u.remove(this.datasetPublish.users.find((u) => u.email == selectedUser));
      this.datasetPublish.users.push(user as IUser);
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  getView = () => <View viewModel={this} />
}


export default ViewModel