import { observable, action, makeObservable } from "mobx"
import { getPersistedStore, makePersistable } from "mobx-persist-store"

/**
* Store for the storing the settings.
*/
class SettingStore {
    @observable isDarkmode: boolean = false;

    constructor() {
        makeObservable(this)
        makePersistable(this, { name: 'SettingStore', properties: ['isDarkmode'], storage: window.localStorage });
        this.initialize();
    }

    async initialize(){
        await this.getPersistedData();
    }

    /**
    * Function for getting the persisted data.
    */
    async getPersistedData(): Promise<void> {
        const data = await getPersistedStore(this);
        this.isDarkmode = data.isDarkmode;
    }
}

const settingStore = new SettingStore()
export default settingStore;
