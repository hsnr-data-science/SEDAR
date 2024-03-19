import { Box, Button, Grid, TableCell, TableRow, TextField } from "@material-ui/core";
import React from "react";
import ViewModel from "..";
import { t } from "i18next";
import { IAttribute } from "../../../../models/schema";

/**
* Component that represents the schema view for attributes.
*/
export const Attribute = (props: { attribute: IAttribute, viewModel: ViewModel, prefix: string})=> {
    const { attribute , prefix, viewModel} = props;

    const [isEditing, setIsEditing] = React.useState(false);
    const [editLoad, setEditLoad] = React.useState(false);
    const [datatype, setDatatype] = React.useState(attribute.dataType);
    
    if(attribute.isArrayOfObjects==true || attribute.isObject==true){
        return(
            <React.Fragment>
                <TableRow>
                    <TableCell colSpan={attribute.isArrayOfObjects==true?1:4}>
                        {(prefix!=''?(prefix+'.'):'') + attribute.name + (attribute.isArrayOfObjects==true?' '+t('generic.array'):' '+t('generic.object'))}
                    </TableCell>
                    {
                        attribute.isArrayOfObjects==true?
                        <TableCell colSpan={3}>
                            {isEditing? <Grid container spacing={2}>
                                <Grid item xs={12}>
                                    <TextField
                                    fullWidth
                                    label={'Datatype'}
                                    value={datatype}
                                    onChange={(e) => setDatatype(e.target.value)}
                                    required
                                    />
                                </Grid>
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
                                    onClick={
                                        (e) => {
                                        e.preventDefault();
                                        setEditLoad(true);
                                        viewModel.putAttribute(attribute.id, datatype).then(()=> {
                                            attribute.dataType = datatype;
                                            setEditLoad(false); 
                                            setIsEditing(false);
                                        }).catch(error =>{
                                            alert(error);
                                            setEditLoad(false);});
                                        }
                                    }
                                    >
                                    {t("generic.save")}
                                    </Button>
                                </Grid>
                            </Grid>:<Box onClick={()=>setIsEditing(true)}>{attribute?.dataType==attribute?.dataTypeInternal?attribute?.dataType:(attribute?.dataType + ' (intern: ' + attribute?.dataTypeInternal + ')')}</Box>}
                        </TableCell>:''
                    }
                </TableRow>
                {attribute.attributes.map((item) => (
                    <Attribute attribute={item} viewModel={viewModel} prefix={(prefix!=''?(prefix+'.'):'') + attribute.name}/>
                ))}
            </React.Fragment>
        );
    }
    else{
        return (
            <React.Fragment>
                <TableRow>
                    <TableCell> {(prefix!=''?(prefix+'.'):'') + attribute?.name}</TableCell>
                    <TableCell>
                        {isEditing? <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <TextField
                                fullWidth
                                label={'Datatype'}
                                value={datatype}
                                onChange={(e) => setDatatype(e.target.value)}
                                required
                                />
                            </Grid>
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
                                onClick={
                                    (e) => {
                                    e.preventDefault();
                                    setEditLoad(true);
                                    viewModel.putAttribute(attribute.id, datatype).then(()=> {
                                        attribute.dataType = datatype;
                                        setEditLoad(false); 
                                        setIsEditing(false);
                                    }).catch(error =>{
                                        alert(error);
                                        setEditLoad(false);});
                                    }
                                }
                                >
                                {t("generic.save")}
                                </Button>
                            </Grid>
                        </Grid>:<Box onClick={()=>setIsEditing(true)}>{attribute?.dataType==attribute?.dataTypeInternal?attribute?.dataType:(attribute?.dataType + ' (intern: ' + attribute?.dataTypeInternal + ')')}</Box>}
                    </TableCell>
                    <TableCell>{attribute?.isPk?.toString()}</TableCell>
                    <TableCell>{attribute?.nullable?.toString()}</TableCell>
                </TableRow>
                    <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                </TableCell>
            </React.Fragment>
        );
    }
}
