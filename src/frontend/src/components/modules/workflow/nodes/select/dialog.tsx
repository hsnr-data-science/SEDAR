import React from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import IViewProps from "../../../../../models/iViewProps";
import Grid from "@material-ui/core/Grid";
import { useTranslation } from "react-i18next";
import FormControl from "@material-ui/core/FormControl";
import InputLabel from "@material-ui/core/InputLabel";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import Chip from "@material-ui/core/Chip";
import { makeStyles } from "@material-ui/core/styles";
import { Theme } from "@material-ui/core/styles";
import { createStyles } from "@material-ui/core/styles";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

const useStyles = makeStyles((theme: Theme) =>
    /**
     *
     * @param theme
     */
 createStyles({
    chipContainer: {
      display: "flex",
      justifyContent: "center",
      flexWrap: "wrap",
      listStyle: "none",
      padding: theme.spacing(0.5),
      margin: 0,
    },
    chip: {
      margin: theme.spacing(0.5),
    },
  })
);

const Dialog: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) =>
    /**
     *
     * @param viewModel
     */
{
  const { t } = useTranslation();
  const classes = useStyles();

  return (
      /**
       * @return
       * @param select column
       */
    <Grid container direction="column">
      <Grid item sm>
        <FormControl fullWidth margin="dense">
          <InputLabel>
            {t("workflow.properties_dialog.select.column")}
          </InputLabel>
          <Select
            value={""}
            onChange={(e) =>
              viewModel.updateData((data) => {
                data.schema.fields.push(
                  viewModel.currentFields[e.target.value as number]
                );
              })
            }
          >
            {viewModel.currentFields.map((item, index) => (
              <MenuItem value={index} key={index}>
                {item.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid item sm>
        <ul className={classes.chipContainer}>
          {viewModel.data.schema.fields.map((item, index) => {
            return (
              <li key={index}>
                <Chip
                  label={item.name}
                  className={classes.chip}
                  onDelete={() =>
                    viewModel.updateData((data) => {
                      data.schema.fields.splice(index, 1);
                    })
                  }
                />
              </li>
            );
          })}
        </ul>
      </Grid>
        <Grid item sm>
            <FormControlLabel
                control={
                    <Checkbox
                        checked={viewModel.data?.distinct ?? false}
                        color="primary"
                        onChange={(e) =>
                            viewModel.updateData((data) => {
                                data.distinct = e.target.checked
                            })
                        }
                    />
                }
                label={t("workflow.properties_dialog.select.distinct")}
            />
        </Grid>
    </Grid>
  );
});

export default Dialog;
