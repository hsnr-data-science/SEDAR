import React, { useRef, useState } from "react";
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
   */ {
  const { t } = useTranslation();
  return (
    /**
     * @return
     */
    <Grid container direction="column">
      <Grid container item>
        <Grid item sm>
          <FormControl fullWidth margin="dense">
            <TextField
              multiline
              rows={10}
              fullWidth
              label={t("workflow.properties_dialog.obda.query")}
              value={viewModel.data?.query_string??""}
              required
              onChange={(e) => 
                viewModel.updateData((d) => (d.query_string = e.target.value as string))
              }
            />
          </FormControl>
        </Grid>
      </Grid>
    </Grid>
  );
}
);

export default Dialog;
