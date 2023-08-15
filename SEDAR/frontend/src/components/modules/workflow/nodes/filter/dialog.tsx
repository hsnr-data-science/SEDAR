import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import TextField from "@material-ui/core/TextField";
import IViewProps from "../../../../../models/iViewProps";
import Grid from "@material-ui/core/Grid";
import { useTranslation } from "react-i18next";
import FormControl from "@material-ui/core/FormControl";

const Dialog: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) =>
    /**
     *
     * @param viewModel
     */
{
  const { t } = useTranslation();
  return (
      /**
       * @return
       * @param filter column
       */
    <Grid container direction="column">
      <Grid item sm>
        <FormControl fullWidth margin="dense">
          <TextField
            required
            label={t("workflow.properties_dialog.filter.condition")}
            value={viewModel.data?.condition ?? ""}
            onChange={(e) =>
              viewModel.updateData((d) => (d.condition = e.target.value))
            }
          />
        </FormControl>
      </Grid>
    </Grid>
  );
});

export default Dialog;
