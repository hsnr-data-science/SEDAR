import { makeAutoObservable } from "mobx";
import { getPersistedStore, makePersistable } from 'mobx-persist-store';
import { IUser } from "../models/user";

/**
* Store for the current user.
*/
class UserStore {
  firstname: string = '';
  lastname: string = '';
  email: string = '';
  username: string = '';
  isAdmin: boolean = false;
  stayLoggedIn: boolean = false;

  constructor() {
    makeAutoObservable(this);
    makePersistable(this, { name: 'UserStore', properties: ['firstname', 'lastname', 'email', 'username', 'isAdmin', 'stayLoggedIn'], storage: window.localStorage });
    this.initialize();
  }

  async initialize(){
    await this.getPersistedData();
  }

  /**
  * Function for validating the local data with the server data.
  */
  private async validate() {
    try{
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+'/users/current/'+this.email,
        {
          method: "GET",
          headers: { Accept: "application/json" },
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      const json = (await response.json())      
      return json as IUser;
    } catch (ex) {
      throw new Error(ex.statusText);
    }
  }

  /**
  * Function for getting the persisted data.
  */
  async getPersistedData(): Promise<void> {
    const data = await getPersistedStore(this);
    if(data.email!='' && data.stayLoggedIn==true){
      const validation = (await this.validate());      
      //double check if user properties, they migth change with time. For example if a different user changes the name.
      this.firstname==validation.firstname?data.firstname:validation.firstname;
      this.lastname==validation.lastname?data.lastname:validation.lastname;
      this.email==validation.email?data.email:validation.email;
      
      //this.username==validation.username?data.username:validation.username;
      this.username = validation.username;
      this.isAdmin==validation.isAdmin?data.isAdmin:validation.isAdmin;
      this.stayLoggedIn = data.stayLoggedIn;

    }else{
      return;
    }
  }
}

const userStore = new UserStore();
export default userStore;
