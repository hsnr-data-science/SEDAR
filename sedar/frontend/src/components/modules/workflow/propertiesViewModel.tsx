import { action, makeObservable, observable } from "mobx";
import ViewModel from ".";
import ContentStore from "../../../models/contentStore";
import { NodeData } from "../../../models/workflow";

/**
* ViewModel for the properties view.
*/
abstract class PropertiesViewModel<T extends NodeData> extends ContentStore {
  public readonly workflowViewModel: ViewModel;
  public readonly id: string;
  @observable data: T;

  constructor
  /**
   *
   * @param workflowViewModel
   * @param id
   * @param data
   */
  (workflowViewModel: ViewModel, id: string, data: T) {
    super();
    this.workflowViewModel = workflowViewModel;
    this.id = id;
    this.data = data;
    makeObservable(this);
  }

  @action updateData(func: (data: T) => void) {
    func(this.data);
  }
}

export default PropertiesViewModel;
