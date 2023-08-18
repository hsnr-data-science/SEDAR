import { action, computed, IObservableArray, makeObservable, observable } from 'mobx'
import React from 'react'
import { AutocompleteItem } from '../../../models/autocomplete'
import ContentStore from '../../../models/contentStore'
import { IDataset, ITag } from '../../../models/dataset'
import { IDatasource } from '../../../models/datasource'
import { IFileUpload } from '../../../models/fileUpload'

import StoreStatus from '../../../models/storeStatus.enum'
import workspacesStore from '../../../stores/workspaces.store'
import View from './main.component'
import appStore from '../../../stores/app.store'
import routingStore from "../../../stores/routing.store";
import uuid from 'react-uuid'
/**
* ViewModel for the machine learning tab.
*/
class ViewModel extends ContentStore {

  @observable sessionId: string = uuid() as string;
  @observable experiments: string | null = null;
  @observable experiment_id: string | null = null;
  @observable mlergebnisse;
  @observable datasets = [];
  
  /**
  * Konstruktor
  */
  constructor() {
    super()
    makeObservable(this);
    this.initialize();
  }

  /**
  * Function for initialization
  */
  async initialize() {
    this.getAllDatasets()
    this.setStatus(StoreStatus.initializing);
    try {
    
        this.setStatus(StoreStatus.ready);
    } catch (ex) {
        this.setStatus(StoreStatus.failed);
    }
  }
  

  /**
  * Function for creating an experiment
  */
  public async handleForm(data: FormData){
    try {
      var name = data.get("exp_name");
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/createExperiment`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspacesStore.currentWorkspace.id,
            name: name
          }),
          credentials: 'include',
        }
      );
    if (!response.ok) {
      const text = (await response.text())
      alert("Error" + text);
      throw new Error(response.statusText)};
    const experiments = (await response.json())        
    this.listExperiment()
  
    } catch (ex) {
    this.setStatus(StoreStatus.failed);
    }
  }
  /**
  * Function for listing all experiment associated with the workspace
  */
  public async listExperiment(){
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/listExperiments`,
        {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include'
        }
    );
    if (!response.ok) throw new Error(response.statusText);
    const experiments = (await response.json())

    var erg = "["
    for (var i = 0; i < experiments["experiments"].length; i++) {
     
      if(experiments["experiments"][i]["tags"] != undefined){            
        if(experiments["experiments"][i]["tags"][0]["key"] == "workspace_id" && experiments["experiments"][i]["tags"][0]["value"] == workspacesStore.currentWorkspace.id){
        
          var temp = "";
          if(erg != "["){
          
            temp = temp + ",";
          }

          temp = temp + "{\"experiment_id\":\""+experiments["experiments"][i]["experiment_id"]+"\",\"name\":\""+experiments["experiments"][i]["name"]+"\", \"artifact_location\":\""+experiments["experiments"][i]["artifact_location"]+"\", \"lifecycle_stage\":\""+experiments["experiments"][i]["lifecycle_stage"]+"\"}";
          
          erg = erg +temp;
        } 
      }  
    }
    erg = erg +"]";
    appStore.experiments = erg;
    } catch (ex) {
    this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for deleting an experiment
  */
  public async handleDelete(experiment_id:string){
    try {      
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/deleteExperiment`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experiment_id: experiment_id
          }),
          credentials: 'include',
        }
      );


    if (response.ok) {
      this.listExperiment();
      alert("Experiment gelöscht");
    }
    else{
      this.setStatus(StoreStatus.failed);
    }
  }
  catch{
    alert("Error");
  }
}

  /**
  * Function for transitioning an stage for an deployed model
  */
  public async handleTransition(name:string, version:string, stage:string){
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/handleTransition`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: name,
            version: version,
            stage: stage,
          }),
          credentials: 'include',
        }
      );


    if (!response.ok) throw new Error(response.statusText);
    const experiments = (await response.json())  

    } catch (ex) {
    this.setStatus(StoreStatus.failed);
    alert("Error");
    }
  }

    /**
  * Function for getting all dataset-information
  */
    async getAllDatasets() {    
      try {
        const response = await fetch(
          `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/mlflow/${workspacesStore.currentWorkspace.id}/datasets`,
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = (await response.json())
        this.datasets = json;  
        appStore.allDatasets = json;
      } catch (ex) {
        this.setStatus(StoreStatus.failed);
      }
    }

  getView = () => <View viewModel={this} />
}


export default ViewModel