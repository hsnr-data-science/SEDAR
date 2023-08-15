import { observable, action, makeObservable, IObservableArray } from "mobx";
import { getPersistedStore, makePersistable } from "mobx-persist-store";
import { IDataset } from "../models/dataset";
import StoreStatus from "../models/storeStatus.enum";
import { IWorkspace, IWorkspaceExchange } from "../models/workspace";
import searchStore from "./search.store";

/**
* Store for the workspaces.
*/
class WorkspacesStore {
  @observable status: StoreStatus = StoreStatus.uninitialized;
  @observable currentWorkspace: IWorkspace | null = null;
  @observable idOfCurrentWorkspace: string = undefined;
  workspaces: IObservableArray<IWorkspace>;
  favorites: IObservableArray<IDataset>;

  constructor() {
    this.workspaces = observable.array([] as IWorkspace[]);
    makePersistable(this, { name: 'WorkspaceStore', properties: ['idOfCurrentWorkspace'], storage: window.localStorage });
    makeObservable(this);
    this.initialize();
  }

  async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/", {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      const workspaces = (await response.json()) as IWorkspace[];
      await this.getPersistedData();
      await this.setWorkspaces(workspaces);
      this.setStatus(StoreStatus.ready);
      this.getFavorites();
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting alls favorites of a user for the chosen workspace.
  */
  private async getFavorites() {
    try {
      this.favorites = observable.array([] as IDataset[]);
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${this.currentWorkspace.id}/favorites`,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.favorites.replace(json as IDataset[]);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting the persisted data.
  */
  async getPersistedData(): Promise<void> {
    const data = await getPersistedStore(this);
    this.idOfCurrentWorkspace==data.idOfCurrentWorkspace;
  }

  /**
  * Function for setting the store status.
  * @param {StoreStatus} newValue new status of store.
  */
  @action setStatus(newValue: StoreStatus) {
    this.status = newValue;
  }

  /**
  * Function for setting the store status.
  * @param {StoreStatus} newValue new status of store.
  */
  @action setWorkspaces(newValue: IWorkspace[]) {
    this.workspaces.clear();
    this.workspaces.push(...newValue);
    searchStore.initialize();
    if(this.currentWorkspace == null && this.workspaces.find((w)=>w.id==this.idOfCurrentWorkspace)==undefined){
      this.currentWorkspace = this.workspaces[0];
      /*added*/
      this.idOfCurrentWorkspace = this.workspaces[0].id;
    }else{
      /*added*/
      this.currentWorkspace = this.workspaces.find((w)=>w.id==this.idOfCurrentWorkspace);
    }
    searchStore.getAllUsersOfWorkspace();
    searchStore.getTags();
    searchStore.getExperiments();
    searchStore.getMetrics();
    searchStore.getParameters();
  }

  /**
  * Function for adding a workspace internally.
  * @param {IWorkspace} item workspace.
  */
  @action private addWorkspaceInternal(item: IWorkspace) {
    this.workspaces.push(item);
    this.currentWorkspace = item;
    /*added*/
    this.idOfCurrentWorkspace = item.id;
    searchStore.initialize();
    this.getFavorites();
    searchStore.getAllUsersOfWorkspace();
    searchStore.getTags();
  }

  /**
  * Function for adding a workspace.
  * @param {IWorkspaceExchange} newValue data of the workspace.
  */
  async addWorkspace(newValue: IWorkspaceExchange) {
    this.setStatus(StoreStatus.working);
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newValue),
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      const workspace = (await response.json()) as IWorkspace;
      this.addWorkspaceInternal(workspace);
      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for setting the current workspace.
  * @param {IWorkspace} newValue data of the workspace to set.
  */
  @action setCurrentWorkspace(newValue: IWorkspace) {
    if (this.workspaces.indexOf(newValue) > -1){
      this.currentWorkspace = newValue;
      /*added*/
      this.idOfCurrentWorkspace = newValue.id;
      searchStore.initialize();
      this.getFavorites();
      searchStore.getAllUsersOfWorkspace();
      searchStore.getTags();
    }
  }

  /**
  * Function for deleting a workspace internally.
  * @param {IWorkspace} item workspace to delete.
  */
  @action private deleteWorkspaceInternal(item: IWorkspace) {
    this.workspaces.remove(item);
  }

  /**
  * Function for deleting a workspace.
  * @param {IWorkspace} item workspace to delete.
  */
  async deleteWorkspace(item: IWorkspace) {
    this.setStatus(StoreStatus.working);
    const id = item.id;
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+"/workspaces/"+id, {
        method: "DELETE",
        credentials: 'include',
      });
      if (!response.ok) throw new Error(response.statusText);
      this.deleteWorkspaceInternal(item);
      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }
}

const workspacesStore = new WorkspacesStore();
export default workspacesStore;
