import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControlLabel, Grid, IconButton, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography, useMediaQuery, useTheme} from "@material-ui/core";
import { CardHeader, Stack } from "@mui/material";
import IViewProps from "../../../../models/iViewProps";
import { NeoGraph } from "../../../common/neograph/NeoGraph";
import { Entity } from "./entity";
import { Files } from "./files";
import searchStore from "../../../../stores/search.store";
import SearchbarComponent from "../../../common/searchbar";
import { AutocompleteItem } from "../../../../models/autocomplete";
import workspacesStore from "../../../../stores/workspaces.store";
import AutocompleteComponent from "../../../common/autocomplete";
import DeleteIcon from "@material-ui/icons/Delete";
import { IDataset } from '../../../../models/dataset'
import routingStore from '../../../../stores/routing.store'

import Deequ from "../deequ/main.component";
import {default as vM} from "../deequ";

/**
* Component that represents the profile tab.
*/





const Profile: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();

  const [load, setLoad] = React.useState(false);
  const [version, setVersion] = React.useState(viewModel.dataset.datasource.currentRevision);
  const [uri, setUri] = React.useState(`${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST_FRONTEND}:${process.env.NEO4J_PORT}`)
  const [description, setDescription] = React.useState('');
  const [key, setKey] = React.useState('');
  const [attributeOntologyProperty, setAttributeOntologyProperty] = React.useState(undefined);
  const [deleteLoad, setDeleteLoad] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [annotationId, setAnnotationId] = React.useState('false');
  const [openDeequDialog, setOpenDeequDialog] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
      <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("dataset.profileTab")}
              </Typography>
              <Typography variant="subtitle1">
                {t("dataset.profileTabDescription")}
              </Typography><hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
        
        
        <Dialog open={openDeequDialog} style={{zIndex:20000, padding:0}} 
        maxWidth={false}
      fullWidth>
          <DialogTitle></DialogTitle>
          <DialogContent>
            <Deequ item={viewModel.dataset as IDataset} viewModel={new vM(null)} version={version} validation_results={viewModel.validation_results}/>
              <DialogActions>
                  <Button variant="outlined" onClick={() => {
                    setOpenDeequDialog(false);
                  }}>{t("generic.cancel")}</Button>
              </DialogActions>
          </DialogContent>
        </Dialog>
 
            
          {
          viewModel.dataset.schema!=undefined?viewModel.dataset.schema.type=='UNSTRUCTURED'?
          <Box>
            {viewModel.dataset.schema.files.map((item) => (
              <Files file={item} viewModel={viewModel}/>
            ))}
          </Box>:
          <Box style={{position:'relative'}}>
            <Select
              style={{position:'absolute', top:5, right:5, zIndex:120, minWidth:200}}
              onChange={(e) => {
                setVersion(e.target.value as number);
                if(uri.endsWith('/')){
                  setUri(`${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST_FRONTEND}:${process.env.NEO4J_PORT}`);
                }else{
                  setUri(`${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST_FRONTEND}:${process.env.NEO4J_PORT}/`);
                }
              }}
              value={version}
              label={t('generic.version')}
              >
              {new Array(viewModel.dataset.datasource.currentRevision+1).fill("", 0, viewModel.dataset.datasource.currentRevision+1).map((row,index)=>{
              return(<MenuItem value={index}>
                {t('generic.version') + ': ' + index.toString()}
              </MenuItem>)})}
            </Select>
            <NeoGraph
              containerId={"neoGraph"}
              neo4jUri={uri}
              neo4jUser={`${process.env.NEO4J_USERNAME}`}
              neo4jPassword={`${process.env.NEO4J_PASSWORD}`}
              initialCypher={"MATCH path = ((p:Entity {uid: '"+viewModel.dataset.schema.entities[0].id+"'})-[r:HAS_ATTRIBUTE*1..10000]->(k:Attribute)) WHERE ALL( x IN relationships(path) WHERE x.version="+version.toString()+") RETURN path"}
            /><br/>
            {viewModel.dataset.schema.entities.map((item) => (
              <Entity entity={item} viewModel={viewModel}/>
            ))}
          </Box>:''
        }



        <Dialog open={viewModel.openFkDialog} maxWidth="md"
        fullWidth>
        <DialogTitle>{t("dataset.profileTabFkDialog")}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
              <Grid item xs={12}>
                <Grid container item>
                <Grid item sm={12}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box style={{minWidth: '500px'}}>
                    <SearchbarComponent isWorkflow={true} isExtendedView={false} isVisualizationView={false} isRecommendation={false}/>
                  </Box>
                  <Button variant="contained" color="primary" disabled={searchStore.idOfSelectedDataset==undefined} fullWidth onClick={()=>{
                    viewModel?.fkColumns?.replace([]);
                    viewModel.idOfFkDataset = searchStore.idOfSelectedDataset;
                      viewModel.getFKDataset().then(()=> {
                      }).catch(error =>{
                      alert(error);
                      });
                    }
                  }>{t("generic.select")}</Button>
                </Stack>
                </Grid>
              </Grid>
              </Grid>
              <Grid item xs={12}>
                <Select
                  value={viewModel.idOfFkAttribute}
                  label="Column"
                  required
                  onChange={(e) => viewModel.idOfFkAttribute =  e.target.value as string}
                  fullWidth
                >
                  {viewModel?.fkColumns?.map((item) => {
                    return (
                      <MenuItem value={item['id']}>
                        {item['name']}
                      </MenuItem>
                    );
                  })}
                </Select>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Checkbox
                    checked={viewModel.setPk}
                    color="primary"
                    onChange={(e) => viewModel.setPk=!viewModel.setPk}
                    />
                  }
                  label={t("dataset.profileTabAttributePK")}
                  />
              </Grid>
          </Grid>
          <DialogActions>
            <Button variant="outlined" onClick={() => viewModel.openFkDialog=false}>{t("generic.cancel")}</Button>
            <Button variant="outlined" disabled={load||viewModel.idOfFkAttribute==''} onClick={() =>{ 
                setLoad(true);
                viewModel.patchAttribute().then(() => {
                  viewModel.fkAttribute='';
                  viewModel.idOfFkDataset='';
                  viewModel.idOfFkAttribute=''; 
                  viewModel.fkDataset=undefined;
                  viewModel.fkColumns.replace([]);
                  setLoad(false);
                  viewModel.openFkDialog=false;
                }).catch(error =>{
                  setLoad(false);
                  alert(error);
                viewModel.openFkDialog=false;
                })
            }}>{t("generic.save")}</Button>
            </DialogActions>
          </DialogContent>
        </Dialog>



      <Dialog open={viewModel.openCustomAnnotationDialog} style={{zIndex:20000, padding:0}} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
      fullWidth>
        <DialogContent style={{padding:20, position:'relative'}}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              {viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true?
              <form
                onSubmit={(e) => {
                e.preventDefault();
                setLoad(true);
                if(viewModel.dataset.schema.type!="UNSTRUCTURED"){
                  viewModel.patchEntity(description, key, attributeOntologyProperty).then(()=> {
                    setLoad(false); 
                  }).catch(error =>{
                    alert(error);
                    setLoad(false);});
                }
                else{
                  viewModel.patchFile(description, key, attributeOntologyProperty).then(()=> {
                    setLoad(false); 
                  }).catch(error =>{
                    alert(error);
                    setLoad(false);});
                }
                }}
                >
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom component="div">
                        {t('generic.add')}:
                    </Typography>
                  </Grid>
                  <Grid container spacing={2} style={{padding:40}}>
                      <Grid item xs={12}>
                        <TextField
                        fullWidth
                        label={t("dataset.profileTabCustomAnnotationKey")}
                        value={key}
                        onChange={(e) => setKey(e.target.value)}
                        required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={t("dataset.profileTabCustomAnnotationDescription")}
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <AutocompleteComponent
                          value={attributeOntologyProperty}
                          onChange={(value) =>
                              setAttributeOntologyProperty(value)
                          }
                          title={t("annotation.ontology_property")}
                          queryUrl={(term: string) =>
                              process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace?.id}/ontologies/completion?search_term=${term}`
                          }
                          />
                      </Grid>
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <Button
                          fullWidth
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={load||attributeOntologyProperty==undefined}
                          >
                          {t("generic.save")}
                          </Button>
                        </Grid>
                      </Grid>
                  </Grid>
                </Grid>
                </form>:''}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom component="div">
                      {t("dataset.profileTabCustomAnnotation")}:
                  </Typography>
                </Grid>
                <Grid item xs={12} style={{padding:40}}>
                  <TableContainer component={Paper}>
                    <Table aria-label="collapsible table">
                        <TableHead>
                            <TableRow>
                              <TableCell align="left">{t("dataset.profileTabCustomAnnotationKey")}</TableCell>
                              <TableCell align="left">{t("dataset.profileTabCustomAnnotationDescription")}</TableCell>
                              <TableCell align="left">{t("annotation.ontology_property")}</TableCell>
                              <TableCell align="left">{t("generic.options")}</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {viewModel?.dataset?.schema.type!="UNSTRUCTURED"?viewModel?.dataset?.schema?.entities?.find((e) => e.id==viewModel.selectedEntityForCustomAnnotation)?.customAnnotation?.map((item) => (
                              <TableRow>
                                <TableCell align="left">{item.key}</TableCell>
                                <TableCell align="left">{item.description}</TableCell>
                                <TableCell align="left">{item.ontology.title+': '+item.instance}</TableCell>
                                <TableCell align="left"><IconButton onClick={() =>{
                                  setAnnotationId(item.id);
                                  setOpenDeleteDialog(true);
                                }}><DeleteIcon/></IconButton></TableCell>
                              </TableRow>
                            )):viewModel?.dataset?.schema?.files?.find((e) => e.id==viewModel.selectedEntityForCustomAnnotation)?.customAnnotation?.map((item) => (
                              <TableRow>
                                <TableCell align="left">{item.key}</TableCell>
                                <TableCell align="left">{item.description}</TableCell>
                                <TableCell align="left">{item.ontology.title+': '+item.instance}</TableCell>
                                <TableCell align="left"><IconButton 
                                disabled={viewModel.dataset.isPublic==false&&viewModel.dataset.permission.canDelete==false}
                                onClick={() =>{
                                  setAnnotationId(item.id);
                                  setOpenDeleteDialog(true);
                                }}><DeleteIcon/></IconButton></TableCell>
                              </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
                </Grid>
              </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button variant="outlined" onClick={() => viewModel.openCustomAnnotationDialog=false}>{t("generic.saveAndClose")}</Button>
          </DialogActions>
      </Dialog>




      <Dialog open={openDeleteDialog} maxWidth="sm" style={{zIndex:20001}}
      fullWidth>
        <DialogTitle>{t("generic.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
            <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
              setDeleteLoad(true);
              if(viewModel.dataset.schema.type!="UNSTRUCTURED"){
                viewModel.patchEntity(description, key, attributeOntologyProperty, annotationId).then(()=> {
                  setDeleteLoad(false); 
                  setOpenDeleteDialog(false); 
                }).catch(error =>{
                  alert(error);
                  setDeleteLoad(false);});
              }
              else{
                viewModel.patchFile(description, key, attributeOntologyProperty, annotationId).then(()=> {
                  setDeleteLoad(false); 
                  setOpenDeleteDialog(false); 
                }).catch(error =>{
                  alert(error);
                  setLoad(false);});
              }
              }}>{t("generic.delete")}</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>


        {viewModel?.dataset?.schema?.type!='UNSTRUCTURED'?<Fab
          style={{
          position: "fixed",
          bottom: "2rem",
          right: "7rem",
          }}
          variant="extended"
          size="medium"
          color="primary"
          disabled={viewModel.canNotRunProfiling||(viewModel.dataset.isPublic==false&&viewModel.dataset.permission.canWrite!=true)}
          onClick={()=>{
            viewModel.canNotRunProfiling = true;
            viewModel.getProfiling(version.toString())
          }}
          >
            {t("dataset.profileTabProfiling")}
          </Fab>:''}

          {viewModel?.dataset?.schema?.type!='UNSTRUCTURED'?<Fab
          style={{
          position: "fixed",
          bottom: "2rem",
          right: "15rem",
          }}
          variant="extended"
          size="medium"
          color="primary"
          onClick={()=>{
            // viewModel.openDeequ(viewModel.dataset, version.toString())
            setOpenDeequDialog(true);
          }}
          >
            {t("dataset.profileUnitTest")}
          </Fab>:''}


        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Profile;