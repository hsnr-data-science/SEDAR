import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Card, CardActions, CardContent, Fab, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography} from "@material-ui/core";
import { CardHeader, Skeleton, Stack } from "@mui/material";
import IViewProps from "../../../../models/iViewProps";
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import Plot from 'react-plotly.js';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import settingStore from "../../../../stores/settings.store";

/**
* Component that represents the test tab. This tab is only accessible for adminstrators. 
*/
const Test: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  useEffect(() => {
    viewModel.registerIntevals();
    return () => viewModel.deregisterIntevals();
  });
  const { t } = useTranslation();

  const [load, setLoad] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
      <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("test.header")}
              </Typography>
              <Typography variant="subtitle1">
                {t("test.description")}
              </Typography><hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
          {
            viewModel.test==undefined?
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Skeleton variant="rectangular" height="250px"/>
                </Grid>
              </Grid>:
          <Box>
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  {t("test.status")}: {viewModel?.test?.status ?? '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  {t("test.count")}: {viewModel?.test?.numberOfTestCases ?? '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  {t("test.started")}: {viewModel?.test?.started ?? '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  {t("test.ended")}: {viewModel?.test?.ended ?? '-'}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  {t("test.testError")}: {viewModel?.test?.error==''||viewModel?.test?.error==null?'-':viewModel?.test?.error}
                </Typography>
              </Grid>
              <Grid item xs={6}>
                <Typography variant="subtitle1">
                  {t("test.testStartedBy")}: {viewModel?.test?.startedBy==undefined?'-':viewModel?.test?.startedBy?.firstname + ' ' + viewModel?.test?.startedBy?.lastname}
                </Typography>
              </Grid>
            </Grid>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Typography variant="subtitle1">
                  {t("test.testStats")}:
                  </Typography>
                  <IconButton disabled={viewModel?.test?.status=='RUNNING'||viewModel?.test?.status==undefined||viewModel?.test?.status==''} onClick={()=>{
                    viewModel.showStats=!viewModel.showStats;
                  }}>
                    {viewModel.showStats==true?<VisibilityOffIcon/>:<VisibilityIcon/>}
                  </IconButton>
                </Stack>
              </Grid>
            </Grid>
            {viewModel.showStats==true?
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Plot
                    data={[
                      {
                      values: viewModel.pieChartOneValues,
                      labels: viewModel.pieChartOneLabels,
                      type: 'pie',
                      textinfo: 'none'
                      }
                    ]}
                    layout={ {
                      autosize:true,
                      paper_bgcolor:'rgba(0,0,0,0.0)',
                      plot_bgcolor:'rgba(0,0,0,0)',
                      title: t('test.testStatsFirstChart'),
                      font: {
                        color: settingStore.isDarkmode==true?'white':'black'
                      }
                    }}
                    useResizeHandler={true}
                    style={{width: "100%", height: "100%"}}
                  />
                </Grid>
                <Grid item xs={6}>
                  <Plot
                    data={[
                      {
                        x:viewModel.pieChartOneLabels,
                        y:viewModel.pieChartOneValues,
                        type: 'scatter'
                      }
                    ]}
                    layout={ {
                      autosize:true,
                      showlegend: false,
                      paper_bgcolor:'rgba(0,0,0,0.0)',
                      plot_bgcolor:'rgba(0,0,0,0)',
                      title: t('test.testStatsSecondChart'),
                      font: {
                        color: settingStore.isDarkmode==true?'white':'black'
                      }
                    }}
                    useResizeHandler={true}
                    style={{width: "100%", height: "100%"}}
                  />
                </Grid>
              </Grid>:''
            }
            <Paper style={{ width: '100%', marginTop:20}}>
              <TableContainer>
                <Table aria-label="collapsible table">
                  <TableHead>
                    <TableRow>
                      <TableCell align="left">{t("test.testID")}</TableCell>
                      <TableCell align="left">{t("test.testDescription")}</TableCell>
                      <TableCell align="left">{t("test.testTime")}</TableCell>
                      <TableCell align="left">{t("test.testResult")}</TableCell>
                      <TableCell align="left">{t("test.testError")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    <TableRow>
                      <TableCell align="left"></TableCell>
                      <TableCell align="left"></TableCell>
                      <TableCell align="left">{t('generic.total') + ': ' + (viewModel?.test?.delta??'0') + ' ' + t('generic.seconds')}</TableCell>
                      <TableCell align="left">{viewModel?.test?.testCases.length==0?'-':(viewModel?.test?.testCases.find((t)=> t.status=='FAILED')!=undefined?<CancelIcon/>:<CheckCircleIcon/>)}</TableCell>
                      <TableCell align="left"></TableCell>
                    </TableRow>
                    {viewModel?.test?.testCases?.map((item) => (
                      <TableRow>
                        <TableCell align="left">{item.id}</TableCell>
                        <TableCell align="left">{item.description}</TableCell>
                        <TableCell align="left">{(item.delta??'-') + ' ' +t('generic.seconds') + ' (' + item.started + ' - ' + (item.ended??'')+')'}</TableCell>
                        <TableCell align="left">{item.status=='RUNNING'?'RUNNING':(item.status=='ENDED'?<CheckCircleIcon/>:<CancelIcon/>)}</TableCell>
                        <TableCell align="left">{item.error==undefined?'-':item.error}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
            <Fab
              style={{
                position: "fixed",
                bottom: "1rem",
                right: "1rem",
              }}
              variant="extended"
              size="medium"
              color="primary"
              disabled={load==true||viewModel?.test?.status=='RUNNING'}
              onClick={async () => {
                setLoad(true);
                viewModel.postTest().then(()=> 
                  setLoad(false)).catch(error =>{
                  setLoad(false);});
              }}>
              <PlayArrowIcon style={{ marginRight: "0.4rem" }} />
              {t("generic.start")}
            </Fab>
        </Box>}
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Test;
