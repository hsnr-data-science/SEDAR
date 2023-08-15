import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Dialog, DialogActions, DialogContent, DialogTitle, FormControlLabel, Grid, Switch, Typography} from "@material-ui/core";
import { CardHeader, Skeleton } from "@mui/material";
import IViewProps from "../../../../models/iViewProps";
import routingStore from "../../../../stores/routing.store";
import { NeoGraph } from "../../../common/neograph/NeoGraph";
import Tree from 'react-d3-tree';
import "./style.css";
import Workflow from "../../workflow/main.component";
import {default as vM} from "../../workflow";

/**
* Component that represents the lineage tab.
*/
const Lineage: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();
  
  const [id, setId] = React.useState('');
  const [name, setName] = React.useState('');
  const [script, setScript] = React.useState('');
  const [code, setCode] = React.useState('');
  const [version, setVersion] = React.useState('');
  const [isWorkflow, setIsWorkflow] = React.useState(false);
  const [openInfoDialog, setOpenInfoDialog] = React.useState(false);
  const [orientation, setOrientation] = React.useState(true);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
      <CardHeader title={
          <Box>
            <Typography variant="h6" gutterBottom component="div">
              {t("dataset.lineageTab")}
            </Typography>
            {/* <Typography variant="subtitle1">
              {t("dataset.lineageTabDescription")}
            </Typography> */}
            <hr/>
          </Box>
        }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
          {
            viewModel.lineage==undefined?
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Skeleton variant="rectangular" height="400px"/>
              </Grid>
            </Grid>:
            <div id="treeWrapper" style={{ width: '100%', height: '50vh' }}>
              <FormControlLabel
                style={{position:'absolute', top:'1rem', right:'1rem'}}
                control={
                  <Switch color="primary" checked={orientation} onChange={() => setOrientation(!orientation)} name="horizontal" />
                }
                label="Horizontal"
              />
              <Tree pathFunc={'step'} orientation={orientation==true?"horizontal":"vertical"} collapsible={false} data={viewModel.lineage} nodeSize={{ x:250, y: 250 }} separation={{ siblings:1, nonSiblings: 1 }} translate={{ x:200, y: 200 }} rootNodeClassName={'root-node'} onNodeClick={(e) => {
                setId(e.data.attributes['id'] as string);
                setName(e.data.attributes['name']==undefined?'':e.data.attributes['name'] as string);
                setScript(e.data.attributes['script']==undefined?'':e.data.attributes['script'] as string);
                setCode(e.data.attributes['code']==undefined?'':e.data.attributes['code'] as string);
                setIsWorkflow(e.data.attributes['isWorkflow']==undefined?false:(e.data.attributes['isWorkflow'] as boolean));
                setVersion(e.data.attributes['version']==undefined?'':e.data.attributes['version'] as string)
                setOpenInfoDialog(true);
              }}/>
            </div>
          }
        <Dialog open={openInfoDialog} maxWidth="md" fullWidth>
          <DialogTitle>{name}</DialogTitle>
          <DialogContent>
              <Grid container spacing={2} style={{padding:20}}>
                {
                  script==''?'':
                  <Grid container spacing={2} style={{padding:20}}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.lineageTabSQL')}:
                      </Typography>
                    </Grid>
                    <Grid item xs={12} style={{paddingLeft:20}}>{script}</Grid>
                  </Grid>
                }
                {viewModel.dataset.schema.type!='UNSTRUCTURED'?viewModel.dataset.id==id?'':
                  <Grid container spacing={2} style={{padding:20}}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom component="div">
                        {t('dataset.lineageTabSchemaComparsion')}:
                      </Typography>
                    </Grid>
                    <Grid item xs={6} style={{paddingLeft:20}}>
                      <Typography variant="subtitle1">
                        {t('dataset.lineageTabTargetSchema')}:
                      </Typography>
                      <NeoGraph
                        containerId={"sourceSchema"}
                        neo4jUri={`${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST_FRONTEND}:${process.env.NEO4J_PORT}`}
                        neo4jUser={`${process.env.NEO4J_USERNAME}`}
                        neo4jPassword={`${process.env.NEO4J_PASSWORD}`}
                        initialCypher={"MATCH path = ((p:Entity {uid: '"+viewModel.dataset.schema.entities[0].id+"'})-[r:HAS_ATTRIBUTE*1..10000]->(k:Attribute)) WHERE ALL( x IN relationships(path) WHERE x.version="+viewModel.dataset.datasource.currentRevision.toString()+") RETURN path"}
                      />
                    </Grid>
                    <Grid item xs={6} style={{paddingLeft:20}}>
                      <Typography variant="subtitle1">
                        {t('dataset.lineageTabSourceSchema')}:
                      </Typography>
                      <NeoGraph
                        containerId={"targetSchema"}
                        neo4jUri={`${process.env.NEO4J_PROTOCOL}://${process.env.NEO4J_HOST_FRONTEND}:${process.env.NEO4J_PORT}`}
                        neo4jUser={`${process.env.NEO4J_USERNAME}`}
                        neo4jPassword={`${process.env.NEO4J_PASSWORD}`}
                        initialCypher={"MATCH path = ((:Dataset{uid:'"+id+"'})-[HAS_SCHEMA{version:"+version.toString()+"}]-(Schema)-[HAS_ENTITY {version:"+version.toString()+"}]->(p:Entity)-[r:HAS_ATTRIBUTE*1..10000]->(k:Attribute)) WHERE ALL( x IN relationships(path) WHERE x.version="+version.toString()+") RETURN path"}
                      />
                    </Grid>
                  </Grid>:''
                }
                {
                  isWorkflow==false?'':
                  <Grid container spacing={2} style={{padding:20}}>
                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom component="div">
                      {t('dataset.lineageTabWorkflow')}:
                      </Typography>
                    </Grid>
                    <Grid item xs={12} style={{paddingLeft:20}}>
                      <Workflow viewModel={new vM(true, JSON.parse(code))}/>
                    </Grid>
                    <Grid item xs={12} style={{paddingTop:20, paddingLeft:20}}>
                      {code}
                    </Grid>
                  </Grid>
                }
              </Grid> 
              <DialogActions>
                  <Button variant="outlined" onClick={() => {
                    setOpenInfoDialog(false)
                    setId('');
                    setScript('');
                    setCode('');
                    setName('');
                    setVersion('');
                    setIsWorkflow(false);
                  }}>{t("generic.cancel")}</Button>
                  <Button variant="outlined" disabled={viewModel.dataset.id==id} onClick={() => {
                    routingStore.push('/dataset/'+id);
                  }}>{t("dataset.lineageTabLoad")}</Button>
              </DialogActions>
          </DialogContent>
        </Dialog>
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Lineage;
