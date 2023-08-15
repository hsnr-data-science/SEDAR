import React from "react";
import IconButton from "@material-ui/core/IconButton";
import appStore from "../../../../stores/app.store";
import ExitToAppIcon from "@material-ui/icons/ExitToApp";
import { observer } from "mobx-react";
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import { Link } from "react-router-dom";

/**
* Component for the settings. 
*/
const SettingsComponent: React.FC = observer(() => {
  if (!appStore.isLoggedIn) return null;

  return (
    <React.Fragment>
      <IconButton color="inherit" component={Link} to="/profile"><AccountCircleOutlinedIcon/></IconButton>
      <IconButton
        color="inherit"
        onClick={() => appStore.logout()}
      >
        <ExitToAppIcon />
      </IconButton>
    </React.Fragment>
  );
});

export default SettingsComponent;
