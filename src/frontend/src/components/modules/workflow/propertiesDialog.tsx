import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../models/iViewProps";
import { useTranslation } from "react-i18next";
import Button from "@material-ui/core/Button";
import Dialog from "@material-ui/core/Dialog";
import DialogTitle from "@material-ui/core/DialogTitle";
import DialogContent from "@material-ui/core/DialogContent";
import DialogActions from "@material-ui/core/DialogActions";
import { red } from "@material-ui/core/colors";

/**
* Dialog component for the properties. 
*/
const PropertiesDialog: React.FC<IViewProps<ViewModel>> = observer(
    /**
     *
     * @param viewModel
     */

  ({ viewModel }) => {
    const { t } = useTranslation();
    return (
      <Dialog
        //open={viewModel.isPropertiesModalOpen}
        open={viewModel.isPropertiesModalOpen==true&&viewModel.isLineageView==false}
        disableAutoFocus
        maxWidth="sm"
        fullWidth
        onClose={() => viewModel.closePropertiesModal()}
      >
        <DialogTitle>{t("workflow.properties_dialog.title")}</DialogTitle>
        <form
          onSubmit={(e) => {
          e.preventDefault();
          viewModel.saveProperties();
        }}>
          <DialogContent>{viewModel.propertiesModalContentView}</DialogContent>
        
        <DialogActions>
          <Button
            variant="outlined"
            style={{ color: red[500] }}
            onClick={() => {
              if (viewModel.propertiesViewModel?.id) {
                viewModel.deleteNode(viewModel.propertiesViewModel.id);
                viewModel.closePropertiesModal();
              }
            }}
          >
            {t("generic.delete")}
          </Button>
          <div style={{ flex: 1 }} />
          <Button variant="outlined" onClick={() => viewModel.closePropertiesModal()}>
            {t("generic.cancel")}
          </Button>
          <Button color="primary" variant="outlined" type="submit" /*onClick={() => viewModel.saveProperties()}*/>
            {t("generic.save")}
          </Button>
        </DialogActions>
        </form>
      </Dialog>
    );
  }
);

export default PropertiesDialog;
