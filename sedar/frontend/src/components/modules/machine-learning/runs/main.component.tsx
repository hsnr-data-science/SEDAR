import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, makeStyles, CardContent, ListItemText, CardHeader, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, FormControlLabel, IconButton, InputLabel, MenuItem, Paper, Select, Tab, Table, TableHead, TableBody, TableCell, TableContainer, TableRow, Tabs, TextField, Typography, useMediaQuery, useTheme, Divider, Input } from "@material-ui/core";
import Grid from '@mui/material/Grid';
import SendIcon from '@material-ui/icons/PlayArrow';
import workspacesStore from "../../../../stores/workspaces.store";
import Iframe from "react-iframe";
import CloseIcon from '@mui/icons-material/Close';
import appStore from "../../../../stores/app.store";
import Autocomplete from '@mui/material/Autocomplete';
import routingStore from "../../../../stores/routing.store";
import userStore from '../../../../stores/user.store'
import VisibilityIcon from '@mui/icons-material/Visibility';
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import TopicIcon from '@mui/icons-material/Topic';
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import BuildIcon from '@mui/icons-material/Build';

function filterString(string: string): string {
  return string.replace("[", "")
    .replace("(", "")
    .replace("{", "")
    .replace(" ", "")
    .replace("]", "")
    .replace(")", "")
    .replace("}", "")
    .replace("`", "")
    .replace(" ", "");
}

function isEmpty(ob) {
  for (var i in ob) { return false; }
  return true;
}


/**
* Main component for the Run view. 
*/
const Runs: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {


  const [jSstate, setJSstate] = React.useState(false);
  useEffect(() => {

    /**
    * Function for creating new MLFlow-JupyterNotebooks
    * In the useEffect()-Funktion you can define asyncronous-functions in the main-component
    */
    async function handleNewJupyterScriptAsync() {
      var containerstatus = await viewModel.checkContainer();
      if (containerstatus == "running") {
        viewModel.notebookurl = "";
        var processedDatastes = [];
        for (var i = 0; i < jupyterDataset.length; i++) {
          processedDatastes.push(jupyterDataset[i].id + "!_!seperator!_!" + jupyterDataset[i].title + "!_!seperator!_!" + i);
        }
        setOpenBackdrop(true);
        const r = (await viewModel.addJupyterRun(viewModel.experiment_id, juypterMethod, jupyterModel, processedDatastes, nbtitle, nbdescription, nbis_public, nbwithDeploy));
        if (r == true) {
          closeJupyter();
          setOpenNotebookDialog(true);
        } else {
          setOpenBackdrop(false);
        }
      } else {
        alert("JupyterHub Single-User-Server not running!")
      }

    }
    if (jSstate == true) {
      handleNewJupyterScriptAsync();
      setJSstate(false);
    }
  });


  const { t } = useTranslation();
  const [openNotebookDialog, setOpenNotebookDialog] = React.useState(false);
  const [openBackdrop, setOpenBackdrop] = React.useState(false);

  const [runName, setRunName] = React.useState({});
  const [openJupyterDialog, setOpenJupyterDialog] = React.useState(false);

  const [juypterMethod, setJuypterMethod] = React.useState('');
  const [jupyterModel, setJupyterModel] = React.useState('');
  const [jupyterDataset, setJupyterDataset] = React.useState([]);


  const [nbtitle, setNbtitle] = React.useState('');

  const [nbdescription, setNbdescription] = React.useState('');
  const [nbis_public, setNbis_public] = React.useState(false);
  const [nbwithDeploy, setNbwithDeploy] = React.useState(false);




  const learningMethods = ["Supervised Learning", "Unsupervised Learning"];

  let linearmodelsJSON = require('../../../../../../mlflow/supervisedModels.json');
  let unsupervisedmodelsJSON = require('../../../../../../mlflow/clusterModels.json');

  let linearmodels = []
  let linearClass = {}
  let unsupervisedClass = {}

  for (let z = 0; z < linearmodelsJSON.length; z++) {

    linearmodels.push(linearmodelsJSON[z]["displayname"]);
    linearClass[linearmodelsJSON[z]["displayname"]] = linearmodelsJSON[z]["class"] + "!_!seperator!_!" + JSON.stringify(linearmodelsJSON[z]["parameters"]);
  }

  for (let y = 0; y < unsupervisedmodelsJSON.length; y++) {
    unsupervisedClass[unsupervisedmodelsJSON[y]["displayname"]] = unsupervisedmodelsJSON[y]["class"] + "!_!seperator!_!" + JSON.stringify(unsupervisedmodelsJSON[y]["parameters"]);

  }

  const tablecontent = JSON.parse(appStore.runs);

  /**
  * Function for opering the dialog to create jupyter notebooks
  */
  const handleJupyter = function () {
    setOpenJupyterDialog(true);
  }


  /**
  * Function for closing the jupyter notebook dialog
  */
  const closeJupyter = function () {
    setJuypterMethod("");
    setJupyterModel("");
    setJupyterDataset([]);
    setNbtitle("");
    setNbdescription("");
    setNbis_public(false);
    setNbwithDeploy(false);
    setOpenJupyterDialog(false);
  }

  /**
  * Helper-Function for setting up the depolyment of runs
  */
  const beforeSetRunName = (event, id) => {
    runName[id] = event.target.value;
    viewModel.runModelNames = runName;

  }

  /**
  * Function for open the asynchronous function for creating an new jupyter notebook
  */
  const handleNewJupyterScript = function () {
    setJSstate(true);
  }


  return (
    <React.Fragment>


      <Dialog open={openBackdrop} style={{ zIndex: 20000, padding: 0 }} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
        fullWidth>
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={openBackdrop}>
          <CircularProgress color="inherit" />
        </Backdrop>
      </Dialog>




      <Card style={{ minWidth: 275 }}>
        <CardHeader>
        </CardHeader>
        <CardContent style={{ position: "relative", padding: "20px", paddingTop: "0px" }}>
          <Grid container spacing={2}>
            <Fab
              variant="extended"
              size="medium"
              color="primary" onClick={() => {
                viewModel.initialize();
                const listItems = Object.keys(tablecontent).map((key) => tablecontent[key]);
              }}> {t("sdm.Refresh")}
              <IconButton size="small">
                <RefreshIcon style={{ color: 'white' }} />
              </IconButton>
            </Fab>
            <Fab
              variant="extended"
              size="medium"
              color="primary"
              onClick={() => handleJupyter()}
            >
              <SendIcon style={{ marginRight: "0.4rem" }} />
              {t("runs.addrunjupyter")}
            </Fab>
          </Grid>
          <br />
          <br />
          <br />
          {tablecontent != null ?
            <Grid container spacing={2}>
              {(() => {
                if (!isEmpty(tablecontent)) {
                  const listItems = Object.keys(tablecontent).map((key) => tablecontent[key]);
                  return (
                    listItems.map((item, index) => (
                      <Grid item xs={12}>
                        <Box padding={2}>
                          <Grid border={3} borderColor="#000000" borderBottom={0} container spacing={1} columns={5}>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#D4D4D4' }}>
                              {t("runs.nr")}
                            </Grid>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#C4C4C4' }}>
                              {t("runs.user")}
                            </Grid>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#D4D4D4' }}>
                              {t("runs.status")}
                            </Grid>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#C4C4C4' }}>
                              {t("runs.artifact")}
                            </Grid>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#D4D4D4' }}>
                              {t("runs.stage")}
                            </Grid>
                            <Grid item xs={1}>{index}</Grid>
                            <Grid item xs={1}>
                              <div>{item.data.tags["username"]}</div>
                            </Grid>
                            <Grid item xs={1}>{item.info.status}</Grid>
                            <Grid item xs={1} zeroMinWidth>
                              <Typography style={{ overflowWrap: 'break-word' }}> {item.info.artifact_uri}</Typography>
                            </Grid>
                            <Grid item xs={1}>{item.info.lifecycle_stage}</Grid>
                          </Grid>


                          <Grid border={3} borderColor="#000000" borderBottom={0} borderTop={0} container spacing={1} columns={2}>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#D4D4D4' }}>
                              {t("runs.metrics")}
                            </Grid>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#C4C4C4' }}>
                              {t("runs.parameter")}
                            </Grid>
                            <Grid item xs={1}>
                              <Table style={{ width: "100%", margin: "auto", borderRight: "1px solid rgba(224, 224, 224, 1)" }} aria-label="simple table">
                                <TableBody>
                                  {Object.keys(listItems[index]["data"]).includes("metrics") == true ? Object.keys(listItems[index]["data"]["metrics"]).map((key, value) => {
                                    return (
                                      <TableRow>
                                        <TableCell>
                                          {key}
                                        </TableCell>
                                        <TableCell>
                                          {value}
                                        </TableCell>
                                      </TableRow>)
                                  })
                                    : <TableRow></TableRow>
                                  }
                                </TableBody>
                              </Table>
                            </Grid>
                            <Grid item xs={1}>
                              <Table style={{ width: "100%", margin: "auto" }} aria-label="simple table">
                                <TableBody>
                                  {Object.keys(listItems[index]["data"]).includes("params") == true ? Object.keys(listItems[index]["data"]["params"]).map((key, value) => {
                                    return (
                                      <TableRow>
                                        <TableCell>
                                          {key}
                                        </TableCell>
                                        <TableCell>
                                          {value}
                                        </TableCell>
                                      </TableRow>)
                                  })
                                    : <TableRow></TableRow>
                                  }
                                </TableBody>
                              </Table>
                            </Grid>
                          </Grid>


                          <Grid border={3} borderColor="#000000" borderTop={0} container spacing={1} columns={3}>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#D4D4D4' }}>
                              {t("runs.deployment")}
                            </Grid>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#C4C4C4' }}>
                              {t("runs.notebook")}
                            </Grid>
                            <Grid item xs={1} sx={{ fontWeight: 'bold', fontSize: '12px', borderBottom: 1, backgroundColor: '#D4D4D4' }}>
                              {t("runs.datasets")}
                            </Grid>
                            <Grid item xs={1}>
                              <TextField
                                name={"runName_" + item.info.run_id}
                                id={"runName_" + item.info.run_id}
                                onChange={(e) => beforeSetRunName(event, item.info.run_id)}
                                value={runName[item.info.run_id]}
                                margin="dense"
                                label="Deployment Name"
                                required
                              />
                              {(viewModel.runModelNames[item.info.run_id] != undefined && runName[item.info.run_id] != "")?
                              <Button variant="contained"  style={{color: 'red'}} onClick={() => viewModel.deployRun(item.info.run_id, item.info.artifact_uri, runName[item.info.run_id])}>
                                <IconButton size="small">
                                      <BuildIcon />{t("runs.deploy")}
                                </IconButton></Button>
                              :''}
                            </Grid>
                            <Grid item xs={1}>
                              {(() => {
                                var notebook_info = item.data.tags["notebook"];
                                var public_info = item.data.tags["is_public"];
                                var dataset_info = item.data.tags["datasets"].split(",");
                                var username = item.data.tags["username"];
                                return (
                                  <Button variant="contained" onClick={() => {
                                    if (public_info == "true" && username != userStore.username) {
                                      viewModel.copyNbFromHDFStoContainer(userStore.username, notebook_info.split(",")[1], dataset_info[0].split("|")[0])
                                    }
                                    viewModel.notebookurl = process.env.JUPYTERHUB_URL + "/user/" + userStore.username + "/notebooks/" + filterString(workspacesStore.currentWorkspace.title) + "/" + dataset_info[0].split("|")[0] + "/" + notebook_info.split(",")[0]
                                    setOpenNotebookDialog(true);
                                  }}><IconButton size="small">
                                      <ManageSearchIcon />{notebook_info.split(",")[0]}
                                    </IconButton>
                                  </Button>
                                )
                              })()}
                            </Grid>
                            <Grid item xs={1}>
                              {(() => {
                                var datasetinfo = item.data.tags["datasets"].split(",")
                                return (
                                  datasetinfo.map((item1, index1) => (
                                    <Button variant="contained" onClick={() => {
                                      routingStore.history.push("/dataset/" + item1.split("|")[1]);
                                    }}>
                                      <IconButton size="small">
                                        <TopicIcon style={{ color: 'white' }} />
                                      </IconButton>{item1.split("|")[0]}
                                    </Button>
                                  ))
                                )
                              })()}
                            </Grid>
                          </Grid>
                        </Box>
                      </Grid>
                    ))
                  )
                } else {
                  return (
                    <Grid>
                      <Typography variant="h6">
                        No Runs in this Experiment. Add Runs through a Notebook.
                      </Typography>
                    </Grid>
                  )
                }

              })()}
            </Grid> : ''}

          <Dialog open={openJupyterDialog} maxWidth="sm" fullWidth>
            <DialogTitle>{t("generic.add")}</DialogTitle>
            <DialogContent>
              <div>
                <DialogContentText>{t("generic.addMessage")}</DialogContentText>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      variant="filled"
                      autoFocus
                      onChange={(e) => setNbtitle(e.target.value as string)}
                      value={nbtitle}
                      margin="dense"
                      label={t("dataset.analyticsTabTitleProperty")}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      multiline
                      minRows={4}
                      onChange={(e) => setNbdescription(e.target.value as string)}
                      value={nbdescription}
                      margin="dense"
                      label={t("dataset.analyticsTabDescriptionProperty")}
                      fullWidth
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox checked={nbis_public} color="primary" onChange={() => setNbis_public(!nbis_public)} />
                      }
                      label={t("dataset.analyticsTabIsPublic")}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox checked={nbwithDeploy} color="primary" onChange={() => setNbwithDeploy(!nbwithDeploy)} />
                      }
                      label={t("dataset.analyticsTabWithDeploy")}
                    />
                  </Grid>

                  {viewModel.datasets.length != 0 ?
                    <Grid item xs={12}>
                      <Autocomplete
                        multiple
                        id="jupyter_select_dataset"
                        options={viewModel.datasets}
                        getOptionLabel={(option) => option.title}
                        onChange={(event, value) => setJupyterDataset(value)}
                        renderInput={(params) => (
                          <TextField
                            required
                            {...params}
                            variant="filled"
                            label="Dataset"
                            placeholder="Datasets"
                          />
                        )}
                      />
                    </Grid> : ''}

                  {jupyterDataset.length != 0 ?
                    <Grid item xs={6} style={{ minWidth: 300 }}>
                      <InputLabel id="jupyter_select_learning_method_label">{t("runs.method")}</InputLabel>
                      <Select
                        style={{ minWidth: 300 }}
                        labelId="jupyter_select_learning_method_label"
                        id="jupyter_select_learning_method"
                        label={t("runs.method")}
                        value={juypterMethod}
                        onChange={(event) => setJuypterMethod(event.target.value as string)}
                      >
                        {learningMethods.map((item1, index1) => (
                          <MenuItem value={item1}>{item1}</MenuItem>
                        ))}
                      </Select>
                    </Grid> : ""}

                  {juypterMethod != "" ?
                    <Grid item xs={6}>
                      <InputLabel id="jupyter_select_modell_label">{t("runs.modell")}</InputLabel>
                      <Select
                        style={{ minWidth: 300 }}
                        labelId="jupyter_select_modell_label"
                        id="jupyter_select_modell"
                        label={t("runs.modell")}
                        value={jupyterModel}
                        onChange={(event) => setJupyterModel(event.target.value as string)}
                      >
                        {(() => {
                          if (juypterMethod == "Supervised Learning") {
                            return (
                              linearmodelsJSON.map((item1, index1) => (
                                <MenuItem value={item1.class}>{item1.displayname}</MenuItem>
                              ))

                            )
                          } else if (juypterMethod == "Unsupervised Learning") {
                            return (
                              unsupervisedmodelsJSON.map((item1, index1) => (
                                <MenuItem value={item1.class}>{item1.displayname}</MenuItem>
                              ))
                            )
                          }
                        })()}
                      </Select>
                    </Grid>
                    : ""}
                </Grid>

                <DialogActions>
                  <Button variant="outlined" onClick={() => {
                    closeJupyter()
                  }}>{t("generic.cancel")}</Button>

                  <Button variant="outlined" onClick={() => {
                    window.open(process.env.JUPYTERHUB_URL, '_blank', 'noopener,noreferrer');
                  }}>JupyterHub</Button>

                  {(() => {
                    if (jupyterDataset.length != 0 && nbtitle != "") {
                      return (
                        <Button variant="outlined" onClick={() => handleNewJupyterScript()}>{t("generic.save")}</Button>
                      )
                    } else {
                      return (
                        <Button disabled variant="outlined">{t("generic.save")}</Button>
                      )
                    }
                  })()}

                </DialogActions>
              </div>
            </DialogContent>
          </Dialog>




          <Dialog open={openNotebookDialog} style={{ zIndex: 20000, padding: 0 }} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
            fullWidth>
            <DialogContent style={{ padding: 0, position: 'relative' }}>
              <Iframe width="100%" height="100%" url={viewModel.notebookurl}></Iframe>
              <IconButton style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'red', fontSize: 80, border: 'solid red' }} onClick={() => {
                setOpenNotebookDialog(false);
                setOpenBackdrop(false);
              }}><CloseIcon /></IconButton>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card >

    </React.Fragment >
  );
});

export default Runs;