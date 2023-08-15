import React, { useEffect } from "react";
import { Box, Card, CardContent, Grid, IconButton, Tooltip, MenuItem, Typography, Dialog, DialogTitle, DialogContent, useMediaQuery, useTheme, DialogActions, DialogContentText, Select, FormControl, InputLabel, TextField } from "@material-ui/core";
import { Button, Skeleton, Stack } from "@mui/material";
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../../models/iViewProps";
import FindInPageIcon from '@mui/icons-material/FindInPage';
import { useTranslation } from "react-i18next";
import userStore from "../../../../stores/user.store";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ErrorIcon from '@mui/icons-material/Error';
import workspacesStore from "../../../../stores/workspaces.store";
import CloseIcon from '@mui/icons-material/Close';
import Iframe from "react-iframe";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import { makeStyles } from '@material-ui/core/styles';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import routingStore from '../../../../stores/routing.store'

const useStyles = makeStyles({
  root: {
    // background: 'linear-gradient(45deg, #FE6B8B 30%, #FF8E53 90%)',
    // border: 0,
    // borderRadius: 3,
    // boxShadow: '0 3px 5px 2px rgba(255, 105, 135, .3)',
    color: 'white',
    // height: 48,
    // padding: '0 30px',
    spacing: 50
  },
});

const ONTOP: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const classes = useStyles();
  useEffect(() => {
    if (userStore.isAdmin == true) {
      viewModel.registerIntevals();
      return () => viewModel.deregisterIntevals();
    }
  });

  const { t } = useTranslation();
  const [openViewDialog, setOpenViewDialog] = React.useState(false);
  const [openSaveDialog, setOpenSaveDialog] = React.useState(false);
  const [editLoad, setEditLoad] = React.useState(false);
  const [openAddMappingDialog, setOpenAddMappingDialog] = React.useState(false);
  const [open, setOpen] = React.useState(false);


  const handleCheck = (mappings) => {
    mappings.some(element => {
      if (element._id.$oid === viewModel.mappingFile) {
        viewModel.setMapping(element.mappings_file);
        viewModel.setMappingName(element.name);
        viewModel.setMappingDescription(element.description);
        return element;
      }
    });
  };

  const resetMappingForm = () => {
    viewModel.setMapping('');
    viewModel.setMappingName('');
    viewModel.setMappingDescription('');
  }

  return (

    <React.Fragment>
      {open && (
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={open}>
          <CircularProgress color="inherit" />
        </Backdrop>
      )}


      <Card style={{ minWidth: 275, marginTop: 20 }}>
        <CardContent style={{ position: "relative" }}>
          <Typography variant="h6" gutterBottom component="div">
            {t("sdm.health")} ({t("sdm.healthText")}: {viewModel.lastChecked}):
          </Typography>
          <Box style={{ paddingRight: 40, paddingLeft: 40, paddingTop: 20, paddingBottom: 20, }}>{
            viewModel.components.length == 0 ?
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
              </Grid>
              :
              <Grid container spacing={1}>{
                viewModel.components?.map((item) => {
                  return (
                    <Grid item xs={2} ><a href={item.url} target="_blank" style={{ color: "inherit", textDecoration: "none" }}><Tooltip title={item.url}><Stack direction="row" alignItems="center" gap={1}>{item.isAlive == true ? <CheckCircleIcon color="success" /> : <CancelIcon color="error" />} {item.name}</Stack></Tooltip></a></Grid>
                  );
                })}
              </Grid>
          }
            {userStore.isAdmin == true ?
              <React.Fragment>


                <Button variant="contained" sx={{ top: 10 }} onClick={() => {
                  viewModel.initialize_hive();
                }}>
                  {t("sdm.StartHive")}
                </Button>
                <Button variant="contained" sx={{ top: 10, left: '2%', height: 38 }} onClick={() => {
                  viewModel.refresh_all();
                }}>
                  <IconButton size="small">
                    <RefreshIcon style={{ color: 'white' }} />
                  </IconButton>
                </Button>
                <Button variant="contained" sx={{ top: 10, left: '4%' }} onClick={() => {
                  viewModel.stop_hive();
                }}>
                  {t("sdm.StopHive")}
                </Button>
              </React.Fragment> : ''}
          </Box>
        </CardContent>
      </Card>
      <Card style={{ minWidth: 275, marginTop: 20 }}>
        <CardContent style={{ position: "relative" }}>


          <Grid container direction="column">
            <Card style={{ minWidth: 275 }}>
              <CardContent style={{ position: "relative" }}>
                <Grid container spacing={2} item>
                  <Grid item sm>
                    <FormControl fullWidth margin="dense">
                      <InputLabel id="demo-simple-select-label">
                        {t("sdm.configuration.mappings")}
                      </InputLabel>
                      <Select
                        value={viewModel.mappingFile}
                        onChange={(e) =>
                          viewModel.setMappingFile(e.target.value as string)
                        }
                      >
                        {
                          viewModel.mappings.map((el, index) => {
                            // @ts-ignore
                            return <MenuItem key={el._id.$oid} value={el._id.$oid}>{el.name}</MenuItem>;
                          })
                        }
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
                <Grid>
                  {viewModel.mappingFile !== "" ?
                    <Button
                      variant="contained"
                      sx={{ top: 10 }}
                      onClick={() => {
                        handleCheck(viewModel.mappings);
                        setOpenAddMappingDialog(true);
                        viewModel.setEditMapping(true);
                      }}>
                      <EditIcon />
                      {t("sdm.editMapping")}
                    </Button> : ""}
                  <Button
                    variant="contained"
                    sx={{ top: 10, left: '2%', marginRight: 1 }}
                    onClick={() => {
                      resetMappingForm();
                      setOpenAddMappingDialog(true);
                      viewModel.setEditMapping(false);
                    }}>
                    <AddCircleIcon />
                    {t("sdm.addMapping")}
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ top: 10, left: '2%', marginRight: 1, height: 38 }}
                    onClick={() => {
                      viewModel.refresh_all();
                    }}>
                    <IconButton size="small" color={'default'}>
                      <RefreshIcon style={{ color: 'white' }} />
                    </IconButton>
                  </Button>
                </Grid>
              </CardContent>
            </Card>





            <Card style={{ minWidth: 275, marginTop: 20 }}>
              <CardContent style={{ position: "relative" }}>
                <Grid container spacing={2} item>
                  <Grid item sm>
                    <FormControl fullWidth margin="dense">
                      <InputLabel id="demo-simple-select-label">
                        {t("sdm.configuration.ontology")}
                      </InputLabel>
                      <Select
                        value={viewModel.ontologyFile}
                        onChange={(e) =>
                          viewModel.setOntologyFile(e.target.value as string)
                        }
                      >
                        {
                          viewModel.ontologies.map((el, index) => {
                            // @ts-ignore
                            return <MenuItem key={el.id} value={el.id}>{el.name}</MenuItem>;
                          })
                        }
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Card style={{ minWidth: 275, marginTop: 20 }}>
              <CardContent style={{ position: "relative" }}>
                <Button
                  variant="contained" sx={{ top: 10 }}
                  disabled={!viewModel.canStartOnTop}
                  onClick={() => {
                    setOpen(true)
                    viewModel.StartOnTop().then(() => { setOpen(false); }).catch(error => {
                      alert(error);
                      viewModel.refresh_all();
                      setOpen(false);
                    });
                  }
                  }
                >
                  {t("sdm.configuration.startontop")}
                </Button>
                {viewModel.isOntopRunning && (
                  <CheckCircleIcon color="success" sx={{ top: 10, left: '2%' }} />
                )}
                {!viewModel.isOntopRunning && (
                  <ErrorIcon color="error" sx={{
                    fontSize: 40, m: 0,
                    // position: 'absolute',
                    left: '40%'
                  }} />
                )}

                {viewModel.isOntopRunning == true ?
                  <Button
                    variant="contained"
                    sx={{ top: 10, left: '4%' }}
                    onClick={() => {
                      setOpenViewDialog(true);
                    }}>
                    {t("sdm.OpenOnTop")}
                  </Button>
                  : ''}
              </CardContent>
            </Card>
          </Grid>
        </CardContent>
      </Card>


      <Dialog open={openAddMappingDialog} style={{ zIndex: 20000, padding: 0 }} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
        fullWidth>
        <DialogContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setEditLoad(true);
              viewModel.addMappingToWorkspace().then(() => {
                setEditLoad(false);
                setOpenAddMappingDialog(false);
              }).catch(error => {
                alert(error);
                setEditLoad(false);
              });
            }}>
            <Grid container direction="column">
              <Card>
                <CardContent>
                  <Typography>
                    {t("sdm.Mapping")}
                  </Typography>
                  <Grid container spacing={2} item>
                    <Grid item container xs>
                      <TextField
                        fullWidth
                        required
                        autoFocus
                        multiline
                        rows={30}
                        onChange={(e) => viewModel.setMapping(e.target.value)}
                        value={viewModel.mapping}
                        // margin="dense"
                        label={t("sdm.addMapping")}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography>
                    {t("sdm.Name")}
                  </Typography>
                  <Grid container spacing={2} item>
                    <Grid item container xs>
                      <TextField
                        autoFocus
                        multiline
                        required
                        style={{ width: 600 }}
                        rows={1}
                        onChange={(e) => viewModel.setMappingName(e.target.value)}
                        value={viewModel.mappingname}
                        // margin="dense"
                        label={t("sdm.Name")}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography>
                    {t("sdm.Description")}
                  </Typography>
                  <Grid item container xs>
                    <TextField
                      autoFocus
                      required
                      style={{ width: 600 }}
                      multiline
                      rows={10}
                      onChange={(e) => viewModel.setMappingDescription(e.target.value)}
                      value={viewModel.mappingdescription}
                      // margin="dense"
                      label={t("sdm.addDescription")}
                    />
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <DialogActions>
              <Button variant="outlined" onClick={() => {
                setOpenAddMappingDialog(false);
              }}>{t("generic.cancel")}
              </Button>
              {viewModel.editMapping === true ?
                <Button variant="outlined" disabled={!viewModel.editMapping} onClick={() => {
                  viewModel.deleteMapping();
                  setOpenAddMappingDialog(false);
                }}>{t("generic.delete")}
                </Button>
                : ''}
              <Button variant="outlined" disabled={editLoad} type="submit">{t("generic.save")}</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={openViewDialog} style={{ zIndex: 20000, padding: 0 }} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
        fullWidth>
        <DialogContent style={{ padding: 0, position: 'relative' }}>
          <Iframe width="100%" height="100%" url={process.env.ONTOP_URL_FRONTEND}></Iframe>
          <IconButton style={{ position: 'absolute', top: 5, right: 600, backgroundColor: 'red', fontSize: 80, border: 'solid red' }} onClick={() => {
            setOpenViewDialog(false);
          }}><CloseIcon /></IconButton>
          <IconButton style={{ position: 'absolute', top: 5, right: 700, backgroundColor: 'red', fontSize: 80, border: 'solid red' }} onClick={() => {
            setOpenSaveDialog(true);
          }}><SaveAsIcon /></IconButton>
        </DialogContent>
      </Dialog>

      <Dialog open={openSaveDialog} style={{ zIndex: 20000, padding: 0 }} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
        fullWidth>
        <DialogContent style={{ padding: 0, position: 'relative' }}>
        <form
            onSubmit={(e) => {
              e.preventDefault();
              viewModel.addDataSource().then(() => {
                setOpenSaveDialog(false);
                routingStore.history.push('/ingestion');
              }).catch(error => {
                alert(error);
              });
            }}>
            <Grid container direction="column">
              <Card>
                <CardContent>
                  <Typography>
                    {t("sdm.query")}
                  </Typography>
                  <Grid container spacing={2} item>
                    <Grid item container xs>
                      <TextField
                        fullWidth
                        required
                        autoFocus
                        multiline
                        rows={30}
                        onChange={(e) => viewModel.setObdaQueryString(e.target.value)}
                        value={viewModel.obdaqueryString}
                        // margin="dense"
                        label={t("sdm.addQuery")}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
              <Card>
                <CardContent>
                  <Typography>
                    {t("sdm.queryTitle")}
                  </Typography>
                  <Grid container spacing={2} item>
                    <Grid item container xs>
                      <TextField
                        autoFocus
                        multiline
                        required
                        style={{ width: 600 }}
                        rows={1}
                        onChange={(e) => viewModel.setDatasourceTitle(e.target.value)}
                        value={viewModel.datasourcetitle}
                        // margin="dense"
                        // label={t("sdm.queryTitle")}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
            <DialogActions>
              <Button variant="outlined" onClick={() => {
                setOpenSaveDialog(false);
              }}>{t("generic.cancel")}
              </Button>
              <Button variant="outlined" disabled={editLoad} type="submit">{t("generic.save")}</Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

    </React.Fragment>
  );
});

export default ONTOP;
