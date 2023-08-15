import { NodeData } from "../../../../../models/workflow";

export interface IData extends NodeData {
  /**
   * @data concatenate
   * @data type selection
   */
  field: {
    input_1: string;
    input_2: string;
  };
  ids: {
    input_1: string,
    input_2: string,
  },
}

export default {
   /**
   * exception*/
  field: {
    input_1: "",
    input_2: "",
  },
  ids: {
    input_1: "",
    input_2: "",
  },
  schema: {
    fields: [],
  },
} as IData;
