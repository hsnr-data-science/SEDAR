import { action, computed, makeObservable, observable } from "mobx";
import React from "react";
import ContentStore from "../../../models/contentStore";
import StoreStatus from "../../../models/storeStatus.enum";
import appStore from "../../../stores/app.store";
import routingStore from "../../../stores/routing.store";
import userStore from "../../../stores/user.store";
import workspacesStore from "../../../stores/workspaces.store";
import View from "./main.component";

/**
* ViewModel for the ingestion view.
*/
class ViewModel extends ContentStore {

  @observable email: string = "";
  @observable password: string = "";
  @observable stayLoggedIn: boolean = true;
  @observable clicked: boolean = false;
  errorMessage: string = "";

  constructor() {
    super()
    makeObservable(this);
    this.initialize();
    this.gitLabAuthorize("text");
  }

  /**
  * Function for initialization
  */
  async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
        
        this.setStatus(StoreStatus.ready);
       
    } catch (ex) {
        this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for authorizing in gitlab
  */
  async gitLabAuthorize(response) {
    this.setStatus(StoreStatus.initializing);
    appStore.setlogoutFlag(false);
    console.log(appStore.code)
    if (appStore.code != ""){
    try {
      const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/auth/gitlablogin?'+appStore.code, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          code: appStore.code,
          state: "STATE",
        }),
      });
      if (!response.ok){
        this.errorMessage = response.statusText;
        throw new Error(response.statusText);
      } 
      const json = (await response.json())
      this.dataLakeLogin("text", json);
      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }
  else {
    
  }
    routingStore.history.push("/");
  }

  /**
  * Function for retrieving the logged in user
  */
 async dataLakeLogin(response, json1) {
  this.setStatus(StoreStatus.initializing);
  try {
    const response = await fetch(process.env.MAIN_BACKEND_URL+'/api/auth/login', {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      credentials: 'include',
      body: JSON.stringify({
        email: json1["email"],
        password: this.password,
      }),
    });
    if (!response.ok){
      this.errorMessage = response.statusText;
      throw new Error(response.statusText);
    } 
    const json = (await response.json())
    userStore.firstname =json['user']['firstname'];
    userStore.lastname =json['user']['lastname'];
    userStore.isAdmin =json['user']['isAdmin'];
    userStore.username =json['user']['username'];
    userStore.email =json1["email"];
    userStore.stayLoggedIn = this.stayLoggedIn;
    appStore.setIsLoggedIn(true);
    workspacesStore.initialize();
    routingStore.history.push("/dashboard");
    this.setStatus(StoreStatus.ready);
  } catch (ex) {
    this.setStatus(StoreStatus.failed);
  }
}
  getView = () => <View viewModel={this} />
}


export default ViewModel