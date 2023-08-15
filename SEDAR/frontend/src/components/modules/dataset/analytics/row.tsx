import { Box, Button, Checkbox, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Grid, IconButton, MenuItem, Select, TableCell, TableRow, TextField, Typography, useMediaQuery, useTheme } from "@material-ui/core";
import React from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from "@material-ui/icons/Delete";
import ViewModel from "../viewModel";
import VisibilityIcon from '@mui/icons-material/Visibility';
import workspacesStore from "../../../../stores/workspaces.store";
import { INotebook } from "../../../../models/dataset";
import userStore from "../../../../stores/user.store";
import Iframe from "react-iframe";
import CloseIcon from '@mui/icons-material/Close';
import SearchbarComponent from "../../../common/searchbar";
import "./style.css";
import SearchIcon from '@mui/icons-material/Search';
import searchStore from "../../../../stores/search.store";
import { useTranslation } from "react-i18next";
import MenuBookIcon from '@mui/icons-material/MenuBook';
import MDEditor from "@uiw/react-md-editor";
import routingStore from "../../../../stores/routing.store";

import AddCommentIcon from '@mui/icons-material/AddComment';


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


/**
* Component that represents the collapsable table row. 
*/
export const Row = (props: { item: INotebook, viewModel: ViewModel})=> {
  const {t, i18n} = useTranslation()

  const { item, viewModel} = props;
  const [open, setOpen] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [openViewDialog, setOpenViewDialog] = React.useState(false);
  const [openSearchbar, setOpenSearchbar] = React.useState(false);
  const [openWiki, setOpenWiki] = React.useState(false);

  const [title, setTitle] = React.useState(item.title);
  const [description, setDescription] = React.useState(item.description);
  const [isPublic, setIsPublic] = React.useState(item.isPublic);
  const [version, setVersion] = React.useState(item.version);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editLoad, setEditLoad] = React.useState(false);
  const [deleteLoad, setDeleteLoad] = React.useState(false);

  /**
  * Function to open the run tab associated with the run/experiment
  */
  const pushToRuns = (experiment_id) => {
    var bo = viewModel.prepareRuns(experiment_id);
    if(bo){
      routingStore.history.push('/runs');
    }
  }
  
  var iframeurl = "";
  iframeurl = process.env.JUPYTERHUB_URL+"/user/"+item.author.username+"/notebooks/"+filterString(workspacesStore.currentWorkspace.title)+"/"+filterString(viewModel.dataset.title)+"/"+filterString(item.title)+".ipynb";
  return (
    <React.Fragment>    
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="left">{item.title}</TableCell>
        <TableCell align="left">{item.type}</TableCell>
        <TableCell align="left">{item.author.firstname + ' ' + item.author.lastname}</TableCell>
        <TableCell align="left">{item.version}</TableCell>
        <TableCell align="left">
            <IconButton onClick={()=> {
              if(item.isPublic == true && item.author.username != userStore.username){
                viewModel.copyNbFromHDFStoContainer(userStore.username,item.id)
          
              }             
              searchStore.typeOfNotebook = item.type;
              setOpenViewDialog(true);
              viewModel.getWiki(i18n.language.split('-')[0]);
            }}><VisibilityIcon/></IconButton>
            <IconButton disabled={userStore.email!=item.author.email} onClick={() => setOpenDeleteDialog(true)}><DeleteIcon/></IconButton>
            <IconButton disabled={item.isPublic==false} onClick={() => viewModel.addNotebookToHDFS(item)}><AddCommentIcon/></IconButton>

        </TableCell>
        <TableCell>
          {(() => {
            if(item.mlruns != "None"){      
              console.log("TRUE")        
              return(                        
                JSON.parse(item.mlruns.replaceAll("'","\"")).map((id) => (
                  <Button variant="outlined"  onClick={() => pushToRuns(id.split(":")[1])}>{id.split(":")[0]}</Button>                
                ))
              )                  
            }else{
              return(
              	<div>-</div>
              )
            }
          })()}

        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: "20px" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditLoad(true);
                  viewModel.putNotebook(item.id, title, description, isPublic, version).then(()=> {
                    setEditLoad(false), 
                    setIsEditing(false)
                  }).catch(error =>{
                    alert(error);
                    setEditLoad(false);});
                }}
                >
                <Grid container spacing={2} onClick={()=>userStore.email==item.author.email?setIsEditing(true):''}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom component="div">
                      {t("generic.info")}:
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    {isEditing?<TextField
                      fullWidth
                      value={title}
                      label={t("dataset.analyticsTabTitleProperty")}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("dataset.analyticsTabTitleProperty")}{": "+item.title}
                    </Typography>}
                  </Grid>
                  <Grid item xs={12}>
                    {isEditing?<TextField
                        fullWidth
                        multiline
                        rows={4}
                        label={t("dataset.analyticsTabDescriptionProperty")}
                        defaultValue={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                    />:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("dataset.analyticsTabDescriptionProperty")}{": "+item.description}
                    </Typography>
                    }
                  </Grid>
                  <Grid item xs={6}>
                    {isEditing?<Select
                      onChange={(e) => {
                        setVersion(e.target.value as string);
                      }}
                      value={version}
                      label={t('generic.version')}
                      fullWidth
                      disabled={viewModel?.dataset?.schema?.type!='UNSTRUCTURED'&&(viewModel?.dataset?.datasource?.revisions.find((r)=>r.number==viewModel?.dataset?.datasource?.currentRevision).write_type=='DEFAULT'||viewModel?.dataset?.datasource?.revisions.find((r)=>r.number==viewModel?.dataset?.datasource?.currentRevision).write_type=='CUSTOM')}
                      >
                      <MenuItem value='LATEST'>
                        {t('generic.version') + ': ' + t('dataset.analyticsTabAlwaysNewest')}
                      </MenuItem>
                      {new Array(viewModel.dataset.datasource.currentRevision+1).fill("", 0, viewModel.dataset.datasource.currentRevision+1).map((row,index)=>{
                      return(<MenuItem value={index}>
                        {t('generic.version') + ': ' + index.toString()}
                      </MenuItem>)})}
                    </Select>:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("dataset.analyticsTabVersion")}{": "+item.version}
                    </Typography>}
                  </Grid>
                  <Grid item xs={6}>
                    {isEditing?<FormControlLabel
                      control={
                        <Checkbox checked={isPublic} color="primary" onChange={()=>setIsPublic(!isPublic)}/>
                      }
                      label={t("dataset.analyticsTabIsPublic")}
                    />:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("dataset.analyticsTabIsPublic")}{": "+item.isPublic}
                    </Typography>}
                  </Grid>
                </Grid>
                {isEditing?<Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      disabled={editLoad}
                      onClick={() => {
                        setIsEditing(false);
                        setTitle(item.title);
                        setDescription(item.description);
                        setIsPublic(item.isPublic);
                      }}
                    >
                      {t("generic.cancel")}
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={editLoad}
                    >
                      {t("generic.save")}
                    </Button>
                  </Grid>
                </Grid>:''}
              </form>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>

      <Dialog open={openDeleteDialog} maxWidth="sm"
      fullWidth>
        <DialogTitle>{t("generic.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
            <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
              setDeleteLoad(true);
              viewModel.deleteNotebook(item.id).then(() => { 
                setDeleteLoad(false);
                setOpenDeleteDialog(false);
              }).catch(error =>{
              alert(error);
              setDeleteLoad(false);})
              }}>{t("generic.delete")}</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      <Dialog open={openWiki} style={{zIndex:200033, padding:0}} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
      fullWidth>
        <DialogContent style={{padding:"5%", position:'relative'}}>
          <MDEditor.Markdown source={viewModel?.wiki}/>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={() => setOpenWiki(false)}>{t("generic.cancel")}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openViewDialog} style={{zIndex:20000, padding:0}} fullScreen={useMediaQuery(useTheme().breakpoints.down('xl'))}
      fullWidth>
        <DialogContent style={{padding:0, position:'relative'}}>

            <Iframe width="100%" height="100%" url={iframeurl}></Iframe>
            <IconButton style={{position:'absolute', top:5, right:5, backgroundColor:'red', fontSize:80, border:'solid red'}} onClick={() => {
              setOpenViewDialog(false);
              setOpenSearchbar(false);
              setOpenWiki(false);
            }}><CloseIcon/></IconButton>
            <IconButton style={{position:'absolute', top:5, right:65, backgroundColor:'red', fontSize:80, border:'solid red'}} onClick={() => {
              setOpenWiki(!openWiki);
            }}><MenuBookIcon/></IconButton>
            <IconButton style={{position:'absolute', top:5, right:125, backgroundColor:'red', fontSize:80, border:'solid red'}} onClick={() => setOpenSearchbar(!openSearchbar)}><SearchIcon/></IconButton>
            {openSearchbar==true?<Box id="searchbarBox" style={{position:'absolute', minWidth:500, top:8, right:190, zIndex:200012}}><SearchbarComponent isWorkflow={false} isExtendedView={false} isVisualizationView={true} isRecommendation={false}/></Box>:''}
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}