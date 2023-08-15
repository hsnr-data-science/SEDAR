import { Box, Button, Checkbox, Collapse, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, FormControlLabel, Grid, IconButton, TableCell, TableRow, TextField, Typography } from "@material-ui/core";
import { t } from "i18next";
import React from "react";
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import DeleteIcon from "@material-ui/icons/Delete";
import { IUser } from "../../../../models/user";
import ViewModel from "../viewModel";

/**
* Component that represents the collapsable table row. 
*/
export const Row = (props: { item: IUser, viewModel: ViewModel})=> {
  const { item, viewModel} = props;
  const [open, setOpen] = React.useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = React.useState(false);

  const [firstname, setFirstname] = React.useState(item.firstname);
  const [lastname, setLastname] = React.useState(item.lastname);
  const [email, setEmail] = React.useState(item.email);
  const [isAdmin, setIsAdmin] = React.useState(item.isAdmin);

  const [isEditing, setIsEditing] = React.useState(false);
  const [editLoad, setEditLoad] = React.useState(false);
  const [deleteLoad, setDeleteLoad] = React.useState(false);

  return (
    <React.Fragment>
      <TableRow>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
        <TableCell align="left">{item.firstname}</TableCell>
        <TableCell align="left">{item.lastname}</TableCell>
        <TableCell align="left"><a style={{color:"inherit"}}href={"mailto:"+item.email}>{item.email}</a></TableCell>
        <TableCell align="left">
          <IconButton onClick={() => setOpenDeleteDialog(true)}><DeleteIcon/></IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: "20px" }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setEditLoad(true);
                  viewModel.putOneUser(item.email, email, firstname, lastname, isAdmin).then(()=> {
                    setEditLoad(false), 
                    setIsEditing(false)
                    setFirstname(item.firstname);
                    setLastname(item.lastname);
                    setEmail(item.email);
                    setIsAdmin(item.isAdmin);
                  }).catch(error =>{
                    alert(error);
                    setEditLoad(false);});
                }}
                >
                <Grid container spacing={2} onClick={()=>setIsEditing(true)}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom component="div" onClick={() => setIsEditing(true)}>
                      {t("generic.info")}:
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    {isEditing?<TextField
                      fullWidth
                      value={firstname}
                      label={t("generic.firstname")}
                      onChange={(e) => setFirstname(e.target.value)}
                      required
                    />:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("generic.firstname")}{": "+item.firstname}
                    </Typography>}
                  </Grid>
                  <Grid item xs={6}>
                    {isEditing?<TextField
                      fullWidth
                      label={t("generic.lastname")}
                      defaultValue={lastname}
                      onChange={(e) => setLastname(e.target.value)}
                      required
                    />:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("generic.lastname")}{": "+item.lastname}
                    </Typography>
                    }
                  </Grid>
                  <Grid item xs={6}>
                    {isEditing? <TextField
                      fullWidth
                      label={t("generic.email")}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("generic.email")}{": "+item.email}
                    </Typography>}
                  </Grid>
                  <Grid item xs={6}>
                    {isEditing?<FormControlLabel
                      control={
                        <Checkbox checked={isAdmin} color="primary" onChange={()=>setIsAdmin(!isAdmin)}/>
                      }
                      label={t("generic.isadmin")}
                    />:
                    <Typography variant="h6" gutterBottom component="div">
                      {t("generic.isadmin")}{": "+item.isAdmin}
                    </Typography>}
                  </Grid>
                </Grid>
                {isEditing?<Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      disabled={editLoad}
                      onClick={() => {
                        setIsEditing(false);
                        setFirstname(item.firstname);
                        setLastname(item.lastname);
                        setEmail(item.email);
                        setIsAdmin(item.isAdmin);
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
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>



      
      <Dialog open={openDeleteDialog} maxWidth="sm"
      fullWidth>
        <DialogTitle>{t("generic.delete")}</DialogTitle>
        <DialogContent>
          <DialogContentText>{t("generic.deleteMessage")}</DialogContentText>
          <DialogActions>
            <Button variant="outlined" onClick={() => setOpenDeleteDialog(false)}>{t("generic.cancel")}</Button>
            <Button variant="outlined" disabled={deleteLoad} onClick={() =>{ 
              setDeleteLoad(true);
              viewModel.deleteOneUser(item.email).then(() => setDeleteLoad(false) ).catch(error =>{
              alert(error);
              setDeleteLoad(false);})}}>{t("generic.delete")}</Button>
          </DialogActions>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
}