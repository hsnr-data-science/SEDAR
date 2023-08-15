import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, Table, TableCell, TableRow, TextField, Typography } from "@material-ui/core";
import { t } from "i18next";
import React from "react";
import ViewModel from "../viewModel";
import DeleteIcon from "@material-ui/icons/Delete";
import DownloadIcon from '@mui/icons-material/Download';
import workspacesStore from "../../../../stores/workspaces.store";
import { IOntology } from "../../../../models/ontology";

/**
* Component that represents the ontology card. 
*/
export const OntologyCard = (props: { card: IOntology , viewModel: ViewModel})=> {
    const { card, viewModel } = props;
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [openInfoDialog, setOpenInfoDialog] = React.useState(false);
    const [title, setTitle] = React.useState(card.title);
    const [description, setDescription] = React.useState(card.description);
    const [isEditing, setIsEditing] = React.useState(false);
    const [editLoad, setEditLoad] = React.useState(false);
    const [deleteLoad, setDeleteLoad] = React.useState(false);
  
    return (
      <React.Fragment>
        <Card style={{ minWidth: 300, minHeight: 200}}>
          <CardContent style={{position:'relative'}}>
            <IconButton style={{position:'absolute', top:'-10px', right:'20px'}} onClick={() => viewModel.downloadOntology(card.id, card.filename)}><DownloadIcon/></IconButton>
            {workspacesStore?.currentWorkspace!=undefined?(workspacesStore?.currentWorkspace?.permission?.canDelete==true||viewModel.currentWorkspace.isDefault==true?<IconButton disabled={viewModel.currentWorkspace.ontologies.length==1} style={{position:'absolute', top:'-10px', right:'-10px'}} onClick={() => {
              setIsEditing(false);
              if(card.canBeDeleted==true){
                setOpenDeleteDialog(true);
              }else{
                setOpenInfoDialog(true);
              }
              }}><DeleteIcon/></IconButton>:''):''}
            <Box>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditLoad(true);
                    viewModel.putOntology(card.id, title, description).then(()=> {
                      setEditLoad(false)
                      setIsEditing(false)
                    }).catch(error =>{
                    alert(error);
                    setEditLoad(false);});
                }}>
                  <Grid container spacing={2} onClick={() =>{
                    if(workspacesStore?.currentWorkspace!=undefined?workspacesStore?.currentWorkspace?.permission?.canWrite==true||viewModel.currentWorkspace.isDefault==true:false){
                      setIsEditing(true)
                    }
                  }}>
                    <Grid item xs={12}>
                      {isEditing?
                        <TextField
                          fullWidth
                          value={title}
                          label={t("workspaceAdministration.nameOfWorkspace")}
                          onChange={(e) => setTitle(e.target.value)}
                          required
                        />
                        :<Typography variant="subtitle1">
                          {card.title}
                        </Typography>
                      }
                    </Grid>
                    <Grid item xs={12}>
                      {isEditing?
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label={t("workspaceAdministration.descriptionOfWorkspace")}
                          defaultValue={description}
                          onChange={(e) => setDescription(e.target.value)}
                        />
                        :<Typography variant="subtitle1">
                          {card.description}
                        </Typography>
                      }
                    </Grid>
                    <Grid item xs={12}>
                      {t('generic.metainfo')}:
                    </Grid>
                    <Grid item xs={12}>
                      <Table>
                        <TableRow>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {t('workspaceAdministration.ontologyFilename')}:
                          </TableCell>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {card.filename}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {t('workspaceAdministration.ontologyFileMimetype')}: 
                          </TableCell>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {card.mimetype}
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {t('workspaceAdministration.ontologyFilesize')}:
                          </TableCell>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {card.sizeInBytes} Bytes
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {t('workspaceAdministration.ontologyCountTriples')}:
                          </TableCell>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {card.countTriples}
                          </TableCell>
                        </TableRow>
                      </Table>
                    </Grid>
                  </Grid>
                  {isEditing?
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          disabled={editLoad}
                          onClick={() => {setIsEditing(false);
                            setTitle(card.title);
                            setDescription(card.description);
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
                    </Grid>
                  :''}
                </form>
            </Box>
          </CardContent>
          <CardActions>
          </CardActions>
        </Card>




        <Dialog open={openDeleteDialog} maxWidth="sm"
        fullWidth>
          <DialogTitle>{t("generic.delete")}</DialogTitle>
          <DialogContent>
            <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
            <DialogActions>
              <Button onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
              <Button disabled={deleteLoad} onClick={() =>{ 
                setDeleteLoad(true);
                viewModel.deleteOntology(card.id).then(() => {
                  setDeleteLoad(false);
                  setOpenDeleteDialog(false);
                } ).catch(error =>{
                alert(error);
                setDeleteLoad(false);})
              }}>{t("generic.delete")}</Button>
            </DialogActions>
          </DialogContent>
        </Dialog>




        <Dialog open={openInfoDialog} maxWidth="sm"
        fullWidth>
          <DialogTitle>{t("generic.info")}</DialogTitle>
          <DialogContent>
            <DialogContentText>{t("workspaceAdministration.ontologiesDeleteInfoMessage")}</DialogContentText>
            <DialogActions>
              <Button onClick={() => setOpenInfoDialog(false)}>{t("generic.cancel")}</Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
      </React.Fragment>
    );
  }