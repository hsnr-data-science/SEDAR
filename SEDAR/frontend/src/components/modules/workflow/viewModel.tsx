import { IObservableArray, runInAction, toJS } from "mobx";
import { action, makeObservable, observable } from "mobx";
import React from "react";
import ContentStore from "../../../models/contentStore";
import StoreStatus from "../../../models/storeStatus.enum";
import View from "./main.component";
import workspacesStore from "../../../stores/workspaces.store";
import { NodeData } from "../../../models/workflow";
import {
  addEdge as addEdgeRF,
  ArrowHeadType,
  Connection,
  Edge,
  Elements,
  FlowElement,
  isEdge,
  Node,
} from "react-flow-renderer";
import { v4 as uuidv4 } from "uuid";
import { computed } from "mobx";
import PropertiesViewModel from "./propertiesViewModel";
import { NodeType } from "./nodes";
import WorkflowHelper from "../../../utils/helpers/workflowHelper";
import { IDataset } from "../../../models/dataset";
import routingStore from "../../../stores/routing.store";
import { t } from "i18next";
import searchStore from "../../../stores/search.store";

/**
* Main ViewModel for the workflow view.
*/
class ViewModel extends ContentStore {

  constructor(isLineageView=false, nodesForLineage={}) {
    super();
    searchStore.idOfSelectedDataset=undefined;
    this.datasets = observable.array([] as IDataset[]);
    this.elements = observable.array([] as Elements<NodeData>);
    this.isLineageView=isLineageView;
    this.nodesForLineage=nodesForLineage;
    makeObservable(this);
    this.initialize();
  }

  /**
  * Function for adding a new edge.
  * @param {Edge<NodeData>} edgeParams all connection informations.
  */
  @action addEdge(edgeParams: Edge<NodeData> | Connection) {
    let edge: Edge;
    edge = {
      ...edgeParams,
      id: uuidv4(),
      arrowHeadType: ArrowHeadType.Arrow,
    } as Edge;
    const connectionExists = this.elements.some(
      (el) =>
        isEdge(el) &&
        el.source === edge.source &&
        el.target === edge.target &&
        (el.sourceHandle === edge.sourceHandle ||
          (!el.sourceHandle && !edge.sourceHandle)) &&
        (el.targetHandle === edge.targetHandle ||
          (!el.targetHandle && !edge.targetHandle))
    );

    if (connectionExists) return;
    this.elements.push(edge as Edge);
  }

  /**
  * Function for removing elements.
  * @param {Elements<NodeData>} elementsToRemove all elements to remove.
  */
  @action removeElements(elementsToRemove: Elements<NodeData>) {
    elementsToRemove.map((e) => this.elements.remove(e));
  }

  /**
  * Function for removing a node.
  * @param {string} id id of the node that should be removed.
  */
  @action deleteNode(id: string) {
    const elements = this.elements.filter(
      (e) => e.id === id || (isEdge(e) && (e.target === id || e.source === id))
    );
    if (elements.length === 0) return;
    elements.forEach((e) => this.elements.remove(e));
  }

  /**
  * Function for getting a node.
  * @param {string} id id of the node.
  */
  getNode(id: string) {
    const node = this.elements.find((e) => e.id === id) as Node<NodeData>;
    return node;
  }

  /**
  * Function for adding a node.
  * @param {NodeType} type the type of the node that should be added.
  * @param {any} position the position {x:-,y:-} where the node should be added.
  */
  async addNode(type: NodeType, position: any) {
    await import(`./nodes/${type}/data`).then((data) => {
      let node: Node<NodeData> = {
        id: uuidv4(),
        position,
        data: data.default as NodeData,
        type,
      };
      runInAction(() => {
        this.elements.push(node);
      });
    });
  }

  @observable isLineageView: boolean = false;
  @observable nodesForLineage;
  datasets: IObservableArray<IDataset>;
  elements: IObservableArray<FlowElement<NodeData>>;

  /**
  * Function for displaying the workflow in the lineage view.
  * @param {any} nodes all nodes on this iteration level.
  */
  public async recusiveNodes(nodes){
    const lastIDs=[];
    for (const n of nodes) {
      if(n['type']!=undefined){
        await this.addNode(n['type'] as NodeType, {
          x: n['x'],
          y: n['y'],
        });
        lastIDs.push(this.elements[this.elements.length-1].id)
      }
      if(n['input']!=undefined){
        let lIDs = await this.recusiveNodes(n['input']);
        if(n["isJoinInput"]==undefined){
          for (const  [index, id] of lIDs.entries()) {
            if(n['type'] == 'join'){
              await this.addEdge({
                source: id[0], 
                sourceHandle: 'output', 
                target: lastIDs[lastIDs.length-1],
                targetHandle: 'input_'+String(index+1)
              })
            }else{
              await this.addEdge({
                source: id, 
                sourceHandle: 'output', 
                target: lastIDs[lastIDs.length-1],
                targetHandle: 'input'
              })
            } 
          }
        }
        else{
          lastIDs.push(lIDs)
        }
      }
    }
    return lastIDs;
  }

  private async initialize() {
    this.setStatus(StoreStatus.initializing);
    try {
      this.setStatus(StoreStatus.ready);
      if(this.isLineageView==true){
        this.elements.clear();
        let lastIDs = await this.recusiveNodes(this.nodesForLineage['input'])
        await this.addNode(this.nodesForLineage['type'] as NodeType, {
          x: this.nodesForLineage['x'],
          y: this.nodesForLineage['y'],
        });
        let exportID = this.elements[this.elements.length-1].id;
        lastIDs.forEach(async (id)=>{
          await this.addEdge({
            source: id, 
            sourceHandle: 'output', 
            target: exportID,
            targetHandle: 'input'
          })
        })
      }
    } catch (ex) {
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Function for getting a dataset.
  * @param {string} id id of the dataset.
  */
  public async getDataset(id:string) {
    if (!workspacesStore.currentWorkspace)
      throw new Error("Current workspace must be set.");

    const response = await fetch(
      process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${id}?schema_only=True`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
        credentials: 'include',
      }
    );
    if (!response.ok) throw new Error(response.statusText);
    const datamart = (await response.json()) as IDataset;
    this.datasets.push(datamart)
  }

  getView = () => <View viewModel={this} />;

  /**
  * Function that is needed for the drawer.
  * @param {React.DragEvent<HTMLElement>} event event that was triggered on dragging.
  * @param {string} nodeType type of the node.
  */
  onDragStart = (event: React.DragEvent<HTMLElement>, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  /**
  * Function to submit the workflow.
  */
  async submit() {
    if (!workspacesStore.currentWorkspace)
      throw new Error("Current workspace must be set.");
    console.log(JSON.stringify(WorkflowHelper.parseElements(this.elements)))
    this.setStatus(StoreStatus.working);
    try {
      const response = await fetch(
        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace.id}/workflow`,
        {
          method: "POST",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify(WorkflowHelper.parseElements(this.elements)),
          credentials: 'include',
        }
      );
      if (!response.ok) throw new Error(response.statusText);
      this.setStatus(StoreStatus.ready);
      routingStore.history.push("/ingestion");
    } catch (ex) {
      alert(t("workflow.failed"));
      this.setStatus(StoreStatus.failed);
    }
  }

  /**
  * Properties
  */
  @observable propertiesViewModel: PropertiesViewModel<NodeData> | null = null;

  /**
  * Function for computing if a properties model is open.
  */
  @computed get isPropertiesModalOpen() {
    return Boolean(this.propertiesViewModel);
  }

  /**
  * Function to open the properties modal.
  * @param {Node<NodeData>} node node where the modal should be opened for.
  */
  async openPropertiesModal(node: Node<NodeData>) {
    if (node.type)
      await import(`./nodes/${node.type}`).then((res) => {
        runInAction(() => {
          this.propertiesViewModel = new res.default(
            this,
            node.id,
            node.data ? toJS(node.data) : {}
          ) as PropertiesViewModel<NodeData>;
        });
      });
  }

  /**
  * Function for closing the properties modal.
  */
  @action closePropertiesModal() {
    this.propertiesViewModel = null;
  }

  /**
  * Function returning the properties modal view.
  */
  @computed get propertiesModalContentView() {
    if (!this.propertiesViewModel) return null;
    return this.propertiesViewModel.getView();
  }

  /**
  * Function for saving the properties.
  */
  @action saveProperties() {
    const viewModel = this.propertiesViewModel;
    if (!viewModel) return;
    const node = this.elements.find((e) => e.id === viewModel.id);
    if (node) {
      this.elements.remove(node);
      node.data = viewModel.data;
      this.elements.push(node);
    }
    this.closePropertiesModal();
  }
}

export default ViewModel;
