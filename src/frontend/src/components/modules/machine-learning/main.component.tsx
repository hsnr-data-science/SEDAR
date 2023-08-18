import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Tab, Table, TableHead, TableBody, TableCell, TableContainer, TableRow, Tabs, TextField, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import SendIcon from '@material-ui/icons/PlayArrow';
import Iframe from "react-iframe";
import CloseIcon from '@mui/icons-material/Close';
import appStore from "../../../stores/app.store";
import routingStore from "../../../stores/routing.store";
import { DropzoneArea } from "material-ui-dropzone";
import { IFileUpload } from "../../../models/fileUpload";
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RefreshIcon from '@mui/icons-material/Refresh';

import Runs from "./runs/main.component";
import { default as vM } from "./runs";

/**
* Main component for the machine learning tab. 
*/
const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {

  const { t } = useTranslation();
  const [openQueryDialog, setOpenQueryDialog] = React.useState(false);
  const [openRunDialog, setOpenRunDialog] = React.useState(false);
  const [mLResultDialog, setMLResultDialog] = React.useState(false);

  const [openViewDialog, setOpenViewDialog] = React.useState(false);
  const [openAddTagDialog, setOpenAddTagDialog] = React.useState(false);


  const [modelName, setModelName] = React.useState("");
  const [modelVersion, setModelVersion] = React.useState("");
  const [modelArt, setModelArt] = React.useState("");

  const stageTags = ["none", "staging", "production", "archived"];


  const [experiment_id, setExperimentId] = React.useState("");

  /**
  * Function for setting the Stage of a deployed model
  */
  const handleSetStage = (val) => {
    let a = val.split("!_!seperator!_!")
    viewModel.handleTransition(a[0], a[1], a[2]);

  }
  /**
  * Function for opening the Mlflow UI
  */
  const handleShow = function () {

    setOpenViewDialog(true);
  }

  /**
  * Function for opening the main prediction dialog
  */
  const handleQuery = function (run_id, name, version, art) {

    setModelName(name);
    setModelVersion(version);
    setModelArt(art);

    setOpenQueryDialog(true);


  }

  /**
  * Function for deleting an experiment
  */
  const handleDelete = function (id) {
    viewModel.handleDelete(id);

  }


  /**
  * Function for creating an Experiment
  */
  const handleSubmit = (event) => {
    event.preventDefault();
    const data = new FormData(event.target);
    viewModel.handleForm(data);

    setOpenAddTagDialog(false);
  };

  var tablecontent = JSON.parse(appStore.experiments);
  var regContent = JSON.parse(appStore.registeredModels);
  return (
    <React.Fragment>

      <Card style={{ minWidth: 275 }}>
        <CardHeader title={
          <Box>
            <Typography variant="h6" gutterBottom component="div">
              {t("ml.drawerHeader")}
            </Typography>
            <Fab
              variant="extended"
              size="medium"
              color="primary" onClick={() => {
                viewModel.listExperiment();
              }}> {t("sdm.Refresh")}
              <IconButton size="small">
                <RefreshIcon style={{ color: 'white' }} />
              </IconButton>
            </Fab><hr />
          </Box>
        }>
        </CardHeader>
        <CardContent style={{ position: "relative", padding: "40px", paddingTop: "0px" }}>


          <TableContainer>
            {t("ml.experiments")}
            <Table style={{ width: "100%", margin: "auto" }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="left">{t("ml.experimentid")}</TableCell>
                  <TableCell align="left">{t("ml.experimentname")}</TableCell>
                  <TableCell align="left">{t("ml.location")}</TableCell>
                  <TableCell align="left">{t("ml.stage")}</TableCell>
                  <TableCell align="left"></TableCell>
                  <TableCell align="left"></TableCell>
                </TableRow>
              </TableHead>





              <TableBody>


                {tablecontent.map((item, index) => (
                  <TableRow>
                    <TableCell>{item.experiment_id}</TableCell>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>{item.artifact_location}</TableCell>
                    <TableCell>{item.lifecycle_stage}</TableCell>
                    <TableCell><Button variant="outlined"
                      onClick={() => handleDelete(item.experiment_id)}
                    >
                      {t("generic.delete")}
                    </Button>
                    </TableCell>
                    <TableCell>
                      <Button variant="outlined"
                        onClick={() => {
                          viewModel.getAllDatasets();
                          setExperimentId(item.experiment_id);
                          setModelName(item.name);
                          setOpenRunDialog(true);
                        }
                        }
                      >
                        {t("ml.createRun")}
                      </Button>

                    </TableCell>
                  </TableRow>

                ))}




              </TableBody>
            </Table>

          </TableContainer>
          <br />
          <Button variant="outlined" onClick={() => setOpenAddTagDialog(true)}>{t("ml.createExperiment")}</Button>
          <br />
          <br /><br />
          <TableContainer>

            {t("ml.deployedModels")}

            <Table style={{ width: "100%", margin: "auto" }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="left">{t("ml.name")}</TableCell>
                  <TableCell align="left">{t("ml.runid")}</TableCell>
                  <TableCell align="left">{t("ml.source")}</TableCell>
                  <TableCell align="left">{t("ml.status")}</TableCell>
                  <TableCell align="left">{t("ml.version")}</TableCell>
                  <TableCell align="left">{t("ml.kind")}</TableCell>
                  <TableCell align="left">{t("ml.stage")}</TableCell>
                  <TableCell align="left"></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  if (regContent != null) {

                    return (

                      regContent["models"].map((item, index) => (
                        <TableRow>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{item.run_id}</TableCell>
                          <TableCell>{item.source}</TableCell>
                          <TableCell>{item.status}</TableCell>
                          <TableCell>{item.version}</TableCell>
                          <TableCell>{item.art}</TableCell>

                          <TableCell>


                            <InputLabel id="stageSelect">{item.stage}</InputLabel>
                            <Select
                              labelId="stageSelect"
                              id="stageSelect_id"


                              onChange={(event) => handleSetStage(event.target.value as string)}

                            >
                              {stageTags.map((item1, index1) => (
                                <MenuItem value={item.name + "!_!seperator!_!" + item.version + "!_!seperator!_!" + item1}>{item1}</MenuItem>
                              ))}
                            </Select>




                          </TableCell>
                          <TableCell align="right"><Button
                            onClick={() => handleQuery(item.run_id, item.name, item.version, item.art)}
                          >
                            {t("ml.query")}
                          </Button></TableCell>

                        </TableRow>
                      ))
                    )
                  } else {
                    return (
                      <TableRow></TableRow>
                    )
                  }
                })()}
              </TableBody>
            </Table>

          </TableContainer>




          <Dialog open={openAddTagDialog} maxWidth="sm"
            fullWidth>
            <DialogTitle>{t("generic.add")}</DialogTitle>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      variant="filled"
                      autoFocus
                      id="exp_name"
                      name="exp_name"
                      margin="dense"
                      label="experiment"
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>
                <DialogActions>
                  <Button variant="outlined" onClick={() => {
                    setOpenAddTagDialog(false)
                  }}>{t("generic.cancel")}</Button>
                  <Button variant="outlined" type="submit">{t("generic.save")}</Button>
                </DialogActions>
              </form>
            </DialogContent>
          </Dialog>



          <Fab
            style={{
              position: "fixed",
              bottom: "1rem",
              right: "1rem",
            }}
            variant="extended"
            size="medium"
            color="primary"
            onClick={() => handleShow()}
          >
            <SendIcon style={{ marginRight: "0.4rem" }} />
            {t("ml.MLFlowUI")}
          </Fab>


        </CardContent>









      </Card>


      <Dialog open={openRunDialog} maxWidth="xl" fullWidth>
        <DialogTitle>
          <Box>
            <Typography variant="h4" gutterBottom component="div">
              {t("ml.runs")}
            </Typography>
            <Typography variant="h6" gutterBottom component="div">
              Experiment: {modelName}, Experiment ID: {experiment_id}
            </Typography><hr />
            <Fab
              variant="extended"
              size="medium"
              color="primary"
              onClick={() => setOpenRunDialog(false)}
            >
              <ArrowBackIcon/>
              {t("runs.backtoexperiments")}
            </Fab>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Runs viewModel={new vM(experiment_id.toString())} />
        </DialogContent>
      </Dialog>





      <Dialog open={openViewDialog} style={{ zIndex: 20000, padding: 0 }} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
        fullWidth>
        <DialogContent style={{ padding: 0, position: 'relative' }}>
          <Iframe width="100%" height="100%" url={process.env.MLFLOW_FRONTEND_IP}></Iframe>
          <IconButton style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'red', fontSize: 80, border: 'solid red' }} onClick={() => {
            setOpenViewDialog(false);
          }}><CloseIcon /></IconButton>
        </DialogContent>
      </Dialog>

      <Dialog open={openQueryDialog} maxWidth="sm"
        fullWidth>
        <DialogTitle>{t("ml.queryQueueto")} {modelName}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("generic.addMessage")}</DialogContentText>
        </DialogContent>
      </Dialog>


      <Dialog open={mLResultDialog} maxWidth="sm"
        fullWidth>
        <DialogTitle>{t("ml.resultQuery")} {modelName}</DialogTitle>
        <DialogContent>
          <DialogContentText>Ergebnis</DialogContentText>


          <TableContainer>
            {t("ml.result")}
            <Table style={{ width: "100%", margin: "auto" }} aria-label="simple table">
              <TableHead>
                <TableRow>
                  <TableCell align="left">{t("ml.filename")}</TableCell>
                  <TableCell align="left">{t("ml.result")}</TableCell>
                </TableRow>
              </TableHead>

              {(() => {

                if (viewModel.mlergebnisse != null && viewModel.mlergebnisse != undefined) {
                  return (
                    <TableBody>
                      {viewModel.mlergebnisse.map((item, index) => (
                        <TableRow>
                          <TableCell>{item.name}</TableCell>
                          <TableCell>{JSON.stringify(item.result)}</TableCell>
                        </TableRow>
                      ))}

                    </TableBody>
                  )

                } else {
                  return (
                    <TableBody>Null</TableBody>

                  )

                }
              })()}




            </Table>
          </TableContainer>
          <DialogActions>
            <Button variant="outlined" onClick={() => {
              setMLResultDialog(false)
            }}>{t("ml.finish")}</Button>

          </DialogActions>
        </DialogContent>
      </Dialog>


    </React.Fragment>
  );
});

export default Main;
