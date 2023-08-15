import React from "react";
import Button from "@material-ui/core/Button";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import { observer, useLocalObservable } from "mobx-react";
import AddIcon from "@material-ui/icons/Add";
import Typography from "@material-ui/core/Typography";
import { useTheme } from "@material-ui/core/styles";
import Divider from "@material-ui/core/Divider";
import { useTranslation } from "react-i18next";
import TextField from "@material-ui/core/TextField";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContentText from "@material-ui/core/DialogContentText";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import ViewModel from "./viewModel";
import workspacesStore from "../../../../stores/workspaces.store";
import appStore from "../../../../stores/app.store";
import { Grid, IconButton } from "@material-ui/core";
import DeleteIcon from "@material-ui/icons/Delete";
import routingStore from "../../../../stores/routing.store";

/**
* Component for changing the current workspaces. 
*/
const WorkspaceChanger: React.FC = observer(() => {
  const viewModel = useLocalObservable(() => new ViewModel());
  const theme = useTheme();
  const { t } = useTranslation();

  if (!appStore.isLoggedIn) return null;
  return (
    <React.Fragment>
      <Button
        aria-haspopup="true"
        color="inherit"
        endIcon={<ExpandMoreIcon />}
        onClick={(event) => viewModel.setAnchorEl(event.currentTarget)}
      >
        {workspacesStore.currentWorkspace==null?"":workspacesStore.currentWorkspace.title}
      </Button>
      <Menu
        anchorEl={viewModel.anchorEl}
        keepMounted
        open={viewModel.isMenuOpen}
        onClose={() => viewModel.closeMenu()}
      >
        {workspacesStore.workspaces.map((item) => (
          <MenuItem
            key={item.id}
          >
            <div onClick={() =>{
              if(routingStore.location.pathname.toString()!='/'&&routingStore.location.pathname.toString()!='/workspace-management'&&routingStore.location.pathname.toString()!='/profile'){
                routingStore.history.push('/');
              }
              viewModel.changeWorkspace(item)
            }}>{item.title}</div>
            <IconButton style={{marginLeft: "auto"}}
              disabled={workspacesStore.currentWorkspace?.id == item.id}
              edge="end"
              aria-label="delete"
              onClick={() => workspacesStore.deleteWorkspace(item)}
            >
              <DeleteIcon/>
            </IconButton>
          </MenuItem>
        ))}
        <Divider style={{ margin: theme.spacing(1, 0) }} />

        <MenuItem onClick={() => viewModel.openDialog()}>
          <AddIcon fontSize="small" style={{ marginRight: theme.spacing(1) }} />
          <Typography variant="inherit">{t("generic.add")}</Typography>
        </MenuItem>
      </Menu>
      <Dialog
        open={viewModel.isDialogOpen}
        disableAutoFocus
        onClose={() => viewModel.closeDialog()}
      >
        <DialogTitle>{t("workspaceChanger.title")}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t("workspaceChanger.description")}
          </DialogContentText>
          <form
              onSubmit={(e) => {
                e.preventDefault();
                viewModel.addNewWorkspace();}}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  autoFocus
                  onChange={(e) => viewModel.setWorkspaceTitle(e.target.value)}
                  value={viewModel.workspaceTitle}
                  margin="dense"
                  label={t("workspaceChanger.nameOfWorkspace")}
                  fullWidth
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  multiline
                  rows={4}
                  onChange={(e) => viewModel.setWorkspaceDescription(e.target.value)}
                  value={viewModel.workspaceDescription}
                  margin="dense"
                  label={t("workspaceChanger.descriptionOfWorkspace")}
                  fullWidth
                />
              </Grid>
            </Grid>
            <DialogActions>
              <Button variant="outlined" onClick={() => viewModel.closeDialog()}>
                {t("generic.cancel")}
              </Button>
              <Button variant="outlined" type="submit">
                {t("generic.create")}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
    </React.Fragment>
  );
});

export default WorkspaceChanger;
