import { action, computed, IObservableArray, makeObservable, observable } from 'mobx'
import React from 'react'
import { AutocompleteItem } from '../../../../models/autocomplete'
import ContentStore from '../../../../models/contentStore'
import { IDataset, INotebook } from '../../../../models/dataset'
import { IDatasource } from '../../../../models/datasource'
import { IFileUpload } from '../../../../models/fileUpload'
import { IAttribute } from '../../../../models/schema'
import StoreStatus from '../../../../models/storeStatus.enum'
import { IUser } from '../../../../models/user'
import searchStore from '../../../../stores/search.store'
import workspacesStore from '../../../../stores/workspaces.store'
import View from './main.component'
import appStore from '../../../../stores/app.store'
import uuid from 'react-uuid'
import userStore from '../../../../stores/user.store'

function filterString(string: string): string {
  return string.replace("[", "")
    .replace("(", "")
    .replace("{", "")
    .replace(" ", "")
    .replace("]", "")
    .replace(")", "")
    .replace("}", "")
    .replace("`", "")
    .replace(" ", "");
}


/**
* ViewModel for the run view.
*/
class ViewModel extends ContentStore {

  @observable experiment_id = "";
  @observable datasets = [];
  @observable allDatasets = null;
  @observable sessionId: string = uuid() as string;
  @observable parameters_def = {};
  @observable supervised_image_parameters_def = {};
  @observable unsupervised_image_parameters_def = {};
  @observable runModelNames = {};
  @observable notebookurl = "";
  @observable notebooks = {};
  @observable runs: string | null = null;

  /**
  * Construktor
  */
  constructor(experiment_id: string | null = null) {
    super()
    this.experiment_id = experiment_id;
    this.initialize();
    
    makeObservable(this);
  }

  /**
  * Function for initialization
  */
  async initialize() {
    this.jsonInit();
    this.getAllDatasets();
    this.setStatus(StoreStatus.initializing);
    try {
      if (this.runs == null && this.experiment_id != '' ) await this.searchRuns(this.experiment_id);
      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for initializing all json sources
  */
  async jsonInit() {
    let models = require('../../../../../../mlflow/supervisedModels.json');
    let models2 = require('../../../../../../mlflow/clusterModels.json');
    for (let z = 0; z < models.length; z++) {
      this.parameters_def[models[z]["displayname"]] = models[z]["parameters"];
    }
    for (let z = 0; z < models2.length; z++) {
      this.unsupervised_image_parameters_def[models2[z]["displayname"]] = models2[z]["parameters"];
    }
  }

  /**
  * Function for run deployment
  */
  async deployRun(lrun_id, lartifact_uri, lname) {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/mlflow/deployRun`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspacesStore.currentWorkspace.id,
            run_id: lrun_id,
            artifact_uri: lartifact_uri,
            model_name: lname,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
    alert("Run deployed");
    this.listRegisteredModels();
  }


  /**
  * Function for listing all registered models
  */
  public async listRegisteredModels() {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + '/mlflow/' + workspacesStore.currentWorkspace.id + '/listRegisteredModels',
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
  * Function for adding a new jupyter notebook
  */
  async addJupyterRun(lexperiment_id: string, lmethod: string, lmodel: string, ldatasets, ltitle: string, ldescription: string, lisPublic: boolean, lnbwithDeloy: boolean) {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/mlflow/createJupyterCode`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspacesStore.currentWorkspace.id,
            session_id: this.sessionId,
            experiment_id: lexperiment_id,
            method: lmethod,
            model: lmodel,
            datasets: JSON.stringify(ldatasets),
            title: ltitle,
            description: ldescription,
            is_public: lisPublic,
            withDeploy: lnbwithDeloy
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) {
        alert(response.statusText);
        throw new Error(response.statusText);
      } else {
        const notebook = (await response.json())
        this.notebookurl = process.env.JUPYTERHUB_URL + "/user/" + userStore.username + "/notebooks/" + filterString(workspacesStore.currentWorkspace.title) + "/" + notebook.dataset_title + "/" + notebook.title + ".ipynb";
        return true;
      }
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }

  }


  /**
  * Function for listing all runs in an experiment
  */
  public async searchRuns(experiment_id: string) {
    try {
      const response = await fetch(

        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/mlflow/searchRuns`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            experiment_id: experiment_id
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const temp = (await response.json())
      appStore.runs = JSON.stringify(temp);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for receiving a link to a notebook
  */
  async getNotebook(dataset_id: string, notebook_id: string) {

    this.notebooks[dataset_id + notebook_id] = "loading";
    try {
      const response = await fetch(
        `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${dataset_id}/notebooks`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const notebooks = (await response.json())
      var it_notebooks = observable.array(notebooks as INotebook[]);
      for (var i = 0; i < it_notebooks.length; i++) {
        if (it_notebooks[i].id == notebook_id) {
          this.notebooks[dataset_id + notebook_id] = JSON.stringify(it_notebooks[i]);
          return "success";
        }
      }
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for copying a public notebook from hdfs to the container of the user
  */
  async copyNbFromHDFStoContainer(username: string, item_id: string, dataset_id: string) {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/jupyterhub/copyNbFromHDFStoContainer`,
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            workspace_id: workspacesStore.currentWorkspace.id,
            session_id: this.sessionId,
            dataset_id: dataset_id,
            item_id: item_id,
            username: username,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) { throw new Error(response.statusText); }
      else {
        const erg = (await response.json())
        return erg;
      }
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
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


  /**
  * Function for checking if an container is running
  */
  async checkContainer() {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/jupyterhub/checkContainer`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (response.status != 200) {
        throw new Error(response.statusText)
      }
      else {
        return "running";
      };
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  getView = () => <View viewModel={this} />;
}

export default ViewModel;