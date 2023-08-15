import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../../../models/iViewProps";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";
import { useTranslation } from "react-i18next";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import { IAttribute } from "../../../../../models/schema";
import SearchbarComponent from "../../../../common/searchbar";
import { Box, Button } from "@material-ui/core";
import searchStore from "../../../../../stores/search.store";
import { Stack } from "@mui/material";

const Dialog: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) =>
  /**
   *
   * @param viewModel
   */
  {
    const { t } = useTranslation();
    let columns=[] as {name:string, id:string}[];

    function getColumns(attributes:IAttribute[], prefix:string) {
      attributes.forEach(element => {
        if(element.isObject){
          getColumns(element.attributes, prefix+element.name + '.');
        }
        else if(element.isArrayOfObjects){
          //getColumns(element.attributes, prefix+element.name + (element.attributes.length>0?'[0].':'[0]'));
          getColumns(element.attributes, prefix+element.name + '.');
        }
        else{
          columns.push({name:prefix+element.name, id:element.id});
        }
      });
    }

    return (
      /**
       * @return
       */
      <Grid container direction="column">
        <Grid container item>
          <Grid item sm>
          <Grid container item>
              <Grid item sm={12}>
              <Stack direction="row" alignItems="center" gap={1}>
                  <Box style={{minWidth: '450px'}}>
                    <SearchbarComponent isWorkflow={true} isExtendedView={false} isVisualizationView={false} isRecommendation={false}/>
                  </Box>
                  <Button variant="contained" color="primary" fullWidth disabled={searchStore.idOfSelectedDataset==undefined?true:
                    viewModel.workflowViewModel.datasets.find(
                      (i) => i.id == searchStore.idOfSelectedDataset
                      )!=undefined} onClick={()=>{
                      viewModel.workflowViewModel.getDataset(searchStore.idOfSelectedDataset).then(()=> {
                        }).catch(error =>{
                        alert(error);
                      });
                    }
                  }>{t("generic.select")}</Button>
                </Stack>
              </Grid>
            </Grid>
            <FormControl fullWidth margin="dense">
              <InputLabel>
                {t("workflow.properties_dialog.data_source.dataset")}*
              </InputLabel>
              <Select
                required
                value={viewModel.data?.uid ?? ""}
                onChange={(e) =>
                  viewModel.updateData((data) => {
                    const uid = e.target.value as string;
                    data.uid = uid;
                    const datamart = viewModel.workflowViewModel.datasets.find(
                      (i) => i.id == uid
                    );
                    /*data.schema.fields = (
                      datamart as any
                    ).metadata.schema.fields;*/
                    getColumns(datamart.schema.entities[0].attributes, '');
                    data.schema.fields = (
                      columns as any
                    );

                    /*viewModel.workflowViewModel.annotations.forEach((i) => {
                      if (i.datamart_id != uid) return;
                      if (
                        i.ontology_attribute.find(
                          (x) =>
                            x[1] ==
                            "<http://ncicb.nci.nih.gov/xml/owl/EVS/Thesaurus.owl#C49189>"
                        )
                      )
                        data.schema.primary_key.push(i.data_attribute);
                    });*/
                  })
                }
              >
                {viewModel.workflowViewModel.datasets.map((i) => (
                  <MenuItem value={i.id} key={i.id}>
                    {i.title}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Grid>
    );
  }
);

export default Dialog;
