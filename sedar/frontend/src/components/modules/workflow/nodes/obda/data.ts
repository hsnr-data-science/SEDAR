import { NodeData } from "../../../../../models/workflow";

export interface IData extends NodeData {
  /**
   * @data export
   * @data type selection
   */
  query_string: string;
}

export default {
  query_string: "",
} as IData;
