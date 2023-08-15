import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import { Box, IconButton, Tab, Tabs, Typography } from "@material-ui/core";
import Query from "./query/main.component";
import Analytics from "./analytics/main.component";
import Profile from "./profile/main.component";
import General from "./general/main.component";
import History from "./history/main.component";
import Lineage from "./lineage/main.component";
import Options from "./option/main.component";
import StarBorderIcon from '@mui/icons-material/StarBorder';
import StarIcon from '@mui/icons-material/Star';
import userStore from "../../../stores/user.store";

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  /**
   *
   * @param props
   * @constructor
   */
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box>
          <Typography component={"span"}>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: any) {
  /**
   *
   * @param index
   */
  return {
    id: `simple-tab-${index}`,
    "aria-controls": `simple-tabpanel-${index}`,
  };
}

/**
* Main component for the dataset view. 
*/
const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  useEffect(() => {
    viewModel.registerIntevals();
    return () => viewModel.deregisterIntevals();
  });
  const { t } = useTranslation();

  const [changingFavoriteStatus, setChangingFavoriteStatus] = React.useState(false);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) =>
    /**
     *
     * @param event
     * @param newValue
     */ {
    viewModel.tab=newValue
  };
  
  return (
    <React.Fragment>
      <Tabs
        value={viewModel.tab}
        onChange={handleChange}
        indicatorColor={'primary'}
        aria-label="tab"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={t('dataset.generalTab')} {...a11yProps(0)} />
        <Tab disabled={viewModel.dataset==undefined || viewModel?.dataset?.schema?.type=='UNSTRUCTURED' || (viewModel.dataset.schema.entities==undefined && viewModel.dataset.schema.files==undefined)} label={t('dataset.queryTab')} {...a11yProps(1)} 
        onClick={
          ()=>{
            if(viewModel.columns.length == 0){
              viewModel?.dataset?.schema?.entities.forEach(element => {
                viewModel.getColumns(element.attributes,'')
              })
            }
          }
        }/>
        <Tab disabled={viewModel.dataset==undefined||(viewModel.dataset.schema.entities==undefined && viewModel.dataset.schema.files==undefined)} label={t('dataset.profileTab')} {...a11yProps(2)} />
        <Tab disabled={viewModel.dataset==undefined||(viewModel.dataset.schema.entities==undefined && viewModel.dataset.schema.files==undefined)} onClick={() => {viewModel.lineage==undefined?viewModel.getDataset():'';}} label={t('dataset.historyTab')} {...a11yProps(3)} />
        <Tab disabled={viewModel.dataset==undefined||(viewModel.dataset.schema.entities==undefined && viewModel.dataset.schema.files==undefined)} onClick={() => {viewModel.lineage==undefined?viewModel.getLineage():'';}} label={t('dataset.lineageTab')} {...a11yProps(4)} />
        <Tab disabled={viewModel.dataset==undefined||(viewModel.dataset.schema.entities==undefined && viewModel.dataset.schema.files==undefined)} onClick={() => {viewModel.dataset.notebooks==undefined?viewModel.getNotebooks():'';}} label={t('dataset.analyticsTab')} {...a11yProps(5)} />
        {viewModel?.dataset?.owner?.email==userStore.email?
        <Tab disabled={viewModel.dataset.schema==undefined} label={t('dataset.optionTab')} {...a11yProps(6)} />:''}
      </Tabs>
      <TabPanel value={viewModel.tab} index={0}>
        <General viewModel={viewModel}/>
      </TabPanel>
      <TabPanel value={viewModel.tab} index={1}>
        <Query viewModel={viewModel} />
      </TabPanel>
      <TabPanel value={viewModel.tab} index={2}>
        <Profile viewModel={viewModel}/>
      </TabPanel>
      <TabPanel value={viewModel.tab} index={3}>
        <History viewModel={viewModel}/>
      </TabPanel>
      <TabPanel value={viewModel.tab} index={4}>
        <Lineage viewModel={viewModel}/>
      </TabPanel>
      <TabPanel value={viewModel.tab} index={5}>
        <Analytics viewModel={viewModel}/>
      </TabPanel>
      {viewModel?.dataset?.owner?.email==userStore.email?<TabPanel value={viewModel.tab} index={6}>
        <Options viewModel={viewModel}/>
      </TabPanel>:''}
      {viewModel.dataset!=undefined?
        <IconButton
        style={{
          position: "fixed",
          bottom: "1rem",
          right: "1rem",
        }}
        disabled={changingFavoriteStatus}
        onClick={async ()=>{
            setChangingFavoriteStatus(true);
            await viewModel.setOrUnsetFavorite();
            setChangingFavoriteStatus(false);
          }
        }
      >
        { viewModel?.dataset?.isFavorite==false?
          <StarBorderIcon style={{ fontSize: "60px" }}/>:
          <StarIcon style={{ fontSize: "60px" }}/>
        }
      </IconButton>:''
      }
    </React.Fragment>
  );
});

export default Main;
