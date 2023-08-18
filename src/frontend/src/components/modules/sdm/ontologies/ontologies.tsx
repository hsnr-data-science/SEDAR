import { Card, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, CardHeader, Box, Typography, CardContent, FormControl, InputLabel, Select, MenuItem, Grid, TextField, FormControlLabel, Checkbox, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody, CardActions, IconButton } from "@material-ui/core";
import { observer } from "mobx-react";
import { DropzoneArea } from "material-ui-dropzone";
import React from "react";
import { useTranslation } from "react-i18next";
import Iframe from "react-iframe";
import IViewProps from "../../../../models/iViewProps";
import ViewModel from "../viewModel";
import FindInPageIcon from '@mui/icons-material/FindInPage';
import { Skeleton } from "@mui/material";
import workspacesStore from "../../../../stores/workspaces.store";
import AddIcon from '@mui/icons-material/Add';
import { OntologyCard } from "./card";

/**
* Component that represents the ontology tab.
*/
const Ontologies: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t } = useTranslation();

  const [runQuery, setRunQuery] = React.useState(false);
  const [editLoad, setEditLoad] = React.useState(false);
  const [openAddOntologyDialog, setOpenAddOntologyDialog] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
        <CardHeader title={
          <Box>
            <Typography variant="h6" gutterBottom component="div">
              {t("workspaceAdministration.ontologyHeader")}
            </Typography>
            <Typography variant="subtitle1">
              {t("workspaceAdministration.ontologyDescription")}
            </Typography><hr />
          </Box>
        }>
        </CardHeader>
        <CardContent style={{ position: "relative", padding: 20, paddingLeft: 40, paddingRight: 40 }}>

          {viewModel.currentWorkspace == undefined ?
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Skeleton variant="text" />
              </Grid>
            </Grid> :
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <br />
                <Typography variant="h6" gutterBottom component="div">
                  {t("workspaceAdministration.ontologiesOfWorkspace")}:
                </Typography><hr />
              </Grid>
              <Grid container spacing={2} style={{ padding: 20 }}>
                {
                  viewModel.currentWorkspace.ontologies != undefined ? viewModel.currentWorkspace.ontologies.map((item) => {
                    return (
                      <Grid item xs={12} sm={12} md={6}>
                        <OntologyCard card={item} viewModel={viewModel} />
                      </Grid>
                    );
                  }) : ""
                }
                {workspacesStore?.currentWorkspace != undefined ? (workspacesStore?.currentWorkspace?.permission?.canWrite == true || viewModel.currentWorkspace.isDefault == true ?
                  <Grid item xs={12} sm={12} md={6}>
                    <Card style={{ minWidth: 275, minHeight: 415, border: "4px dotted", display: 'flex', alignItems: 'center', justifyContent: 'center', }} onClick={() => setOpenAddOntologyDialog(true)}>
                      <AddIcon style={{ width: 200, minHeight: 200 }} />
                    </Card>
                  </Grid> : '') : ''
                }
              </Grid>
            </Grid>
          }







          <Typography variant="h6" gutterBottom component="div">
            {t("workspaceAdministration.ontologyVisualization")}
          </Typography><hr />
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
                {viewModel.currentWorkspace != undefined ? viewModel.currentWorkspace.ontologies.map((item) => (
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
          </Box><br /><br />
          <Typography variant="h6" gutterBottom component="div">
            {t("workspaceAdministration.ontologyQuery")}
          </Typography><hr />
          <Box style={{ padding: "20px" }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                setRunQuery(true);
                viewModel.query().then(() => setRunQuery(false)).catch(error => {
                  alert(error);
                  setRunQuery(false);
                }
                );
              }}
            >
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel variant="standard" htmlFor="uncontrolled-native">
                      {t("workspaceAdministration.ontologySelect")}
                    </InputLabel>
                    <Select
                      labelId="demo-simple-select-label"
                      id="demo-simple-select"
                      disabled={workspacesStore?.currentWorkspace != undefined ? workspacesStore?.currentWorkspace?.permission?.canWrite == false && viewModel.currentWorkspace.isDefault == false : false}
                      value={viewModel.ontologyToQuery}
                      fullWidth
                      onChange={(e) => viewModel.ontologyToQuery = e.target.value as string}
                      required
                    >
                      <MenuItem value="None"><em>None (Union of all graphs)</em></MenuItem>
                      {viewModel.currentWorkspace != undefined ? viewModel.currentWorkspace.ontologies.map((item) => (
                        <MenuItem key={item.graphname} value={item.id} onClick={() => viewModel.graphnameOfSelectedOntology = item.graphname}> {item.title} </MenuItem>
                      )) : ''}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    onChange={(e) => viewModel.queryString = e.target.value as string}
                    value={viewModel.queryString}
                    placeholder=""
                    disabled={workspacesStore?.currentWorkspace != undefined ? workspacesStore?.currentWorkspace?.permission?.canWrite == false && viewModel.currentWorkspace.isDefault == false : false}
                    multiline
                    rows={6}
                    label={t("workspaceAdministration.ontologyQueryOrKeyword")}
                    fullWidth
                    required
                    InputProps={{
                      endAdornment: (
                        <IconButton style={{ position: 'absolute', top: '5px', right: '5px' }} disabled={viewModel.isConstruct ? false : (viewModel.isQuery ? false : true)} onClick={() => viewModel.getExample()}><FindInPageIcon /></IconButton>
                      ),
                    }}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={viewModel.isQuery}
                        color="primary"
                        disabled={workspacesStore?.currentWorkspace != undefined ? (workspacesStore?.currentWorkspace?.permission?.canWrite == true || viewModel.currentWorkspace.isDefault == true ? viewModel.isConstruct : true) : false}
                        onChange={(e) => viewModel.isQuery = !viewModel.isQuery}
                      />
                    }
                    label={t("workspaceAdministration.ontologyQueryInfo")}
                  />
                </Grid>
                <Grid item xs={6}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={viewModel.isConstruct}
                        color="primary"
                        disabled={workspacesStore?.currentWorkspace != undefined ? (workspacesStore?.currentWorkspace?.permission?.canWrite == true || viewModel.currentWorkspace.isDefault == true ? viewModel.isQuery : true) : false}
                        onChange={(e) => viewModel.isConstruct = !viewModel.isConstruct}
                      />
                    }
                    label={t("workspaceAdministration.ontologyConstructInfo")}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button disabled={workspacesStore?.currentWorkspace != undefined ? (workspacesStore?.currentWorkspace?.permission?.canWrite == true || viewModel.currentWorkspace.isDefault == true ? runQuery : true) : false}
                    type="submit"
                    variant="contained"
                    color="primary" fullWidth>
                    {t("generic.query")}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Box><br />
          <Box style={{ padding: "20px" }}>{
            runQuery == true ?
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Skeleton variant="rectangular" height="250px" />
                </Grid>
              </Grid> :
              viewModel.resultHeader.length != 0 ?
                <TableContainer component={Paper} style={{ maxHeight: 500 }}>
                  <Table aria-label="collapsible table" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {viewModel.resultHeader.map((item) => (
                          <TableCell align="left">{item}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {viewModel.resultValues.map((item) => (
                        <TableRow>
                          {item.elements.map((element) => (
                            <TableCell align="left">{element.value}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer> :
                viewModel.queryConstructToVisualize != "" ?
                  <Iframe url={viewModel.queryConstructToVisualize}
                    width="100%"
                    height="400px"
                    position="relative" /> : ""
          }

            <Dialog open={openAddOntologyDialog} maxWidth="sm"
              fullWidth>
              <DialogTitle>{t("generic.add")}</DialogTitle>
              <DialogContent>
                <DialogContentText>{t("generic.addMessage")}</DialogContentText>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setEditLoad(true);
                    viewModel.postOntologyToWorkspace().then(() => { setEditLoad(false), setOpenAddOntologyDialog(false); }).catch(error => {
                      alert(error);
                      setEditLoad(false);
                    });
                  }}><br />
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        autoFocus
                        fullWidth
                        value={viewModel.ontologyTitle}
                        label={t("workspaceAdministration.nameOfOntology")}
                        onChange={(e) => viewModel.ontologyTitle = e.target.value}
                        required
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        value={viewModel.ontologyDescription}
                        label={t("workspaceAdministration.descriptionOfOntology")}
                        onChange={(e) => viewModel.ontologyDescription = e.target.value}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <DropzoneArea
                        dropzoneText={"Drag and drop an file here or click"}
                        onChange={(files) => {
                          if (viewModel.ontologyTitle == '' && files[0] != undefined) {
                            viewModel.ontologyTitle = files[0].name.replace('.' + files[0].name.split('.')[files[0].name.split('.').length - 1], '');
                          }
                          viewModel.file = files[0];
                        }}
                        maxFileSize={Number(process.env.MAX_ONTOLOGY_SIZE_IN_BYTE ?? 1073741824)}
                        filesLimit={1}
                        acceptedFiles={['.owl', '.rdf', '.owl', '.jsonld', '.n3']}
                      /><br />
                    </Grid>
                  </Grid>
                  <DialogActions>
                    <Button variant="outlined" onClick={() => {
                      setOpenAddOntologyDialog(false)
                      viewModel.ontologyTitle = '';
                      viewModel.ontologyDescription = '';
                    }}>{t("generic.cancel")}</Button>
                    <Button variant="outlined" disabled={editLoad} type="submit">{t("generic.save")}</Button>
                  </DialogActions>
                </form>
              </DialogContent>
            </Dialog>



          </Box>
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Ontologies;
