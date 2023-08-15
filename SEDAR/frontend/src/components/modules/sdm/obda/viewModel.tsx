import { action, computed, makeObservable, observable, IObservableArray } from "mobx";
import React from "react";
import { IComponents, IStats } from '../../../../models/components'
import ContentStore from '../../../../models/contentStore'
import appStore from "../../../../stores/app.store";
import StoreStatus from '../../../../models/storeStatus.enum'
import userStore from '../../../../stores/user.store'
import View from "./obda";
import workspacesStore from '../../../../stores/workspaces.store'
import { IWorkspace } from "../../../../models/workspace";

class ViewModel extends ContentStore {
  components: IObservableArray<IComponents>;
  @observable lastChecked: string = '';
  private refreshIntervalId: number | null = null;
  ontologies: IObservableArray<object>;
  mappings: IObservableArray<object>;
  @observable currentWorkspace: IWorkspace = undefined;
  @observable ontologyToQuery: string = 'None';
  @observable graphnameOfSelectedOntology: string = 'None';
  @observable isOntopRunning: boolean;
  @observable queryString: string = '';

  @observable mapping: string = '';
  @action async setMapping(value: string) {
    this.mapping = value;
  }

  @observable mappingname: string = '';
  @action async setMappingName(value: string) {
    this.mappingname = value;
  }

  @observable mappingdescription: string = '';
  @action async setMappingDescription(value: string) {
    this.mappingdescription = value;
  }

  @observable mappingFile: string = '';
  @action async setMappingFile(value: string) {
    this.mappingFile = value;
  }

  @observable editMapping: boolean = false;
  @action async setEditMapping(value: boolean) {
    this.editMapping = value;
  }

  @observable ontologyFile: string = '';
  @action async setOntologyFile(value: string) {
    this.ontologyFile = value;
  }

  @observable datasourcetitle: string = '';
  @action async setDatasourceTitle(value: string) {
    this.datasourcetitle = value;
  }

  @observable obdaqueryString: string = '';
  @action async setObdaQueryString(value: string) {
    this.obdaqueryString = value;
  }

  @computed get canStartOnTop(): boolean {
    return (this.mappingFile != '' && this.ontologyFile != '')
  }

  constructor() {
    super();
    this.ontologies = observable.array([]);
    this.mappings = observable.array([]);
    this.components = observable.array([] as IComponents[]);
    this.isFullscreen = true;
    makeObservable(this);
    this.initialize();
  }

  async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
      this.alive();
      this.getMappings();
      this.OnTopConfigurations();
      this.getCurrentWorkspace();
      this.alive_ontop();
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
      this.refresh_all.bind(this), 30000
    );
  }
  public refresh_all() {
    this.alive();
    this.alive_ontop();
    this.getMappings();
  }

  /**
* Function for getting the complete data for the current workspace.
*/
  public async getCurrentWorkspace() {
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/workspaces/${workspacesStore.currentWorkspace.id}`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const cW = await response.json();
      this.currentWorkspace = cW as IWorkspace;
      // await this.getUsers();
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }


  /**
* Function for getting all health informations of the software components.
*/
  async alive() {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL + '/api/alive-hive',
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
    this.lastChecked = ((today.getHours() < 10 ? '0' : '') + today.getHours()) + ':' + ((today.getMinutes() < 10 ? '0' : '') + today.getMinutes()) + ':' + ((today.getSeconds() < 10 ? '0' : '') + today.getSeconds());
  }


  async initialize_hive() {
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/initialize_ontop`,
      {
        method: "POST",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())

  }

  async stop_hive() {
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/initialize_ontop`,
      {
        method: "DELETE",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())

  }

  async OnTopConfigurations() {
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/OnTopConfigurations`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json());
    this.ontologies = json.ontologies;
  }

  async StartOnTop() {

    if (!workspacesStore.currentWorkspace)
      throw new Error("Current workspace must be set.");
    const formData = new FormData();
    formData.append("mappings", this.mappingFile);
    formData.append("ontology_id", this.ontologyFile);
    const configs = {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: formData,
    };
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/ontop/mapping_parser`,
      configs
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = await response.json()
    return json
  }

  async alive_ontop() {
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/CheckOnTop`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())
    this.isOntopRunning = json['is_running'];
  }

  getExample() {
    this.queryString = `SELECT ?subject ?predicate ?object
      WHERE {
        GRAPH ${this.ontologyToQuery == 'None' ? '?g' : this.graphnameOfSelectedOntology} {
          ?subject ?predicate ?object
        }
      }
      LIMIT 25
      `;
  }

  async addDataSource() {
    const formData = new FormData();
    formData.append("query_string", this.obdaqueryString);
    formData.append("title", this.datasourcetitle);

    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/ontop/mapping_parser`,
      {
        method: "PUT",
        headers: { Accept: "application/json",},
        credentials: "include",
        body: formData,
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())

  }

  async addMappingToWorkspace() {
    const formData = new FormData();
    formData.append("workspace_id", this.currentWorkspace.id);
    formData.append("mappings_file", this.mapping);
    formData.append("name", this.mappingname);
    formData.append("description", this.mappingdescription);

    if (this.editMapping == true) {
      formData.append("mapping_id", this.mappingFile);
    }
    const configs = {
      method: "POST",
      // credentials: "include", // ??????
      headers: {
        Accept: "application/json",
      },

      body: formData,
    };

    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/mappings`,
      configs
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())

  }

  async getMappings() {
    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/mappings`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())
    // console.log("mappings", json[0]._id.$oid)
    this.mappings = json;

  }

  async deleteMapping() {
    const formData = new FormData();
    formData.append("mapping_id", this.mappingFile);

    const configs = {
      method: "DELETE",
      // credentials: "include", // ??????
      headers: {
        Accept: "application/json",
      },

      body: formData,
    };

    const response = await fetch(
      `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/obda/mappings`,
      configs
    );
    if (!response.ok) {
      alert(await response.text());
      throw new Error(response.statusText)
    };
    const json = (await response.json());

  }



  getView = () => <View viewModel={this} />;
}

export default ViewModel;
