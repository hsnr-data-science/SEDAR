import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Select, Typography} from "@material-ui/core";
import { CardHeader, Stack } from "@mui/material";
import IViewProps from "../../../../models/iViewProps";
import userStore from "../../../../stores/user.store";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import InfoIcon from '@mui/icons-material/Info';

/**
* Component that represents the options tab.
*/
const Options: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();

  const [editLoad, setEditLoad] = React.useState(false);
  const [openAddUserDialog, setOpenAddUserDialog] = React.useState(false);
  const [openPermissionDialog, setOpenPermissionDialog] =  React.useState(false);
  const [canRead, setCanRead] = React.useState(true);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
  const [canWrite, setCanWrite] = React.useState(false);
  const [canDelete, setCanDelete] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState('');
  const [selectedUserToDelete, setSelectedUserToDelete] = React.useState('');
  const [userToChangePermission, setUserToChangePermission] = React.useState('');
  const [deleteLoad, setDeleteLoad] = React.useState(false);
  const [indexLoad, setIndexLoad] = React.useState(false);
  const [openDeleteDatasetDialog, setOpenDeleteDatasetDialog] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
      <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("dataset.optionTab")}
              </Typography>
              {/* <Typography variant="subtitle1">
                {t("dataset.optionTabDescription")}
              </Typography> */}
              <hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
        <Grid container spacing={2}>
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" gap={1}><InfoIcon/> {t('ingestion.publishAccessTabInfo')} </Stack>
            </Grid>
            <Grid item xs={12} style={{padding:"20px"}}>
              <FormControlLabel control={<Checkbox color="primary" checked={viewModel?.dataset?.isPublic} onClick={ async ()=>{
                  await viewModel.setDatasetStatus();
                }
              }/>} label={t('ingestion.publishAccessTabIsPublic')} />
              {viewModel.dataset.isPublic==false?
              <Box>
              {
                viewModel?.dataset?.users?.map((item) => { 
                  if(userStore.email != item.email){
                    return (
                      <Chip label={item.firstname + ' ' + item.lastname + ' (' + t('generic.permission')+': '+(item?.datasetPermissions?.canRead?'R':'')+(item?.datasetPermissions?.canWrite?'W':'')+(item?.datasetPermissions?.canDelete?'D':'')+')'} 
                        onClick={()=> {
                          if(viewModel.dataset.permission.canWrite==true){
                            setUserToChangePermission(item.email);
                            setCanRead(item.datasetPermissions.canRead);
                            setCanWrite(item.datasetPermissions.canWrite);
                            setCanDelete(item.datasetPermissions.canDelete);
                            setSelectedUser(item.email);
                            setOpenPermissionDialog(true);
                          }
                        }} 
                        style={{margin:"10px"}} 
                        onDelete={(e) => {
                          if(viewModel?.dataset?.permission?.canWrite==true){
                            setSelectedUserToDelete(item.email);
                            setOpenDeleteDialog(true);
                          }
                        }}/>
                      );
                    }
                  }
                )
              }
              {
                viewModel?.dataset?.permission?.canWrite==true?<IconButton onClick={async () => 
                  {
                    setSelectedUser('');
                    if(viewModel.users.length==0){
                      await viewModel.getAllUsersOfWorkspace();
                    }
                    setCanWrite(false);
                    setCanDelete(false);
                    setOpenAddUserDialog(true);
                  }}><AddCircleIcon/></IconButton>:''
              }
            </Box>:''
            }
            </Grid>
            {viewModel.dataset.isPublic==true?viewModel.dataset.schema.type!="UNSTRUCTURED"?
            <React.Fragment>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" gap={1}><InfoIcon/> {t('ingestion.indexInfo')} </Stack>
              </Grid>
              <Grid item xs={12} style={{padding:"20px"}}>
                <FormControlLabel
                control={
                    <Checkbox
                    checked={viewModel.dataset.isIndexed}
                    disabled={indexLoad}
                    color="primary"
                    onChange={(e) => viewModel.dataset.isIndexed=!viewModel.dataset.isIndexed}
                      onClick={ async ()=>{
                        setIndexLoad(true);
                        await viewModel.setDatasetIndex();
                        setIndexLoad(false);
                      }
                    }/>
                }
                label={t('ingestion.index')}
                />
              </Grid>
            </React.Fragment>:'':''
            }
            <Grid item xs={12}>
              <Stack direction="row" alignItems="center" gap={1}><InfoIcon/> {t('dataset.optionTabDeleteInfo')}</Stack>
            </Grid>
            <Grid item xs={12} style={{padding:"20px"}}>
              <Button variant="contained" color="inherit" onClick={()=>{
                setOpenDeleteDatasetDialog(true);
              }} style={{backgroundColor:"red"}}>{t("generic.delete")}</Button>
            </Grid>
          </Grid>



          <Dialog open={openPermissionDialog} maxWidth="sm"
              fullWidth>
              <DialogTitle>{t("generic.permission")}</DialogTitle>
              <DialogContent>
                  <DialogContentText>{t("generic.permissionMessage")}.</DialogContentText>
                  <Grid container spacing={2}>
                      <Grid item xs={4}>
                          <FormControlLabel control={<Checkbox color="primary" checked={canRead} disabled onClick={()=>setCanRead(!canRead)}/>} label={t("generic.read")} />
                      </Grid>
                      <Grid item xs={4}>
                          <FormControlLabel control={<Checkbox color="primary" checked={canWrite} onClick={()=>setCanWrite(!canWrite)}/>} label={t("generic.write")} />
                      </Grid>
                      <Grid item xs={4}>
                      <FormControlLabel control={<Checkbox color="primary" checked={canDelete} onClick={()=>setCanDelete(!canDelete)}/>} label={t("generic.delete")} />
                      </Grid>
                  </Grid>
                  <DialogActions>
                      <Button variant="outlined" onClick={() => setOpenPermissionDialog(false)}>{t("generic.cancel")}</Button>
                      <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                          setDeleteLoad(true);
                          viewModel.updatePermissionForUser(selectedUser, canRead,canWrite,canDelete).then(() => { 
                              setDeleteLoad(false);
                              setOpenPermissionDialog(false);
                          }).catch(error =>{
                          alert(error);
                          setDeleteLoad(false);
                          })
                      }}>{t("generic.save")}</Button>
                  </DialogActions>
              </DialogContent>
          </Dialog>




          <Dialog open={openDeleteDialog} maxWidth="sm"
              fullWidth>
              <DialogTitle>{t("generic.delete")}</DialogTitle>
              <DialogContent>
                  <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
                  <DialogActions>
                      <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
                      <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                          setDeleteLoad(true);
                          viewModel.removeUserFromDataset(selectedUserToDelete).then(() => { setDeleteLoad(false), setOpenDeleteDialog(false);}).catch(error =>{
                          alert(error);
                          setDeleteLoad(false);
                          })
                      }}>{t("generic.delete")}</Button>
                  </DialogActions>
              </DialogContent>
          </Dialog>



          <Dialog open={openDeleteDatasetDialog} maxWidth="sm"
              fullWidth>
              <DialogTitle>{t("generic.delete")}</DialogTitle>
              <DialogContent>
                  <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
                  <DialogActions>
                      <Button variant="outlined" onClick={() => setOpenDeleteDatasetDialog(false)}>{t("generic.cancel")}</Button>
                      <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                          setDeleteLoad(true);
                          viewModel.deleteDataset().then(() => { 
                            setDeleteLoad(false), 
                            setOpenDeleteDatasetDialog(false);}).catch(error =>{
                          alert(error);
                          setDeleteLoad(false);
                          })
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
                  e.preventDefault()
                  setEditLoad(true);
                    let su = selectedUser;
                    setSelectedUser('');
                    viewModel.addUserToDataset(su, canRead, canWrite, canDelete).then(()=> {
                      setEditLoad(false); 
                      setOpenAddUserDialog(false);
                    }).catch(error =>{
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
                                  label={"Graph Name"}
                                  value={selectedUser}
                                  style={{width:"100%"}}
                                  required
                                  onChange={(e) => setSelectedUser(e.target.value as string)}
                                  >
                                    {
                                      viewModel?.users?.length==0?'':viewModel?.users?.map((item) => (
                                        viewModel?.dataset?.users?.find((u) => u.email == item.email)==undefined?<MenuItem key={item.email} value={item.email}> {item.firstname + ' ' + item.lastname}</MenuItem>:''
                                      ))
                                    }
                              </Select>
                          </FormControl>
                      </Grid>
                      <Grid item xs={4}>
                          <FormControlLabel control={<Checkbox color="primary" checked={canRead} disabled onClick={()=>setCanRead(!canRead)}/>} label={t("generic.read")} />
                      </Grid>
                      <Grid item xs={4}>
                          <FormControlLabel control={<Checkbox color="primary" checked={canWrite} onClick={()=>setCanWrite(!canWrite)}/>} label={t("generic.write")} />
                      </Grid>
                      <Grid item xs={4}>
                          <FormControlLabel control={<Checkbox color="primary" checked={canDelete} onClick={()=>setCanDelete(!canDelete)}/>} label={t("generic.delete")} />
                      </Grid>
                  </Grid>
                  <DialogActions>
                      <Button variant="outlined" onClick={() => {setOpenAddUserDialog(false)}}>{t("generic.cancel")}</Button>
                      <Button variant="outlined" disabled={editLoad} type="submit">{t("generic.save")}</Button>
                  </DialogActions>
                </form>
            </DialogContent>
        </Dialog>
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Options;
