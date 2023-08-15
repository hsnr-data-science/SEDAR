import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControlLabel, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography} from "@material-ui/core";
import { CardHeader } from "@mui/material";
import IViewProps from "../../../../models/iViewProps";
import { DropzoneArea } from "material-ui-dropzone";
import { IFileUpload } from "../../../../models/fileUpload";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import { Row } from "./row";

/**
* Component that represents the history tab.
*/
const History: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();
  
  const [openUpdateDialog, setOpenUpdateDialog] = React.useState(false);
  const [load, setLoad] = React.useState(false);

  viewModel.getDatasource();

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
      <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("dataset.historyTab")}
              </Typography>
              {/* <Typography variant="subtitle1">
                {t("dataset.historyTabDescription")}
              </Typography> */}
              <hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
        <TableContainer component={Paper}>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell align="left"></TableCell>
                  <TableCell align="left">{t("dataset.historyTabVersion")}</TableCell>
                  <TableCell align="left">{t("dataset.historyTabStartDate")}</TableCell>
                  <TableCell align="left">{t("dataset.historyTabEndDate")}</TableCell>
                  <TableCell align="left">{t("dataset.historyTabState")}</TableCell>
                  <TableCell align="left">{t("generic.options")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewModel.dataset.datasource.ingestions.map((item) => (
                  <Row item={item} revision={viewModel.dataset.datasource.revisions.find((r)=>r.number==item.revision)} viewModel={viewModel}/>
                ))}
              </TableBody>
            </Table>
          </TableContainer>




          <Dialog open={openUpdateDialog} maxWidth="sm"
          fullWidth>
            <DialogTitle>{t("generic.update")}</DialogTitle>
            <DialogContent>
              <DialogContentText>{t("generic.updateMessage")}</DialogContentText>
              <form onSubmit={(e) => {
                e.preventDefault();
                setLoad(true);
                viewModel.putDatasource().then(()=> {
                  setLoad(false);
                  setOpenUpdateDialog(!openUpdateDialog);
                  if(viewModel.isUpdateFor==false||(viewModel?.isUpdateFor==true&&viewModel?.dataset?.datasource?.revisions?.find((r)=>r.number==viewModel?.dataset?.datasource?.currentRevision)?.write_type=='DELTA')){
                    viewModel.runIngestion();
                  }
                  viewModel.isUpdateFor = false;
                }).catch(error =>{
                alert(error);
                setLoad(false);});}}>
                <Grid container spacing={2} style={{position:"relative"}}>
                  <Grid item xs={12} style={{position:"absolute", top:-10, right:0}}>
                    <FormControlLabel
                      control={
                        <Checkbox
                        checked={viewModel.isUpdateFor}
                        color="primary"
                        disabled={viewModel?.dataset?.schema?.type=='UNSTRUCTURED'||viewModel?.dataset?.datasource?.revisions?.find((r)=>r.number==viewModel?.dataset?.datasource?.currentRevision).write_type=='CUSTOM'}
                        onChange={(e) => {
                          var def = JSON.parse(viewModel.datasourceDefinition);
                          if(viewModel.isUpdateFor==false){
                            def['update_for'] = viewModel.dataset.datasource.id;
                          }else{
                            delete def['update_for'];
                          }
                          viewModel.datasourceDefinition = JSON.stringify(def, null, "\t")
                          viewModel.isUpdateFor = !viewModel.isUpdateFor;
                        }}
                        />
                      }
                      label={t("dataset.historyTabUpdateFor")+'?'}
                    />
                  </Grid>
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
                  <Grid item xs={12}>
                    <DropzoneArea
                      dropzoneText={t("ingestion.datasetFiles")}
                      onChange={(files) => {
                        viewModel.data=[]
                        var def = JSON.parse(viewModel.datasourceDefinition);
                        if(files.length>0){
                          def['source_files']=[];
                        }
                        files.forEach((f)=>{
                          let name = f.name.replace('.'+f.name.split('.')[f.name.split('.').length-1],'');
                          viewModel.data.push({name:name, data:f} as IFileUpload);
                          def['source_files'].push(name);
                        })
                        viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                      }}
                      maxFileSize={Number(process.env.INGESTION_MAX_FILE_SIZE_IN_BYTE??1073741824)}
                      filesLimit={Number(process.env.INGESTION_MAX_NUMBER_FILES??10)}
                    /><br/>
                  </Grid>
                  <Grid item xs={12}>
                    <DropzoneArea
                      dropzoneText={t("ingestion.datasetPlugin")}
                      onChange={(files) => {
                        viewModel.plugin=[]
                        var def = JSON.parse(viewModel.datasourceDefinition);
                        if(files.length>0){
                          def['plugin_files']=[];
                        }
                        files.forEach((f)=>{
                          let name = f.name.replace('.'+f.name.split('.')[f.name.split('.').length-1],'');
                          viewModel.plugin.push({name:name, data:f} as IFileUpload);
                          def['plugin_files'].push(name);
                        })
                        viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
                      }}
                      maxFileSize={Number(process.env.INGESTION_MAX_PLUGINS_SIZE_IN_BYTE??1073741824)}
                      filesLimit={Number(process.env.INGESTION_MAX_NUMBER_PLUGINS??10)}
                      acceptedFiles={['.py']}
                    /><br/>
                  </Grid>
                </Grid> 
              <DialogActions>
                <Button variant="outlined" onClick={() => {
                  setOpenUpdateDialog(!openUpdateDialog);
                  viewModel.datasourceDefinition = '';
                  viewModel.isUpdateFor = false;
                }}>{t("generic.cancel")}</Button>
                <Button variant="outlined" disabled={load} type="submit">{t("generic.save")}</Button>
              </DialogActions>
              </form>   
            </DialogContent>
          </Dialog>




          <Fab
            style={{
            position: "fixed",
            bottom: "2rem",
            right: "7rem",
            }}
            variant="extended"
            size="medium"
            color="primary"
            disabled={viewModel.dataset.isPublic==false&&viewModel.dataset.permission.canWrite!=true}
            onClick={async () => {
              viewModel.datasourceDefinition='';
              const rev = JSON.parse(JSON.stringify(viewModel.dataset.datasource.revisions.find((r)=>r.number==viewModel.dataset.datasource.currentRevision)))
              delete rev['created'];
              delete rev['number'];
              delete rev['write_mode'];
              Object.keys(rev).map(key => {
                if(rev[key]==undefined||rev[key]==null||(Array.isArray(rev[key])&&!rev[key].length)||(Object.keys(rev[key]).length == 0)){
                  delete rev[key];
                }
              })
              if(rev['source_files']!=undefined){
                rev['source_files'].forEach((file, index)=>{
                  rev['source_files'][index]=file.substring(5).replace('.'+file.split('.')[file.split('.').length-1],'');
                })
              }
              if(viewModel.dataset.datasource.currentRevision==0){
                rev['name']=rev['name']+'_update_v'+(viewModel.dataset.datasource.currentRevision+1);
              }
              else{
                rev['name']=rev['name'].replace('_update_v'+(viewModel.dataset.datasource.currentRevision),'_update_v'+(viewModel.dataset.datasource.currentRevision+1));
              }
              viewModel.datasourceDefinition=JSON.stringify(rev, null, "\t");
              setOpenUpdateDialog(true);
            }}
          >
            <AddCircleIcon style={{ marginRight: "0.4rem" }} />
            {t("generic.update")}
          </Fab>
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default History;
