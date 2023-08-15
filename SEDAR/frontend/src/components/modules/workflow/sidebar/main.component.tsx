import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "..//viewModel";
import IViewProps from "../../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import List from "@material-ui/core/List";
import ListItem from "@material-ui/core/ListItem";
import ListItemText from "@material-ui/core/ListItemText";
import { Container } from "./styles";
import { NodeType } from "../nodes";


const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const
      { t } = useTranslation();
  /**
   *
   * @param event
   * @param nodeType
   */

  const
      /**
       *
       * @param nodeType request
       */
      onDragStart = (
    event: React.DragEvent<HTMLDivElement>,
    nodeType: string
  ) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
      /**
       *
       */
    <Container>
      <List>
        {Object.keys(NodeType).map((type: string) => {
          const type_string = type;
          return (
              /**
               *@param event request
               */
            <ListItem
              key={type_string}
              button
              onDragStart={(event) => onDragStart(event, type_string)}
              draggable={viewModel.isLineageView==false}
            >
              <ListItemText style={{color:"black"}} primary={t(`workflow.items.${type_string}`)} />
            </ListItem>
          );
        })}
      </List>
    </Container>
  );
});

export default Main;
