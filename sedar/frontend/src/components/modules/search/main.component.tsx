import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import { Card, CardContent, Grid, Typography } from "@material-ui/core";
import SearchbarComponent from "../../common/searchbar";
import searchStore from "../../../stores/search.store";
import { DatasetCard } from "./card/card";
import SearchfilterComponent from "../../common/searchfilter/main.component";

/**
* Main component for the search view. 
*/
const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t } = useTranslation();

  return (
    <React.Fragment>
      <Grid container spacing={2}>
        <Grid item xs={5}>
          <Card style={{ minWidth: 275}}>
            <CardContent style={{position:"relative"}}>
              <SearchfilterComponent/>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={7}>
          <Card style={{ minWidth: 275}}>
            <CardContent style={{position:"relative"}}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom component="div">
                    {t("generic.search")}:
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                  <SearchbarComponent isWorkflow={false} isExtendedView={true} isVisualizationView={false} isRecommendation={false}/><br/>
                </Grid>
                <Grid item xs={12}>
                  {searchStore?.datasets?.map((item) => (
                    <DatasetCard item={item} isWorkflow={false} isVisualizationView={false} isRecommendation={false}/>
                  ))}
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </React.Fragment>
  );
});

export default Main;