import { NodeData } from "../../../../../models/workflow";

export interface IData extends NodeData {
  /**
   * @data export
   * @data type filter
   */

  condition: string;
}

export default {
  /**
   * exception*/
  condition: "",
  schema: {
    fields: [],
  },
} as IData;
