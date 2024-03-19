import {
  IObservableArray,
  makeObservable,
  observable,
} from "mobx";
import React from "react";
import ContentStore from "../../../models/contentStore";
import { IUser } from "../../../models/user";
import StoreStatus from "../../../models/storeStatus.enum";

import View from "./main.component";
import userStore from "../../../stores/user.store";
import { ITest } from "../../../models/test";

/**
* ViewModel for all tabs in the profile view.
*/
class ViewModel extends ContentStore {

  /*
  ------------------------------------------------------------------
  Current User
  ------------------------------------------------------------------
  */

  @observable currentUser: IUser = null;
  @observable oldPassword: string = "";
  @observable newPassword: string = "";
  @observable wiki: string = undefined;

  /*
  ------------------------------------------------------------------
  All Users
  ------------------------------------------------------------------
  */

  allUsers: IObservableArray<IUser> = undefined;

  /*
  ------------------------------------------------------------------
  Test
  ------------------------------------------------------------------
  */

  @observable test: ITest = undefined;
  @observable showStats: boolean = false;
  pieChartOneValues: IObservableArray<number> = undefined;
  pieChartOneLabels: IObservableArray<string> = undefined;
  private refreshIntervalId: number | null = null;
  

  /*
  ------------------------------------------------------------------
  Init
  ------------------------------------------------------------------
  */

  constructor() {
    super();
    makeObservable(this);
    this.initialize();
  }

  private async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
      this.setStatus(StoreStatus.ready);
      this.getCurrentUser();
      this.allUsers = observable.array([] as IUser[]);
      this.getAllUsers();
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /*
  ------------------------------------------------------------------
  Current User
  ------------------------------------------------------------------
  */

  /**
  * Function for getting the data of the current logged-in user.
  */
  private async getCurrentUser() {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/users/current/'+userStore.email,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      const u = json as IUser;
      this.currentUser = u;
      this.oldPassword = "";
      this.newPassword = "";
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for updating the current user.
  * If the request was successful, the locally stored informations 
  * will also be updated.
  */
  async putCurrentUser() {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/users/current/'+userStore.email,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_email: this.currentUser.email,
            firstname: this.currentUser.firstname,
            lastname: this.currentUser.lastname,
            old_password: this.oldPassword,
            new_password: this.newPassword,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      userStore.firstname = this.currentUser.firstname;
      userStore.lastname = this.currentUser.lastname;
      userStore.email = this.currentUser.email;
      const json = (await response.json())
      this.currentUser = json as IUser;
      this.oldPassword = "";
      this.newPassword = "";
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  All Users
  ------------------------------------------------------------------
  */

  /**
  * Function for getting all users that are registered to the system.
  * Note that the current logged-in user won't be available because,
  * he can only change his informations in the real profile tab.
  */
  private async getAllUsers() {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/users',
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.allUsers.replace(json as IUser[]);
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for deleting a specific user from the system.
  * @param {string} email email of user that should be deleted.
  */
  async deleteOneUser(email:string) {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/users/'+email,
        {
          method: "DELETE",
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      this.allUsers.remove(this.allUsers.find((u) => u.email == email));
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for adding a new user to the system.
  * @param {string} email email of user that should be added.
  * @param {string} firstname firstname of user that should be added.
  * @param {string} lastname lastname of user that should be added.
  * @param {string} password inital password of user that should be added.
  * @param {boolean} isAdmin defines whether the new user has admin privileges or not.
  */
  async postOneUser(email:string, firstname:string, lastname:string, password:string, isAdmin:boolean) {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/users/',
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: email,
            firstname: firstname,
            lastname: lastname,
            password: password,
            is_admin: isAdmin,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      const user = json as IUser;
      this.allUsers.push(user);
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for updating the data of a user in the system.
  * @param {string} oldEmail old email of user that should be edited.
  * @param {string} newEmail new email of user that should be edited.
  * @param {string} firstname firstname of user that should be added.
  * @param {string} lastname lastname of user that should be added.
  * @param {boolean} isAdmin defines whether the new user has admin privileges or not.
  */
  async putOneUser(oldEmail:string, newEmail:string, firstname:string, lastname:string, isAdmin:boolean) {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/users/'+oldEmail,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            new_email: newEmail,
            firstname: firstname,
            lastname: lastname,
            is_admin: isAdmin,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      const u = json as IUser;
      let usr = this.allUsers.find((u) => u.email == oldEmail);
      usr.email = u.email;
      usr.firstname = u.firstname;
      usr.lastname = u.lastname;
      usr.isAdmin = u.isAdmin;
    } 
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  Wiki
  ------------------------------------------------------------------
  */

  /**
  * Function for getting the wiki in a specific language.
  * @param {string} lang chosen language.
  */
  async getWiki(lang:string) {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/wiki/'+lang,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.wiki=json['markdown'];
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for updating the wiki for a specific language.
  * @param {string} lang chosen language.
  */
  async putWiki(lang:string) {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/wiki/'+lang,
        {
          method: "PUT",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            markdown: this.wiki,
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
    } 
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /*
  ------------------------------------------------------------------
  Test
  ------------------------------------------------------------------
  */

  /**
  * Function for deregister the hook on exit.
  */
  public deregisterIntevals() {
    if (this.refreshIntervalId !== null)
      window.clearInterval(this.refreshIntervalId);
    this.refreshIntervalId = null;
  }

  /**
  * Function to register a hook to refresh the test and all test cases 
  * every 3 seconds. 
  * This function will be called by effect, to register the hook.
  */
  public registerIntevals() {
    this.deregisterIntevals();
    this.refreshIntervalId = window.setInterval(
      this.getTest.bind(this),
      3000
    );
  }

  /**
  * Function for filling the stats arrays with the requried data. 
  */
  createStatsArrays(){
    this.pieChartOneValues = observable.array([]);
    this.pieChartOneLabels = observable.array([]);
    this.test.testCases.forEach((tc)=>{
      this.pieChartOneValues.push(Number(tc.delta))
      this.pieChartOneLabels.push(tc.id)
    })
    this.showStats=true
  }

  /**
  * Function for getting the test with all test cases. 
  */
  async getTest() {
    try{
      if(this.test==undefined||this.test?.status=='RUNNING'){
        const response = await fetch(
          process.env.MAIN_BACKEND_URL+'/api/test/',
          {
            method: "GET",
            headers: { Accept: "application/json" },
            credentials: 'include',
          }
        );
        if (!response.ok) throw new Error(response.statusText);
        const json = (await response.json())
        this.test=json as ITest;
        if((this.test.status=='ENDED'||this.test.status=='FAILED')&&(this.pieChartOneValues==undefined||this.pieChartOneValues!=undefined)){
          this.createStatsArrays()
        }
      }else{
        if((this.test.status=='ENDED'||this.test.status=='FAILED')&&this.pieChartOneValues==undefined){
          this.createStatsArrays()
        }
      }
    }
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for starting the test. 
  */
  async postTest() {
    this.showStats=false;
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/test/start',
        {
          method: "POST",
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
          }),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())
      this.test=json as ITest;
    } 
    catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  getView = () => <View viewModel={this} />;
}

export default ViewModel;
