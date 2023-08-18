import { observable, action, makeObservable, computed } from "mobx";
import StoreStatus from "../models/storeStatus.enum";
import ContentStore from "../models/contentStore";
import routingStore from "./routing.store";
import userStore from "./user.store";
import workspacesStore from "./workspaces.store";
import searchStore from "./search.store";

/**
* General store for the application.
*/
class AppStore {
  @observable status: StoreStatus = StoreStatus.uninitialized;
  @observable errorMessage: string = "";
  @observable code: string = "";
  @observable isLoggedIn: boolean = false;
  @observable logoutFlag: boolean = false;
  @action setIsLoggedIn(newValue: boolean) {
    this.isLoggedIn = newValue;
  }
  @action setCode(newValue: string) {
    this.code = newValue;
  }
  @action setlogoutFlag(newValue: boolean){
    this.logoutFlag = newValue;

  }
  // content manipulation
  @observable contentViewModel: ContentStore | null = null;
  @computed get view() {
    if (!this.contentViewModel) return null;
    return this.contentViewModel.getView();
  }

  @computed get isFullscreen() {
    if (!this.contentViewModel) return false;
  }

  @action setContentViewModel(newValue: ContentStore | null) {
    this.contentViewModel = newValue;
  }
  // end: content manipulation

  constructor() {
    makeObservable(this);
  }

  @action setStatus(newValue: StoreStatus) {
    this.status = newValue;
  }

  @action setErrorMessage(newValue: string) {
    this.errorMessage = newValue;
  }

  @observable experiments: string | null = null;

  @observable runs: string | null = null;
  @observable registeredModels: string | null = null;
  @observable allDatasets: string | null = null;
  @observable tableDatasets: string | null = null;
  @observable imageDatasets: string | null = null;
  /**
  * Function for logging out of the application.
  */
  async logout() {

    const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/auth/logout', {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: 'include',
    });
    if (!response.ok){
      this.errorMessage = response.statusText;
      throw new Error(response.statusText);
    } 
    this.setlogoutFlag(true);
    this.setIsLoggedIn(false);
    searchStore.initialize();
    workspacesStore.currentWorkspace = null;
    workspacesStore.workspaces.replace([]);
    workspacesStore.favorites.replace([]);
    workspacesStore.idOfCurrentWorkspace = undefined;
    userStore.firstname = '';
    userStore.lastname = '';
    userStore.isAdmin = false;
    userStore.email = '';
    userStore.stayLoggedIn = false;
    appStore.code = "";
    routingStore.history.push("/login")
  }


 

}

const appStore = new AppStore();
export default appStore;
