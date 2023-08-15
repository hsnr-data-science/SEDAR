import { Card, CardHeader, Box, Typography, CardContent, FormControl, InputLabel, Select, MenuItem, Grid, TextField, FormControlLabel, Checkbox, Button, Table, TableRow, TableCell, CardActions, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton } from "@material-ui/core";
import { Skeleton, Stack } from "@mui/material";
import { DropzoneArea } from "material-ui-dropzone";
import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import IViewProps from "../../../../models/iViewProps";
import ViewModel from "../viewModel";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import AddIcon from '@mui/icons-material/Add';
import WorkspaceChanger from "../../../app/header/workspaceChanger";
import FolderSpecialIcon from "@material-ui/icons/FolderSpecial";
import workspacesStore from "../../../../stores/workspaces.store";
import userStore from "../../../../stores/user.store";
import Plot from 'react-plotly.js';
import settingStore from "../../../../stores/settings.store";

/**
* Component that represents the workspace tab.
*/
const Workspaces: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
    const { t } = useTranslation();
    
    const [isEditing, setIsEditing] = React.useState(false);
    const [editLoad, setEditLoad] = React.useState(false);
    const [openAddUserDialog, setOpenAddUserDialog] = React.useState(false);
    const [openAddOntologyDialog, setOpenAddOntologyDialog] = React.useState(false);
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [deleteLoad, setDeleteLoad] = React.useState(false);
    const [openPermissionDialog, setOpenPermissionDialog] =  React.useState(false);
    const [canRead, setCanRead] = React.useState(true);
    const [canWrite, setCanWrite] = React.useState(false);
    const [canDelete, setCanDelete] = React.useState(false);

    return (
        <React.Fragment>
            <Card style={{ minWidth: 275 }}>
            <CardHeader title={
                <Box>
                <Typography variant="h6" gutterBottom component="div">
                    {t("workspaceAdministration.workspaceHeader")}
                </Typography>
                <Typography variant="subtitle1">
                    {t("workspaceAdministration.workspaceDescription")}.
                </Typography><hr/>
                </Box>
            }>
            </CardHeader>
            <CardContent style={{position:"relative", padding:20, paddingLeft:40, paddingRight:40}}>
                <Box>
                {
                viewModel.currentWorkspace==undefined?
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                    <Skeleton variant="text" />
                    </Grid>
                    <Grid item xs={12}>
                    <Skeleton variant="text" />
                    </Grid>
                    <Grid item xs={12}>
                    <Skeleton variant="text" />
                    </Grid>
                    <Grid item xs={12}>
                    <Skeleton variant="text" />
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                    <Grid item xs={6}>
                        <Skeleton variant="rectangular" height="450px"/>
                    </Grid>
                </Grid>:
                <Box>
                    <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setEditLoad(true);
                        viewModel.putCurrentWorkspace().then(()=> {
                            setEditLoad(false);
                            setIsEditing(false);
                        }).catch(error =>{
                        alert(error);
                        setEditLoad(false);});
                    }}>
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom component="div">
                                    {t("generic.info")}:
                                </Typography><hr/>
                            </Grid>
                            <Grid item xs={12} style={{padding:20}}>
                                <Table onClick={() => {
                                    if(workspacesStore?.currentWorkspace!=undefined?workspacesStore?.currentWorkspace?.permission?.canWrite==true||viewModel.currentWorkspace.isDefault==true:false){
                                        setIsEditing(true)
                                    }
                                    }}>
                                    <TableRow>
                                        {isEditing?'':<TableCell align="left" style={{borderBottom:"none"}}>
                                            {t("workspaceAdministration.nameOfWorkspace")}:
                                        </TableCell>}
                                        <TableCell align="left" style={{borderBottom:"none"}}>
                                            {isEditing? 
                                            <TextField
                                                fullWidth
                                                value={viewModel.currentWorkspaceForEdit.title}
                                                label={t("workspaceAdministration.nameOfWorkspace")}
                                                onChange={(e) => viewModel.currentWorkspaceForEdit.title = e.target.value}
                                                required
                                            />
                                            :viewModel.currentWorkspace.title
                                            }
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        {isEditing?'':<TableCell align="left" style={{borderBottom:"none"}}>
                                            {t("workspaceAdministration.descriptionOfWorkspace")}:
                                        </TableCell>}
                                        <TableCell align="left" style={{borderBottom:"none"}}>
                                            {isEditing?
                                            <TextField
                                                fullWidth
                                                multiline
                                                rows={4}
                                                value={viewModel.currentWorkspaceForEdit.description}
                                                label={t("workspaceAdministration.descriptionOfWorkspace")}
                                                onChange={(e) => viewModel.currentWorkspaceForEdit.description = e.target.value}
                                            />:viewModel.currentWorkspace.description}
                                        </TableCell>
                                    </TableRow>
                                </Table>
                                {viewModel.currentWorkspace.owner.email==userStore.email||viewModel.currentWorkspace.isDefault==true?
                                    <Grid item xs={12} style={{paddingLeft:20}}>
                                        {viewModel?.currentWorkspace?.users.map((item) => { 
                                            if(userStore.email != item.email){
                                                return (
                                                    <Chip label={item.firstname + ' ' + item.lastname + ' (' + t('generic.permission')+': '+(item.workspacePermissions.canRead?'R':'')+(item.workspacePermissions.canWrite?'W':'')+(item.workspacePermissions.canDelete?'D':'')+')'} 
                                                        onClick={()=> {
                                                            if(viewModel.currentWorkspace.owner.email==userStore.email||viewModel.currentWorkspace.isDefault==true){
                                                                viewModel.userToChangePermission = item.email;
                                                                setCanRead(item.workspacePermissions.canRead);
                                                                setCanWrite(item.workspacePermissions.canWrite);
                                                                setCanDelete(item.workspacePermissions.canDelete);
                                                                setOpenPermissionDialog(true);
                                                            }
                                                        }} 
                                                        style={{margin:"10px"}} 
                                                        onDelete={(e) => {
                                                            if(viewModel.currentWorkspace.owner.email==userStore.email||viewModel.currentWorkspace.isDefault==true){
                                                                viewModel.userToDelete = item.email;
                                                                setOpenDeleteDialog(true);
                                                            }
                                                        }}/>
                                                    );
                                            }
                                        })
                                        }
                                        {
                                            viewModel.currentWorkspace.owner.email==userStore.email||viewModel.currentWorkspace.isDefault==true?<IconButton onClick={() => {
                                                setCanWrite(false);
                                                setCanDelete(false);
                                                setOpenAddUserDialog(true);
                                            }}><AddCircleIcon/></IconButton>:''
                                        }
                                    </Grid>:''
                                }
                            </Grid>
                            {isEditing?
                                <Grid container spacing={2} style={{padding:20}}>
                                    <Grid item xs={6}>
                                        <Button
                                            fullWidth
                                            variant="contained"
                                            color="primary"
                                            disabled={editLoad}
                                            onClick={() => {setIsEditing(false), viewModel.currentWorkspaceForEdit=viewModel.currentWorkspace}}
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
                        </Grid>
                    </form>
                    {/* <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <br/>
                            <Typography variant="h6" gutterBottom component="div">
                                {t("workspaceAdministration.ontologiesOfWorkspace")}:
                            </Typography><hr/>
                        </Grid>
                        <Grid container spacing={2} style={{padding:20}}>
                            {
                                viewModel.currentWorkspace.ontologies!=undefined?viewModel.currentWorkspace.ontologies.map((item) => {
                                return (
                                    <Grid item xs={12} sm={12} md={6}>
                                        <OntologyCard card={item} viewModel={viewModel}/>
                                    </Grid>
                                );
                            }):""
                            }
                            {workspacesStore?.currentWorkspace!=undefined?(workspacesStore?.currentWorkspace?.permission?.canWrite==true||viewModel.currentWorkspace.isDefault==true?
                                <Grid item xs={12} sm={12} md={6}>
                                    <Card style={{ minWidth: 275, minHeight: 500, border:"4px dotted", display: 'flex', alignItems: 'center', justifyContent: 'center',}} onClick={() => setOpenAddOntologyDialog(true)}>
                                        <AddIcon style={{width:200, minHeight:200}}/>
                                    </Card>
                                </Grid>:''):''
                            }
                        </Grid>
                    </Grid> */}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <br/>
                            <Typography variant="h6" gutterBottom component="div">
                                {t("workspaceAdministration.statsOfWorkspace")}:
                            </Typography><hr/>
                        </Grid>
                        <Grid container spacing={2} style={{padding:20}}>
                            <Grid item xs={12} style={{minHeight:400}}>
                                <Plot
                                    data={[{
                                        x: [t('workspaceAdministration.statsDatasetsChart'), t('workspaceAdministration.statsDistinctTagsChart'), t('workspaceAdministration.statsUsersChart'), t('workspaceAdministration.statsOntologiesChart')],
                                        y: [Number(viewModel.currentWorkspace.countDatasets), viewModel.currentWorkspace.tags.length, viewModel.currentWorkspace.users.length, viewModel.currentWorkspace.ontologies.length],
                                        type: 'bar'
                                    }
                                    ]}
                                    layout={ {
                                        autosize: true,
                                        title: t('workspaceAdministration.statsNormalBarChart'),
                                        paper_bgcolor:'rgba(0,0,0,0.0)',
                                        plot_bgcolor:'rgba(0,0,0,0)',
                                        font: {
                                        color: settingStore.isDarkmode==true?'white':'black'
                                        }
                                    }}
                                    useResizeHandler={true}
                                    style={{width: "100%", height: "100%"}}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Plot
                                    data={[
                                    {
                                        values: viewModel.ontologyPieValues,
                                        labels: viewModel.ontologyPieLabels,
                                        type: 'pie',
                                    }
                                    ]}
                                    layout={ {
                                        autosize: true,
                                        title: t('workspaceAdministration.statsFirstPieChart'),
                                        paper_bgcolor:'rgba(0,0,0,0.0)',
                                        plot_bgcolor:'rgba(0,0,0,0)',
                                        font: {
                                        color: settingStore.isDarkmode==true?'white':'black'
                                        }
                                    }}
                                    useResizeHandler={true}
                                    style={{width: "100%", height: "100%"}}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Plot
                                    data={[
                                    {
                                        values: viewModel.ontologyPieTwoValues,
                                        labels: viewModel.ontologyPieTwoLabels,
                                        type: 'pie',
                                    }
                                    ]}
                                    layout={{  
                                        autosize: true,
                                        title:t('workspaceAdministration.statsSecondPieChart'),
                                        paper_bgcolor:'rgba(0,0,0,0.0)',
                                        plot_bgcolor:'rgba(0,0,0,0)',
                                        font: {
                                        color: settingStore.isDarkmode==true?'white':'black'
                                        }
                                    }}
                                    useResizeHandler={true}
                                    style={{width: "100%", height: "100%"}}
                                />
                            </Grid>
                            <Grid item xs={6}>
                                <Plot
                                    data={[
                                    {
                                        values: viewModel.usersPieValues,
                                        labels: viewModel.usersPieLabels,
                                        type: 'pie',
                                    }
                                    ]}
                                    layout={{  
                                        autosize: true,
                                        title:t('workspaceAdministration.statsUserPieChart'),
                                        paper_bgcolor:'rgba(0,0,0,0.0)',
                                        plot_bgcolor:'rgba(0,0,0,0)',
                                        font: {
                                        color: settingStore.isDarkmode==true?'white':'black'
                                        }
                                    }}
                                    useResizeHandler={true}
                                    style={{width: "100%", height: "100%"}}
                                />
                            </Grid>
                            <Grid item xs={6}>
                            </Grid>
                        </Grid>
                    </Grid>
                </Box>
                }
                </Box>




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
                                viewModel.updatePermissionForUser(canRead,canWrite,canDelete).then(() => { 
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
                                viewModel.deleteUser().then(() => { setDeleteLoad(false), setOpenDeleteDialog(false);}).catch(error =>{
                                alert(error);
                                setDeleteLoad(false);
                                })
                            }}>{t("generic.delete")}</Button>
                        </DialogActions>
                    </DialogContent>
                </Dialog>




                <Dialog open={openAddOntologyDialog} maxWidth="sm"
                    fullWidth>
                <DialogTitle>{t("generic.add")}</DialogTitle>
                <DialogContent>
                    <DialogContentText>{t("generic.addMessage")}</DialogContentText>
                    <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        setEditLoad(true);
                        viewModel.postOntologyToWorkspace().then(()=> {setEditLoad(false), setOpenAddOntologyDialog(false);}).catch(error =>{
                        alert(error);
                        setEditLoad(false);
                        });
                    }}><br/>
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
                                    if(viewModel.ontologyTitle==''&&files[0]!=undefined){
                                        viewModel.ontologyTitle = files[0].name.replace('.'+files[0].name.split('.')[files[0].name.split('.').length-1],'');
                                    }
                                    viewModel.file = files[0];
                                }}
                                maxFileSize={Number(process.env.MAX_ONTOLOGY_SIZE_IN_BYTE??1073741824)}
                                filesLimit={1}
                                acceptedFiles={['.owl', '.rdf', '.owl', '.jsonld', '.n3']}
                            /><br/>
                        </Grid>
                    </Grid>
                    <DialogActions>
                        <Button variant="outlined" onClick={() => {setOpenAddOntologyDialog(false)
                            viewModel.ontologyTitle = '';
                            viewModel.ontologyDescription = '';
                        }}>{t("generic.cancel")}</Button>
                        <Button variant="outlined" disabled={editLoad} type="submit">{t("generic.save")}</Button>
                    </DialogActions>
                    </form>
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
                            viewModel.addUserToWorkspace(canRead, canWrite, canDelete).then(()=> {
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
                                            value={viewModel.selectedUser}
                                            style={{width:"100%"}}
                                            required
                                            onChange={(e) => viewModel.selectedUser=e.target.value as string}
                                            >
                                                {
                                                    viewModel.users.length==0?'':viewModel.users.map((item) => (
                                                        viewModel.currentWorkspace.users==undefined?'':viewModel.currentWorkspace.users.find((u) => u.email == item.email)==undefined?<MenuItem key={item.email} value={item.email}> {item.firstname + ' ' + item.lastname}</MenuItem>:''
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




                <Box bgcolor="primary.main" style={{position:'fixed', textAlign:"center", padding:"10px", bottom:'20px', right:'20px', border:'2px solid'}}>
                    <Stack direction="row" alignItems="center" gap={1}>
                        <FolderSpecialIcon/>
                        <WorkspaceChanger />
                    </Stack>
                </Box>
            </CardContent>
            <CardActions>
            </CardActions>
            </Card>
        </React.Fragment>
    );
});

export default Workspaces;
