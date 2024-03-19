import { Box, Button, Checkbox, Chip, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Grid, IconButton, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@material-ui/core";
import { t } from "i18next";
import React from "react";
import ViewModel from "..";
import { IAttribute } from "../../../../models/schema";
import workspacesStore from "../../../../stores/workspaces.store";
import AutocompleteComponent from "../../../common/autocomplete";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import routingStore from "../../../../stores/routing.store";
import { Stack } from "@mui/material";
import searchStore from "../../../../stores/search.store";

/**
* Component that represents the schema view for attributes.
*/
export const Attribute = (props: { attribute: IAttribute, viewModel: ViewModel, prefix: string})=> {
    const { attribute , viewModel, prefix} = props;
    const [open, setOpen] = React.useState(false);

    const [isEditing, setIsEditing] = React.useState(false);
    const [editLoad, setEditLoad] = React.useState(false);
    const [isFk, setIsFk] = React.useState(attribute.isFk);
    const [isPk, setIsPk] = React.useState(attribute.isPk);
    const [isNullable, setIsNullable] = React.useState(attribute.nullable);
    const [containsPII, setContainsPII] = React.useState(attribute.containsPII);
    const [description, setDescription] = React.useState(attribute.description);
    const [datatype, setDatatype] = React.useState(attribute.dataType);
    const [attributeOntologyProperty, setAttributeOntologyProperty] = React.useState(undefined);
    const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);
    const [deleteLoad, setDeleteLoad] = React.useState(false);
    const [fKIDToDelete, setFKIDToDelete] = React.useState('');
    const [fKDSIDToDelete, setFKDSIDToDelete] = React.useState('');
    const [annotationToDelete, setAnnotationToDelete] = React.useState('');

    if(attribute.annotation==undefined){
        attribute.annotation=[];
    }
    
    if(attribute.isArrayOfObjects==true || attribute.isObject==true){
        return(
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
                    <TableCell colSpan={attribute.isArrayOfObjects==true?1:5}>
                        {(prefix!=''?(prefix+'.'):'') + attribute.name + (attribute.isArrayOfObjects==true?' '+t('generic.array'):' '+t('generic.object'))}
                    </TableCell>
                    {
                        attribute.isArrayOfObjects==true?
                        <TableCell colSpan={4}>
                            {attribute.dataType}
                        </TableCell>:''
                    }
                </TableRow>
                <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: "20px" }}>
                            <form
                                onSubmit={(e) => {
                                e.preventDefault();
                                setEditLoad(true);
                                viewModel.putAttribute(attribute.id, description, datatype, isPk, isFk, containsPII, isNullable).then(()=> {
                                    attribute.description = description;
                                    attribute.dataType = datatype;
                                    if(isFk==false && attribute.isFk==true){
                                        viewModel?.fkColumns?.replace([]);
                                    }
                                    attribute.isFk = isFk;
                                    attribute.isPk = isPk;
                                    attribute.nullable = isNullable;
                                    attribute.containsPII = containsPII;
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
                                            {attribute?.name}:
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
                                            label={t("dataset.profileTabAttributeDescription")}
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            required
                                            />:<Box>{ t("dataset.profileTabAttributeDescription")+ ': ' + attribute.description}</Box>}
                                        </Grid>
                                        {attribute.isArrayOfObjects?
                                        <Grid item xs={12} onClick={()=>{
                                            if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                                setIsEditing(true)
                                            }
                                        }}>
                                            {isEditing? <TextField
                                            fullWidth
                                            label={t("dataset.profileTabAttributeDatatype")}
                                            value={datatype}
                                            onChange={(e) => setDatatype(e.target.value)}
                                            required
                                            />:
                                            <Box>{t("dataset.profileTabAttributeDatatype") + ': ' + (attribute.dataType==attribute.dataTypeInternal?attribute.dataType:(attribute.dataType + ' (intern: ' + attribute?.dataTypeInternal + ')'))}</Box>}
                                        </Grid>:''}
                                        {/* <Grid item xs={12} onClick={()=>{
                                            if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                                setIsEditing(true)
                                            }
                                        }}>
                                            {isEditing?<Box>{(attribute?.annotation?.map((a)=>{
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
                                                viewModel.fkAttribute=attribute.id;
                                                setEditLoad(true);
                                                viewModel.patchAttribute(attributeOntologyProperty, undefined).then((r) => {
                                                    attribute.annotation.push(r);
                                                    setEditLoad(false);
                                                }).catch(error =>{
                                                    alert(error);
                                                })
                                            }}>{t("generic.add")}</Button></Stack></Box>:
                                            <Box>{t("annotation.ontology_property")}: {attribute?.annotation?.map((a)=>{
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
                        </Box>
                    </Collapse>
                </TableCell>
                {attribute.attributes.map((item) => (
                    <Attribute attribute={item} prefix={(prefix!=''?(prefix+'.'):'') + attribute.name} viewModel={viewModel}/>
                ))}
                <Dialog open={openDeleteDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>{t("generic.delete")}</DialogTitle>
                    <DialogContent>
                    <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
                    <DialogActions>
                        <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
                        <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                        setDeleteLoad(true);
                        if(annotationToDelete==''){
                            viewModel.fkAttribute=attribute.id;
                            viewModel.idOfFkAttribute=fKIDToDelete;
                            viewModel.idOfFkDataset=fKDSIDToDelete;
                            viewModel.patchAttribute().then(() => {
                                viewModel.fkAttribute='';
                                viewModel.idOfFkDataset='';
                                viewModel.idOfFkAttribute=''; 
                                setDeleteLoad(false);
                                }).catch(error =>{
                                setDeleteLoad(false);
                                alert(error);
                                })
                        }else{
                            viewModel.fkAttribute=attribute.id;
                            viewModel.patchAttribute(undefined, annotationToDelete).then((r) => {
                                attribute.annotation=attribute.annotation.filter((a)=>a.id!=annotationToDelete);
                                setAnnotationToDelete('');
                                setDeleteLoad(false);
                            }).catch(error =>{
                                setAnnotationToDelete('');
                                setDeleteLoad(false);
                                alert(error);
                            })
                        }
                        setOpenDeleteDialog(false);
                        }}>{t("generic.delete")}</Button>
                    </DialogActions>
                    </DialogContent>
                </Dialog>
            </React.Fragment>
        );
    }
    else{
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
                    <TableCell> {(prefix!=''?(prefix+'.'):'') + attribute?.name}</TableCell>
                    <TableCell>{attribute?.dataType}</TableCell>
                    <TableCell>{attribute?.isPk?.toString()}</TableCell>
                    <TableCell>{attribute?.isFk?.toString()}</TableCell>
                    <TableCell>{attribute?.nullable?.toString()}</TableCell>
                </TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                        <Box sx={{ margin: "20px" }}>
                        <form
                            onSubmit={(e) => {
                            e.preventDefault();
                            setEditLoad(true);
                            viewModel.putAttribute(attribute.id, description, datatype, isPk, isFk, containsPII, isNullable).then(()=> {
                                attribute.description = description;
                                attribute.dataType = datatype;
                                if(isFk==false && attribute.isFk==true){
                                    viewModel?.fkColumns?.replace([]);
                                }
                                attribute.nullable = isNullable;
                                attribute.isFk = isFk;
                                attribute.isPk = isPk;
                                attribute.containsPII = containsPII;
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
                                        {attribute?.name}:
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
                                        label={t("dataset.profileTabAttributeDescription")}
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        />:<Box>{ t("dataset.profileTabAttributeDescription")+ ': ' + attribute.description}</Box>}
                                    </Grid>
                                    <Grid item xs={12} onClick={()=>{
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {isEditing? <TextField
                                        fullWidth
                                        label={t("dataset.profileTabAttributeDatatype")}
                                        value={datatype}
                                        onChange={(e) => setDatatype(e.target.value)}
                                        required
                                        />:
                                        <Box>{t("dataset.profileTabAttributeDatatype") + ': ' + (attribute.dataType==attribute.dataTypeInternal?attribute.dataType:(attribute.dataType + ' (intern: ' + attribute?.dataTypeInternal + ')'))}</Box>}
                                    </Grid>
                                    {/* <Grid item xs={12} onClick={()=>{
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {isEditing?<Box>{(attribute?.annotation?.map((a)=>{
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
                                            viewModel.fkAttribute=attribute.id;
                                            setEditLoad(true);
                                            viewModel.patchAttribute(attributeOntologyProperty, undefined).then((r) => {
                                                attribute.annotation.push(r);
                                                setEditLoad(false);
                                            }).catch(error =>{
                                                alert(error);
                                            })
                                        }}>{t("generic.add")}</Button></Stack></Box>:
                                        <Box>{t("annotation.ontology_property")}: {attribute?.annotation?.map((a)=>{
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
                                    <Grid item xs={6} onClick={()=>{
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {isEditing?<FormControlLabel
                                        control={
                                            <Checkbox
                                            checked={isPk}
                                            color="primary"
                                            onChange={(e) => setIsPk(!isPk)}
                                            />
                                        }
                                        label={t("dataset.profileTabAttributePK")}
                                        />:
                                        <Box>{t("dataset.profileTabAttributePK")+': ' + attribute?.isPk?.toString()}</Box>}
                                    </Grid>
                                    <Grid item xs={6} onClick={()=>{
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {isEditing?<FormControlLabel
                                        control={
                                            <Checkbox
                                            checked={containsPII}
                                            color="primary"
                                            onChange={(e) => setContainsPII(!containsPII)}
                                            />
                                        }
                                        label={t("dataset.profileTabAttributePII")}
                                        />:
                                        <Box>{t("dataset.profileTabAttributePII")+': ' + attribute?.containsPII?.toString()}</Box>}
                                    </Grid>
                                    <Grid item xs={6}>
                                        {isEditing?<Box>
                                        <FormControlLabel
                                        control={
                                            <Checkbox
                                            checked={isFk}
                                            color="primary"
                                            onChange={(e) => setIsFk(!isFk)}
                                            />
                                        }
                                        label={t("dataset.profileTabAttributeFK")}
                                        />
                                        </Box>:
                                        <Box onClick={()=>{
                                            if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                                setIsEditing(true)
                                            }
                                        }}>{t("dataset.profileTabAttributeFK")+': ' + attribute?.isFk?.toString()}</Box>}
                                        {
                                            isFk==true?<Box>
                                                {attribute?.foreignKeysTo!=undefined?
                                                attribute?.foreignKeysTo?.map((fk)=>{
                                                    return(<Chip label={fk.attribute?.name} style={{margin:"10px"}} onClick={() => routingStore.history.push("/dataset/"+fk.dataset)} onDelete={()=>{
                                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canDelete==true){
                                                            setFKIDToDelete(fk.attribute.id);
                                                            setFKDSIDToDelete(fk.dataset);
                                                            setOpenDeleteDialog(true);
                                                        }
                                                    }}/>)
                                                }):''}
                                                {isEditing?<IconButton onClick={() => {
                                                    viewModel.fkAttribute=attribute.id;
                                                    searchStore.idOfSelectedDataset=undefined;
                                                    viewModel.openFkDialog=true}}><AddCircleIcon/></IconButton>:''}
                                            </Box>:''
                                        }
                                    </Grid>
                                    <Grid item xs={6} onClick={()=>{
                                        if(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true){
                                            setIsEditing(true)
                                        }
                                    }}>
                                        {isEditing?<FormControlLabel
                                        control={
                                            <Checkbox
                                            checked={isNullable}
                                            color="primary"
                                            onChange={(e) => setIsNullable(!isNullable)}
                                            />
                                        }
                                        label={t("dataset.profileTabAttributeNullable")}
                                        />:
                                        <Box>{t("dataset.profileTabAttributeNullable")+': ' + attribute?.nullable?.toString()}</Box>}
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
                                <Grid item xs={12}>
                                    <Typography variant="h6" gutterBottom component="div">
                                        {t("dataset.profileTabAttributeStats")}:
                                    </Typography>
                                </Grid>
                                <Grid item xs={12} style={{margin:20}}>
                                    <TableContainer component={Paper}>
                                        <Table aria-label="collapsible table">
                                            <TableHead>
                                            </TableHead>
                                            <TableBody>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeCompletness")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.completeness?.toString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeApproximateCountDistinctValues")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.approximateCountDistinctValues?.toString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeDatatype")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.dataType}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeIsDatatypeInferred")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.isDataTypeInferred?.toString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeMean")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.mean?.toString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeMaximum")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.maximum?.toString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeMinimum")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.minimum?.toString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeSum")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.sum?.toString()}</TableCell>
                                                </TableRow>
                                                <TableRow>
                                                    <TableCell align="left">{t("dataset.profileTabAttributeStandardDeviation")}:</TableCell>
                                                    <TableCell>{attribute?.stats?.standardDeviation?.toString()}</TableCell>
                                                </TableRow>
                                            </TableBody>
                                        </Table>
                                    </TableContainer>
                                </Grid>
                            </Grid>
                        </form>
                        </Box>
                    </Collapse>
                </TableCell>




                <Dialog open={openDeleteDialog} maxWidth="sm" fullWidth>
                    <DialogTitle>{t("generic.delete")}</DialogTitle>
                    <DialogContent>
                    <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
                    <DialogActions>
                        <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
                        <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                        setDeleteLoad(true);
                        if(annotationToDelete==''){
                            viewModel.fkAttribute=attribute.id;
                            viewModel.idOfFkAttribute=fKIDToDelete;
                            viewModel.idOfFkDataset=fKDSIDToDelete;
                            viewModel.patchAttribute().then(() => {
                                viewModel.fkAttribute='';
                                viewModel.idOfFkDataset='';
                                viewModel.idOfFkAttribute=''; 
                                setDeleteLoad(false);
                                }).catch(error =>{
                                setDeleteLoad(false);
                                alert(error);
                                })
                        }else{
                            viewModel.fkAttribute=attribute.id;
                            viewModel.patchAttribute(undefined, annotationToDelete).then((r) => {
                                attribute.annotation=attribute.annotation.filter((a)=>a.id!=annotationToDelete);
                                setAnnotationToDelete('');
                                setDeleteLoad(false);
                            }).catch(error =>{
                                setAnnotationToDelete('');
                                setDeleteLoad(false);
                                alert(error);
                            })
                        }
                        setOpenDeleteDialog(false);
                        }}>{t("generic.delete")}</Button>
                    </DialogActions>
                    </DialogContent>
                </Dialog>
            </React.Fragment>
        );
    }
}
