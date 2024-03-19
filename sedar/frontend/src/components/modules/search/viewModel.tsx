import { makeObservable } from 'mobx'
import React from 'react'
import ContentStore from '../../../models/contentStore'
import StoreStatus from '../../../models/storeStatus.enum'
import View from './main.component'

/**
* ViewModel for the search view.
*/
class ViewModel extends ContentStore {

  constructor() {
    super()
    makeObservable(this)
    this.initialize();
  }

  async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
      this.setStatus(StoreStatus.ready);
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  getView = () => <View viewModel={this} />
}


export default ViewModel