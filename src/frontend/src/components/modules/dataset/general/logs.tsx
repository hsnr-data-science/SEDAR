import { Box, Card, CardContent, Grid, Table, TableCell, TableRow, Typography } from "@material-ui/core";
import { observer } from "mobx-react";
import React from "react";
import { useTranslation } from "react-i18next";
import { ILog } from "../../../../models/dataset";

/**
* Component that represents the log cards. 
*/
export const Logs =  observer((props: { log: ILog})=> {
  const {log} = props;
  const { t, i18n} = useTranslation();
  const [isShown, setIsShown] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ margin:"20px"}} onMouseEnter={() => log.changes!=undefined&&log.changes.length>0?setIsShown(true):''}
        onMouseLeave={() => setIsShown(false)}>
        {isShown==false?
        <CardContent style={{position:"relative", padding:"20px"}}>
          <Grid container spacing={2}>
            <Grid item xs={12} style={{overflowX:'auto'}}>
              <Typography variant="h6" style={{textDecorationLine: 'underline'}}>
               {log.changes!=undefined&&log.changes.length>0?log.type+' ('+t('generic.hover')+')':log.type}
              </Typography>
              <Typography variant="caption" style={{fontStyle:'italic'}}>
                {log.user.firstname + ' ' + log.user.lastname + ', ' + log.createdOn}
              </Typography>
              <Typography variant="body1" style={{padding:5, paddingLeft:0}}>
                {log.description[i18n.language.split('-')[0]]}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>:
        <CardContent style={{position:"relative", padding:"20px"}}>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <Typography variant="subtitle1" style={{textDecorationLine: 'underline'}}>
              {t('generic.changes')}:
            </Typography>
            <Box style={{overflowX:'auto', minHeight:50}}>
            <Table>
              <TableRow>
                <TableCell align="left">
                  {t('generic.key')}
                </TableCell>
                <TableCell align="left">
                  {t('generic.from')}
                </TableCell>
                <TableCell align="left">
                  {t('generic.to')}
                </TableCell>
              </TableRow>
                {
                  log.changes.map((change)=>{
                    return(
                    <TableRow style={{padding:10}}>
                      <TableCell align="left">{change.key}</TableCell> 
                      <TableCell align="left">{change.from}</TableCell>  
                      <TableCell align="left">{change.to}</TableCell>
                    </TableRow>)
                  })
                }
              </Table>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
        }
      </Card>
    </React.Fragment>
  ); 
})