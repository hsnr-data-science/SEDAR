import { Box, Card, CardContent, Grid, Tooltip, Typography } from "@material-ui/core";
import React from "react";
import routingStore from "../../../../stores/routing.store";
import { Chip } from "@material-ui/core";
import { IDataset } from "../../../../models/dataset";
import searchStore from "../../../../stores/search.store";
import { t } from "i18next";
import StorageIcon from '@mui/icons-material/Storage';
import FilePresentIcon from '@mui/icons-material/FilePresent';
import AccountTreeIcon from '@mui/icons-material/AccountTree';

/**
* Component that represents the preview card. 
* The card is shown in every search result.
*/
export const DatasetCard = (props: { item: IDataset, isWorkflow: boolean, isVisualizationView: boolean, isRecommendation:boolean})=> {
  const { item, isWorkflow, isVisualizationView, isRecommendation} = props;

  /**
  * Function that returns the correct needed code. 
  * In dependence of the permission, it will be a direct reroute,
  * the id of the dataset or the requried code for the notebooks.
  */
  async function permission(){
    if(isWorkflow==true){
      if(item.schema.type!='UNSTRUCTURED'){
        searchStore.idOfSelectedDataset=item.id
      }
      else{
        alert(t("generic.datasetUnstructuredError"))
      }
    }
    else if(isRecommendation==true){
      searchStore.idOfSelectedDataset=item.id
    }
    else if(isVisualizationView==true){
      searchStore.idOfSelectedDataset=item.id;
      let code = await searchStore.getCodeForCopy();
      navigator.clipboard.writeText(code as string);
    }
    else{
      routingStore.history.push('/dataset/'+item.id)
    }
  }

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275, marginTop: 20}} onClick={() => {
        if(item.isPublic==true){
          permission();
        }
        else{
          if(item.permission!=undefined){
            permission();
          }else{
            alert(t("generic.noPermission"));
          }
        }
        }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={4} style={{ alignSelf: 'center'}}>
              {
                <Box style={{width:'100%'}}>
                  {
                  item.schema.type=='UNSTRUCTURED'?
                  <Box style={{textAlign:'center'}}>
                    <FilePresentIcon style={{fontSize:'6em'}}/>
                    <Typography variant="subtitle2">
                      {t('generic.UNSTRUCTURED')}
                    </Typography>
                  </Box>:''
                  }
                  {
                    item.schema.type=='STRUCTURED'?
                    <Box style={{textAlign:'center'}}>
                      <StorageIcon style={{fontSize:'6em'}}/>
                      <Typography variant="subtitle2">
                        {t('generic.STRUCTURED')}
                      </Typography>
                    </Box>:''
                  }
                  {
                    item.schema.type=='SEMISTRUCTURED'?
                    <Box style={{textAlign:'center'}}>
                      <AccountTreeIcon style={{fontSize:'6em'}}/>
                      <Typography variant="subtitle2">
                        {t('generic.SEMISTRUCTURED')}
                      </Typography>
                    </Box>:''
                  }
                </Box>
              }
            </Grid>
            <Grid item xs={8}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" noWrap gutterBottom component="div">
                    {item.title}
                  </Typography>
                  <Typography variant="subtitle1">
                    {item.createdOn + ', ' + item.owner.firstname + ' ' + item.owner.lastname} 
                  </Typography>
                </Grid>
                <Grid item xs={12}>
                    {
                    item.tags.map((tag) => {
                      return (
                        <Tooltip title={tag.annotation.ontology.title+': '+tag.annotation.instance}>
                          <Chip label={tag.title} style={{margin:"10px"}}/>
                        </Tooltip>
                      );
                    })
                    }
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </React.Fragment>
  );
}