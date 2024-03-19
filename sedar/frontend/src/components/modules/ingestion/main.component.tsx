import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, CardHeader, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, FormControlLabel, Grid, IconButton, InputLabel, LinearProgress, MenuItem, Paper, Select, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableRow, Tabs, TextField, Typography } from "@material-ui/core";
import { Skeleton, Stack } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { DropzoneArea } from "material-ui-dropzone";
import StoreStatus from "../../../models/storeStatus.enum";
import InfoIcon from '@mui/icons-material/Info';
import { IFileUpload } from "../../../models/fileUpload";
import AutocompleteComponent from "../../common/autocomplete";
import workspacesStore from "../../../stores/workspaces.store";
import userStore from "../../../stores/user.store";
import { Entity } from "./schema/entitiy";
import { Files } from "./schema/files";
import { NeoGraph } from "../../common/neograph/NeoGraph";
import { LocalizationProvider, DesktopDatePicker } from "@mui/lab";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import MDEditor from "@uiw/react-md-editor";
import { TextField as TF } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import SaveAsIcon from '@mui/icons-material/SaveAs';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { format } from "date-fns";
import Examples from "./examples.json"
import DeleteIcon from '@mui/icons-material/Delete';
import CSV from "./templates/csv"
import JSONtemplate from "./templates/jsont" // had to rename slighlty to not interfere with JSON library
import Postgres from "./templates/postgres" // had to rename slighlty to not interfere with JSON library
import Iframe from "react-iframe";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';


interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  /**
   *
   * @param props
   * @constructor
   */
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          <Typography component={"span"}>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

const writetypes = [{ value: 'DEFAULT', label: 'DEFAULT', }, { value: 'DELTA', label: 'DELTA', },];

function a11yProps(index: any) {
  /**
   *
   * @param index
   */
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

/**
* Main component for the ingestion view. 
*/
const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  useEffect(() => {

    viewModel.registerIntevals();
    return () => viewModel.deregisterIntevals();
  });
  const { t } = useTranslation();

  const [openAddDialog, setOpenAddDialog] = React.useState(false);
  const [load, setLoad] = React.useState(false);
  const [openPublishDialog, setOpenPublishDialog] = React.useState(false);
  const [publish, setPublish] = React.useState(false);
  const [publishAndProfile, setPublishAndProfile] = React.useState(false);
  const [value, setValue] = React.useState(0);
  const [index, setIndex] = React.useState(false);
  const [editLoad, setEditLoad] = React.useState(false);
  const [openAddUserDialog, setOpenAddUserDialog] = React.useState(false);
  const [openPermissionDialog, setOpenPermissionDialog] = React.useState(false);
  const [canRead, setCanRead] = React.useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [canWrite, setCanWrite] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState('');
  const [selectedUserToDelete, setSelectedUserToDelete] = React.useState('');
  const [userToChangePermission, setUserToChangePermission] = React.useState('');
  const [deleteLoad, setDeleteLoad] = React.useState(false);
  const [tagToDelete, setTagToDelete] = React.useState('');
  const [openAddTagDialog, setOpenAddTagDialog] = React.useState(false);
  const [selectedExample, setSelectedExample] = React.useState('');
  const [openDeleteDatasetDialog, setOpenDeleteDatasetDialog] = React.useState(false);
  const [datasetToDelete, setDatasetToDelete] = React.useState('');
  const [template, setTemplate] = React.useState(1);
  const [writeType, setWriteType] = React.useState('');
  const [openprogress, setOpenProgress] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) =>
      /**
       *
       * @param event
       * @param newValue
       */ {
    setValue(newValue);
  };

  function handleForm() {
    try {
      var def = JSON.parse(viewModel.datasourceDefinition);
      def.write_type = writeType;
      if (template == 1 || template == 2) {
        def.read_type = 'SOURCE_FILE';
      } else if (template == 3) {
        def.read_type = 'PULL';
      }
      viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
      console.log(viewModel.datasourceDefinition);
    } catch (ex) {

    }


  }

  useEffect(() => {
    setProgress(viewModel.progress)
    handleForm();
  }, [writeType]);

  return (
    <React.Fragment>
      {openprogress && (
        <Backdrop
          sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
          open={openprogress}>
          <CircularProgress variant="determinate" value={viewModel.progress} />
        </Backdrop>
      )}

      <Card style={{ minWidth: 275 }}>
        <CardHeader title={
          <Box>
            <Typography variant="h6" gutterBottom component="div">
              {t("ingestion.drawerHeader")}
            </Typography>
            <Typography variant="subtitle1">
              {t("ingestion.description")}
            </Typography><hr />
          </Box>
        }>
        </CardHeader>
        <CardContent style={{ position: "relative", padding: "40px", paddingTop: "0px" }}>
          {
            viewModel.status != StoreStatus.ready ?
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Skeleton variant="rectangular" height="200px" />
                </Grid>
                <Grid item xs={12}>
                  <Skeleton variant="rectangular" height="200px" />
                </Grid>
              </Grid> : viewModel.datasets.map((item) => (
                <Card style={{ minWidth: 275, marginBottom: "20px" }}>
                  <CardContent style={{ position: "relative", padding: "40px" }}>
                    <IconButton style={{ position: "absolute", top: 5, right: 5 }} onClick={() => {
                      setDatasetToDelete(item.id);
                      setOpenDeleteDatasetDialog(true);
                    }}><DeleteIcon /></IconButton>
                    <Typography variant="h6" gutterBottom component="div">
                      {item.title}
                    </Typography>
                    <Typography variant="subtitle1">
                      {item.owner.firstname + ' ' + item.owner.lastname}
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Table>
                          <TableRow>
                            <TableCell align="left" style={{ borderBottom: "none", width: '20%' }}>
                              {t("ingestion.state")}:
                            </TableCell>
                            <TableCell align="left" style={{ borderBottom: "none", width: '80%' }}>
                              {item.datasource.ingestions.length == 0 ? '' : item.datasource.ingestions[item.datasource.lates_ingestion].state}
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell align="left" style={{ borderBottom: "none", width: '20%' }}>
                              {t("generic.error")}:
                            </TableCell>
                            <TableCell align="left" style={{ borderBottom: "none", width: '80%' }}>
                              {item.datasource.ingestions.length == 0 ? '' : item.datasource.ingestions[item.datasource.lates_ingestion].error == undefined ? '-' : <Stack direction="row" alignItems="center" gap={1} style={{ color: 'red' }}><InfoIcon /> {item.datasource.ingestions[item.datasource.lates_ingestion].error}</Stack>}
                            </TableCell>
                          </TableRow>
                        </Table>
                      </Grid>
                    </Grid>
                  </CardContent>
                  <CardActions>
                    <Box style={{ marginLeft: "auto" }}>
                      {<Button variant="outlined" 
                      // disabled={item?.datasource?.ingestions[item?.datasource?.lates_ingestion]?.state == 'FINISHED' ? (item?.datasource?.ingestions[item?.datasource?.lates_ingestion]?.error == undefined ? true : false) : (item?.datasource?.ingestions[item?.datasource?.lates_ingestion]?.state == undefined ? false : true)} 
                      style={{ marginLeft: "auto" }} onClick={() => viewModel.runIngestion(item.id)}>{t('ingestion.startIngestion')}</Button>}
                      {item.datasource.ingestions.length == 0 ? '' : (item.datasource.ingestions[item.datasource.lates_ingestion].state != undefined ? <Button variant="outlined" style={{ marginLeft: 5 }} onClick={() => {
                        if (viewModel.datasetPublish.id != item.id) {
                          viewModel.lineage.replace([]);
                          viewModel.datasetPublish = item
                          // @ts-ignore  
                          if (viewModel.datasetPublish.lineage != undefined && viewModel.datasetPublish.lineage != []) {
                            viewModel.datasetPublish.lineage.forEach((item) => {
                              viewModel.getDatasetsForLineage(item);
                            })
                          }
                        }
                        setValue(0);
                        setOpenPublishDialog(true);
                      }} disabled={item.isUpdateFor == true}>{t("ingestion.publish")}</Button> : '')}
                    </Box>
                  </CardActions>
                </Card>
              ))
          }



          <Dialog open={openAddTagDialog}
            fullScreen>
            <DialogTitle>{t("annotation.add")}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("annotation.helper_text")}</DialogContentText>
              <form onSubmit={(e) => {
                e.preventDefault();
                setEditLoad(true);
                viewModel.postTag().then(() => {
                  setEditLoad(false);
                  setOpenAddTagDialog(false);
                }).catch(error => {
                  alert(error);
                  setEditLoad(false);
                })
                  ;
              }}><br />

                <Grid container spacing={5}>
                  <Grid item xs={12}>
                    <TextField
                      autoFocus
                      onChange={(e) => viewModel.tag.title = e.target.value as string}
                      value={viewModel.tag.title}
                      margin="dense"
                      label="Title"
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Card style={{ minWidth: 275 }}>
                      <CardHeader title={
                        <Box>
                          <Typography variant="h6" gutterBottom component="div">
                            Choose from the stored ontologies via keyword search (Required!)
                          </Typography><hr />
                        </Box>
                      }>
                      </CardHeader>
                      <CardContent style={{ position: "relative", padding: 20, paddingLeft: 40, paddingRight: 40 }}>
                        <AutocompleteComponent
                          value={viewModel.tagOntologyProperty}
                          onChange={(value) =>
                            viewModel.setTagOntologyProperty(value)
                          }
                          title={t("annotation.ontology_property")}
                          queryUrl={(term: string) =>
                            process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/workspaces/${workspacesStore.currentWorkspace?.id}/ontologies/completion?search_term=${term}`
                          }
                        />
                        <br /> <br /> <br />
                        <Box>
                          <Typography variant="h6" gutterBottom component="div">
                            {t("workspaceAdministration.ontologyVisualization")}
                          </Typography>
                          <Typography variant="subtitle1">
                            {t("workspaceAdministration.ontologyVisualizationDescription")}
                          </Typography><hr />
                        </Box>

                        <Box style={{ padding: "20px" }}>
                          <FormControl fullWidth>
                            <InputLabel variant="standard" htmlFor="uncontrolled-native">
                              {t("workspaceAdministration.ontologySelect")}
                            </InputLabel>
                            <Select
                              labelId="demo-simple-select-label"
                              id="demo-simple-select"
                              label={"Graph Name"}
                              value={viewModel.ontologyToVisualize}
                              style={{ width: "100%" }}
                              onChange={(e) => viewModel.setOntologyToVisualize(e.target.value as string)}
                            >
                              {viewModel.currentWorkspace.ontologies != undefined ? viewModel.currentWorkspace.ontologies.map((item) => (
                                <MenuItem key={item.id} value={item.id}> {item.title} </MenuItem>
                              )) : ''}
                            </Select>
                          </FormControl>
                          {
                            viewModel.ontologyToVisualize != '' ?
                              <Iframe url={viewModel.iriOfOntologyToVisualize}
                                width="100%"
                                height="400px"
                                position="relative" /> : ""
                          }
                        </Box>
                      </CardContent>
                      <CardActions>
                      </CardActions>
                    </Card>
                  </Grid>
                  <br /> <br /> <br />
                  <Grid item xs={12}>
                    <Card style={{ minWidth: 275 }}>
                      <CardHeader title={
                        <Box>
                          <Typography variant="h6" gutterBottom component="div">
                            Optional: Additonally choose from an external knowledge base (WikiData)
                          </Typography><hr />
                        </Box>
                      }>
                      </CardHeader>
                      <CardContent style={{ position: "relative", padding: 20, paddingLeft: 40, paddingRight: 40 }}>
                        <AutocompleteComponent
                          value={viewModel.tagOntologyProperty}
                          onChange={(value) =>
                            viewModel.setTagOntologyProperty(value)
                          }
                          title={t("annotation.ontology_property")}
                          queryUrl={(term: string) =>
                            process.env.MAIN_BACKEND_URL + '/api/v' + process.env.MAIN_BACKEND_API_VERSION + `/workspaces/${workspacesStore.currentWorkspace?.id}/ontologies/completion?knowledge_base=WikiData&search_term=${term}`

                          }
                        />
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
                <DialogActions>
                  <Button variant="outlined" onClick={() => {
                    setOpenAddTagDialog(false)
                  }}>{t("generic.cancel")}</Button>
                  <Button variant="outlined" disabled={editLoad || viewModel.tagOntologyProperty == undefined} type="submit">{t("generic.save")}</Button>
                </DialogActions>
              </form>
            </DialogContent>
          </Dialog>




          <Dialog open={openPermissionDialog} maxWidth="sm"
            fullWidth>
            <DialogTitle>{t("generic.permission")}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("generic.permissionMessage")}.</DialogContentText>
              <Grid container spacing={2}>
                <Grid item xs={4}>
                  <FormControlLabel control={<Checkbox color="primary" checked={canRead} disabled onClick={() => setCanRead(!canRead)} />} label={t("generic.read")} />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel control={<Checkbox color="primary" checked={canWrite} onClick={() => setCanWrite(!canWrite)} />} label={t("generic.write")} />
                </Grid>
                <Grid item xs={4}>
                  <FormControlLabel control={<Checkbox color="primary" checked={canDelete} onClick={() => setCanDelete(!canDelete)} />} label={t("generic.delete")} />
                </Grid>
              </Grid>
              <DialogActions>
                <Button variant="outlined" onClick={() => setOpenPermissionDialog(false)}>{t("generic.cancel")}</Button>
                <Button variant="outlined" disabled={deleteLoad} onClick={() => {
                  setDeleteLoad(true);
                  viewModel.updatePermissionForUser(selectedUser, canRead, canWrite, canDelete).then(() => {
                    setDeleteLoad(false);
                    setOpenPermissionDialog(false);
                  }).catch(error => {
                    alert(error);
                    setDeleteLoad(false);
                  })
                }}>{t("generic.save")}</Button>
              </DialogActions>
            </DialogContent>
          </Dialog>




          <Dialog open={openPublishDialog} maxWidth="md"
            fullWidth>
            <DialogTitle>{t("ingestion.publish")}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("ingestion.publishMessage")}</DialogContentText>
              <form onSubmit={async (e) => {
                e.preventDefault();
                setLoad(true);
                viewModel.putDataset().then(() => {
                  viewModel.publishDataset(index, publishAndProfile).then(() => {
                    setPublishAndProfile(false);
                    setLoad(false);
                    setPublish(false);
                    setOpenPublishDialog(false);
                  }).catch(error => {
                    alert(error);
                    setPublishAndProfile(false);
                    setPublish(false);
                    setLoad(false);
                  })
                }).catch(error => {
                  alert(error);
                  setLoad(false);
                })
                  ;
              }}>
                <Tabs
                  value={value}
                  onChange={handleChange}
                  indicatorColor={'primary'}
                  aria-label="tab"
                  variant="scrollable"
                  scrollButtons="auto"
                >
                  <Tab label={t('ingestion.publishGeneralTab')} {...a11yProps(0)} />
                  <Tab disabled={viewModel.pageOneAndTwoDisabled} label={t('ingestion.publishAccessTab')} {...a11yProps(1)} />
                  <Tab disabled={viewModel.pageOneAndTwoDisabled} label={t('ingestion.publishSchemaTab')} {...a11yProps(2)} />
                  <Tab disabled={false} label={t('ingestion.publishReviewTab')} {...a11yProps(3)} />
                </Tabs>
                <TabPanel value={value} index={0}>
                  <Box style={{ position: "relative", padding: "40px" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.publishGeneralTabInfoOne')} </Stack>
                      </Grid>
                      <Grid container style={{ padding: '40px' }}>
                        <Grid item xs={12}>
                          {t('ingestion.publishGeneralTabTags')}:
                          {
                            viewModel?.datasetPublish?.tags?.map((tag) => {
                              return (
                                <Chip label={tag.title + ' (' + tag.annotation.ontology.title + ': ' + tag.annotation.instance + ')'} style={{ margin: "10px" }} onDelete={() => {
                                  setOpenDeleteDialog(true);
                                  setTagToDelete(tag.id);
                                }} />
                              );
                            })
                          }
                          <IconButton onClick={() => {
                            viewModel.tagOntologyProperty = undefined;
                            viewModel.tag.title = '';
                            setOpenAddTagDialog(true)
                          }}><AddCircleIcon /></IconButton>
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? <Box>{
                              viewModel?.lineage?.map((items) => {
                                return (items?.tags?.map((tag) => {
                                  return (
                                    <Chip label={items.title + ': ' + tag.title} disabled={viewModel?.datasetPublish?.tags?.find((t) => t.id == tag.id) != undefined} style={{ margin: "10px" }} onClick={() => {
                                      setEditLoad(true);
                                      viewModel.postTag(tag.id).then(() => {
                                        setEditLoad(false);
                                      }).catch(error => {
                                        alert(error);
                                        setEditLoad(false);
                                      });
                                    }} />
                                  );
                                }))
                              })}</Box> : ''
                          }
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            onChange={(e) => viewModel.datasetPublish.title = e.target.value as string}
                            value={viewModel.datasetPublish.title}
                            margin="dense"
                            label={t("ingestion.publishGeneralTabDatasetTitle")}
                            fullWidth
                            required
                          />
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                              return (
                                <Chip label={item.title + ': ' + item.title} style={{ margin: "10px" }} onClick={() => {
                                  viewModel.datasetPublish.title = item.title;
                                }} />
                              );
                            }) : ''
                          }
                        </Grid>
                        <Grid item xs={12}>
                          <MDEditor
                            value={viewModel.datasetPublish.description ?? ('# ' + t("dataset.generalTabReadme"))}
                            onChange={(v) => viewModel.datasetPublish.description = v}
                          />
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                              return (
                                <Chip label={item.title + ': ' + item.description} style={{ margin: "10px" }} onClick={() => {
                                  viewModel.datasetPublish.description = item.description;
                                }} />
                              );
                            }) : ''
                          }
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.publishGeneralTabInfoTwo')}</Stack>
                      </Grid>
                      <Grid container style={{ padding: '40px' }}>
                        <Grid item xs={12}>
                          <TextField
                            onChange={(e) => viewModel.datasetPublish.author = e.target.value as string}
                            value={viewModel.datasetPublish.author ?? ''}
                            margin="dense"
                            label={t("ingestion.publishGeneralTabDatasetAuthor")}
                            fullWidth
                          />
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                              return (
                                <Chip label={item.title + ': ' + item.author} style={{ margin: "10px" }} onClick={() => {
                                  viewModel.datasetPublish.author = item.author;
                                }} />
                              );
                            }) : ''
                          }
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            onChange={(e) => viewModel.datasetPublish.language = e.target.value as string}
                            value={viewModel.datasetPublish.language ?? ''}
                            margin="dense"
                            label={t("ingestion.publishGeneralTabDatasetLanguage")}
                            fullWidth
                          />
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                              return (
                                <Chip label={item.title + ': ' + item.language} style={{ margin: "10px" }} onClick={() => {
                                  viewModel.datasetPublish.language = item.language;
                                }} />
                              );
                            }) : ''
                          }
                        </Grid>
                        <Grid item xs={12}>
                          <MDEditor
                            value={viewModel.datasetPublish.license ?? ('# ' + t("dataset.generalTabLicense"))}
                            onChange={(v) => viewModel.datasetPublish.license = v}
                          />
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                              return (
                                <Chip label={item.title + ': ' + item.license} style={{ margin: "10px" }} onClick={() => {
                                  viewModel.datasetPublish.license = item.license;
                                }} />
                              );
                            }) : ''
                          }
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.publishGeneralTabInfoThree')} </Stack>
                      </Grid>
                      <Grid container style={{ padding: '40px' }}>
                        <Grid item xs={5}>
                          <TextField
                            onChange={(e) => viewModel.datasetPublish.latitude = e.target.value as string}
                            value={viewModel.datasetPublish.latitude ?? ''}
                            margin="dense"
                            label={t('ingestion.publishGeneralTabDatasetLatitude')}
                            fullWidth
                          />
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                              return (
                                <Chip label={item.title + ': ' + item.latitude} style={{ margin: "10px" }} onClick={() => {
                                  viewModel.datasetPublish.latitude = item.latitude;
                                }} />
                              );
                            }) : ''
                          }
                        </Grid>
                        <Grid item xs={1}></Grid>
                        <Grid item xs={6}>
                          <TextField
                            onChange={(e) => viewModel.datasetPublish.longitude = e.target.value as string}
                            value={viewModel.datasetPublish.longitude ?? ''}
                            margin="dense"
                            label={t('ingestion.publishGeneralTabDatasetLongitude')}
                            fullWidth
                          />
                          {
                            viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                              return (
                                <Chip label={item.title + ': ' + item.longitude} style={{ margin: "10px" }} onClick={() => {
                                  viewModel.datasetPublish.longitude = item.longitude;
                                }} />
                              );
                            }) : ''
                          }
                        </Grid>
                      </Grid>
                      <Grid item xs={12}>
                        <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.publishGeneralTabInfoFour')} </Stack>
                      </Grid>
                      <Grid container style={{ padding: '40px' }}>
                        <Grid item xs={12}>
                          <LocalizationProvider dateAdapter={AdapterDateFns}>
                            <Grid container spacing={2}>
                              <Grid item xs={6}>
                                <DesktopDatePicker
                                  label={t('ingestion.publishGeneralTabStartDate')}
                                  inputFormat="dd.MM.yyyy"
                                  value={viewModel.datasetPublish.rangeStart}
                                  onChange={(v) => viewModel.datasetPublish.rangeStart = v}
                                  renderInput={(params) => <TF fullWidth {...params} />}
                                />
                                {
                                  viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                                    return (
                                      <Chip label={item.title + ': ' + item.rangeStart} style={{ margin: "10px" }} onClick={() => {
                                        viewModel.datasetPublish.rangeStart = item.rangeStart;
                                      }} />
                                    );
                                  }) : ''
                                }
                              </Grid>
                              <Grid item xs={6}>
                                <DesktopDatePicker
                                  label={t('ingestion.publishGeneralTabEndDate')}
                                  inputFormat="dd.MM.yyyy"
                                  value={viewModel.datasetPublish.rangeEnd}
                                  onChange={(v) => viewModel.datasetPublish.rangeEnd = v}
                                  renderInput={(params) => <TF fullWidth {...params} />}
                                />
                                {
                                  viewModel?.datasetPublish?.lineage?.length > 0 ? viewModel?.lineage?.map((item) => {
                                    return (
                                      <Chip label={item.title + ': ' + item.rangeEnd} style={{ margin: "10px" }} onClick={() => {
                                        viewModel.datasetPublish.rangeEnd = item.rangeEnd;
                                      }} />
                                    );
                                  }) : ''
                                }
                              </Grid>
                            </Grid>
                          </LocalizationProvider>
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                </TabPanel>
                <TabPanel value={value} index={1}>
                  <Box style={{ position: "relative", padding: "40px" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.publishAccessTabInfo')} </Stack>
                      </Grid>
                      <Grid container style={{ padding: '40px' }}>
                        <Grid item xs={12}>
                          <FormControlLabel control={<Checkbox color="primary" checked={viewModel?.datasetPublish?.isPublic} onClick={async () => {
                            await viewModel.setDatasetStatus();
                          }
                          } />} label={t('ingestion.publishAccessTabIsPublic')} />
                          {
                            viewModel.datasetPublish.isPublic == false ?
                              <Box>
                                {
                                  viewModel?.datasetPublish?.users?.map((item) => {
                                    if (userStore.email != item.email) {
                                      return (
                                        <Chip label={item.firstname + ' ' + item.lastname + ' (' + t('generic.permission') + ': ' + (item?.datasetPermissions?.canRead ? 'R' : '') + (item?.datasetPermissions?.canWrite ? 'W' : '') + (item?.datasetPermissions?.canDelete ? 'D' : '') + ')'}
                                          onClick={() => {
                                            setUserToChangePermission(item.email);
                                            setCanRead(item.datasetPermissions.canRead);
                                            setCanWrite(item.datasetPermissions.canWrite);
                                            setCanDelete(item.datasetPermissions.canDelete);
                                            setSelectedUser(item.email);
                                            setOpenPermissionDialog(true);
                                          }}
                                          style={{ margin: "10px" }}
                                          onDelete={(e) => {
                                            setSelectedUserToDelete(item.email);
                                            setOpenDeleteDialog(true);
                                          }} />
                                      );
                                    }
                                  }
                                  )
                                }
                                <IconButton onClick={async () => {
                                  setSelectedUser('');
                                  if (viewModel.users.length == 0) {
                                    await viewModel.getAllUsersOfWorkspace();
                                  }
                                  setCanRead(true);
                                  setCanWrite(false);
                                  setCanDelete(false);
                                  setOpenAddUserDialog(true);
                                }}><AddCircleIcon /></IconButton>
                              </Box> : ''
                          }
                        </Grid>
                      </Grid>
                    </Grid>
                  </Box>
                </TabPanel>
                <TabPanel value={value} index={2}>
                  <Box style={{ position: "relative", padding: "40px" }}>
                    <Grid container spacing={2}>
                      <Grid item xs={12}>
                        <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.publishSchemaTabInfo')} </Stack>
                      </Grid>
                      <Grid container style={{ padding: '40px' }}>
                        {viewModel.datasetPublish.schema == undefined ?
                          <Grid container spacing={2}>
                            <Grid item xs={12}>
                              <Skeleton variant="rectangular" height="200px" />
                            </Grid>
                          </Grid> :
                          <Grid item xs={12}>
                            {
                              viewModel.datasetPublish.schema != undefined ? viewModel.datasetPublish.schema.type == 'UNSTRUCTURED' ?
                                <Box>
                                  <Typography variant="h6" gutterBottom component="div">
                                    {t('ingestion.publishSchemaTabClassification')}: {t('generic.' + viewModel.datasetPublish.schema.type)}
                                  </Typography>
                                  {viewModel.datasetPublish.schema.files.map((item) => (
                                    <Files file={item} />
                                  ))}
                                </Box> :
                                <Box>
                                  <Typography variant="h6" gutterBottom component="div">
                                    {t('ingestion.publishSchemaTabClassification')}: {t('generic.' + viewModel.datasetPublish.schema.type)}
                                  </Typography>
                                  <NeoGraph
                                    containerId={"neoGraph"}
                                    neo4jUri={`${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST_FRONTEND}:${process.env.NEO4J_PORT}`}
                                    neo4jUser={`${process.env.NEO4J_USERNAME}`}
                                    neo4jPassword={`${process.env.NEO4J_PASSWORD}`}
                                    initialCypher={"MATCH (n:Schema {uid: '" + viewModel.datasetPublish.schema.id + "'}) CALL apoc.path.subgraphAll(n, {relationshipFilter:'HAS_ENTITY>|HAS_ATTRIBUTE'}) YIELD nodes, relationships RETURN nodes, relationships;"}
                                  />
                                  {viewModel.datasetPublish.schema.entities.map((entity) => (
                                    <Entity entity={entity} viewModel={viewModel} />
                                  ))}
                                </Box> : ''
                            }
                          </Grid>
                        }
                      </Grid>
                    </Grid>
                  </Box>
                </TabPanel>
                <TabPanel value={value} index={3}>
                  <Box style={{ position: "relative", padding: "40px" }}>
                    <Grid item xs={12}>
                      <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.publishReviewTabInfo')} </Stack>
                    </Grid>
                    <Grid container style={{ padding: '40px' }}>
                      <Grid item xs={12}>
                        <TableContainer component={Paper}>
                          <Table aria-label="collapsible table">
                            <TableBody>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabDatasetTitle')}:</TableCell>
                                <TableCell align="left">{viewModel.datasetPublish.title}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabTags')}:</TableCell>
                                <TableCell align="left">
                                  {
                                    viewModel?.datasetPublish?.tags?.map((tag) => {
                                      return (
                                        <Chip label={tag.title + ' (' + tag.annotation.ontology.title + ': ' + tag.annotation.instance + ')'} style={{ margin: "10px" }} disabled={viewModel?.datasetPublish?.tags?.length == 1} onDelete={() => {
                                          setOpenDeleteDialog(true);
                                          setTagToDelete(tag.id);
                                        }} />
                                      );
                                    })
                                  }
                                </TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabDatasetDescription')}:</TableCell>
                                <TableCell align="left"><MDEditor.Markdown source={viewModel.datasetPublish.description} /></TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabDatasetAuthor')}:</TableCell>
                                <TableCell align="left">{viewModel.datasetPublish.author}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t("ingestion.publishGeneralTabDatasetLanguage")}:</TableCell>
                                <TableCell align="left">{viewModel.datasetPublish.language}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabDatasetLicense')}:</TableCell>
                                <TableCell align="left"><MDEditor.Markdown source={viewModel.datasetPublish.license} /></TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabDatasetLongitude')}:</TableCell>
                                <TableCell align="left">{viewModel.datasetPublish.longitude}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabDatasetLatitude')}:</TableCell>
                                <TableCell align="left">{viewModel.datasetPublish.latitude}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabStartDate')}:</TableCell>
                                <TableCell align="left">{viewModel.datasetPublish.rangeStart != undefined ? format(new Date(viewModel.datasetPublish.rangeStart), 'dd.MM.yyyy') : ''}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishGeneralTabEndDate')}:</TableCell>
                                <TableCell align="left">{viewModel.datasetPublish.rangeEnd != undefined ? format(new Date(viewModel.datasetPublish.rangeEnd), 'dd.MM.yyyy') : ''}</TableCell>
                              </TableRow>
                              <TableRow>
                                <TableCell align="left">{t('ingestion.publishSchemaTabClassification')}:</TableCell>
                                <TableCell align="left">{t('generic.' + viewModel?.datasetPublish?.schema?.type?.toString())}</TableCell>
                              </TableRow>
                            </TableBody>
                          </Table>
                        </TableContainer><br />
                      </Grid>{viewModel?.datasetPublish?.isPublic == true ? viewModel?.datasetPublish?.schema?.type != 'UNSTRUCTURED' ?
                        <Grid container>
                          <Grid item xs={12}>
                            <Stack direction="row" alignItems="center" gap={1}><InfoIcon /> {t('ingestion.indexInfo')} </Stack>
                          </Grid>
                          <Grid item xs={12} style={{ padding: '20px' }}>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={index}
                                  color="primary"
                                  onChange={(e) => setIndex(!index)}
                                />
                              }
                              label={t('ingestion.index')}
                            />
                          </Grid>
                        </Grid> : '' : ''
                      }
                    </Grid>
                  </Box>
                </TabPanel>
                {value != 3 ? <DialogActions>
                  <IconButton disabled={value == 0} onClick={() => {
                    setValue(value - 1)
                  }}><ArrowBackIcon /></IconButton>
                  {value != 2 ? <IconButton disabled={viewModel.pageOneAndTwoDisabled} onClick={() => {
                    setValue(value + 1)
                  }}><ArrowForwardIcon /></IconButton> :
                    <IconButton disabled={viewModel.pageThreeDisabled} onClick={() => {
                      setValue(value + 1)
                    }}><ArrowForwardIcon /></IconButton>
                  }
                </DialogActions> :
                  <DialogActions>
                    <IconButton onClick={() => {
                      setValue(value - 1)
                    }}><ArrowBackIcon /></IconButton>
                    <Button variant="outlined" disabled={load} onClick={() => setPublish(true)} type="submit">{t('ingestion.publish')}</Button>
                    <Button variant="outlined" disabled={viewModel?.datasetPublish?.schema?.type == 'UNSTRUCTURED' ? true : load} onClick={() => { setPublish(true); setPublishAndProfile(true) }} type="submit">{t('ingestion.publishAndProfile')}</Button>
                  </DialogActions>
                }
                <IconButton style={{ position: 'absolute', top: 5, right: 5, backgroundColor: 'red', fontSize: 80, border: 'solid red' }} onClick={() => {
                  setOpenPublishDialog(false)
                }}><CloseIcon /></IconButton>
                <IconButton disabled={load} style={{ position: 'absolute', top: 5, right: 65, backgroundColor: 'green', fontSize: 80, border: 'solid green' }} onClick={() => {
                  setLoad(true);
                  viewModel.putDataset().then(() => {
                    setLoad(false);
                  }).catch(error => {
                    alert(error);
                    setLoad(false);
                  })
                }}><SaveAsIcon /></IconButton>
              </form>
            </DialogContent>
          </Dialog>




          <Dialog open={openDeleteDialog} maxWidth="sm"
            fullWidth>
            <DialogTitle>{t("generic.delete")}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
              <DialogActions>
                <Button variant="outlined" onClick={() => {
                  setOpenDeleteDialog(false);
                  setSelectedUserToDelete('');
                  setTagToDelete('');
                }}>{t("generic.cancel")}</Button>
                <Button variant="outlined" disabled={deleteLoad} onClick={() => {
                  setDeleteLoad(true);
                  if (selectedUserToDelete != '') {
                    viewModel.removeUserFromDataset(selectedUserToDelete).then(() => {
                      setDeleteLoad(false); setOpenDeleteDialog(false); setSelectedUserToDelete('');
                    }).catch(error => {
                      alert(error);
                      setDeleteLoad(false);
                    })
                  } else {
                    viewModel.deleteTag(tagToDelete).then(() => {
                      setDeleteLoad(false); setOpenDeleteDialog(false); setTagToDelete('')
                    }).catch(error => {
                      alert(error);
                      setDeleteLoad(false);
                    })
                  }
                }}>{t("generic.delete")}</Button>
              </DialogActions>
            </DialogContent>
          </Dialog>



          <Dialog open={openAddUserDialog} maxWidth="sm" fullWidth>
            <DialogTitle>{t("generic.add")}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("generic.addMessage")}</DialogContentText>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditLoad(true);
                  let su = selectedUser;
                  setSelectedUser('');
                  viewModel.addUserToDataset(su, canRead, canWrite, canDelete).then(() => {
                    setEditLoad(false);
                    setOpenAddUserDialog(false);
                  }).catch(error => {
                    alert(error);
                    setEditLoad(false);
                  });
                }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel variant="standard" htmlFor="uncontrolled-native">
                        {t("workspaceAdministration.userSelect")}:
                      </InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={selectedUser}
                        style={{ width: "100%" }}
                        required
                        onChange={(e) => setSelectedUser(e.target.value as string)}
                      >
                        {
                          viewModel?.users?.length == 0 ? '' : viewModel?.users?.map((item) => (
                            viewModel?.datasetPublish?.users?.find((u) => u.email == item.email) == undefined ? <MenuItem key={item.email} value={item.email}> {item.firstname + ' ' + item.lastname}</MenuItem> : ''
                          ))
                        }
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={4}>
                    <FormControlLabel control={<Checkbox color="primary" checked={canRead} disabled onClick={() => setCanRead(!canRead)} />} label={t("generic.read")} />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControlLabel control={<Checkbox color="primary" checked={canWrite} onClick={() => setCanWrite(!canWrite)} />} label={t("generic.write")} />
                  </Grid>
                  <Grid item xs={4}>
                    <FormControlLabel control={<Checkbox color="primary" checked={canDelete} onClick={() => setCanDelete(!canDelete)} />} label={t("generic.delete")} />
                  </Grid>
                </Grid>
                <DialogActions>
                  <Button variant="outlined" onClick={() => { setOpenAddUserDialog(false) }}>{t("generic.cancel")}</Button>
                  <Button variant="outlined" disabled={editLoad} type="submit">{t("generic.save")}</Button>
                </DialogActions>
              </form>
            </DialogContent>
          </Dialog>




          <Dialog open={openAddDialog} maxWidth="sm"
            fullWidth>
            <DialogTitle>{t("generic.add")}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("generic.addMessage")}</DialogContentText>
              <form onSubmit={(e) => {
                e.preventDefault();
                setOpenProgress(true);
                setOpenAddDialog(false);
                setLoad(true);
                viewModel.postDatasource().then(() => {
                  setLoad(false);
                  setOpenProgress(false);
                  viewModel.example = undefined;
                  viewModel.datasetTitle = '';
                  viewModel.datasourceDefinition = '';
                  setOpenAddDialog(false);
                }).catch(error => {
                  alert(error);
                  setLoad(false);
                  setOpenProgress(false);
                });
              }}>
                <FormControlLabel
                  style={{ position: "absolute", top: "20px", right: "20px" }}
                  control={
                    <Switch checked={viewModel.customView} color="default" onChange={() => viewModel.customView = !viewModel.customView} inputProps={{ 'aria-label': 'controlled' }} />
                  }
                  label={t("ingestion.customview")} />


                <Grid container spacing={2} style={{ position: "relative" }}>

                  <Grid item xs={12}>
                    <TextField
                      onChange={(e) => {
                        var def = JSON.parse(viewModel.datasourceDefinition);
                        if ((def['name'] != undefined && def['name'].includes('INGESTION_' + viewModel.datasetTitle)) || (def['name'] != undefined && def['name'] == "")) {
                          def['name'] = ('INGESTION_' + e.target.value as string);
                          viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                        }
                        viewModel.datasetTitle = e.target.value as string;
                      }}
                      value={viewModel.datasetTitle}
                      margin="dense"
                      label={t("ingestion.datasetTitle")}
                      fullWidth
                      required
                    />
                  </Grid>
                  {viewModel.customView == true ?
                    <React.Fragment>

                      <Grid item xs={12}>
                        <FormControl fullWidth>
                          <InputLabel id="demo-simple-select-label">{t("ingestion.examples")}</InputLabel>
                          <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={selectedExample}
                            label={t("ingestion.examples")}
                            onChange={(e) => {
                              viewModel.example = undefined;
                              if (e.target.value == '') {
                                viewModel.datasourceDefinition = JSON.stringify({ "name": "" }, null, "\t");
                                if (viewModel.datasetTitle != '' && e.target.value == '') {
                                  var def = JSON.parse(viewModel.datasourceDefinition);
                                  def['name'] = ('INGESTION_' + viewModel.datasetTitle);
                                  viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                                }
                              } else {
                                viewModel.datasourceDefinition = JSON.stringify(Examples[e.target.value as string], null, "\t");
                                var def = JSON.parse(viewModel.datasourceDefinition);
                                if (viewModel.datasetTitle != '' && e.target.value != '') {
                                  def['name'] = ('INGESTION_' + viewModel.datasetTitle);
                                  viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                                }
                                if (def['example'] != undefined) {
                                  viewModel.example = def['example'];
                                  delete def['example'];
                                  viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                                }
                              }
                              setSelectedExample(e.target.value as string);
                            }}
                          >
                            <MenuItem value="">-</MenuItem>
                            {Object.keys(Examples).map(key => {
                              return <MenuItem value={key}>{key}</MenuItem>
                            })}
                          </Select>
                        </FormControl>
                      </Grid>



                      {viewModel.example != undefined ?
                        <Grid item xs={12}>
                          <MDEditor.Markdown source={viewModel.example} />
                        </Grid> : ''}
                      <Grid item xs={12}>
                        <TextField
                          multiline
                          rows={8}
                          onChange={(e) => viewModel.datasourceDefinition = e.target.value as string}
                          value={viewModel.datasourceDefinition}
                          margin="dense"
                          label={t("ingestion.datasetDefinition")}
                          fullWidth
                          required
                        />
                      </Grid>
                    </React.Fragment>
                    :
                    ////////////////////////////////////////////////////////////////////////////////
                    <React.Fragment>
                      <TextField
                        margin='normal'
                        id="outlined-select-writeType"
                        select
                        required
                        label="WriteType"
                        value={writeType}
                        onChange={(e) => {
                          setWriteType(e.target.value);
                        }}
                        helperText="Please select a WriteType. DELTA saves the file as DELTA Table (standard option), DEFAULT saves the file as plain parquet file."
                      >
                        {
                          writetypes.map((option) => (
                            <MenuItem key={option.value} value={option.value}>
                              {option.label}
                            </MenuItem>
                          ))}
                      </TextField>

                      <Box sx={{ width: '100%' }}>
                        <FormControl fullWidth>
                          <InputLabel id="demo-simple-select-label">Choose from a given template!</InputLabel>
                          <Select
                            labelId="demo-simple-select-label"
                            id="demo-simple-select"
                            value={template}
                            label="Choose from a given template!"
                            onChange={(e) => {
                              setTemplate(e.target.value as number);
                            }}
                            autoWidth={true}
                          >
                            <MenuItem value={1}>CSV</MenuItem>
                            <MenuItem value={2}>JSON</MenuItem>
                            <MenuItem value={3}>POSTGRES</MenuItem>
                          </Select>
                        </FormControl>
                      </Box>
                      {template == 1 && <CSV viewModel={viewModel} />}
                      {template == 2 && <JSONtemplate viewModel={viewModel} />}
                      {template == 3 && <Postgres viewModel={viewModel} />}

                    </React.Fragment>
                  }


                  {template != 3 &&
                    <React.Fragment>
                      <Grid item xs={12}>
                        <InputLabel required id="demo-simple-select-label">Drop the data file here!</InputLabel>
                        <DropzoneArea
                          dropzoneText={t("ingestion.datasetFiles")}
                          onChange={(files) => {
                            viewModel.data = []
                            var def = JSON.parse(viewModel.datasourceDefinition);
                            if (files.length == 0) {
                              delete def['source_files'];
                            }
                            else {
                              def['source_files'] = [];
                            }
                            files.forEach((f) => {
                              let name = f.name.replace('.' + f.name.split('.')[f.name.split('.').length - 1], '');
                              viewModel.data.push({ name: name, data: f } as IFileUpload);
                              def['source_files'].push(name);
                            })
                            viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                          }}
                          maxFileSize={Number(process.env.INGESTION_MAX_FILE_SIZE_IN_BYTE ?? 1073741824)}
                          filesLimit={Number(process.env.INGESTION_MAX_NUMBER_FILES ?? 10)}
                        />
                        <br />
                      </Grid>
                    </React.Fragment>
                  }


                  <Grid item xs={12}>
                    <DropzoneArea
                      dropzoneText={t("ingestion.datasetPlugin")}
                      onChange={(files) => {
                        viewModel.plugin = []
                        var def = JSON.parse(viewModel.datasourceDefinition);
                        if (files.length == 0) {
                          delete def['plugin_files'];
                        }
                        else {
                          def['plugin_files'] = [];
                        }
                        files.forEach((f) => {
                          let name = f.name.replace('.' + f.name.split('.')[f.name.split('.').length - 1], '');
                          viewModel.plugin.push({ name: name, data: f } as IFileUpload);
                          def['plugin_files'].push(name);
                        })
                        viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                      }}
                      maxFileSize={Number(process.env.INGESTION_MAX_PLUGINS_SIZE_IN_BYTE ?? 1073741824)}
                      filesLimit={Number(process.env.INGESTION_MAX_NUMBER_PLUGINS ?? 10)}
                      acceptedFiles={['.py']}
                    /><br />
                  </Grid>
                </Grid>
                <DialogActions>
                  <Button variant="outlined" onClick={() => {
                    setOpenAddDialog(!openAddDialog);
                    viewModel.example = undefined;
                    viewModel.datasetTitle = '';
                  }}>{t("generic.cancel")}</Button>
                  <Button variant="outlined" disabled={load} type="submit">{t("generic.save")}</Button>
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
            onClick={async () => {
              viewModel.datasourceDefinition = JSON.stringify({ "name": "" }, null, "\t");
              setSelectedExample("");
              setOpenAddDialog(true);
            }}
          >
            <AddCircleIcon style={{ marginRight: "0.4rem" }} onClick={() => setOpenAddDialog(true)} />
            {t("generic.add")}
          </Fab>
        </CardContent>
      </Card>



      <Dialog open={openDeleteDatasetDialog} maxWidth="sm"
        fullWidth>
        <DialogTitle>{t("generic.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpenDeleteDatasetDialog(false)}>{t("generic.cancel")}</Button>
            <Button variant="outlined" disabled={deleteLoad} onClick={() => {
              setDeleteLoad(true);
              viewModel.deleteDataset(datasetToDelete).then(() => {
                setOpenDeleteDatasetDialog(false);
                setDeleteLoad(false)
              }).catch(error => {
                alert(error);
                setDeleteLoad(false);
              })
            }}>{t("generic.delete")}</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </React.Fragment >
  );
});

export default Main;
