import { NodeData } from "../../../../../models/workflow";

export interface IData extends NodeData {
   /**
   * @data export
   * @data type selection
   */
  name: string;
  target: string;
  isPolymorph: boolean;
  setFk: boolean;
  setPk: boolean;
  auto: boolean;
  writeType: string;
}

export default {
  name: "",
  target: "HDFS",
  isPolymorph: false,
  setFk: false,
  setPk: false,
  auto: true,
  writeType: "DEFAULT",
} as IData;
