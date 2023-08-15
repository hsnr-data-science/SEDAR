import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import Workspaces from "./workspaces/workspaces";

/**
* Main component for the workspace administration view. 
*/
const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Workspaces viewModel={viewModel}/>
    </React.Fragment>
  );
});

export default Main;
