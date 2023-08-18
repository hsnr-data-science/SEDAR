import React from "react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogTitle, FormControl, FormControlLabel, Grid, IconButton, InputLabel, MenuItem, Paper, Select, Switch, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography} from "@material-ui/core";
import { CardHeader, Skeleton, Stack } from "@mui/material";
import ViewModel from "../viewModel";
import IViewProps from "../../../../models/iViewProps";
import routingStore from "../../../../stores/routing.store";
import FileUploadIcon from '@mui/icons-material/FileUpload';
import InfoIcon from '@mui/icons-material/Info';

/**
* Component that represents the query tab.
*/
const Query: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();

  const [load, setLoad] = React.useState(false);
  const [ingestionLoad, setIngestionLoad] = React.useState(false);
  const [openIngestionDialog, setOpenIngestionDialog] = React.useState(false);
  const [datasetTitle, setDatasetTitle] = React.useState(viewModel.dataset.title);
  const [isPolymorph, setIsPolymorph] = React.useState(false);
  const [writeType, setWriteType] = React.useState("DEFAULT");

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
        <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("dataset.queryTab")}
              </Typography>
              {/* <Typography variant="subtitle1">
                {t("dataset.queryTabDescription")}
              </Typography> */}
              <hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
        <Card style={{ minWidth: 275 }}>
            <CardContent style={{position:"relative", padding:"40px"}}>
              <FormControlLabel
                style={{position:"absolute", top:"20px", right:"20px"}}
                control={
                  <Switch checked={viewModel.simpleView} color="default" onChange={()=>viewModel.simpleView = !viewModel.simpleView } inputProps={{ 'aria-label': 'controlled' }}/>
                }
                label={t("dataset.queryTabSimple")}/>
                <Box
                sx={{ margin: "20px" }}>
                {
                  viewModel.simpleView == true?
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Grid container spacing={2}>
                        <Typography variant="h6" gutterBottom component="div">
                          {t('dataset.queryTabSelect')}:
                        </Typography>
                        <Grid item xs={12}>
                          <Stack direction="row" alignItems="center" gap={1}><InfoIcon/> {t('dataset.queryTabInfo')} </Stack>
                        </Grid>
                        <Grid item xs={12} style={{padding:20}}>
                          {
                            viewModel.columnsToSelect?.map((item) => {
                              return (
                                <Chip label={item} style={{margin:"10px"}} onDelete={(e) => viewModel.removeSelect(item)}/>
                              );
                            })
                          }
                          <Select
                            value={viewModel.selectColumn}
                            label="Column"
                            onChange={(e) => viewModel.selectColumn =  e.target.value as string}
                            fullWidth
                          >
                            <MenuItem value="*">
                              *
                            </MenuItem>
                            {viewModel.columns?.map((item) => {
                                return (
                                  <MenuItem value={item}>
                                    {item}
                                  </MenuItem>
                                );
                            })}
                          </Select><br/><br/>
                          <Select
                            onChange={(e) => viewModel.selectAggregation = e.target.value as string}
                            fullWidth
                            value={viewModel.selectAggregation}
                            label="Value"
                            >
                            <MenuItem key="" value="">
                              -
                            </MenuItem>
                            <MenuItem  key="Count" value="COUNT">
                              {t('dataset.queryTabCount')}
                            </MenuItem>
                            <MenuItem  key="AVG" value="AVG">
                              {t('dataset.queryTabAverage')}
                            </MenuItem>
                            <MenuItem key="SUM" value="SUM">
                              {t('dataset.queryTabSum')}
                            </MenuItem>
                          </Select><br/><br/>
                          <Button
                            fullWidth
                            variant="contained"
                            color="primary"
                            onClick={() => viewModel.appendSelect()}
                            >
                              {t('generic.append')}
                            </Button>
                          </Grid> 
                      </Grid>
                      <br/>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.queryTabFilterBy')}:
                      </Typography>
                      <Grid item xs={12} style={{padding:20}}>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          viewModel.appendFilter();
                        }}>
                        {
                          viewModel.columnsToFilter?.map((item) => {
                            return (
                              <Chip label={item} style={{margin:"10px"}} onDelete={(e) => viewModel.removeFilter(item)}/>
                            );
                          })
                        }
                        <Select
                          value={viewModel.filterColumn}
                          label="Column"
                          onChange={(e) => viewModel.filterColumn = e.target.value as string}
                          fullWidth
                          disabled={viewModel.disabled}
                        >
                          <MenuItem value="">-
                          </MenuItem>
                          {viewModel.columns?.map((item) => {
                              return (
                                <MenuItem value={item}>
                                  {item}
                                </MenuItem>
                              );
                          })}
                        </Select><br/><br/>
                        <Select
                          onChange={(e) => viewModel.filterOperator = e.target.value as string}
                          fullWidth
                          value={viewModel.filterOperator}
                          label="Value"
                          disabled={viewModel.disabled}
                          >
                          <MenuItem key="" value="">
                            -
                          </MenuItem>
                          <MenuItem key="Equal" value="=">
                            {t('dataset.queryTabEqual')}
                          </MenuItem>
                          <MenuItem key="Greater than" value=">">
                            {t('dataset.queryTabGreaterThan')}
                          </MenuItem>
                          <MenuItem key="Less than" value="<">
                            {t('dataset.queryTabLessThan')}
                          </MenuItem>
                          <MenuItem key="Greater than or equal" value=">=">
                            {t('dataset.queryTabGreaterThanOrEqual')}
                          </MenuItem>
                          <MenuItem key="Less than or equal" value="<=">
                            {t('dataset.queryTabLessThanOrEqual')}
                          </MenuItem>
                          <MenuItem key="BETWEEN" value="BETWEEN">
                            {t('dataset.queryTabBetween')}
                          </MenuItem>
                          <MenuItem key="LIKE" value="LIKE">
                            {t('dataset.queryTabLike')}
                          </MenuItem>
                        </Select><br/><br/>
                        {
                          viewModel.filterOperator=='BETWEEN'?
                          <div>
                            <TextField
                            fullWidth
                            value={viewModel.filterValueOne}
                            label={t('dataset.queryTabBetweenStart')}
                            onChange={(e) => viewModel.filterValueOne = e.target.value}
                            required
                            disabled={viewModel.disabled}
                            />
                            <TextField
                            fullWidth
                            value={viewModel.filterValueTwo}
                            label={t('dataset.queryTabBetweenEnd')}
                            onChange={(e) => viewModel.filterValueTwo = e.target.value}
                            required
                            disabled={viewModel.disabled}
                            />
                          </div>:
                          <TextField
                          fullWidth
                          value={viewModel.filterValueOne}
                          label={t('dataset.queryTabValue')}
                          onChange={(e) => viewModel.filterValueOne = e.target.value}
                          required
                          disabled={viewModel.disabled}
                        />
                        }<br/><br/>
                        <Button
                          fullWidth
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={viewModel.disabled||viewModel.filterColumn == ''}
                        >
                          {t('generic.append')}
                        </Button>
                        </form>
                      </Grid>
                    </Grid>
                    <Grid item xs={6}>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.queryTabGroupBy')}:
                      </Typography>
                      <Grid item xs={12} style={{padding:20}}>
                        {
                          viewModel.columnsToGroupBy?.map((item) => {
                            return (
                              <Chip label={item} style={{margin:"10px"}} onDelete={(e) => viewModel.removeGroup(item)}/>
                            );
                          })
                        }
                        <Select
                          value={viewModel.groupByColumn}
                          label="Column"
                          onChange={(e) => viewModel.groupByColumn = e.target.value as string}
                          fullWidth
                          disabled={viewModel.disabled}
                        >
                          <MenuItem value="">-
                          </MenuItem>
                          {viewModel.columns?.map((item) => {
                              return (
                                <MenuItem value={item}>
                                  {item}
                                </MenuItem>
                              );
                          })}
                        </Select><br/><br/>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => viewModel.appendGroup()}
                          disabled={viewModel.disabled||viewModel.groupByColumn == ''}
                        >
                          {t('generic.append')}
                        </Button>
                      </Grid><br/>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.queryTabOrderBy')}:
                      </Typography>
                      <Grid item xs={12} style={{padding:20}}>
                        {
                          viewModel.columnsToOrderBy?.map((item) => {
                            return (
                              <Chip label={item} style={{margin:"10px"}} onDelete={(e) => viewModel.removeOrder(item)}/>
                            );
                          })
                        }
                        <Select
                          value={viewModel.orderByColumn}
                          label="Column"
                          onChange={(e) => viewModel.orderByColumn = e.target.value as string}
                          fullWidth
                          disabled={viewModel.disabled}
                        >
                          <MenuItem value="">-
                          </MenuItem>
                          {viewModel.columns?.map((item) => {
                              return (
                                <MenuItem value={item}>
                                  {item}
                                </MenuItem>
                              );
                          })}
                        </Select><br/><br/>
                        <Select
                          value={viewModel.sortDirection}
                          label="Column"
                          onChange={(e) => viewModel.sortDirection = e.target.value as string}
                          fullWidth
                          disabled={viewModel.disabled}
                        >
                          <MenuItem value="Asc">
                            {t('dataset.queryTabAsc')}
                          </MenuItem>
                          <MenuItem value="Desc">
                            {t('dataset.queryTabDesc')}
                          </MenuItem>
                        </Select><br/><br/>
                        <Button
                          fullWidth
                          variant="contained"
                          color="primary"
                          onClick={() => viewModel.appendOrder()}
                          disabled={viewModel.disabled||viewModel.orderByColumn == ''}
                        >
                          {t('generic.append')}
                        </Button>
                      </Grid><br/>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.queryTabLimit')}:
                      </Typography>
                      <Grid item xs={12} style={{padding:20}}>
                        <TextField
                          fullWidth
                          value={viewModel.limit}
                          label="Limit"
                          type="number"
                          InputProps={{ inputProps: { min: 10, max: 1000 } }}
                          onChange={(e) => viewModel.changeLimit(e.target.value as string)}
                          disabled={viewModel.disabled}
                          required
                        />
                      </Grid>
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.queryTabQuery')}:
                      </Typography>
                      <TextField
                        value={viewModel.craftedQuery}
                        onChange={(e) => viewModel.craftedQuery = e.target.value as string}
                        variant="standard"
                        style={{width:"100%"}}
                      />
                    </Grid>
                  </Grid>:
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.queryTabQuery')}:
                      </Typography>
                      <TextField
                        label="Query"
                        multiline
                        rows={4}
                        value={viewModel.craftedQuery}
                        onChange={(e) => viewModel.craftedQuery = e.target.value as string}
                        variant="standard"
                        style={{width:"100%"}}
                      />
                    </Grid>
                  </Grid>
                }
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      onClick={() => {
                        setLoad(true);
                        viewModel.postQuery().then(()=> {
                          setLoad(false);
                        }).catch(error =>{
                          setLoad(false);
                        });
                      }}
                      disabled={viewModel.craftedQuery.length==0||load==true}
                    >
                      {t('generic.execute')}
                    </Button>
                  </Grid>
                </Grid>
              </Box>
            </CardContent>
            </Card>
          <Box><br/>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom component="div">
                {t("dataset.queryTabResult")}:
              </Typography>
              {viewModel.queryPreview==undefined?load==true?
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Skeleton variant="rectangular" height="250px"/>
                  </Grid>
                </Grid>:'':
                <TableContainer component={Paper} style={{position:"relative", overflowX:"auto", maxHeight:500}}>
                  <Table aria-label="collapsible table" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {viewModel.queryPreview.header.map((item) => (
                          <TableCell align="left">{item}</TableCell>
                        ))}
                        <TableCell align="right">
                          <IconButton onClick={()=> {
                            setWriteType("DEFAULT");
                            setIsPolymorph(false);
                            setOpenIngestionDialog(true);
                          }}><FileUploadIcon/></IconButton>
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                        {viewModel.queryPreview.body.map((item) => (
                          <TableRow>
                            {viewModel.queryPreview.header.map((element) => (
                              <TableCell align="left">{typeof item[element] === 'string'?item[element]:JSON.stringify(item[element])}</TableCell>
                            ))}
                            <TableCell align="right"></TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                }
              </Grid>
            </Grid>
          </Box>
          



          <Dialog open={openIngestionDialog} maxWidth="sm"
          fullWidth>
            <DialogTitle>{t("generic.add")}</DialogTitle>
            <DialogContent>
              <form onSubmit={(e) => {e.preventDefault();
                setIngestionLoad(true);
                viewModel.startIngestion(datasetTitle, isPolymorph, writeType).then(() => { 
                  setIngestionLoad(false);
                  setOpenIngestionDialog(false);
                  routingStore.history.push('/ingestion');
                }).catch(error =>{
                alert(error);
                setIngestionLoad(false);})
              }}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      onChange={(e) => setDatasetTitle(e.target.value as string)}
                      value={datasetTitle}
                      margin="dense"
                      label={t("ingestion.datasetTitle")}
                      fullWidth
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel id="demo-simple-select-label">{t('generic.writeFormat')}</InputLabel>
                      <Select
                        labelId="demo-simple-select-label"
                        id="demo-simple-select"
                        value={writeType}
                        label="Age"
                        required
                        onChange={(e)=>{
                          setWriteType(e.target.value as string);
                        }}
                      >
                        <MenuItem value="DEFAULT">DEFAULT</MenuItem>
                        <MenuItem value="DELTA">DELTA</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                  <FormControlLabel control={<Checkbox color='primary' checked={isPolymorph} onChange={()=>{
                    setIsPolymorph(!isPolymorph)}}/>} label={t("workflow.properties_dialog.export.polymorph") as string}/>
                  </Grid>
                </Grid>
                <DialogActions>
                  <Button variant="outlined" onClick={() => setOpenIngestionDialog(false)}>{t("generic.cancel")}</Button>
                  <Button variant="outlined" disabled={ingestionLoad} type='submit'>{t("generic.add")}</Button>
                </DialogActions>
              </form>
            </DialogContent>
          </Dialog>
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Query;
