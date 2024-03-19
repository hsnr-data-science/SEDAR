import React from "react";
import Typography from '@mui/material/Typography';
import searchStore from '../../../stores/search.store';
import { observer } from "mobx-react";
import { Checkbox, FormControlLabel, Grid, IconButton, MenuItem, Select, TextField } from "@material-ui/core";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { useTranslation } from "react-i18next";
import Multiselect from "./multiselect";
import { LocalizationProvider, DesktopDatePicker } from "@mui/lab";
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import { TextField as TF} from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
/**
* Component for the filter for searching. 
*/
const SearchfilterComponent = observer(() => {
  const { t } = useTranslation();
  const [metrics, setMetrics] = React.useState([]);
  const [parameters, setParameters] = React.useState([]);
  const setBeforeMetrics = (value) => {

    setMetrics(value);
    searchStore.selectedMetrics = value;
    searchStore.getDatasets();
  }
  const setBeforeParameters = (value) => {
    

    setParameters(value);
    
    searchStore.selectedParameters = value;
    searchStore.getDatasets();
  }
 
  return (
    <React.Fragment>
      <Typography variant="h6" gutterBottom component="div">
        {t("search.filterHeader")}:
        </Typography><br/>
        <IconButton style={{position:"absolute", right:"0", top:"0"}} onClick={()=>searchStore?.clearFilter()}><RemoveCircleOutlineIcon/></IconButton>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            {t("search.filterWildcard")}:
          </Grid>
          <Grid item xs={12} style={{padding:20}}>
            <FormControlLabel
              control={
                <Checkbox
                checked={searchStore?.withAutoWildcard}
                disabled={searchStore?.isSemanticSearch==true}
                color="primary"
                onChange={(e) => {
                  searchStore.withAutoWildcard=!searchStore.withAutoWildcard;
                }}
                />
              }
              label={t("search.filterSelectWildcard")}
              />
          </Grid>
          <Grid item xs={12}>
            {t("search.filterSort")}:
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <Select
              value={searchStore?.sortTarget}
              style={{width:"100%"}}
              disabled={searchStore?.isSourceDataSearch}
              onChange={(e) => {
                searchStore.sortTarget=e.target.value as string;
                if(searchStore.sortTarget!=''&&searchStore.sortDirection==''){
                  searchStore.sortDirection = 'ASC';
                }
                if(searchStore.sortTarget==''&&searchStore.sortDirection!=''){
                  searchStore.sortDirection = '';
                }
                searchStore.getDatasets();
              }}
              >
                <MenuItem  value="">-</MenuItem>
                <MenuItem value='created_on'>{t('search.filterSortCreated')}</MenuItem>
                <MenuItem value='last_updated_on'>{t('search.filterSortUpdated')}</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <Select
              value={searchStore?.sortDirection}
              style={{width:"100%"}}
              disabled={searchStore?.isSourceDataSearch||searchStore?.sortTarget==''}
              onChange={(e) => {
                searchStore.sortDirection=e.target.value as string;
                searchStore.getDatasets();
              }}
              >
                <MenuItem  value="">-</MenuItem>
                <MenuItem value='ASC'>{t('search.filterSortAsc')}</MenuItem>
                <MenuItem value='DESC'>{t('search.filterSortDesc')}</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12}>
            {t("search.filterLimit")}:
          </Grid>
          <Grid item xs={12} style={{padding:20}}>
            <Select
              value={searchStore?.limit}
              style={{width:"100%"}}
              disabled={searchStore?.isSourceDataSearch}
              onChange={(e) => {
                searchStore.limit=e.target.value as string;
                searchStore.getDatasets();
              }}
              >
                <MenuItem value="10">10</MenuItem>
                <MenuItem value="25">25</MenuItem>
                <MenuItem value="50">50</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={6}>
            {t("search.filterSearchDatasource")}:
          </Grid>
          <Grid item xs={6}>
            {t("search.filterSearchSemantic")}:
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <FormControlLabel
              control={
                  <Checkbox
                  checked={searchStore?.isSourceDataSearch}
                  color="primary"
                  onChange={(e) => {
                    searchStore.isSourceDataSearch==false?searchStore.clearFilter():'';
                    searchStore.isSourceDataSearch = !searchStore.isSourceDataSearch;
                    searchStore.getDatasets();
                  }}
                  />
              }
              label={t("search.filterSearchDatasource")}
              />
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <FormControlLabel
              control={
                  <Checkbox
                  checked={searchStore?.isSemanticSearch}
                  color="primary"
                  onChange={(e) => {
                    searchStore.isSemanticSearch==false?searchStore.clearFilter():'';
                    searchStore.isSemanticSearch = !searchStore.isSemanticSearch;
                    if(searchStore.isSemanticSearch == true){
                      searchStore.withAutoWildcard=false
                    }
                    if(searchStore.isSemanticSearch == false){
                      searchStore.withAutoWildcard=true
                    }
                    searchStore.getDatasets();
                  }}
                  />
              }
              label={t("search.filterSearchSemantic")}
              />
          </Grid>
          <Grid item xs={12}>
            {t("search.filterSearchNotebooks")}:
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <FormControlLabel
              control={
                <Checkbox
                checked={searchStore?.isNotebookSearch}
                color="primary"
                onChange={(e) => {
                  searchStore.isNotebookSearch==false?searchStore.clearFilter():searchStore.selectNotebookType='';
                  searchStore.isNotebookSearch = !searchStore.isNotebookSearch;
                  searchStore.getDatasets();
                }}
                />
              }
              label={t("search.filterSearchNotebooks")}
              />
          </Grid>
          {searchStore?.isNotebookSearch==true?
            <Grid item xs={6} style={{padding:20}}>
              <Select
                value={searchStore?.selectNotebookType}
                style={{width:"100%"}}
                onChange={(e) => {
                  searchStore.selectNotebookType=e.target.value as string;
                  searchStore.getDatasets();
                }}
                >
                  <MenuItem  value="">-</MenuItem>
                  <MenuItem  value="JUPYTER">Jupyter</MenuItem>
                  <MenuItem  value="ZEPPELIN">Zeppelin</MenuItem>
                  <MenuItem  value="MLFLOW">MLFLOW</MenuItem>
              </Select>
            </Grid>:
            <Grid item xs={6} style={{padding:20}}>
            </Grid>
          }
          <Grid item xs={12}>
            {t("search.filterTags")}:
          </Grid>
          <Grid item xs={12} style={{padding:20}}>
            <Multiselect/>
            <FormControlLabel
              control={
                <Checkbox
                checked={searchStore?.selectLinked}
                color="primary"
                disabled={searchStore?.isSourceDataSearch}
                onChange={(e) => {
                  searchStore.selectLinked=!searchStore.selectLinked;
                }}
                />
              }
              label={t("search.filterSelectAllLinkedTags")}
              />
          </Grid>
          <Grid item xs={12}>
            {t("search.filterZone")}:
          </Grid>
          <Grid item xs={12} style={{padding:20}}>
            <Select
              value={searchStore?.selectedZone}
              style={{width:"100%"}}
              disabled={searchStore?.isSourceDataSearch}
              onChange={(e) => {
                searchStore.selectedZone=e.target.value as string;
                searchStore.getDatasets();
              }}
              >
                <MenuItem  value="">-</MenuItem>
                <MenuItem value='RAW'>{t('search.filterZoneRaw')}</MenuItem>
                <MenuItem value='PROCESSED'>{t('search.filterZoneProcessed')}</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12}>
            {t("search.filterPublicStatus")}:
          </Grid>
          <Grid item xs={12} style={{padding:20}}>
            <Select
              value={searchStore?.publicStatus}
              style={{width:"100%"}}
              disabled={searchStore?.isSourceDataSearch}
              onChange={(e) => {
                searchStore.publicStatus=e.target.value as string;
                searchStore.getDatasets();
              }}
              >
                <MenuItem  value="">-</MenuItem>
                <MenuItem value="PUBLIC">{t('search.filterPublicStatusPublic')}</MenuItem>
                <MenuItem value="PRIVATE">{t('search.filterPublicStatusPrivate')}</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12}>
            {t("search.filterDatetime")}:
          </Grid>
          <Grid item xs={12}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Grid container spacing={2}>
                <Grid item xs={6} style={{padding:20}}>
                  <DesktopDatePicker
                    label={t('search.filterDatetimeStart')}
                    disabled={searchStore?.isSourceDataSearch}
                    inputFormat="dd.MM.yyyy"
                    value={searchStore.datetimeStart}
                    onChange={(v)=>{
                      searchStore.datetimeStart=v;
                      searchStore.getDatasets();
                    }}
                    renderInput={(params) => <TF fullWidth {...params} />}
                  />
                </Grid>
                <Grid item xs={6} style={{padding:20}}>
                  <DesktopDatePicker
                    label={t('search.filterDatetimeEnd')}
                    inputFormat="dd.MM.yyyy"
                    disabled={searchStore?.isSourceDataSearch}
                    value={searchStore.datetimeEnd}
                    onChange={(v)=>{
                      searchStore.datetimeEnd=v;
                      searchStore.getDatasets();
                    }}
                    renderInput={(params) => <TF fullWidth {...params} />}
                  />
                </Grid>
              </Grid>
            </LocalizationProvider>
          </Grid>
          <Grid item xs={6}>
            {t("search.filterOwner")}:
          </Grid>
          <Grid item xs={6}>
            {t("search.filterSchema")}:
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <Select
              value={searchStore?.selectedOwner}
              style={{width:"100%"}}
              disabled={searchStore?.isSourceDataSearch}
              onChange={(e) => {
                searchStore.selectedOwner=e.target.value as string;
                searchStore.getDatasets();
              }}
              >
                <MenuItem  value="">-</MenuItem>
                {
                  searchStore?.users?.length==0?'':searchStore?.users?.map((item) => (
                    <MenuItem key={item.email} value={item.email}> {item.firstname + ' ' + item.lastname}</MenuItem>
                  ))
                }
            </Select>
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <Select
              value={searchStore?.selectedSchema}
              style={{width:"100%"}}
              disabled={searchStore?.isSourceDataSearch}
              onChange={(e) => {
                searchStore.selectedSchema=e.target.value as string;
                if(searchStore.selectedSchema=='UNSTRUCTURED'){
                  searchStore.rowsMin='';
                  searchStore.rowsMax='';
                }
                if(searchStore.selectedSchema==''){
                  searchStore.searchSchemaElement=false;
                  searchStore.filterSchema=false;
                  searchStore.isPk=false;
                  searchStore.isFk=false;
                }
                searchStore.getDatasets();
              }}
              >
                <MenuItem  value="">-</MenuItem>
                <MenuItem value='STRUCTURED'>{t('generic.STRUCTURED')}</MenuItem>
                <MenuItem value='SEMISTRUCTURED'>{t('generic.SEMISTRUCTURED')}</MenuItem>
                <MenuItem value='UNSTRUCTURED'>{t('generic.UNSTRUCTURED')}</MenuItem>
            </Select>
          </Grid>
          {searchStore.selectedSchema!=''&&searchStore.isSemanticSearch==false&&searchStore.isNotebookSearch==false?
            <Grid item xs={12} style={{padding:20}}>
              <FormControlLabel
                control={
                    <Checkbox
                    checked={searchStore?.searchSchemaElement}
                    color="primary"
                    onChange={(e) => {
                      searchStore.searchSchemaElement = !searchStore.searchSchemaElement;
                      searchStore.getDatasets();
                    }}
                    />
                }
                label={t("search.filterSearchSchemaElements")}
                />
            </Grid>
          :''}
          {searchStore.selectedSchema=='STRUCTURED'||searchStore.selectedSchema=='SEMISTRUCTURED'?
            <React.Fragment>
              {searchStore.searchSchemaElement==true? 
                <React.Fragment>
                <Grid item xs={12} style={{padding:20}}>
                  <FormControlLabel
                    control={
                        <Checkbox
                        checked={searchStore?.filterSchema}
                        color="primary"
                        onChange={(e) => {
                          searchStore.filterSchema = !searchStore.filterSchema;
                          searchStore.getDatasets();
                        }}
                        />
                    }
                    label={t("search.filterSchemaElements")}
                    />
                </Grid>
                {searchStore.filterSchema==true?
                  <React.Fragment>
                    <Grid item xs={6} style={{padding:20}}>
                      <FormControlLabel
                        control={
                            <Checkbox
                            checked={searchStore?.isPk}
                            color="primary"
                            onChange={(e) => {
                              searchStore.isPk = !searchStore.isPk;
                              searchStore.getDatasets();
                            }}
                            />
                        }
                        label={t("search.filterPK")}
                        />
                    </Grid>
                    <Grid item xs={6} style={{padding:20}}>
                      <FormControlLabel
                        control={
                            <Checkbox
                            checked={searchStore?.isFk}
                            color="primary"
                            onChange={(e) => {
                              searchStore.isFk = !searchStore.isFk;
                              searchStore.getDatasets();
                            }}
                            />
                        }
                        label={t("search.filterFK")}
                        />
                    </Grid>
                  </React.Fragment>:''}
                </React.Fragment>:''
              }
              <Grid item xs={12}>
                {t("search.filterRowCount")}:
              </Grid>
              <Grid item xs={6} style={{padding:20}}>
                <TextField
                  onChange={(e) => {
                      searchStore.rowsMin = e.target.value as string
                      searchStore.getDatasets();
                    }
                  }
                  value={searchStore.rowsMin}
                  disabled={searchStore?.isSourceDataSearch}
                  margin="dense"
                  label={t("search.filterRowCountMin")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} style={{padding:20}}>
                <TextField
                  onChange={(e) => {
                      searchStore.rowsMax = e.target.value as string
                      searchStore.getDatasets();
                    }
                  }
                  value={searchStore.rowsMax}
                  disabled={searchStore?.isSourceDataSearch}
                  margin="dense"
                  label={t("search.filterRowCountMax")}
                  fullWidth
                />
              </Grid>
            </React.Fragment>:''
          }
          {searchStore?.selectedSchema=='UNSTRUCTURED'&&searchStore?.searchSchemaElement==true&&searchStore.isNotebookSearch==false?
            <React.Fragment>
              <Grid item xs={12}>
                {t("search.filterFileSize")}:
              </Grid>
              <Grid item xs={6} style={{padding:20}}>
                <TextField
                  onChange={(e) => {
                      searchStore.sizeMin = e.target.value as string
                      searchStore.getDatasets();
                    }
                  }
                  value={searchStore.sizeMin}
                  disabled={searchStore?.isSourceDataSearch}
                  margin="dense"
                  label={t("search.filterRowCountMin")}
                  fullWidth
                />
              </Grid>
              <Grid item xs={6} style={{padding:20}}>
                <TextField
                  onChange={(e) => {
                      searchStore.sizeMax = e.target.value as string
                      searchStore.getDatasets();
                    }
                  }
                  value={searchStore.sizeMax}
                  disabled={searchStore?.isSourceDataSearch}
                  margin="dense"
                  label={t("search.filterRowCountMax")}
                  fullWidth
                />
              </Grid>
            </React.Fragment>:''
          }
          <Grid item xs={12}>
          {t('search.mlsearchfilter')}
          </Grid>
          <Grid item xs={4} style={{padding:20}}>
            <FormControlLabel
              control={
                  <Checkbox
                  checked={searchStore?.hasRun}
                  color="primary"
                  onChange={(e) => {
                    
                    searchStore.hasRun = !searchStore.hasRun;
                    searchStore.getDatasets();
                  }}
                  />
              }
              label={t('search.mlrun')}
              />
          </Grid>
          <Grid item xs={4} style={{padding:20}}>
            <FormControlLabel
              control={
                  <Checkbox
                  checked={searchStore?.hasNotebook}
                  color="primary"
                  onChange={(e) => {
                    
                    searchStore.hasNotebook = !searchStore.hasNotebook;
                    searchStore.getDatasets();
                  }}
                  />
              }
              label={t('search.mlnotebook')}
              />
          </Grid>
          <Grid item xs={4} style={{padding:20}}>
            <FormControlLabel
              control={
                  <Checkbox
                  checked={searchStore?.hasRegModel}
                  color="primary"
                  onChange={(e) => {
                    
                    searchStore.hasRegModel = !searchStore.hasRegModel;
                    searchStore.getDatasets();
                  }}
                  />
              }
              label={t('search.mldeployedmodel')}
              />
          </Grid>

          <Grid item xs={12}>
          {t('search.mlexperiment')}
          </Grid>
          <Grid item xs={12} style={{padding:20}}>
            <Select
              value={searchStore?.selectedExperiment}
              style={{width:"100%"}}             
              onChange={(e) => {
                searchStore.selectedExperiment=e.target.value as string;
                searchStore.getDatasets();
              }}
              >
                <MenuItem  value="">-</MenuItem>
                {
                  searchStore?.experiments?.length==0?'':searchStore?.experiments?.map((item) => (
                    <MenuItem value={item.experiment_id}> {item.experiment_id + ' ' + item.name}</MenuItem>
                  ))
                }
            </Select>
          </Grid>
          <Grid item xs={6}>
            Filter {t('search.mlmetrics')}
          </Grid>
          <Grid item xs={6}>
            Filter {t('search.mlparameter')}
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <Autocomplete
              multiple
              value={searchStore.selectedMetrics}       
              options={searchStore.metrics}
              getOptionLabel={(option) => option}
              onChange={(event, value) => setBeforeMetrics(value)}
              renderInput={(params) => (
                <TextField
                  {...params}
                  variant="standard"
                  label="Metric"
                  placeholder="Metrics"
                />
              )}
            />
          </Grid>
          <Grid item xs={6} style={{padding:20}}>
            <Autocomplete
                multiple
                value={searchStore.selectedParameters}         
                options={searchStore.parameters}
                getOptionLabel={(option) => option}
                onChange={(event, value) => setBeforeParameters(value)}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="standard"
                    label="Parameter"
                    placeholder="Parameters"
                  />
                )}
              />
          </Grid>
        </Grid>
    </React.Fragment>
  );
});

export default SearchfilterComponent;