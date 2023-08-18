import React from "react";
import { Link, Switch, Route, BrowserRouter as Router } from "react-router-dom";
import appStore from "../../stores/app.store";
import ContentStore from "../../models/contentStore";
import routingStore from "../../stores/routing.store";
import { toJS } from "mobx";
import { observer } from "mobx-react";
import { useEffect } from "react";
import { AppBar, Backdrop, Box, CircularProgress, Container, createStyles, createTheme, CssBaseline, Divider, Drawer, FormControlLabel, IconButton, InputLabel, List, ListItem, ListItemIcon, ListItemText, makeStyles, Theme, ThemeProvider, Toolbar, useTheme } from "@material-ui/core";
import clsx from 'clsx';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import { useTranslation } from "react-i18next";
import { Switch as Sw} from '@material-ui/core';
import blue from "@material-ui/core/colors/blue";
import WorkspaceChanger from "./header/workspaceChanger";
import SettingsComponent from "./header/settings/main.component";
import logo from "../../resources/images/logo.png";
import LanguageChanger from "./header/languageChanger";
import workspacesStore from "../../stores/workspaces.store";
import StoreStatus from "../../models/storeStatus.enum";
import BrightnessMediumIcon from '@mui/icons-material/BrightnessMedium';
import FolderSpecialIcon from "@material-ui/icons/FolderSpecial";
import settingStore from "../../stores/settings.store";
import WorkspacesIcon from '@mui/icons-material/Workspaces';
import AddIcon from '@mui/icons-material/Add';
import SearchbarComponent from "../common/searchbar";
import TimelineIcon from '@mui/icons-material/Timeline';
import HubIcon from '@mui/icons-material/Hub';
import ScrollBackToTopButton from "./scrollButton";
import ComputerIcon from '@mui/icons-material/Computer';

const drawerWidth = 240;

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {
      display: 'flex',
    },
    appBar: {
      color:"primary",
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
    },
    appBarShift: {
      width: `calc(100% - ${drawerWidth}px)`,
      marginLeft: drawerWidth,
      transition: theme.transitions.create(['margin', 'width'], {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
    },
    menuButton: {
      marginRight: theme.spacing(2),
    },
    hide: {
      display: 'none',
    },
    drawer: {
      width: drawerWidth,
      flexShrink: 0,
    },
    drawerPaper: {
      width: drawerWidth,
    },
    drawerHeader: {
      display: 'flex',
      alignItems: 'center',
      padding: theme.spacing(0, 1),
      ...theme.mixins.toolbar,
      justifyContent: 'flex-end',
    },
    content: {
      flexGrow: 1,
      padding: theme.spacing(3),
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.sharp,
        duration: theme.transitions.duration.leavingScreen,
      }),
      marginLeft: -drawerWidth,
    },
    contentShift: {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginLeft: 0,
    },
  }),
);

/**
* Overall main component. 
*/
const RoutingComponent: React.FC = observer(() => {
  const location = routingStore.history.location;
  const state = toJS(routingStore.history.location.state) ?? null;

  const theme = useTheme();
  useEffect(() => {
    assignViewModel(location.pathname);
  }, [location.pathname, workspacesStore.currentWorkspace, state]);

  const assignViewModel = async (path: string) => {
    //await import("../modules" + path).then((res) =>
    //replaced so that the id of a datasets can be used in the url 
    await import("../modules" + (path.startsWith('/dataset')==true?'/dataset':path)).then((res) =>
      appStore.setContentViewModel(new res.default() as ContentStore)
    );
    //.catch(() => appStore.setContentViewModel(new NotFoundStore(path)));
  };

  return (
    <div
      style={{
        flex: 1,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        alignItems: "stretch",
        overflow: "auto",
      }}
    >
      <div
        style={{
          flex: 1,
          position: "relative",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Backdrop
          style={{
            position: "relative",
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: "rgba(255,255,255,0.4)",
          }}
          open={
            appStore.contentViewModel != null &&
            (appStore.contentViewModel.status == StoreStatus.initializing ||
              appStore.contentViewModel.status == StoreStatus.working)
          }
        >
          <CircularProgress
            style={{
              position: "fixed",
              top: "50%",
            }}
          />
        </Backdrop>
        {appStore.isFullscreen ? (
          <div
            style={{
              position: "relative",
              flex: 1,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {appStore.view}
          </div>
        ) : (
          <Container
            style={{
              marginTop: "2rem",
              marginBottom: "2rem",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              flex: 1,
            }}
          >
            <div
              style={{
                position: "relative",
                flex: 1,
                display: "flex",
                flexDirection: "column",
              }}
            >
              {appStore.view}
            </div>
          </Container>
        )}
      </div>
    </div>
  );
});

const App: React.FC<{}> = () => {
  const lightTheme = createTheme({
    palette: {
      type: "light",
      primary: {
        main: blue[500],
      },
    }
  });

  const darkTheme = createTheme({
    palette: {
      type: "dark",
      primary: {
        main: blue[500],
      },
    }
  });

  const { t } = useTranslation();
  const classes = useStyles();
  const [theme, setTheme] = React.useState(settingStore.isDarkmode?darkTheme:lightTheme);
  const [open, setOpen] = React.useState(false);

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  return (
    <>
      <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className={classes.root}>
        <AppBar
            position="fixed"
            className={clsx(classes.appBar, {
            [classes.appBarShift]: open,
            })}
        >
            <Toolbar>
            <IconButton
                color="inherit"
                aria-label="open drawer"
                onClick={handleDrawerOpen}
                edge="start"
                className={clsx(classes.menuButton, open && classes.hide)}
            >
                <MenuIcon />
            </IconButton>
            <Box style={{ flex: 1 }}>
              <Link to="/dashboard" className="no-highlight">
                <img src={logo} style={{ height: "2rem", marginRight: "1rem" }} />
              </Link>
            </Box>
            <Box style={{minWidth:500, marginRight:"auto"}}><SearchbarComponent isWorkflow={false} isExtendedView={false} isVisualizationView={false} isRecommendation={false}/></Box>
            <LanguageChanger />
            <SettingsComponent />
            </Toolbar>
        </AppBar>
        <Drawer
            className={classes.drawer}
            variant="persistent"
            anchor="left"
            open={open}
            classes={{
            paper: classes.drawerPaper,
            }}
        >
            <div className={classes.drawerHeader}>
            <IconButton onClick={handleDrawerClose}>
                {theme.direction === 'ltr' ? <ChevronLeftIcon /> : <ChevronRightIcon />}
            </IconButton>
            </div>
            <Divider />
            {appStore.isLoggedIn==true?
            <List>
            <div>
              <ListItem>
                <ListItemIcon><FolderSpecialIcon /></ListItemIcon>
                <ListItemText>
                  <WorkspaceChanger />
                </ListItemText>
              </ListItem>
              <ListItem>
                <ListItemIcon><BrightnessMediumIcon /></ListItemIcon>
                <ListItemText><FormControlLabel
                  control={
                    <Sw checked={settingStore.isDarkmode} color="default" onChange={() => {settingStore.isDarkmode=!settingStore.isDarkmode, setTheme(settingStore.isDarkmode?darkTheme:lightTheme); }} inputProps={{ 'aria-label': 'controlled' }}/>
                  }
                  label=""/>
                </ListItemText>
              </ListItem>
            </div>
            <Divider /><br/>
            <ListItem button component={Link} to="/workspace-management" onClick={handleDrawerClose}>
              <ListItemIcon><WorkspacesIcon/></ListItemIcon>
              <ListItemText primary={t("workspaceAdministration.drawerHeader")}/>
            </ListItem>
            <ListItem button component={Link} to="/workflow" onClick={handleDrawerClose}>
              <ListItemIcon><TimelineIcon/></ListItemIcon>
              <ListItemText primary={t("workflow.drawerHeader")}/>
            </ListItem>
            <ListItem button component={Link} to="/ingestion" onClick={handleDrawerClose}>
              <ListItemIcon><AddIcon/></ListItemIcon>
              <ListItemText primary={t("ingestion.drawerHeader")}/>
            </ListItem>
            <ListItem button component={Link} to="/machine-learning" onClick={handleDrawerClose}>
              <ListItemIcon><ComputerIcon/></ListItemIcon>
              <ListItemText primary={t("ml.drawerHeader")}/>
            </ListItem>
            <ListItem button component={Link} to="/sdm" onClick={handleDrawerClose}>
              <ListItemIcon><HubIcon/></ListItemIcon>
              <ListItemText primary={t("sdm.drawerHeader")}/>
            </ListItem>
          </List>:''}
        </Drawer>
        <main
            className={clsx(classes.content, {
            [classes.contentShift]: open,
            })}
        >
            <div className={classes.drawerHeader} />
            <Switch>
              <Route component={RoutingComponent} />
            </Switch>
          <ScrollBackToTopButton/>  
        </main>
        </div>
      </ThemeProvider>
    </>
  );
};

export default App;