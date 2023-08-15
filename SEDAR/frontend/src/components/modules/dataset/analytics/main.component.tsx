import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControlLabel, Grid, MenuItem, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography} from "@material-ui/core";
import { CardHeader, Skeleton } from "@mui/material";
import IViewProps from "../../../../models/iViewProps";
import { Row } from "./row";
import AddCircleIcon from '@mui/icons-material/AddCircle';

/**
* Component that represents the analytics tab.
*/
const Analytics: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();
  
  const [editLoad, setEditLoad] = React.useState(false);
  const [openAddDialog, setOpenAddDialog] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
      <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("dataset.analyticsTab")}
              </Typography>
              {/* <Typography variant="subtitle1">
                {t("dataset.analyticsTabDescription")}
              </Typography> */}
              <hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
        {
          viewModel.dataset.notebooks==undefined?
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height="400px"/>
            </Grid>
          </Grid>:<TableContainer>
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell></TableCell>
                  <TableCell align="left">{t("dataset.analyticsTabTitleProperty")}</TableCell>
                  <TableCell align="left">{t("dataset.analyticsTabTypeProperty")}</TableCell>
                  <TableCell align="left">{t("generic.author")}</TableCell>
                  <TableCell align="left">{t("dataset.analyticsTabVersion")}</TableCell>
                  <TableCell align="left">{t("generic.options")}</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {viewModel.dataset.notebooks.map((item) => (
                  <Row item={item} viewModel={viewModel}/>
                ))}
              </TableBody>
            </Table>
          </TableContainer>}



          <Dialog open={openAddDialog} maxWidth="sm"
            fullWidth>
            <DialogTitle>{t("generic.add")}</DialogTitle>
            <DialogContent>
                <DialogContentText>{t("generic.addMessage")}</DialogContentText>
                <form onSubmit={(e) => {e.preventDefault();
                setEditLoad(true);
                viewModel.postNotebook().then(()=> {
                    setEditLoad(false);
                    setOpenAddDialog(false);
                    viewModel.notebook.title = '';
                    viewModel.notebook.description = '';
                    viewModel.notebook.isPublic = false;
                    viewModel.notebook.type = 'JUPYTER';
                    viewModel.notebook.version = 'LATEST';
                    }).catch(error =>{
                    alert(error);
                    setEditLoad(false);
                    })
                ;}}><br/>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                    autoFocus
                    onChange={(e) => viewModel.notebook.title=e.target.value as string}
                    value={viewModel.notebook.title}
                    margin="dense"
                    label={t("dataset.analyticsTabTitleProperty")}
                    fullWidth
                    required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                    multiline
                    rows={4}
                    onChange={(e) => viewModel.notebook.description=e.target.value as string}
                    value={viewModel.notebook.description}
                    margin="dense"
                    label={t("dataset.analyticsTabDescriptionProperty")}
                    fullWidth
                    />
                  </Grid>
                  {/* <Grid item xs={12}>
                    <Select
                      value={viewModel.notebook.type}
                      label="Column"
                      margin="dense"
                      onChange={(e) => viewModel.notebook.type=e.target.value as string}
                      fullWidth
                    >
                      <MenuItem value="JUPYTER">
                        Jupyter Notebook
                      </MenuItem>
                    </Select>
                  </Grid> */}
                  <Grid item xs={6}>
                    <Select
                      onChange={(e) => {
                        viewModel.notebook.version = e.target.value as string;
                      }}
                      value={viewModel.notebook.version}
                      label={t('generic.version')}
                      disabled={viewModel?.dataset?.schema?.type!='UNSTRUCTURED'&&(viewModel?.dataset?.datasource?.revisions.find((r)=>r.number==viewModel?.dataset?.datasource?.currentRevision).write_type=='DEFAULT'||viewModel?.dataset?.datasource?.revisions.find((r)=>r.number==viewModel?.dataset?.datasource?.currentRevision).write_type=='CUSTOM')}
                      fullWidth
                      >
                      <MenuItem value='LATEST'>
                        {t('generic.version') + ': ' + t('dataset.analyticsTabAlwaysNewest')}
                      </MenuItem>
                      {new Array(viewModel.dataset.datasource.currentRevision+1).fill("", 0, viewModel.dataset.datasource.currentRevision+1).map((row,index)=>{
                      return(<MenuItem value={index}>
                        {t('generic.version') + ': ' + index.toString()}
                      </MenuItem>)})}
                    </Select>
                  </Grid>
                  <Grid item xs={6}>
                    <FormControlLabel
                      control={
                        <Checkbox checked={viewModel.notebook.isPublic} color="primary" onChange={()=>viewModel.notebook.isPublic=!viewModel.notebook.isPublic}/>
                      }
                      label={t("dataset.analyticsTabIsPublic")}
                    />
                  </Grid>
                </Grid> 
                <DialogActions>
                    <Button variant="outlined" onClick={() => {setOpenAddDialog(false)
                      viewModel.notebook.title = '';
                      viewModel.notebook.description = '';
                      viewModel.notebook.isPublic = false;
                      viewModel.notebook.type = 'JUPYTER';
                      viewModel.notebook.version = 'LATEST';
                    }}>{t("generic.cancel")}</Button>
                    <Button variant="outlined" disabled={editLoad} type="submit">{t("generic.save")}</Button>
                </DialogActions>
                </form>   
            </DialogContent>
          </Dialog>
          <Fab
            disabled={viewModel.dataset.isPublic==false&&viewModel.dataset.permission.canWrite!=true}
            style={{
            position: "fixed",
            bottom: "2rem",
            right: "7rem",
            }}
            variant="extended"
            size="medium"
            color="primary"
            onClick={async () => {
            setOpenAddDialog(true);
              //viewModel.notebook.version=viewModel.dataset.datasource.currentRevision.toString();
              viewModel.notebook.version="LATEST";
            }}
            >
              <AddCircleIcon style={{ marginRight: "0.4rem" }} />
              {t("generic.add")}
          </Fab>
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Analytics;
