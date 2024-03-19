import { Card, CardContent, Grid, Typography } from "@material-ui/core";
import React from "react";
import { IAttribute } from "../../../../models/schema";
import ViewModel from "../viewModel";

/**
* Component that represents the column cards. 
*/
export const Columns = (props: { attribute: IAttribute, prefix: string, viewModel: ViewModel})=> {
    const {attribute, prefix, viewModel} = props;
  
    if(attribute.isArrayOfObjects==true || attribute.isObject==true){
      return(
        <React.Fragment>
            {attribute.attributes.map((item) => (
              <Columns attribute={item} prefix={(prefix!=''?(prefix+'_'):'') + attribute.name} viewModel={viewModel}/>
            ))}
        </React.Fragment>
      );
    }
    else{
      if(attribute.stats!=undefined){
        viewModel.canNotRunProfiling=true;
      }
      return (
        <React.Fragment>
          <Card style={{ margin:"20px"}}>
            <CardContent style={{position:"relative", padding:"20px"}}>
              <Grid container spacing={2}>
                <Grid item xs={8}>
                  <Typography variant="subtitle1" style={{wordWrap:'break-word'}}>
                    {(prefix!=''?(prefix+'_'):'')+ attribute.name + ': ' + attribute.dataType}
                  </Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </React.Fragment>
      ); 
    }
}