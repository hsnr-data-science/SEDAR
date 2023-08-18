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
* ViewModel for the login view.
*/
class ViewModel extends ContentStore {
  @observable email: string = "";
  @observable password: string = "";
  @observable stayLoggedIn: boolean = true;
  @observable clicked: boolean = false;
  @observable customLogin: boolean = true;
  errorMessage: string = "";


  /**
  * Constructor
  */
  constructor() {
    super();
    appStore.setIsLoggedIn(false);
    makeObservable(this);
    if(process.env.NODE_ENV=="development"){
      this.email = process.env.FRONTEND_DEFAULT_EMAIL;
      this.password = process.env.FRONTEND_DEFAULT_PASSWORD;
    } 
  }

  
  /**
  * Function for setting the email.
  */
  @action setEmail(value: string) {
    this.email = value;
  }

  /**
  * Function for setting the password.
  */
  @action setPassword(value: string) {
    this.password = value;
  }

  /**
  * Function that computes if the user can login or not. 
  * The login is possible if the email is given and
  * the password are given.
  */
  @computed get canLogin(): boolean {
    if(process.env.NODE_ENV=="development"){
      return true;
    } 
    return this.password.length > 0 && this.email.length > 0;
  }

  /**
  * Function for the login. 
  * If the login are valid, the server sents a access-cookie that 
  * will grant access to the server.
  */
  async login() {
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
          email: this.email,
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
      userStore.email =this.email;
      userStore.stayLoggedIn = this.stayLoggedIn;
      appStore.setIsLoggedIn(true);
      workspacesStore.initialize();
      routingStore.history.push("/dashboard");
      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }
  
  getView = () => <View viewModel={this} />;
}

export default ViewModel;
