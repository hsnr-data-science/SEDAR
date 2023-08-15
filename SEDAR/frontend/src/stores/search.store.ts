import { observable, action, makeObservable, IObservableArray, computed } from "mobx";
import { IDataset, ITag } from "../models/dataset";
import StoreStatus from "../models/storeStatus.enum";
import { IUser } from "../models/user";
import workspacesStore from "./workspaces.store";

/**
* Store for the searching of datasets.
*/
class SearchStore {
  @observable status: StoreStatus = StoreStatus.uninitialized;
  @observable searchQuery: string = '';
  @observable typeOfNotebook: string = '';
  @observable idOfSelectedDataset: string = undefined;
  @observable isSourceDataSearch: boolean;
  @observable isSemanticSearch: boolean;
  @observable selectedSchema: string;
  @observable selectedOwner: string;
  @observable openFilterDialog: boolean;
  @observable selectedZone: string;
  @observable sortTarget: string;
  @observable sortDirection: string;
  @observable publicStatus: string;
  @observable limit: string = '10';
  @observable rowsMin: string = '';
  @observable rowsMax: string = '';
  @observable selectLinked: boolean = false;
  @observable datetimeStart: Date = undefined;
  @observable datetimeEnd: Date = undefined;
  @observable withAutoWildcard: boolean = true;
  @observable searchSchemaElement: boolean = false;
  @observable filterSchema: boolean = false;
  @observable isPk: boolean = false;
  @observable isFk: boolean = false;
  @observable sizeMin: string = '';
  @observable sizeMax: string = '';
  @observable isNotebookSearch: boolean = false;
  @observable selectNotebookType: string = '';
  datasets: IObservableArray<IDataset> = undefined;
  users: IObservableArray<IUser> = undefined;
  tags: IObservableArray<ITag> = undefined;
  selectedTags: IObservableArray<ITag> = undefined;
  selectedTagsStrings: string[];

  @observable hasRun: boolean = false;
  @observable hasNotebook: boolean = false;
  @observable hasRegModel: boolean = false;

  @observable selectedExperiment: string = '';
  @observable experiments = [];
  
  @observable metrics = [];
  @observable parameters = [];
  @observable selectedMetrics = [];
  @observable selectedParameters = [];

 
  constructor() {
    this.datasets = observable.array([] as IDataset[]);
    makeObservable(this);
    this.initialize();
  }

  async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
      this.datasets = observable.array([] as IDataset[]);
      this.searchQuery = '';
      this.users = observable.array([] as IUser[]);
      this.tags = observable.array([] as ITag[]);
      this.selectedTags = observable.array([] as ITag[]);
      this.clearFilter();
      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Computed function to compute if a filter is set or not.
  */
  @computed get filter() {
    if(this.isSourceDataSearch==false&&this.isSemanticSearch==false&&this.selectedSchema==''&&this.selectedOwner==''&&this.selectedTags.length==0&&this.selectedZone==''&&this.sortDirection==''&&this.sortTarget==''&&this.publicStatus==''&&this.rowsMin==''&&this.rowsMax==''&&this.datetimeStart==undefined&&this.datetimeEnd==undefined&&this.searchSchemaElement==false&&this.filterSchema==false&&this.isPk==false&&this.isFk==false&&this.sizeMin==''&&this.sizeMax==''&&this.isNotebookSearch==false&&this.selectNotebookType=='')
      return false;
    else{
      return true;
    }
  }

  /**
  * Function for setting the store status.
  * @param {StoreStatus} newValue new status of store.
  */
  @action setStatus(newValue: StoreStatus) {
    this.status = newValue;
  }

  /**
  * Function for clearing the filter.
  */
  @action clearFilter() {
    this.isSourceDataSearch = false;
    this.isSemanticSearch = false;
    this.selectedSchema = '';
    this.selectedOwner = '';
    this.selectedZone = '';
    this.selectedTags.replace([]);
    this.sortTarget = '';
    this.sortDirection = '';
    this.publicStatus = '';
    this.rowsMin = '';
    this.rowsMax = '';
    this.limit = '10';
    this.datetimeStart = undefined;
    this.datetimeEnd = undefined;
    this.selectLinked = false;
    this.withAutoWildcard = true;
    this.searchSchemaElement = false;
    this.filterSchema = false;
    this.isPk = false;
    this.isFk = false;
    this.sizeMin = '';
    this.sizeMin = '';
    this.isNotebookSearch = false;
    this.selectNotebookType = '';


    this.selectedMetrics = [];
    this.selectedParameters = [];
    this.hasRun = false;
    this.hasNotebook = false;
    this.hasRegModel = false;
    this.selectedExperiment = '';
  }

  /**
  * Function for getting all user of the workspace.
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
      const u = await response.json();
      this.users.replace(u as IUser[]);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }
  
  /**
  * Function for getting the result datasets.
  */
  async getDatasets() {
    this.selectedTagsStrings=[];
    this.selectedTags.map((t)=>{this.selectedTagsStrings.push(t.id)})
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/search`,
      {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: this.searchQuery,
          source_search: this.isSourceDataSearch,
          semantic_search: this.isSemanticSearch,
          author: this.selectedOwner,
          schema: this.selectedSchema,
          zone: this.selectedZone,
          tags: this.selectedTagsStrings,
          sort_target: this.sortTarget,
          sort_direction: this.sortDirection,
          status: this.publicStatus,
          limit: this.limit,
          rows_min: this.rowsMin,
          rows_max: this.rowsMax,
          datetime_start: this.datetimeStart,
          datetime_end: this.datetimeEnd,
          with_auto_wildcard: this.withAutoWildcard,
          search_schema_element: this.searchSchemaElement,
          filter_schema: this.filterSchema,
          is_pk: this.isPk,
          is_fk: this.isFk,
          size_min: this.sizeMin,
          size_max: this.sizeMax,
          notebook_search: this.isNotebookSearch,
          notebook_type: this.selectNotebookType,
          hasRun: this.hasRun,
          hasNotebook: this.hasNotebook,
          hasRegModel: this.hasRegModel,
          selectedExperiment: JSON.stringify(this.selectedExperiment),
          selectedMetrics: JSON.stringify(this.selectedMetrics),
          selectedParameters: JSON.stringify(this.selectedParameters)
        }),
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())
    this.datasets.replace(json as IDataset[]);
  }

  /**
  * Function for getting the tags for filtering.
  */
  public async getTags(){
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/tags`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const t = await response.json();
    this.tags.replace(t as ITag[]);
  }

  /**
  * Function for getting the code in a notebook.
  */
  async getCodeForCopy() {
    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/notebook-code/${this.idOfSelectedDataset}?notebook_type=${this.typeOfNotebook}`,
      {
        method: "GET",
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const json = (await response.json())
    return json['code']
  }


  public async getExperiments(){
    
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
      
      var temp = "{\"experiment_id\":\""+experiments["experiments"][i]["experiment_id"]+"\",\"name\":\""+experiments["experiments"][i]["name"]+"\", \"artifact_location\":\""+experiments["experiments"][i]["artifact_location"]+"\", \"lifecycle_stage\":\""+experiments["experiments"][i]["lifecycle_stage"]+"\"}";
      if(i < (experiments["experiments"].length-1)){
        temp = temp + ",";
      }
      erg = erg +temp;
    }
    erg = erg +"]";
    this.experiments = JSON.parse(erg);
    } catch (ex) {
    this.setStatus(StoreStatus.failed);
    }
    
  }
  public async getParameters(){
    
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/getParameters`,
        {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include'
        }
    );
    if (!response.ok) throw new Error(response.statusText);
    const params = (await response.json())
    this.parameters = params;
    } catch (ex) {
    this.setStatus(StoreStatus.failed);
    }
    
  }
  public async getMetrics(){
    
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/mlflow/getMetrics`,
        {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include'
        }
    );
    if (!response.ok) throw new Error(response.statusText);
    const mets = (await response.json())    
    this.metrics = mets;
    } catch (ex) {
    this.setStatus(StoreStatus.failed);
    }
    
  }
}
const searchStore = new SearchStore();
export default searchStore;
