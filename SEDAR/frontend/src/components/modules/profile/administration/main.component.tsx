import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import { useTranslation } from "react-i18next";
import { Box, Button, Card, CardActions, CardContent, Checkbox, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControlLabel, Grid, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TextField, Typography} from "@material-ui/core";
import { CardHeader, Skeleton } from "@mui/material";
import AddCircleIcon from '@mui/icons-material/AddCircle';
import IViewProps from "../../../../models/iViewProps";
import { Row } from "./row";

/**
* Component that represents the administration tab. This tab is only accessible for adminstrators. 
*/
const Administration: React.FC<IViewProps<ViewModel>> = observer(( {viewModel} ) => {
  const { t } = useTranslation();

  const [openAddDialog, setOpenAddDialog] = React.useState(false);

  const [firstname, setFirstname] = React.useState("");
  const [lastname, setLastname] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isAdmin, setIsAdmin] = React.useState(false);
  const [load, setLoad] = React.useState(false);

  return (
    <React.Fragment>
      <Card style={{ minWidth: 275 }}>
        <CardHeader title={
          <Box>
            <Typography variant="h6" gutterBottom component="div">
              {t("administration.header")}
            </Typography>
            <Typography variant="subtitle1">
              {t("administration.description")}
            </Typography><hr/>
          </Box>
        }>
        </CardHeader>
        <CardContent style={{position:"relative", padding:"40px", paddingTop:"0px"}}>
          {
            viewModel.allUsers==undefined?
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <Skeleton variant="rectangular" height="250px"/>
                </Grid>
              </Grid>:
          <Box>
            <Paper style={{ width: '100%' }}>
              <TableContainer>
                <Table aria-label="collapsible table">
                  <TableHead>
                    <TableRow>
                      <TableCell></TableCell>
                      <TableCell align="left">{t("generic.firstname")}</TableCell>
                      <TableCell align="left">{t("generic.lastname")}</TableCell>
                      <TableCell align="left">{t("generic.email")}</TableCell>
                      <TableCell align="left">{t("generic.options")}</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {viewModel.allUsers.map((item) => (
                      <Row key={item.email} item={item} viewModel={viewModel}/>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
              <Dialog open={openAddDialog} maxWidth="sm"
                fullWidth>
                  <DialogTitle>{t("generic.add")}</DialogTitle>
                  <DialogContent>
                    <DialogContentText>{t("generic.addMessage")}</DialogContentText>
                    <form onSubmit={(e) => {e.preventDefault();
                    setLoad(true);
                      viewModel.postOneUser(email, firstname, lastname, password, isAdmin).then(()=> {
                        setLoad(false);
                        setOpenAddDialog(!openAddDialog);
                        setEmail("");
                        setFirstname("");
                        setLastname(""); 
                        setPassword("");
                        setIsAdmin(false);
                        }).catch(error =>{
                        alert(error);
                        setLoad(false);});}}>
                      <Grid container spacing={2}>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            value={firstname}
                            label={t("generic.firstname")}
                            onChange={(e) => setFirstname(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label={t("generic.lastname")}
                            defaultValue={lastname}
                            onChange={(e) => setLastname(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label={t("generic.email")}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth
                            label={t("generic.password")}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <FormControlLabel
                            control={
                              <Checkbox checked={isAdmin} color="primary" onChange={()=>setIsAdmin(!isAdmin)}/>
                            }
                            label={t("generic.isadmin")}
                          />
                        </Grid>
                      </Grid> 
                    <DialogActions>
                      <Button variant="outlined" onClick={() => setOpenAddDialog(!openAddDialog)}>{t("generic.cancel")}</Button>
                      <Button variant="outlined" disabled={load} type="submit">{t("generic.save")}</Button>
                    </DialogActions>
                    </form>   
                  </DialogContent>
                </Dialog>
              <Fab
                style={{
                  position: "fixed",
                  bottom: "1rem",
                  right: "1rem",
                }}
                variant="extended"
                size="medium"
                color="primary"
                onClick={async () => {
                  setOpenAddDialog(true);
                }}
              >
                <AddCircleIcon style={{ marginRight: "0.4rem" }} />
                {t("generic.add")}
              </Fab>
        </Box>}
        </CardContent>
        <CardActions>
        </CardActions>
      </Card>
    </React.Fragment>
  );
});

export default Administration;
