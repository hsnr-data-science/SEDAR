import { IObservableArray, makeObservable, observable } from 'mobx'
import React from 'react'
import { IComponents, IStats } from '../../../models/components'
import ContentStore from '../../../models/contentStore'
import StoreStatus from '../../../models/storeStatus.enum'
import appStore from '../../../stores/app.store'
import userStore from '../../../stores/user.store'
import View from './main.component'
import workspacesStore from '../../../stores/workspaces.store'

/**
* ViewModel for the dashboard view.
*/
class ViewModel extends ContentStore {
  components: IObservableArray<IComponents>;
  @observable lastChecked: string = '';
  @observable errorLogs: string = undefined;
  @observable accessLogs: string = undefined;
  @observable stats: IStats = undefined;
  private refreshIntervalId: number | null = null;

  /**
  * Constructor
  */
  constructor() {
    super()
    this.components = observable.array([] as IComponents[]);
    makeObservable(this)
    this.initialize();
  }

  /**
  * Function for initialization
  */
  async initialize() {
    this.setStatus(StoreStatus.initializing);
    this.listExperiment();
    this.listRegisteredModels();
    try {
      if(userStore.isAdmin == true)
      {
        this.alive();
      }
      this.setStatus(StoreStatus.ready);
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
  * Function to register a hook to refresh the alive component as well as the
  * error and access log components.
  * The view is refreshed every 30 seconds. 
  * This function will be called by effect, to register the hook.
  */
  public registerIntevals() {
    this.deregisterIntevals();
    this.refreshIntervalId = window.setInterval(
      this.alive.bind(this),
      30000
    );
  }

  /**
  * Function for getting all health informations of the software components.
  */
  private async alive() {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/alive',
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())
    this.components.replace(json['components'] as IComponents[]);
    var today = new Date();
    this.lastChecked = ((today.getHours()<10?'0':'') + today.getHours()) + ':' + ((today.getMinutes()<10?'0':'') + today.getMinutes()) + ':' + ((today.getSeconds()<10?'0':'') + today.getSeconds());
    this.getStats();
    this.getErrorLogs();
    this.getAccessLogs();
  }


  /**
  * Function for listing all experiments in workspace
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
  * Function for listing registered models in the workspace
  */
  public async listRegisteredModels(){
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/${workspacesStore.currentWorkspace.id}/listRegisteredModels`,
        {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include'
        }
    );
    if (!response.ok) throw new Error(response.statusText);    
    const regs = (await response.json())              
    appStore.registeredModels = JSON.stringify(regs);        
    } catch (ex) {
    this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting all error logs.
  */
   private async getStats() {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/stats',
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())
    this.stats=json;
  }

  /**
  * Function for getting all error logs.
  */
  private async getErrorLogs() {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/logs/error',
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const text = (await response.text())
    this.errorLogs=text;
  }

  /**
  * Function for downloading the error logs.
  */
  public async downloadErrorLogs(){
    //https://pretagteam.com/question/materialui-how-to-download-a-file-when-clicking-a-button
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/logs/error/download', {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
        },
        credentials: 'include',
      })
      .then((response) => response.blob())
      .then((blob) => {
          // Create blob link to download
          const url = window.URL.createObjectURL(
            new Blob([blob]),
          );
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            'error.log',
          );

          // Append to html link element page
          document.body.appendChild(link);

          // Start download
          link.click();

          // Clean up and remove the link
          link.parentNode.removeChild(link);
      });
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for getting the access logs.
  */
  private async getAccessLogs() {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/logs/access',
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const text = (await response.text())
    this.accessLogs=text;
  }

  /**
  * Function for downloading the access logs.
  */
  public async downloadAccessLogs(){
    //https://pretagteam.com/question/materialui-how-to-download-a-file-when-clicking-a-button
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/logs/access/download', {
        method: 'GET',
        headers: {
          'Content-Type': 'text/plain',
        },
        credentials: 'include',
      })
      .then((response) => response.blob())
      .then((blob) => {
          // Create blob link to download
          const url = window.URL.createObjectURL(
            new Blob([blob]),
          );
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute(
            'download',
            'access.log',
          );

          // Append to html link element page
          document.body.appendChild(link);

          // Start download
          link.click();

          // Clean up and remove the link
          link.parentNode.removeChild(link);
      });
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  getView = () => <View viewModel={this} />
}


export default ViewModel