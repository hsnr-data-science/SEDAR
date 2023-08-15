import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@material-ui/core";
import React from "react";
import ViewModel from "..";
import { IFile } from "../../../../models/schema";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { t } from "i18next";
import workspacesStore from "../../../../stores/workspaces.store";
import AutocompleteComponent from "../../../common/autocomplete";
import { Stack } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';

/**
* Component that represents the schema view for files.
*/
export const Files = (props: { file: IFile, viewModel: ViewModel})=> {
    const { file , viewModel} = props;
    
    const [isEditing, setIsEditing] = React.useState(false);
    const [editLoad, setEditLoad] = React.useState(false);
    const [description, setDescription] = React.useState(file.description);
    const [attributeOntologyProperty, setAttributeOntologyProperty] = React.useState(undefined);
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [deleteLoad, setDeleteLoad] = React.useState(false);
    const [annotationToDelete, setAnnotationToDelete] = React.useState('');

    if(file.annotation==undefined){
        file.annotation=[];
    }

    return (
        <React.Fragment>
            <Accordion>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
                >
                <Typography>{file.filename+ ' ('+file.sizeInBytes.toString()+' Byte)'}</Typography>
                </AccordionSummary>
                <AccordionDetails style={{position:"relative"}}>
                <IconButton style={{position:'absolute', top:0, right:0}} onClick={() => viewModel.downloadFile(file.id, file.filename)}><DownloadIcon/></IconButton>
                {/* <Button variant="contained" color="primary" style={{position:"absolute", top:5, right:50}} onClick={()=>{
                    viewModel.selectedEntityForCustomAnnotation=file.id;
                    viewModel.openCustomAnnotationDialog=true;
                }}>{t("dataset.profileTabCustomAnnotation")}</Button> */}
                <Grid container spacing={2}>
                    <Grid item xs={12}>
                        <form
                        onSubmit={(e) => {
                        e.preventDefault();
                        setEditLoad(true);
                        viewModel.putFile(file.id, description).then(()=> {
                            file.description = description;
                            setEditLoad(false); 
                            setIsEditing(false);
                        }).catch(error =>{
                            alert(error);
                            setEditLoad(false);});
                        }}
                        >
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography variant="h6" gutterBottom component="div" onClick={() => setIsEditing(true)}>
                                    {file?.filename}:
                                </Typography>
                            </Grid>
                            <Grid container spacing={2} style={{margin:20}}>
                                <Grid item xs={12} onClick={()=>{
                                    if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                        setIsEditing(true)
                                    }
                                    }}>
                                    {isEditing?<TextField
                                    fullWidth
                                    multiline
                                    rows={4}
                                    label={t("dataset.profileTabEntityDescription")}
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                    />:<Box>{ t("dataset.profileTabEntityDescription")+ ': ' + file.description}</Box>}
                                </Grid>
                                {/* <Grid item xs={12} onClick={()=>{
                                    if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                        setIsEditing(true)
                                    }
                                    }}>
                                    {isEditing?<Box>{(file?.annotation?.map((a)=>{
                                        return(
                                            <Chip style={{margin:20}} label={a.ontology.title+': '+a.instance} onDelete={()=>{
                                                setAnnotationToDelete(a.id);
                                                setOpenDeleteDialog(true);
                                            }}></Chip>
                                        )}
                                        ))}
                                    <Stack direction="row" alignItems="center" gap={1}>
                                    <AutocompleteComponent
                                    value={attributeOntologyProperty}
                                    onChange={(value) =>
                                        setAttributeOntologyProperty(value)
                                    }
                                    title={t("annotation.ontology_property")}
                                    queryUrl={(term: string) =>
                                        process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace?.id}/ontologies/completion?search_term=${term}`
                                    }
                                    /><Button variant="contained" color="primary" style={{minWidth:160, marginRight:20, marginLeft:20}} disabled={editLoad||attributeOntologyProperty==undefined} onClick={()=>{
                                        viewModel.selectedEntityForCustomAnnotation=file.id;
                                        setEditLoad(true);
                                        viewModel.patchFile(undefined, undefined, attributeOntologyProperty, undefined).then((r) => {
                                            file.annotation.push(r);
                                            setEditLoad(false);
                                        }).catch(error =>{
                                            alert(error);
                                        })
                                    }}>{t("generic.add")}</Button></Stack></Box>:
                                    <Box>{t("annotation.ontology_property")}: {file?.annotation?.map((a)=>{
                                        return(
                                            <Chip style={{margin:5}} label={a.ontology.title+': '+a.instance} onDelete={()=>{
                                                if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canDelete==true){
                                                    setAnnotationToDelete(a.id);
                                                    setOpenDeleteDialog(true);
                                                }
                                            }}></Chip>
                                        )
                                    }
                                    )}</Box>}
                                </Grid> */}
                                {isEditing?<Grid container spacing={2}>
                                    <Grid item xs={6}>
                                        <Button
                                        fullWidth
                                        variant="contained"
                                        color="primary"
                                        disabled={editLoad}
                                        onClick={() => {
                                            setIsEditing(false);
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
                            </Grid>
                        </Grid>
                    </form>
                    <br/>
                        <TableContainer component={Paper}>
                            <Table aria-label="collapsible table">
                                <TableHead>
                                    <TableRow>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {Object.entries(file.properties).map((t,k) => (
                                        <TableRow>
                                            <TableCell>{t[0]}:</TableCell>
                                            <TableCell>{t[1]}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        </Grid>
                    </Grid>
                </AccordionDetails>
            </Accordion>




            <Dialog open={openDeleteDialog} maxWidth="sm" fullWidth>
                <DialogTitle>{t("generic.delete")}</DialogTitle>
                <DialogContent>
                <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
                    <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                    setDeleteLoad(true);
                    viewModel.selectedEntityForCustomAnnotation=file.id;
                    viewModel.patchFile(undefined, undefined, undefined, annotationToDelete).then((r) => {
                        file.annotation=file.annotation.filter((a)=>a.id!=annotationToDelete);
                        setAnnotationToDelete('');
                        setDeleteLoad(false);
                    }).catch(error =>{
                        setAnnotationToDelete('');
                        setDeleteLoad(false);
                        alert(error);
                    })
                    setOpenDeleteDialog(false);
                    }}>{t("generic.delete")}</Button>
                </DialogActions>
                </DialogContent>
            </Dialog>
        </React.Fragment>
    );
}