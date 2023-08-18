import React from "react";
import { observer } from "mobx-react-lite";
import { default as vM } from "./ontop/viewModel";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import { Box, Tab, Tabs, Typography } from "@material-ui/core";
import Ontologies from "./ontologies/ontologies";
import ONTOP from "./ontop/ontop";
import OBDA from "./obda/obda";
import { default as vM2 } from "./obda/viewModel";
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
  console.log(value);
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
* Main component for the workspace administration view. 
*/
const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t } = useTranslation();

  const [value, setValue] = React.useState(0);

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) =>
    /**
     *
     * @param event
     * @param newValue
     */ {
    setValue(newValue);
  };

  return (
    <React.Fragment>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor={'primary'}
        aria-label="tab"
        variant="scrollable"
        scrollButtons="auto"
      >
        <Tab label={t('sdm.ontologiesHeader')} {...a11yProps(0)} />
        <Tab disabled={viewModel.currentWorkspace==undefined} label={t('sdm.obdaHeader')} {...a11yProps(1)} />
        {process.env.USE_ONTOP == "True" ?
        <Tab disabled={viewModel.currentWorkspace==undefined} label={t('sdm.OnTopHeader')} {...a11yProps(2)} />
          : ''}
      </Tabs>
      <TabPanel value={value} index={0}>
        <Ontologies viewModel={viewModel} />
      </TabPanel>
      {process.env.USE_ONTOP == "True" ?
        <TabPanel value={value} index={1}>
          <ONTOP viewModel={new vM()} />
        </TabPanel>
        : ''}
      <TabPanel value={value} index={1}>
        <OBDA viewModel={new vM2()} />
      </TabPanel>
    </React.Fragment>
  );
});

export default Main;
