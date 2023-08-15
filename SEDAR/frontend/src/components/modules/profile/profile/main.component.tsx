import React from "react";
import { observer } from "mobx-react-lite";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Grid, TextField, Typography} from "@material-ui/core";
import { Skeleton, CardHeader } from "@mui/material";
import ViewModel from "../viewModel";
import IViewProps from "../../../../models/iViewProps";

/**
* Component that represents the profile tab. 
*/
const Profile: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();

  const [editLoad, setEditLoad] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
        <CardHeader title={
            <Box>
              <Typography variant="h6" gutterBottom component="div">
                {t("profile.header")}
              </Typography>
              <Typography variant="subtitle1">
                {t("profile.description")}
              </Typography><hr/>
            </Box>
          }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
          {
            viewModel.currentUser==undefined?
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Skeleton variant="text" />
                </Grid>
                <Grid item xs={6}>
                  <Skeleton variant="text" />
                </Grid>
                <Grid item xs={12}>
                  <Skeleton variant="text" />
                </Grid>
                <Grid item xs={6}>
                  <Skeleton variant="text" />
                </Grid>
                <Grid item xs={6}>
                  <Skeleton variant="text" />
                </Grid>
                <Grid item xs={12}>
                  <Skeleton variant="text" />
                </Grid>
              </Grid>:
            <Box>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditLoad(true);
                  viewModel.putCurrentUser().then(()=> setEditLoad(false)).catch(error =>{
                    alert(error);
                    setEditLoad(false);});
                }}
                >
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      value={viewModel.currentUser.firstname}
                      label={t("generic.firstname")}
                      onChange={(e) => viewModel.currentUser.firstname = e.target.value}
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      value={viewModel.currentUser.lastname}
                      label={t("generic.lastname")}
                      onChange={(e) => viewModel.currentUser.lastname = e.target.value}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label={t("generic.email")}
                      value={viewModel.currentUser.email}
                      onChange={(e) => viewModel.currentUser.email = e.target.value}
                      required
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label={t("profile.oldPassword")}
                      value={viewModel.oldPassword}
                      onChange={(e) => viewModel.oldPassword = e.target.value}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      type="password"
                      label={t("profile.newPassword")}
                      value={viewModel.newPassword}
                      onChange={(e) => viewModel.newPassword = e.target.value}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <br/>
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
            </Box>
          }
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});


export default Profile;
