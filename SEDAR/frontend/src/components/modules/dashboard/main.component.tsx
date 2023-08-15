import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import { useTranslation } from "react-i18next";
import workspacesStore from "../../../stores/workspaces.store";
import { Box, Card, CardContent, Grid, IconButton, Tooltip, Typography } from "@material-ui/core";
import userStore from "../../../stores/user.store";
import IViewProps from "../../../models/iViewProps";
import { Skeleton, Stack } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import { DatasetCard } from "../search/card/card";
import DownloadIcon from '@mui/icons-material/Download';
import Plot from 'react-plotly.js';
import settingStore from "../../../stores/settings.store";
import appStore from "../../../stores/app.store";
import routingStore from "../../../stores/routing.store";

/**
* Main component for the dashboard view. 
*/
if(appStore.logoutFlag == false){
  var qs = require('qs');
  var c1 = qs.parse(window.location.search, { ignoreQueryPrefix: true }).code;
}

if(c1 != undefined){
  appStore.setCode(c1);
  routingStore.history.push("/gitauth");
}

const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  useEffect(() => {
    if(userStore.isAdmin == true){
      viewModel.registerIntevals();
      return () => viewModel.deregisterIntevals();
    }
  });
  
  const { t, i18n} = useTranslation();

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
        <CardContent style={{position:"relative"}}>
          <Typography variant="h6" gutterBottom component="div">
            {workspacesStore?.currentWorkspace!=undefined?workspacesStore?.currentWorkspace?.title:''}
          </Typography>
          {t("dashboard.welcomeMessage") + ' ' + userStore?.firstname + ' ' + userStore?.lastname + '.'} 
          <br/><br/>
          <Typography variant="h6" gutterBottom component="div">
            {t("dashboard.favorites")}:
          </Typography>
          <Box style={{paddingRight:40, paddingLeft:40, paddingTop:20, paddingBottom:20,}}>
            <Grid container spacing={2}>
              {workspacesStore?.favorites!=undefined?workspacesStore?.favorites.map((item) => (
                <Grid item xs={6}>
                  <DatasetCard item={item} isWorkflow={false} isVisualizationView={false} isRecommendation={false}/>
                </Grid>
              )):''}
            </Grid>
          </Box>
        </CardContent>
      </Card>
      {userStore.isAdmin == true?
      <React.Fragment>
        <Card style={{ minWidth: 275, marginTop:40}}>
          <CardContent style={{position:"relative"}}>
            <Typography variant="h6" gutterBottom component="div">
              {t("dashboard.health")} ({t("dashboard.healthText")}: {viewModel.lastChecked}):
            </Typography>
            <Box style={{paddingRight:40, paddingLeft:40, paddingTop:20, paddingBottom:20,}}>{
                viewModel.components.length==0?
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={4}>
                    <Skeleton variant="text" />
                  </Grid>                
                </Grid>
                :
                <Grid container spacing={2}>{
                viewModel.components?.map((item) => {
                return (
                  <Grid item xs={4}><a href={item.url} target="_blank" style={{ color:"inherit", textDecoration:"none"}}><Tooltip title={item.url}><Stack direction="row" alignItems="center" gap={1}>{item.isAlive==true?<CheckCircleIcon color="success"/>:<CancelIcon color="error"/>} {item.name}</Stack></Tooltip></a></Grid>
                  );
                })}
                </Grid>
              }
            </Box> 
          </CardContent>
        </Card>
        <Card style={{ minWidth: 275, marginTop:40}}>
          <CardContent style={{position:"relative"}}>
            <Typography variant="h6" gutterBottom component="div">
              {t("dashboard.stats")} ({t("dashboard.healthText")}: {viewModel.lastChecked}):
            </Typography>
            <Box style={{paddingRight:40, paddingLeft:40, paddingTop:20, paddingBottom:20,}}>{
                viewModel.stats==undefined?
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Skeleton variant="rectangular" height="200px"/>
                  </Grid>
                </Grid>
                :
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Plot
                      data={[{
                          x: viewModel.stats.labels[i18n.language.split('-')[0]],
                          y: viewModel.stats.values,
                          type: 'bar'
                      }
                      ]}
                      layout={ {
                        autosize: true,
                        paper_bgcolor:'rgba(0,0,0,0.0)',
                        plot_bgcolor:'rgba(0,0,0,0)',
                        font: {
                          color: settingStore.isDarkmode==true?'white':'black'
                        }
                      }}
                      useResizeHandler={true}
                      style={{width: "100%", height: "100%"}}
                    />
                  </Grid>
                </Grid>
              }
            </Box> 
          </CardContent>
        </Card>
        <Card style={{ minWidth: 275, marginTop:40 }}>
          <CardContent style={{position:"relative"}}>
            <IconButton style={{position:'absolute', top:'10px', right:'20px'}} disabled={viewModel.errorLogs==''} onClick={() => viewModel.downloadErrorLogs()}><DownloadIcon/></IconButton>
            <Typography variant="h6" gutterBottom component="div">
              {t("dashboard.errorLogs")} ({t("dashboard.healthText")}: {viewModel.lastChecked}):
            </Typography>
            <Box>{
                viewModel.errorLogs==undefined?
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                </Grid>
                :
                <pre style={{overflowX:"auto"}}>{viewModel.errorLogs}
                </pre>
              }
            </Box> 
          </CardContent>
        </Card>
        <Card style={{ minWidth: 275, marginTop:40 }}>
          <CardContent style={{position:"relative"}}>
          <IconButton style={{position:'absolute', top:'10px', right:'20px'}} disabled={viewModel.accessLogs==''} onClick={() => viewModel.downloadAccessLogs()}><DownloadIcon/></IconButton>
            <Typography variant="h6" gutterBottom component="div">
              {t("dashboard.accessLogs")} ({t("dashboard.healthText")}: {viewModel.lastChecked}):
            </Typography>
            <Box>{
                viewModel.accessLogs==undefined?
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                  <Grid item xs={12}>
                    <Skeleton variant="text" />
                  </Grid>
                </Grid>
                :
                <pre style={{overflowX:"auto"}}>{viewModel.accessLogs}
                </pre>
              }
            </Box> 
          </CardContent>
        </Card>
        </React.Fragment>:''}
    </React.Fragment>
  );
});

export default Main;
