import { computed, makeObservable } from "mobx";
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
    makeObservable(this);
    this.smartInitialize();
  }

  getView() {
    return <Dialog viewModel={this} />;
  }

  async smartInitialize() {
    const node = this.workflowViewModel.getNode(this.id);
    const inputs = WorkflowHelper.getInputNodes(
      node,
      this.workflowViewModel.elements
    );
    const input_1 = inputs.find((i) => i.name == "input_1");
    if (input_1) {
      const pk = input_1.node.data?.schema.primary_key;
      if (pk && pk.length > 0) {
        this.data.field.input_1 = pk[0];
      }
    }

    const input_2 = inputs.find((i) => i.name == "input_2");
    if (input_2) {
      const pk = input_2.node.data?.schema.primary_key;
      if (pk && pk.length > 0) {
        this.data.field.input_2 = pk[0];
      }
    }
  }

  @computed get firstInputFields() {
    /**
     * join workflowViewModel
     */
    const node = this.workflowViewModel.getNode(this.id);
    const inputs = WorkflowHelper.getInputNodes(
      node,
      this.workflowViewModel.elements
    );
    return (
      inputs.find((i) => i.name == "input_1")?.node?.data?.schema?.fields ?? []
    );
  }

  @computed get secondInputFields() {
    const node = this.workflowViewModel.getNode(this.id);
    const inputs = WorkflowHelper.getInputNodes(
      node,
      this.workflowViewModel.elements
    );
    return (
      /**
       * @return NodeData
       */
      inputs.find((i) => i.name == "input_2")?.node?.data?.schema?.fields ?? []
    );
  }
}

export default ViewModel;
