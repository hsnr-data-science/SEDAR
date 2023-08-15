import { NodeData } from "../../../../../models/workflow";

export interface IData extends NodeData {
  /**
   * @data
   * @data type selection
   */
  aggregate_function: string;
  aggregate_select: string;
  group_by: string;
}

export default {
  aggregate_function: "",
  aggregate_select: "",
  group_by: "",
  schema: {
    fields: [],
  },
} as IData;
