import React from "react";
import Typography from '@mui/material/Typography';
import Autocomplete from "@material-ui/lab/Autocomplete";
import searchStore from '../../../stores/search.store';
import routingStore from '../../../stores/routing.store';
import debounce from "lodash/debounce";
import appStore from "../../../stores/app.store";
import { observer } from "mobx-react";
import { DatasetCard } from "../../modules/search/card/card";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from "@material-ui/core";
import { IDataset } from "../../../models/dataset";
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import FilterAltOffIcon from '@mui/icons-material/FilterAltOff';
import { Stack } from "@mui/material";
import SearchfilterComponent from "../searchfilter";
import CircularProgress from "@material-ui/core/CircularProgress";
import { useTranslation } from "react-i18next";
import SearchIcon from '@mui/icons-material/Search';

/**
* Component for searching. 
*/
const SearchbarComponent = observer((props:{isWorkflow:boolean, isExtendedView:boolean, isVisualizationView:boolean, isRecommendation:boolean}) => {
  const [loading, setLoading] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const { t } = useTranslation();

  if (!appStore.isLoggedIn) return null;
  const { isWorkflow, isExtendedView, isVisualizationView, isRecommendation } = props;

  const search = async () => {
    try {
      setLoading(true);
      await searchStore.getDatasets();
      setLoading(false);
    } catch (e) {
    }
  };

  const delayedSearch = debounce(() => search(), 100);

  const inputChanged = (
    event: unknown,
    value: string,
    reason: string
  ): void => {
    searchStore.searchQuery = value;
    delayedSearch();
  };
  
  return (
    <React.Fragment>
      <Stack direction="row" alignItems="center" gap={1}>
        {isExtendedView==false?<IconButton onClick={()=>{
          searchStore.openFilterDialog=true;
        }}>{searchStore.filter==true?<FilterAltIcon/>:<FilterAltOffIcon/>}</IconButton>:''}
        <Autocomplete
          fullWidth
          loading={loading}
          value={searchStore.searchQuery}
          open={open}
          onOpen={() => {
            setOpen(true);
          }}
          onClose={() => {
            setOpen(false);
            setLoading(false);
          }}
          freeSolo={isExtendedView}
          options={isExtendedView==false?searchStore.datasets:[]}
          getOptionLabel={(option) => option.title || searchStore.searchQuery}
          onInputChange={inputChanged}
          renderInput={(params) => (
            <TextField {...params} 
            placeholder={t("generic.searchMessage")}
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <React.Fragment>
                  {loading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </React.Fragment>
              ),
            }}
            variant="standard"
            onKeyDown={e => {
              if (e.code === 'Enter') {
                if(searchStore?.datasets?.length>=1&&isWorkflow==false&&isExtendedView==false&&isVisualizationView==false&&isRecommendation==false){
                  let item = searchStore.datasets[0];
                  if(item.isPublic==true){
                    routingStore.history.push('/dataset/'+item.id)
                  }
                  else{
                    if(item.permission!=undefined){
                      routingStore.history.push('/dataset/'+item.id)
                    }else{
                      alert(t("generic.noPermission"));
                    }
                  }
                  setOpen(false);
                }
              }
            }}/>
          )}
          renderOption={(option) => {
            if(isExtendedView==false){
              return (
                <Typography noWrap>
                  <DatasetCard item={option as IDataset} isWorkflow={isWorkflow} isVisualizationView={isVisualizationView} isRecommendation={isRecommendation}/>
                </Typography>
              );
            }
          }}
        />
        {isWorkflow==false&&isExtendedView==false&&isVisualizationView==false&&isRecommendation==false?<IconButton onClick={()=>{
          routingStore.history.push('/search');
        }}><SearchIcon/></IconButton>:''}
      </Stack>
      <Dialog className="filterDialog" open={searchStore.openFilterDialog} maxWidth="md" fullWidth>
        <DialogContent>
          <SearchfilterComponent/>
          <DialogActions>
            <Button variant="outlined" onClick={() => {
              searchStore.openFilterDialog=false;
            }}>{t("generic.saveAndClose")}</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
});

export default SearchbarComponent;