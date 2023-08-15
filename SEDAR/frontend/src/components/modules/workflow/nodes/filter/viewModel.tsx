import { makeObservable } from "mobx";
import React from "react";
import PropertiesViewModel from "../../propertiesViewModel";
import Dialog from "./dialog";
import WorkflowViewModel from "../..";
import { IData } from "./data";
import WorkflowHelper from "../../../../../utils/helpers/workflowHelper";

class ViewModel extends PropertiesViewModel<IData> {
  /**
   *
   * @param workflowViewModel
   * @param id
   * @param data
   */
  constructor(workflowViewModel: WorkflowViewModel, id: string, data: IData) {
    super(workflowViewModel, id, data);
    const node = workflowViewModel.getNode(id);
    const input = WorkflowHelper.getInputNodes(
      node,
      workflowViewModel.elements
    );
    if (input.length == 1) {
      this.data.schema.fields = input[0].node.data?.schema.fields ?? [];
      this.data.schema.primary_key =
        input[0].node.data?.schema.primary_key ?? [];
    }

    makeObservable(this);
  }

  getView() {
    return <Dialog viewModel={this} />;
  }
}

export default ViewModel;
