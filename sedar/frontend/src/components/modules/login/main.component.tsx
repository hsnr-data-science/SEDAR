import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import Card from "@material-ui/core/Card";
import TextField from "@material-ui/core/TextField";
import CardContent from "@material-ui/core/CardContent";
import { useHistory } from "react-router-dom";
import sha256 from 'crypto-js/sha256';
import Base64 from 'crypto-js/enc-base64';
import { Button, FormControlLabel, Checkbox, FormGroup, Grid, Switch } from "@material-ui/core";
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

/**
* Main component for the login view. 
*/

const Main: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {

  const { t } = useTranslation();
  const history = useHistory();


  const base64URLEncode = function (str) {
    return str.toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
  }
  const challenge = base64URLEncode(Base64.stringify(sha256(process.env.REACT_APP_AUTHENTICATION_VERIFIER)));
  var link = process.env.REACT_APP_AUTHENTICATION_AUTHORIZATION_LINK
    + "?client_id=" + process.env.REACT_APP_CLIENT_ID
    + "&redirect_uri=" + encodeURIComponent(process.env.REACT_APP_AUTHENTICATION_REDIRECT_URI)
    + "&response_type=code&state=STATE&scope=" + process.env.REACT_APP_AUTHENTICATION_SCOPE
    + "&code_challenge="
    + challenge
    + "&code_challenge_method=S256";

  return (
    <Card style={{ width: "20rem", margin: "0 auto" }}>
      <CardContent>
        <div>
          <FormGroup>
            <FormControlLabel control={<Switch defaultChecked  checked={viewModel.customLogin} color="default" onChange={() => viewModel.customLogin = !viewModel.customLogin} inputProps={{ 'aria-label': 'primary checkbox' }} />
            } label="Login with Git-Lab" />

          </FormGroup>
          {viewModel.customLogin == true ?
            <Button
              fullWidth
              type="submit"
              variant="contained"
              color="primary"
              href={link}
            >
              Login (Redirect to gitlab)
            </Button>
            :
            <form
              onSubmit={(e) => {
                e.preventDefault();
                viewModel.login();
              }}
            >
              <Grid container direction="column" spacing={5}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    value={viewModel.email}
                    label={t("generic.email")}
                    onChange={(e) => viewModel.setEmail(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    type="password"
                    label={t("generic.password")}
                    value={viewModel.password}
                    onChange={(e) => viewModel.setPassword(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox checked={viewModel.stayLoggedIn} color="primary" onChange={() => viewModel.stayLoggedIn = !viewModel.stayLoggedIn} />
                    }
                    label={t("login.stayLoggedIn")}
                  />
                </Grid>
                {viewModel.errorMessage != "" ?
                  <Grid container style={{ paddingLeft: "20px" }}>
                    <Grid item xs={2}><ErrorOutlineIcon color="error" /></Grid><Grid item xs={10}><div style={{ color: 'red' }}>{viewModel.errorMessage}</div></Grid>
                  </Grid>
                  : ''}
                <Grid item xs={12}>
                  <Button
                    fullWidth
                    type="submit"
                    variant="contained"
                    disabled={!viewModel.canLogin}
                    color="primary"
                  >
                    {t("generic.login")}
                  </Button>
                </Grid>
              </Grid>
            </form>
          }
        </div>
      </CardContent>
    </Card>
  );
});


export default Main;
