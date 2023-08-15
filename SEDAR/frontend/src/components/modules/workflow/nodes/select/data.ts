import { NodeData } from "../../../../../models/workflow";

export interface IData extends NodeData {
  /**
   * @data export
   * @data type selection
   */
  distinct: boolean;
}

export default {
  /**
   * exception*/
  distinct: false,
  schema: {
    fields: [],
  },
} as IData;
