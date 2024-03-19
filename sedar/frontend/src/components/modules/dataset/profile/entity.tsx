import { Accordion, AccordionDetails, AccordionSummary, Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@material-ui/core";
import { t } from "i18next";
import React from "react";
import ViewModel from "..";
import { IEntity } from "../../../../models/schema";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Attribute } from "./attribute";
import workspacesStore from "../../../../stores/workspaces.store";
import AutocompleteComponent from "../../../common/autocomplete";
import { Stack } from "@mui/material";

/**
* Component that represents the schema view for entities.
*/
export const Entity = (props: { entity: IEntity, viewModel: ViewModel})=> {
    const { entity , viewModel} = props;

    const [isEditing, setIsEditing] = React.useState(false);
    const [editLoad, setEditLoad] = React.useState(false);
    const [description, setDescription] = React.useState(entity.description);
    const [name, setName] = React.useState(entity.displayName);
    const [attributeOntologyProperty, setAttributeOntologyProperty] = React.useState(undefined);
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [deleteLoad, setDeleteLoad] = React.useState(false);
    const [annotationToDelete, setAnnotationToDelete] = React.useState('');

    if(entity.annotation==undefined){
        entity.annotation=[];
    }

    return (
        <React.Fragment>
            <Accordion>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
                >
                <Typography>{((entity.displayName!=''&&entity.displayName!=null&&entity.displayName!=undefined)?(entity.displayName+' ('+t("generic.internal")+':'+entity.internalname+')'):entity.internalname)}</Typography>
                </AccordionSummary>
                <AccordionDetails style={{position:"relative"}}>
                {/* <Button variant="contained" color="primary" style={{position:"absolute", top:5, right:15}} onClick={()=>{
                        viewModel.selectedEntityForCustomAnnotation=entity.id;
                        viewModel.openCustomAnnotationDialog=true;
                    }}>{t("dataset.profileTabCustomAnnotation")}</Button> */}
                    <Grid container spacing={2}>
                        <Grid item xs={12}>
                            <form
                            onSubmit={(e) => {
                            e.preventDefault();
                            setEditLoad(true);
                            viewModel.putEntity(entity.id, description, name).then(()=> {
                                entity.description = description;
                                entity.displayName = name;
                                setEditLoad(false); 
                                setIsEditing(false);
                            }).catch(error =>{
                                alert(error);
                                setEditLoad(false);});
                            }}
                            >
                            <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom component="div" onClick={() => {
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {((entity.displayName!=''&&entity.displayName!=null&&entity.displayName!=undefined)?entity.displayName+' ('+t("generic.internal")+':'+entity.internalname+')':entity.internalname)}:
                                    </Typography>
                                </Grid>
                                <Grid container spacing={2} style={{margin:20}}>
                                    <Grid item xs={12} onClick={()=>{
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {isEditing? <TextField
                                        fullWidth
                                        label={t("dataset.profileTabEntityName")}
                                        value={name}
                                        placeholder={((entity.displayName!=''&&entity.displayName!=null&&entity.displayName!=undefined)?entity.internalname:entity.internalname)}
                                        onChange={(e) => setName(e.target.value)}
                                        />:
                                        <Box>{t("dataset.profileTabEntityName") + ': ' + ((entity.displayName!=''&&entity.displayName!=null&&entity.displayName!=undefined)?entity.displayName+' ('+t("generic.internal")+':'+entity.internalname+')':entity.internalname)}</Box>}
                                    </Grid>
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
                                        />:<Box>{ t("dataset.profileTabEntityDescription")+ ': ' + entity.description}</Box>}
                                    </Grid>
                                    <Grid item xs={12} onClick={()=>{
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {/* {isEditing?<Box>{(entity?.annotation?.map((a)=>{
                                            return(
                                                <Chip style={{margin:20}} label={a.ontology.title+': '+a.instance} onDelete={()=>{
                                                    setAnnotationToDelete(a.id);
                                                    setOpenDeleteDialog(true);
                                                }}></Chip>
                                            )
                                        }
                                        ))}
                                        <Stack direction="row" alignItems="center" gap={1}><AutocompleteComponent
                                        value={attributeOntologyProperty}
                                        onChange={(value) =>
                                            setAttributeOntologyProperty(value)
                                        }
                                        title={t("annotation.ontology_property")}
                                        queryUrl={(term: string) =>
                                            process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace?.id}/ontologies/completion?search_term=${term}`
                                        }
                                        /><Button variant="contained" color="primary" style={{minWidth:160, marginRight:20, marginLeft:20}} disabled={editLoad||attributeOntologyProperty==undefined} onClick={()=>{
                                            viewModel.selectedEntityForCustomAnnotation=entity.id;
                                            setEditLoad(true);
                                            viewModel.patchEntity(undefined, undefined, attributeOntologyProperty, undefined).then((r) => {
                                                entity.annotation.push(r);
                                                setEditLoad(false);
                                            }).catch(error =>{
                                                alert(error);
                                            })
                                        }}>{t("generic.add")}</Button></Stack></Box>:
                                        <Box>{t("annotation.ontology_property")}: {entity?.annotation?.map((a)=>{
                                            return(
                                                <Chip style={{margin:5}} label={a.ontology.title+': '+a.instance} onDelete={()=>{
                                                    if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canDelete==true){
                                                        setAnnotationToDelete(a.id);
                                                        setOpenDeleteDialog(true);
                                                    }
                                                }}></Chip>
                                            )
                                        }
                                        )}</Box>} */}
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
                                            <TableCell align="left"></TableCell>
                                            <TableCell align="left">{t("dataset.profileTabAttributeNameHeader")}</TableCell>
                                            <TableCell align="left">{t("dataset.profileTabAttributeDatatypeHeader")}</TableCell>
                                            <TableCell align="left">{t("dataset.profileTabAttributePK")}</TableCell>
                                            <TableCell align="left">{t("dataset.profileTabAttributeFK")}</TableCell>
                                            <TableCell align="left">{t("dataset.profileTabAttributeNullableHeader")}</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {entity.attributes.map((item) => (
                                            <Attribute attribute={item} prefix={''} viewModel={viewModel}/>
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
                    viewModel.selectedEntityForCustomAnnotation=entity.id;
                    viewModel.patchEntity(undefined, undefined, undefined, annotationToDelete).then((r) => {
                        entity.annotation=entity.annotation.filter((a)=>a.id!=annotationToDelete);
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