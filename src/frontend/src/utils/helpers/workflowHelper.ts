import { Elements, Node, Edge } from "react-flow-renderer";
import { NodeType } from "../../components/modules/workflow/nodes";
import { IData as DataSourceData } from "../../components/modules/workflow/nodes/data_source/data";
import { IData as ExportData } from "../../components/modules/workflow/nodes/export/data";
import { IData as JoinData } from "../../components/modules/workflow/nodes/join/data";
import { IData as FilterData } from "../../components/modules/workflow/nodes/filter/data";
import { IData as SelectData } from "../../components/modules/workflow/nodes/select/data";
import { IData as GroupbyData } from "../../components/modules/workflow/nodes/groupby/data";
import { IData as ObdaData } from "../../components/modules/workflow/nodes/obda/data";
import { NodeData } from "../../models/workflow";

interface InputDescription<T extends NodeData> {
  node: Node<T>;
  name: string;
}

/**
* Helper class with functions for the workflow.
*/
abstract class WorkflowHelper {
  public static parseElements(elements: Elements<NodeData>): any {
    const exportNodes = elements.filter(
      (e) => e.type === NodeType.export
    ) as Node<any>[];
    return exportNodes.map((n) => WorkflowHelper.processNode(n, elements));
  }

  private static processNode(
    node: Node<NodeData>,
    elements: Elements<NodeData>
  ) {
    const data: any = {};
    data.type = node.type;
    data.x = node.position.x;
    data.y = node.position.y;

    switch (node.type) {
      case NodeType.data_source: {
        const nodeData = node.data as DataSourceData;
        data.uid = nodeData.uid;
        break;
      }

      case NodeType.filter: {
        const nodeData = node.data as FilterData;
        data.condition = nodeData.condition;
        data.input = WorkflowHelper.getInputNodes(node, elements).map((n) =>
          WorkflowHelper.processNode(n.node, elements)
        );
        break;
      }

      case NodeType.select: {
        const nodeData = node.data as SelectData;
        data.distinct = nodeData.distinct;
        data.columns = nodeData.schema.fields.map((f) => f.name);
        data.input = WorkflowHelper.getInputNodes(node, elements).map((n) =>
          WorkflowHelper.processNode(n.node, elements)
        );
        break;
      }

      case NodeType.groupby: {
        const nodeData = node.data as GroupbyData;
        const aggregate_select = nodeData.aggregate_select;
        const aggregate_function = nodeData.aggregate_function;

        data.aggregate = {};
        data.aggregate[aggregate_select] = aggregate_function;
        data.column = [nodeData.group_by];
        data.input = WorkflowHelper.getInputNodes(node, elements).map((n) =>
          WorkflowHelper.processNode(n.node, elements)
        );
        break;
      }

      case NodeType.flatten: {
        data.input = WorkflowHelper.getInputNodes(node, elements).map((n) =>
            WorkflowHelper.processNode(n.node, elements)
        );
        break;
      }

      case NodeType.export: {
        const nodeData = node.data as ExportData;
        data.name = nodeData.name;
        data.target = nodeData.target;
        data.isPolymorph = nodeData.isPolymorph;
        data.setFk = nodeData.setFk;
        data.setPk = nodeData.setPk;
        data.auto = nodeData.auto;
        data.write_type = nodeData.writeType;
        data.input = WorkflowHelper.getInputNodes(node, elements).map((n) =>
          WorkflowHelper.processNode(n.node, elements)
        );
        break;
      }

      case NodeType.join: {
        const nodeData = node.data as JoinData;
        data.input = WorkflowHelper.getInputNodes(node, elements).map((n) => ({
          input: [WorkflowHelper.processNode(n.node, elements)],
          column: (nodeData.field as any)[n.name],
          columnID: (nodeData.ids as any)[n.name],
          isJoinInput: true,
        }));
        break;
      }

      case NodeType.obda: {
        const nodeData = node.data as ObdaData;
        data.query_string = nodeData.query_string;
        break;
      }
    }
    return data;
  }

  public static getInputNodes(
    node: Node<NodeData>,
    elements: Elements<NodeData>
  ) {
    const directedEdges = elements.filter(
      (e) => !e.type && (e as Edge<NodeData>).target === node.id
    ) as Edge<NodeData>[];

    return directedEdges.map(
      (e) =>
        ({
          name: e.targetHandle,
          node: elements.find((n) => n.id == e.source),
        } as InputDescription<NodeData>)
    );
  }
}

export default WorkflowHelper;
