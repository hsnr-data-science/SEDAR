import * as React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import CardContent from "@material-ui/core/CardContent";
import Card from "@material-ui/core/Card";

const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {

  // This Site exists to be a Callback-Point for GitLab
  return (
    <Card style={{ width: "20rem", margin: "0 auto" }}>
    <CardContent>
    </CardContent>
  </Card>

  );
});

export default Main;
