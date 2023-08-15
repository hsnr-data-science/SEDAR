import { action, makeObservable, observable } from "mobx";
import React from "react";

import { NodeData } from "../../../../../models/workflow";
import PropertiesViewModel from "../../propertiesViewModel";
import Dialog from "./dialog";
import WorkflowViewModel from "../..";
import { IData } from "./data";

class ViewModel extends PropertiesViewModel<IData> {
  /**
   *
   * @param workflowViewModel
   * @param id
   * @param data
   */
  constructor(workflowViewModel: WorkflowViewModel, id: string, data: IData) {
    super(workflowViewModel, id, data);
    makeObservable(this);
  }

  @action setQuery(newValue: string) {
    this.data.query_string = newValue;
  }
  getView() {
    return <Dialog viewModel={this} />;
  }
}

export default ViewModel;
