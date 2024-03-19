import { Box, Button, Collapse, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton, MenuItem, Paper, Select, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography } from "@material-ui/core";
import { Skeleton, Stack } from "@mui/material";
import React from "react";
import ViewModel from "..";
import { IIngestion, IRevision } from "../../../../models/datasource";
import { IPreview } from "../../../../models/preview";
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import HistoryIcon from '@mui/icons-material/History';
import { t } from "i18next";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import EditIcon from '@mui/icons-material/Edit';

/**
* Component that represents the collapsable table row. 
*/
export const Row = (props: { item: IIngestion, revision: IRevision, viewModel: ViewModel})=> {
  const { item , viewModel, revision} = props;
  const [open, setOpen] = React.useState(false);
  const [deltas, setDeltas] = React.useState(null as IPreview);
  const [openDeltaDialog, setOpenDeltaDialog] = React.useState(false);
  const [version, setVersion] = React.useState(item.number==0?item.number:item.number-1);
  const [lastVersionForComparing, setLastVersionForComparing] = React.useState(undefined);
  const [editLoad, setEditLoad] = React.useState(false);
  const [edit, setEdit] = React.useState(false);
  const [continuationTimer, setContinuationTimer] = React.useState(JSON.stringify(revision?.continuation_timers , null));

  return (
    <React.Fragment>
      <TableRow>
        <TableCell align="left">
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="left">{item.revision}</TableCell>
        <TableCell align="left">{item.started}</TableCell>
        <TableCell align="left">{item.ended}</TableCell>
        <TableCell align="left">{item.state}</TableCell>
        <TableCell align="left">
          {item.state=='FINISHED'?<Box>
          <Stack direction="row" alignItems="center" gap={1}>
              <IconButton disabled={revision?.write_type!='DELTA'||viewModel?.dataset?.schema?.type=='UNSTRUCTURED'} onClick={ async () => {
                setOpenDeltaDialog(true);
                if(deltas==null){
                  setLastVersionForComparing(version.toString());
                  const d = await viewModel.getDeltas(item.revision.toString(), version.toString());
                  setDeltas(d);
                }else{
                  if(lastVersionForComparing!=version.toString()){
                    setDeltas(null as IPreview);
                    setLastVersionForComparing(version.toString());
                    const d = await viewModel.getDeltas(item.revision.toString(), version.toString());
                    setDeltas(d);
                  }
                }
                }}>{openDeltaDialog==true?<VisibilityOffIcon/>:<VisibilityIcon/>} 
              </IconButton>
              <Select
                onChange={(e) => {
                  setVersion(e.target.value as number);
                }}
                value={version}
                disabled={item.number==0||revision?.write_type!='DELTA'||viewModel?.dataset?.schema?.type=='UNSTRUCTURED'}
                label={t('generic.version')}
                fullWidth
                >
                {new Array(viewModel.dataset.datasource.currentRevision+1).fill("", 0, viewModel.dataset.datasource.currentRevision+1).map((row,index)=>{
                return(<MenuItem value={index}>
                  {t('generic.version') + ': ' + index.toString()}
                </MenuItem>)})}
              </Select>
            </Stack>
            <IconButton disabled={revision?.write_type!='DELTA'||viewModel?.dataset?.schema?.type=='UNSTRUCTURED'} onClick={() => alert(t("generic.toBeImplemented"))}><HistoryIcon/></IconButton>
          </Box>:''}
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0}} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: "20px" }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom component="div">
                    {t("dataset.historyTabDatasourceDefinition")}:
                  </Typography>
                  <Table aria-label="table">
                    <TableBody>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevision")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {revision?.number}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionName")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {revision?.name}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionReadType")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {revision?.read_type}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionReadFormat")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {revision?.read_format??'-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionReadOptions")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>{
                          JSON.stringify(revision?.read_options, null, "\t")
                        }
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionSparkPackages")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {
                            JSON.stringify(revision?.spark_packages, null, "\t")
                          }
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionWriteType")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {revision?.write_type}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionWriteFormat")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {revision?.write_format??'-'}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {t("dataset.historyTabRevisionWriteOptions")}:
                        </TableCell>
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          {JSON.stringify(revision?.write_options, null, "\t")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <Stack direction="row" alignItems="center" gap={1}>
                          <TableCell align="left" style={{borderBottom:"none"}}>
                            {t("dataset.historyTabRevisionContinuationTimers")}:
                          </TableCell>
                        </Stack>
                        {edit==false?<TableCell align="left" style={{borderBottom:"none"}}>
                          {JSON.stringify(revision?.continuation_timers , null, "\t")}
                          {revision.number==viewModel.dataset.datasource.currentRevision&&viewModel?.dataset?.schema?.type!="UNSTRUCTURED"&&(viewModel.dataset.isPublic==true||viewModel.dataset.permission.canWrite==true)?<EditIcon onClick={()=>{
                            setContinuationTimer(JSON.stringify(revision?.continuation_timers , null))
                            setEdit(true);
                          }}/>:''}
                        </TableCell>:
                        <TableCell align="left" style={{borderBottom:"none"}}>
                          <form onSubmit={(e) => {e.preventDefault();
                            setEditLoad(true);
                            continuationTimer==''?setContinuationTimer('[]'):continuationTimer;
                            try{
                              JSON.parse(continuationTimer)as string[]
                            }catch{
                              alert(t("dataset.historyTabRevisionContinuationTimersError") + ' ["timer1", "timer2"]')
                              setEditLoad(false);
                              return
                            }
                            viewModel.putContinuationTimer(JSON.parse(continuationTimer)as string[]).then(()=> {
                                revision.continuation_timers=JSON.parse(continuationTimer)as string[];
                                setEditLoad(false);
                                setEdit(false);  
                              }).catch(error =>{
                                alert(error);
                                setEditLoad(false);
                                setEdit(false);  
                              });
                            }}>
                              <Grid container spacing={2}>
                                <Grid item xs={12}>
                                  <TextField
                                  fullWidth
                                  value={continuationTimer}
                                  label={t("dataset.historyTabRevisionContinuationTimers")}
                                  onChange={(e) => setContinuationTimer(e.target.value)}
                                  />
                                </Grid>
                                <Grid item xs={6}>
                                  <Button
                                    fullWidth
                                    variant="contained"
                                    color="primary"
                                    disabled={editLoad}
                                    onClick={() => {
                                      setEdit(false)
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
                            </Grid>
                          </form>
                        </TableCell>
                        }
                      </TableRow>
                    </TableBody>
                  </Table>
                </Grid>
              </Grid>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>




      <Dialog open={openDeltaDialog} maxWidth="xl"
        fullWidth>
          <DialogTitle>{revision?.name + ' (Version '+ item?.number?.toString() +' - Version '+ version.toString() + ')'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                {deltas==null?
                <Skeleton variant="rectangular" height="250px"/>:
                <TableContainer component={Paper} style={{overflowX: 'auto', maxHeight:500}}>
                  <Table aria-label="table" stickyHeader>
                    <TableHead>
                      <TableRow>
                        {deltas.header.map((item) => (
                          item!='cd_deleted'?<TableCell align="left">{item}</TableCell>:''
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                        {deltas.body.map((item) => (
                            item['cd_deleted']==true?
                            <TableRow style={{backgroundColor:"red"}}>
                              {deltas.header.map((element) => (
                                element!='cd_deleted'?<TableCell align="left">{typeof item[element] === 'string'?item[element]:JSON.stringify(item[element])}</TableCell>:''
                              ))}
                            </TableRow>:
                            <TableRow>
                              {deltas.header.map((element) => (
                                element!='cd_deleted'?<TableCell align="left">{typeof item[element] === 'string'?item[element]:JSON.stringify(item[element])}</TableCell>:''
                              ))}
                            </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                } 
                </Grid>
              </Grid>
            <DialogActions>
              <Button onClick={() => {
                setOpenDeltaDialog(false);
              }}>{t("generic.close")}</Button>
            </DialogActions>
          </DialogContent>
        </Dialog>
    </React.Fragment>
  );
}