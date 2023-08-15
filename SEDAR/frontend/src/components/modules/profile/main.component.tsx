import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import { Box, Tab, Tabs, Typography} from "@material-ui/core";
import Profile from "./profile/main.component";
import Administration from "./administration/main.component";
import userStore from "../../../stores/user.store";
import Wiki from "./wiki/main.component";
import Test from "./test/main.component";

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
* Main component for the profile view. 
*/
const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t, i18n } = useTranslation()

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
        <Tab label={t('profile.header')} {...a11yProps(0)} />
        {
          userStore.isAdmin==true?<Tab label={t('administration.header')} {...a11yProps(1)} />:""
        }
        {
          userStore.isAdmin==true?<Tab onClick={()=>{
            viewModel.getWiki(i18n.language.split('-')[0]);
          }} label={t('wiki.header')} {...a11yProps(2)} />:""
        }
        {
          userStore.isAdmin==true?<Tab onClick={()=>{
            if(viewModel.test==undefined){
              viewModel.getTest();
            }
          }} label={t('test.header')} {...a11yProps(3)} />:""
        }
      </Tabs>
      <TabPanel value={value} index={0}>
        <Profile viewModel={viewModel}/>
      </TabPanel>
      {userStore.isAdmin==true?
      <TabPanel value={value} index={1}>
        <Administration viewModel={viewModel}/>
      </TabPanel>:""
      }
      {userStore.isAdmin==true?
      <TabPanel value={value} index={2}>
        <Wiki viewModel={viewModel}/>
      </TabPanel>:""
      }
      {userStore.isAdmin==true?
      <TabPanel value={value} index={3}>
        <Test viewModel={viewModel}/>
      </TabPanel>:""
      }
    </React.Fragment>
  );
});

export default Main;
