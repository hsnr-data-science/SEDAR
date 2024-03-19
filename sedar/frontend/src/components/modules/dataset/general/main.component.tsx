import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, IconButton, Link, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Tooltip, Typography} from "@material-ui/core";
import { CardHeader, Skeleton, Stack} from "@mui/material";
import IViewProps from "../../../../models/iViewProps";
import MDEditor from "@uiw/react-md-editor";
import routingStore from "../../../../stores/routing.store";
import workspacesStore from "../../../../stores/workspaces.store";
import AutocompleteComponent from "../../../common/autocomplete";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import EditIcon from '@mui/icons-material/Edit';
import { Columns } from "./columns";
import searchStore from "../../../../stores/search.store";
import { DatasetCard } from "../../search/card/card";
import { LocalizationProvider, DesktopDatePicker } from "@mui/lab";
import { TextField as TF} from '@mui/material';
import AdapterDateFns from "@mui/lab/AdapterDateFns";
import { format } from "date-fns";
import SearchbarComponent from "../../../common/searchbar/main.component";
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import InfoIcon from '@mui/icons-material/Info';
import { Logs } from "./logs";
import MapIcon from '@mui/icons-material/Map';
import DownloadIcon from '@mui/icons-material/Download';

/**
* Component that represents the general tab.
*/
const General: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t, i18n} = useTranslation();
  
  const [editLoad, setEditLoad] = React.useState(false);
  const [previewLoad, setPreviewLoad] = React.useState(false);
  const [openAddTagDialog, setOpenAddTagDialog] = React.useState(false);
  const [openDeleteTagDialog, setOpenDeleteTagDialog] = React.useState(false);
  const [openDeleteLinkDialog, setOpenDeleteLinkDialog] = React.useState(false);
  const [deleteLoad, setDeleteLoad] = React.useState(false);
  const [tagToDelete, setTagToDelete] = React.useState('');
  const [editDescription, setEditDescription] = React.useState(false);
  const [description, setDescription] = React.useState(''); 
  const [author, setAuthor] = React.useState(''); 
  const [title, setTitle] = React.useState(''); 
  const [editTitle, setEditTitle] = React.useState(false);
  const [editLicense, setEditLicense] = React.useState(false);
  const [license, setLicense] = React.useState('');
  const [latitude, setLatitude] = React.useState('');
  const [longitude, setLongitude] = React.useState('');
  const [rangeStart, setRangeStart] = React.useState(new Date());
  const [rangeEnd, setRangeEnd] = React.useState(new Date());
  const [language, setLanguage] = React.useState('');
  const [openAddRecommendationsDialog, setOpenAddRecommendationsDialog] = React.useState(false);
  const [recommendationDescription, setRecommendationDescription] = React.useState('');
  const [idOfRecommendationDataset, setIdOfRecommendationDataset] = React.useState('');
  const [openEditRecommendationsDialog, setOpenEditRecommendationsDialog] = React.useState(false);
  const [linkToDelete, setLinkToDelete] = React.useState('');

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
      <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("dataset.generalTab")}
              </Typography>
              {/* <Typography variant="subtitle1">
                {t("dataset.generalTabDescription")}
              </Typography> */}
              <hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
       {
          viewModel.dataset==undefined?
          <Grid container spacing={2}>
            <Grid item xs={8}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Skeleton variant="text"/> <Skeleton variant="text"/> <Skeleton variant="text"/>
                </Grid>
                <Grid item xs={6}>
                  <Skeleton variant="text"/> <Skeleton variant="text"/> <Skeleton variant="text"/>
                </Grid>
              </Grid>
              <br/><br/>
              <Skeleton variant="rectangular" height="200px"/>
              <br/><br/>
              <Skeleton variant="rectangular" height="200px"/>
              <br/><br/>
              <Skeleton variant="rectangular" height="200px"/>
            </Grid>
            <Grid item xs={4}>
              <Skeleton variant="rectangular" height="400px"/>
              <br/>
              <Skeleton variant="rectangular" height="400px"/>
            </Grid>
          </Grid>:
          <Grid container spacing={2}>
            <Grid item xs={8} style={{paddingRight:40}}>
              <Stack direction="row" alignItems="center" gap={1} style={{marginBottom:20}}>
                <Typography variant="h6" gutterBottom component="div">
                {viewModel.dataset.title + ' (Version '+viewModel.dataset.datasource.currentRevision+')'}
                </Typography>
                <br/>
                {
                  viewModel.dataset.longitude!=undefined&&viewModel.dataset.longitude!=''&&viewModel.dataset.latitude!=undefined&&viewModel.dataset.latitude!=''?
                  <a href={"http://maps.google.com/maps?q="+viewModel.dataset.latitude+","+viewModel.dataset.longitude} target="_blank" style={{ color:"inherit", textDecoration:"none"}}><MapIcon/></a>:''
                }
              </Stack>
              <Grid container spacing={2}>
                <Grid item xs={12} style={{padding:"0px"}}>
                  <form onSubmit={(e) => {e.preventDefault();
                    setEditLoad(true);
                    viewModel.putDataset(undefined, title, author, undefined, language, latitude, longitude, rangeStart, rangeEnd).then(()=> {
                        setEditLoad(false);
                        setEditTitle(false);
                      }).catch(error =>{
                        alert(error);
                        setEditLoad(false);
                      })
                    ;}}>
                    <Grid container onClick={()=>{
                      if(editTitle==false&&(viewModel.dataset.isPublic==true||(viewModel.dataset.isPublic==false&&viewModel.dataset.permission.canWrite==true))){
                        setEditTitle(true);
                        setTitle(viewModel.dataset.title);
                        setAuthor(viewModel.dataset.author);
                        setLanguage(viewModel.dataset.language);
                        setLongitude(viewModel.dataset.longitude);
                        setLatitude(viewModel.dataset.latitude);
                        setRangeStart(viewModel.dataset.rangeStart);
                        setRangeEnd(viewModel.dataset.rangeEnd);
                      }
                    }}>
                      {editTitle==true?
                      <Grid item xs={12} style={{paddingLeft:20}}>
                        <TextField
                          fullWidth
                          label={t("dataset.generalTabTitle")}
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                        />
                      </Grid>:''}
                      <Grid item xs={6} style={{paddingLeft:20}}>
                        {t("dataset.generalTabCreatedOn")}: {viewModel.dataset.createdOn}
                      </Grid>
                      <Grid item xs={6}>
                          {t("dataset.generalTabLastUpdatedOn")}: {viewModel.dataset.lastUpdatedOn} 
                      </Grid>
                      <Grid item xs={6} style={{paddingLeft:20}}>
                        {t("dataset.generalTabOwner")}: <Link color="inherit" onClick={()=>{
                            searchStore.clearFilter();
                            searchStore.searchQuery='';
                            searchStore.selectedOwner=viewModel.dataset.owner.email;
                            searchStore.getDatasets();
                            routingStore.history.push('/search');
                          }}>{viewModel.dataset.owner.firstname + ' ' + viewModel.dataset.owner.lastname} </Link> 
                      </Grid>
                      <Grid item xs={6}>
                        {editTitle==false?(t("dataset.generalTabAuthors")+': '):''}
                        {editTitle==true?<TextField
                        fullWidth
                        value={author}
                        label={t("dataset.generalTabAuthors")}
                        onChange={(e) => setAuthor(e.target.value)}
                        />:(viewModel.dataset.author!=undefined&&viewModel.dataset.author!=''?viewModel.dataset.author:(viewModel.dataset.owner.firstname + ' ' + viewModel.dataset.owner.lastname))} 
                      </Grid>
                      <Grid item xs={6} style={{paddingLeft:20}}>
                        {t("dataset.generalTabSchemaType")}: <Link color="inherit" onClick={()=>{
                          searchStore.clearFilter();
                          searchStore.searchQuery='';
                          searchStore.selectedSchema=viewModel?.dataset?.schema?.type;
                          searchStore.getDatasets();
                          routingStore.history.push('/search');
                        }}>{t('generic.'+viewModel?.dataset?.schema?.type)}</Link>
                      </Grid>
                      <Grid item xs={6}>
                        {t("dataset.generalTabWriteType")}: {viewModel?.dataset?.datasource?.revisions?.find((r)=>r.number==viewModel.dataset.datasource.currentRevision)?.write_type}
                      </Grid>
                      <Grid item xs={12} style={{paddingLeft:20}}>
                        {editTitle==false?(t("dataset.generalTabLanguage")+': '):''}
                        {editTitle==true?<TextField
                        fullWidth
                        label={t("dataset.generalTabLanguage")}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        />:(viewModel.dataset.language!=undefined?viewModel.dataset.language:('-'))}
                      </Grid>
                      <Grid item xs={5} style={{paddingLeft:20}}>
                        {editTitle==false?(t("dataset.generalTabLatitude")+': '):''}
                        {editTitle==true?<TextField
                        fullWidth
                        value={latitude}
                        label={t("dataset.generalTabLatitude")}
                        onChange={(e) => setLatitude(e.target.value)}
                        />:(viewModel.dataset.latitude!=undefined&&viewModel.dataset.latitude!=''?viewModel.dataset.latitude:('-'))} 
                      </Grid>
                      <Grid item xs={1}></Grid>
                      <Grid item xs={6}>
                        {editTitle==false?(t("dataset.generalTabLongitude")+': '):''}
                        {editTitle==true?<TextField
                        fullWidth
                        value={longitude}
                        label={t("dataset.generalTabLongitude")}
                        onChange={(e) => setLongitude(e.target.value)}
                        />:(viewModel.dataset.longitude!=undefined&&viewModel.dataset.longitude!=''?viewModel.dataset.longitude:('-'))} 
                      </Grid>
                      <Grid item xs={6} style={{paddingLeft:20}}>
                        {editTitle==false?(t("dataset.generalTabRangeStart")+': '):''}
                        {editTitle==true?<Box style={{paddingTop:10, paddingRight:10, paddingBottom:10}}><LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DesktopDatePicker
                          inputFormat="dd.MM.yyyy"
                          value={rangeStart}
                          onChange={(v)=>setRangeStart(v)}
                          label={t("dataset.generalTabRangeStart")}
                          renderInput={(params) => <TF fullWidth {...params} />}
                        /></LocalizationProvider></Box>:(viewModel.dataset.rangeStart!=undefined?format(new Date(viewModel.dataset.rangeStart), 'dd.MM.yyyy'):('-'))} 
                      </Grid>
                      <Grid item xs={6}>
                        {editTitle==false?(t("dataset.generalTabRangeEnd")+': '):''}
                        {editTitle==true?<Box style={{paddingTop:10, paddingBottom:10}}><LocalizationProvider dateAdapter={AdapterDateFns}>
                          <DesktopDatePicker
                          inputFormat="dd.MM.yyyy"
                          value={rangeEnd}
                          onChange={(v)=>setRangeEnd(v)}
                          label={t("dataset.generalTabRangeEnd")}
                          renderInput={(params) => <TF fullWidth {...params} />}
                        /></LocalizationProvider></Box>:(viewModel.dataset.rangeEnd!=undefined?format(new Date(viewModel.dataset.rangeEnd), 'dd.MM.yyyy'):('-'))} 
                      </Grid>
                      </Grid>
                      {editTitle==true?
                        <Grid container spacing={2}>
                          <Grid item xs={6}>
                            <Button
                              fullWidth
                              variant="contained"
                              color="primary"
                              disabled={editLoad}
                              onClick={() => {
                                setEditTitle(false)
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
                    </form>
                  </Grid>
                  <Grid item xs={6} style={{paddingLeft:20}}>
                    <Typography variant="subtitle1">
                      {t("dataset.generalTabTags")}: 
                    </Typography>
                    {
                      viewModel.dataset.tags.map((tag) => {
                        return (
                          <Tooltip title={tag.annotation.ontology.title+': '+tag.annotation.instance}>
                            <Chip label={tag.title} style={{margin:"10px"}} onClick={()=>{
                              searchStore.clearFilter();
                              searchStore.searchQuery='';
                              searchStore.selectedTags.push(tag);
                              searchStore.getDatasets();
                              routingStore.history.push('/search');
                            }} 
                            onDelete={()=>{
                              if(viewModel.dataset.tags.length>1&&(viewModel.dataset.isPublic==true||(viewModel.dataset.isPublic==false&&viewModel.dataset.permission.canDelete==true))){
                                setOpenDeleteTagDialog(true);
                                setTagToDelete(tag.id);
                              }
                            }}/>
                          </Tooltip>
                        );
                      })
                    }
                    <IconButton onClick={() => {
                      if(viewModel.dataset.isPublic==true||(viewModel.dataset.isPublic==false&&viewModel.dataset.permission.canWrite==true)){
                        viewModel.tagOntologyProperty = undefined;
                        viewModel.tag.title = '';
                        setOpenAddTagDialog(true)
                      }
                    }}><AddCircleIcon/></IconButton>
                  </Grid>
                <Grid item xs={6} style={{paddingLeft:"0px"}}>
                  <Typography variant="subtitle1">
                    {t("dataset.generalTabPolymorph")}: 
                  </Typography>
                  {
                    viewModel?.dataset?.polymorph?.map((item) => {
                      return (
                        <Chip label={item.title} style={{margin:"10px"}} onClick={() => routingStore.history.push("/dataset/"+item.id)}/>
                      );
                    })
                  }
                </Grid>
              </Grid><br/><br/>
              <Box style={{position:'relative'}}>
                <Box style={{position:'absolute', right:0, top:0}}>
                  {viewModel?.dataset?.isPublic==true?<IconButton onClick={()=>{
                    setEditDescription(true);
                    setDescription(viewModel.dataset.description);
                  }}><EditIcon/></IconButton>:(viewModel?.dataset?.permission?.canWrite==true?<IconButton onClick={()=>{
                    setEditDescription(true);
                    setDescription(viewModel.dataset.description);
                  }}><EditIcon/></IconButton>:'')}
                </Box>
                {editDescription==true?
                <form onSubmit={(e) => {e.preventDefault();
                  setEditLoad(true);
                  viewModel.putDataset(description).then(()=> {
                      setEditLoad(false);
                      viewModel.dataset.description = description;
                      setEditDescription(false);
                    }).catch(error =>{
                      alert(error);
                      setEditLoad(false);
                    })
                  ;}}>
                  <MDEditor
                    value={description}
                    onChange={(v) => setDescription(v)}
                  /><br/>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={editLoad}
                        onClick={() => {
                          setEditDescription(false)
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
                </form>:
                  <MDEditor.Markdown source={viewModel.dataset.description==undefined?('# '+t("dataset.generalTabReadme")):viewModel.dataset.description!=''?viewModel.dataset.description:('# '+t("dataset.generalTabReadme"))}/>
                }
              </Box><br/><br/>
              <Box style={{position:'relative'}}>
                <Box style={{position:'absolute', right:0, top:0}}>
                  {viewModel?.dataset?.isPublic==true?<IconButton onClick={()=>{
                    setEditLicense(true);
                    setLicense(viewModel.dataset.license);
                  }}><EditIcon/></IconButton>:(viewModel?.dataset?.permission?.canWrite==true?<IconButton onClick={()=>{
                    setEditLicense(true);
                    setLicense(viewModel.dataset.license);
                  }}><EditIcon/></IconButton>:'')}
                </Box>
                {editLicense==true?
                <form onSubmit={(e) => {e.preventDefault();
                  setEditLoad(true);
                  viewModel.putDataset(undefined, undefined,undefined, license).then(()=> {
                      setEditLoad(false);
                      viewModel.dataset.license = license;
                      setEditLicense(false);
                    }).catch(error =>{
                      alert(error);
                      setEditLoad(false);
                    })
                  ;}}>
                  <MDEditor
                    value={license}
                    onChange={(v) => setLicense(v)}
                  /><br/>
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <Button
                        fullWidth
                        variant="contained"
                        color="primary"
                        disabled={editLoad}
                        onClick={() => {
                          setEditLicense(false)
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
                </form>:
                  <MDEditor.Markdown source={viewModel.dataset.license==undefined?('# '+t("dataset.generalTabLicense")):(viewModel.dataset.license!=''?viewModel.dataset.license:('# '+t("dataset.generalTabLicense")))}/>
                }
              </Box><br/><br/>
              {viewModel?.dataset?.schema?.type!='UNSTRUCTURED'?
                <Box>
                  <Typography variant="h6" gutterBottom component="div">
                    {t("dataset.generalTabPreview")}:
                  </Typography>
                  {viewModel.generalPreview==undefined?
                  <Grid container spacing={2}>
                    <Grid item xs={12} style={{width:'100%', height:'250px', position:'relative'}}>
                      <Skeleton variant="rectangular" height="250px"/>
                      <Button variant="contained" disabled={previewLoad} style={{position:'absolute', top:'50%', right:'35%', left:'35%'}} color="primary" onClick={async ()=>{
                        setPreviewLoad(true);
                        await viewModel.getSourcedata();
                        setPreviewLoad(false);
                        }}>{t("dataset.generalTabLoadPreview")}</Button>
                    </Grid>
                  </Grid>:
                  <TableContainer component={Paper} style={{ maxHeight: 500 }}>
                    <Table aria-label="collapsible table" stickyHeader>
                      <TableHead>
                        <TableRow>
                          {viewModel?.generalPreview?.header?.map((item) => (
                            <TableCell align="left">{item}</TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                          {viewModel?.generalPreview?.body?.map((item) => (
                            <TableRow>
                              {viewModel?.generalPreview?.header?.map((element) => (
                                <TableCell align="left">{typeof item[element] === 'string'?item[element]:JSON.stringify(item[element])}</TableCell>
                              ))}
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </TableContainer>}
                </Box>
              :''}<br/><br/>
              <Grid container spacing={2}>
                  <Grid item xs={12} style={{position:"relative"}}>
                    <Box style={{position:'absolute', right:0, top:0}}>
                      {viewModel?.dataset?.isPublic==true?<IconButton onClick={()=>{
                        setOpenAddRecommendationsDialog(true);
                        setRecommendationDescription('');
                      }}><EditIcon/></IconButton>:(viewModel?.dataset?.permission?.canWrite==true?<IconButton onClick={()=>{
                        setOpenAddRecommendationsDialog(true);
                        setRecommendationDescription('');
                      }}><EditIcon/></IconButton>:'')}
                    </Box>
                    <Typography variant="h6" gutterBottom component="div">
                      {t("dataset.generalTabRecommendations")}:
                    </Typography>
                    {viewModel?.recommendations?.map((d)=>{
                      return(
                        <Box style={{position:"relative"}}>
                          <DatasetCard item={d} isWorkflow={false} isVisualizationView={false} isRecommendation={false}/>
                          <Box style={{position:"absolute", right:10, top:10}}>
                            <Stack direction="row" alignItems="center" gap={0}>
                              <InfoIcon/> {d.customLinkDescription==undefined?t("generic.autoLinkedFK"):(d.customLinkDescription=='_LINEAGE_'?t("generic.autoLinkedLineage"):d.customLinkDescription)}
                              {(viewModel.dataset.permission==undefined||viewModel.dataset.permission.canWrite==true)&&d.customLinkDescription!=undefined&&d.customLinkDescription!='_LINEAGE_'?
                              <IconButton style={{padding:0}} disabled={editLoad} onClick={()=>{
                                setIdOfRecommendationDataset(d.id);
                                setRecommendationDescription(d.customLinkDescription);
                                setOpenEditRecommendationsDialog(true);
                              }}><EditIcon/></IconButton>:''}
                              {(viewModel.dataset.permission==undefined||viewModel.dataset.permission.canDelete==true)&&d.customLinkDescription!=undefined&&d.customLinkDescription!='_LINEAGE_'?
                              <IconButton style={{padding:0}} disabled={editLoad} onClick={()=>{
                                if(viewModel.dataset.permission?.canDelete==true||viewModel.dataset.permission==undefined){
                                  setLinkToDelete(d.id);
                                  setOpenDeleteLinkDialog(true);
                                }
                              }}><RemoveCircleOutlineIcon/></IconButton>:''}
                            </Stack>
                          </Box>
                        </Box>
                      )
                    })}
                </Grid>
              </Grid>
            </Grid>
            <Grid item xs={4} style={{ borderColor:"inherit", borderLeft: '0.1em solid', padding: '0.5em' }}>
                <Box style={{maxHeight:"50vh", overflowY:'hidden', overflowX:'hidden'}}>
                  <Typography variant="h6" gutterBottom component="div">
                    {t("dataset.generalTabStats")}:
                  </Typography>
                  <Box style={{maxHeight:"50vh", overflowY:'hidden', overflowX:'hidden'}}>
                    {
                      viewModel.dataset?.schema==undefined?
                      <Grid container spacing={2} style={{padding:20}}>
                        <Grid item xs={12}>
                          <Skeleton variant="rectangular" height="100px"/>
                        </Grid>
                      </Grid>:
                      <Grid container spacing={2} style={{padding:20}}>
                        <Grid item xs={12}>
                          <Table>
                            {viewModel?.dataset?.schema?.type=="UNSTRUCTURED"?
                              <React.Fragment>
                                <TableRow>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {t("dataset.generalTabStatsFiles")}:
                                  </TableCell>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {String(viewModel?.dataset?.schema?.files!=undefined?viewModel.dataset.schema.files.length:'-')}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {t("dataset.generalTabStatsFilesSize")}:
                                  </TableCell>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {String(viewModel?.dataset?.schema?.files!=undefined?(viewModel.sizeOfFiles+' Byte'):'-')}
                                  </TableCell>
                                </TableRow>
                              </React.Fragment>:
                              <React.Fragment>
                                <TableRow>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {t("dataset.generalTabStatsEntities")}:
                                  </TableCell>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {String(viewModel?.dataset?.schema?.entities!=undefined?viewModel.dataset.schema.entities.length:'-')}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {t("dataset.generalTabStatsColumns")}:
                                  </TableCell>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {String(viewModel?.columns.length!=0?viewModel?.columns.length:'-')}
                                  </TableCell>
                                </TableRow>
                                <TableRow>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {t("dataset.generalTabStatsRows")}:
                                  </TableCell>
                                  <TableCell align="left" style={{borderBottom:"none"}}>
                                    {String(viewModel?.dataset?.schema?.entities!=undefined?viewModel.dataset.schema.entities[0].countOfRows:'-')}
                                  </TableCell>
                                </TableRow>
                              </React.Fragment>
                            }
                          </Table>
                        </Grid>
                      </Grid>
                    }
                  </Box><br/>
                </Box>
                {
                viewModel?.dataset?.schema?.type!="UNSTRUCTURED"?
                <Box>
                  <Typography variant="h6" gutterBottom component="div">
                  {t("dataset.generalTabColumns")}:
                  </Typography>
                  <Box style={{maxHeight:"50vh", overflowY:'auto', overflowX:'hidden'}}>
                    {
                      viewModel.dataset?.schema?.entities==undefined?
                      <Grid container spacing={2} style={{padding:20}}>
                        <Grid item xs={12}>
                          <Skeleton variant="rectangular" height="50px"/>
                        </Grid>
                        <Grid item xs={12}>
                          <Skeleton variant="rectangular" height="50px"/>
                        </Grid>
                        <Grid item xs={12}>
                          <Skeleton variant="rectangular" height="50px"/>
                        </Grid>
                        <Grid item xs={12}>
                          <Skeleton variant="rectangular" height="50px"/>
                        </Grid>
                      </Grid>:
                      viewModel.dataset?.schema?.entities?.map((entities) => {
                        return (entities?.attributes?.map((item) => (
                          <Columns attribute={item} prefix={''} viewModel={viewModel}/>
                        )
                        ));
                      })
                    }
                  </Box><br/>
                </Box>:''
              }
              <Stack direction="row" alignItems="center" gap={1}> 
                <Typography variant="h6" gutterBottom component="div">
                  {t("dataset.generalTabLogs")}:
                </Typography>
                <IconButton onClick={() => viewModel.downloadLogs(i18n.language.split('-')[0])}><DownloadIcon/></IconButton>
              </Stack>
              <Box style={{maxHeight:"50vh", overflowY:'auto'}}>
                {
                  viewModel?.logs?.length==0?
                  <Grid container spacing={2} style={{padding:20}}>
                    <Grid item xs={12}>
                      <Skeleton variant="rectangular" height="50px"/>
                    </Grid>
                    <Grid item xs={12}>
                      <Skeleton variant="rectangular" height="50px"/>
                    </Grid>
                    <Grid item xs={12}>
                      <Skeleton variant="rectangular" height="50px"/>
                    </Grid>
                    <Grid item xs={12}>
                      <Skeleton variant="rectangular" height="50px"/>
                    </Grid>
                  </Grid>:
                  viewModel.logs?.map((item) => {
                    return (
                      <Logs log={item}/>
                    );
                  })
                }
              </Box>
            </Grid>
          </Grid>
        }




        <Dialog open={openAddTagDialog} maxWidth="sm"
            fullWidth>
          <DialogTitle>{t("generic.add")}</DialogTitle>
          <DialogContent>
            <DialogContentText>{t("generic.addMessage")}</DialogContentText>
            <form onSubmit={(e) => {e.preventDefault();
            setEditLoad(true);
            viewModel.postTag().then(()=> {
                setEditLoad(false);
                setOpenAddTagDialog(false);
                }).catch(error =>{
                alert(error);
                setEditLoad(false);
                })
            ;}}><br/>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                autoFocus
                onChange={(e) => viewModel.tag.title=e.target.value as string}
                value={viewModel.tag.title}
                margin="dense"
                label="Title"
                fullWidth
                required
                />
              </Grid>
              <Grid item xs={12}>
                <AutocompleteComponent
                  value={viewModel.tagOntologyProperty}
                  onChange={(value) =>
                    viewModel.setTagOntologyProperty(value)
                  }
                  title={t("annotation.ontology_property")}
                  queryUrl={(term: string) =>
                    process.env.MAIN_BACKEND_URL+'/api/v'+process.env.MAIN_BACKEND_API_VERSION+`/workspaces/${workspacesStore.currentWorkspace?.id}/ontologies/completion?search_term=${term}`
                  }
                />
              </Grid>
            </Grid> 
            <DialogActions>
                <Button variant="outlined" onClick={() => {
                  setOpenAddTagDialog(false)
                }}>{t("generic.cancel")}</Button>
                <Button variant="outlined" disabled={editLoad||viewModel.tagOntologyProperty==undefined} type="submit">{t("generic.save")}</Button>
            </DialogActions>
            </form>   
            </DialogContent>
          </Dialog>




          <Dialog open={openDeleteTagDialog} maxWidth="sm"
            fullWidth>
            <DialogTitle>{t("generic.delete")}</DialogTitle>
            <DialogContent>
                <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setOpenDeleteTagDialog(false)}>{t("generic.cancel")}</Button>
                    <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                        setDeleteLoad(true);
                        viewModel.deleteTag(tagToDelete).then(() => { setDeleteLoad(false), setOpenDeleteTagDialog(false);}).catch(error =>{
                        alert(error);
                        setDeleteLoad(false);
                        })
                    }}>{t("generic.delete")}</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>




        <Dialog open={openDeleteLinkDialog} maxWidth="sm"
            fullWidth>
            <DialogTitle>{t("generic.delete")}</DialogTitle>
            <DialogContent>
                <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
                <DialogActions>
                    <Button variant="outlined" onClick={() => setOpenDeleteLinkDialog(false)}>{t("generic.cancel")}</Button>
                    <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
                        setDeleteLoad(true);
                        viewModel.deleteRecommendation(linkToDelete).then(()=> {
                          setDeleteLoad(false);
                          setOpenDeleteLinkDialog(false);
                        }).catch(error =>{
                        alert(error);
                        setDeleteLoad(false);
                        })
                    }}>{t("generic.delete")}</Button>
                </DialogActions>
            </DialogContent>
        </Dialog>





      <Dialog open={openEditRecommendationsDialog} maxWidth="xs"
          fullWidth>
        <DialogTitle>{t("generic.edit")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("generic.editMessage")}</DialogContentText>
          <form onSubmit={(e) => {e.preventDefault();
          setEditLoad(true);
          viewModel.putRecommendation(idOfRecommendationDataset, recommendationDescription).then(()=> {
              setEditLoad(false);
              setOpenEditRecommendationsDialog(false);
              }).catch(error =>{
              alert(error);
              setEditLoad(false);
              })
          ;}}><br/>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
              autoFocus
              onChange={(e) => setRecommendationDescription(e.target.value as string)}
              value={recommendationDescription}
              margin="dense"
              label={t("dataset.generalTabRecommendationsDescription")}
              fullWidth
              required
              />
            </Grid>
          </Grid> 
          <DialogActions>
              <Button variant="outlined" onClick={() => {setOpenEditRecommendationsDialog(false)
              }}>{t("generic.cancel")}</Button>
              <Button variant="outlined" type="submit" disabled={editLoad}>{t("generic.save")}</Button>
          </DialogActions>
          </form>   
          </DialogContent>
        </Dialog>




        <Dialog open={openAddRecommendationsDialog} maxWidth="md"
            fullWidth>
          <DialogTitle>{t("generic.add")}</DialogTitle>
          <DialogContent>
            <DialogContentText>{t("generic.addMessage")}</DialogContentText>
            <form onSubmit={(e) => {e.preventDefault();
            setEditLoad(true);
            viewModel.postRecommendation(idOfRecommendationDataset, recommendationDescription).then(()=> {
                setEditLoad(false);
                setOpenAddRecommendationsDialog(false);
                }).catch(error =>{
                alert(error);
                setEditLoad(false);
                })
            ;}}><br/>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Stack direction="row" alignItems="center" gap={1}>
                  <Box style={{minWidth: '500px'}}>
                    <SearchbarComponent isWorkflow={false} isExtendedView={false} isVisualizationView={false} isRecommendation={true}/>
                  </Box>
                  <Button disabled={searchStore?.idOfSelectedDataset==viewModel?.dataset?.id||searchStore?.idOfSelectedDataset==undefined} variant="contained" color="primary" fullWidth onClick={()=>{
                    setIdOfRecommendationDataset(searchStore.idOfSelectedDataset);
                  }}>{t("generic.select")}</Button>
                </Stack>
              </Grid>
              <Grid item xs={12}>
                <TextField
                autoFocus
                onChange={(e) => setRecommendationDescription(e.target.value as string)}
                value={recommendationDescription}
                margin="dense"
                label={t("dataset.generalTabRecommendationsDescription")}
                fullWidth
                required
                />
              </Grid>
            </Grid> 
            <DialogActions>
                <Button variant="outlined" onClick={() => {setOpenAddRecommendationsDialog(false)
                }}>{t("generic.cancel")}</Button>
                <Button variant="outlined" disabled={editLoad==false?(idOfRecommendationDataset==''||idOfRecommendationDataset==viewModel?.dataset?.id||viewModel.recommendations.find((d)=>d.id==idOfRecommendationDataset)!=undefined):true} type="submit">{t("generic.save")}</Button>
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


export default General;
