import { observable, action, makeObservable, computed } from "mobx"
import StoreStatus from "../models/storeStatus.enum"

abstract class CommonStore {
    @observable status: StoreStatus = StoreStatus.uninitialized
    @observable errorMessage: string = ''

    @action setStatus(newValue: StoreStatus) {
        this.status = newValue
    }
    @action setErrorMessage(newValue: string) {
        this.errorMessage = newValue
    }
}

export default CommonStore