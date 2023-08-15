import React, { useEffect, useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import Sidebar from "./sidebar";
import ReactFlow, {
  ReactFlowProvider,
  Controls,
  OnLoadParams,
} from "react-flow-renderer";
import nodes, { NodeType } from "./nodes";
import PropertiesDialog from "./propertiesDialog";
import Fab from "@material-ui/core/Fab";
import PlayArrowIcon from "@material-ui/icons/PlayArrow";
import { green } from "@material-ui/core/colors";

/**
* Main component for the workflow view. 
*/
const Workflow: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) =>
/**
* @param viewModel
*/
{
  const reactFlowWrapper = useRef<HTMLDivElement | null>(null);
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null);
  const { t } = useTranslation();

  useEffect(() => {
    if(viewModel.isLineageView==true){
      if (reactFlowInstance && viewModel.elements.length>1) {
        reactFlowInstance.fitView();
      }
    }
  });

  const onLoad = (_reactFlowInstance: OnLoadParams<any>) =>
      /**
       *
       * @param _reactFlowInstance
       */
      setReactFlowInstance(_reactFlowInstance);
        
  const onDragOver = (event: React.DragEvent<HTMLDivElement>) =>
      /**
       *
       * @param event
       */
  {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const onDrop = (event: React.DragEvent<HTMLDivElement>) =>
      /**
       *
       * @param event
       */
  {
    event.preventDefault();
    if (!reactFlowWrapper.current) return;
    const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
    const type = event.dataTransfer.getData(
      "application/reactflow"
    ) as NodeType;
    const position = reactFlowInstance.project({
      x: event.clientX - reactFlowBounds.left,
      y: event.clientY - reactFlowBounds.top,
    });

    viewModel.addNode(type, position);
  };

  return (
    <React.Fragment>
      <div style={{ flex: 1, display: "flex" }}>
        <ReactFlowProvider>
          <Sidebar viewModel={viewModel}/>
          <div style={{ flex: 1 }} ref={reactFlowWrapper}>
            <ReactFlow
              elements={viewModel.elements.slice()}
              nodeTypes={nodes}
              onElementsRemove={(e) => viewModel.removeElements(e)}
              onConnect={(e) => viewModel.addEdge(e)}
              onLoad={onLoad}
              onNodeContextMenu={(e, node) => {
                e.preventDefault();
                viewModel.openPropertiesModal(node);
              }}
              onDrop={onDrop}
              onDragOver={onDragOver}
            >
              <Controls/>
            </ReactFlow>
          </div>
        </ReactFlowProvider>
      </div>
      <PropertiesDialog viewModel={viewModel} />
      {viewModel.isLineageView==false?
      <Fab
        style={{
          backgroundColor: green[500],
          position: "absolute",
          bottom: "1rem",
          right: "1rem",
          zIndex:200,
        }}
        disabled={viewModel.elements.filter((d)=>d.type==NodeType.export).length<1}
        variant="extended"
        size="medium"
        color="primary"
        onClick={async () => {
          await viewModel.submit();
        }}
      >
        <PlayArrowIcon style={{ marginRight: "0.4rem" }} />
        {t("generic.execute")}
      </Fab>:''}
    </React.Fragment>
  );
});

export default Workflow;
