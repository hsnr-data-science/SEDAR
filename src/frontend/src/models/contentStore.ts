import { action, observable } from "mobx";
import appStore from "../stores/app.store";
import routingStore from "../stores/routing.store";
import CommonStore from "./commonStore";

abstract class ContentStore extends CommonStore {
  constructor() {
    super();
    if (!appStore.isLoggedIn && appStore.code != "") routingStore.history.push("/login");
    else if(appStore.logoutFlag){
      routingStore.history.push("/login");      
    }
  }

  @observable isFullscreen: boolean = false;
  @action setFullscreen(isFullscreen: boolean) {
    this.isFullscreen = isFullscreen;
  }


  abstract getView(): React.ReactElement;
}

export default ContentStore;
