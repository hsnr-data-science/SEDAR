import React, { useRef, useState } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "./viewModel";
import TextField from "@material-ui/core/TextField";
import IViewProps from "../../../../../models/iViewProps";
import Grid from "@material-ui/core/Grid";
import MenuItem from "@material-ui/core/MenuItem";
import InputLabel from "@material-ui/core/InputLabel";
import { useTranslation } from "react-i18next";
import Select from "@material-ui/core/Select";
import FormControl from "@material-ui/core/FormControl";
import { Checkbox } from "@material-ui/core";
import { FormControlLabel } from "@mui/material";
import { NodeType } from "..";

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
       * @param export
       */
    <Grid container direction="column">
      <Grid item sm>
        <FormControl fullWidth margin="dense">
          <TextField
            label={t("workflow.properties_dialog.export.name")}
            value={viewModel.data?.name ?? ""}
            required
            onChange={(e) =>
              viewModel.updateData((d) => (d.name = e.target.value))
            }
          />
        </FormControl>
      </Grid>
      <Grid item sm><br/>
        <FormControl fullWidth>
          <InputLabel id="demo-simple-select-label">{t('generic.writeFormat')}</InputLabel>
          <Select
            required
            labelId="demo-simple-select-label"
            id="demo-simple-select"
            value={viewModel.data?.writeType??"DEFAULT"}
            label="Age"
            onChange={(e)=>{
              viewModel.updateData((d) => (d.writeType = e.target.value as string));
            }}
          >
            <MenuItem value="DEFAULT">DEFAULT</MenuItem>
            <MenuItem value="DELTA">DELTA</MenuItem>
          </Select>
        </FormControl>
      </Grid>
      <Grid item sm><br/>
        <FormControlLabel control={<Checkbox color='primary' checked={viewModel.data?.auto} onChange={()=>{
          viewModel.updateData((d) => (d.auto = !d.auto));}}/>} label={t("workflow.properties_dialog.export.auto") as string}/>
      </Grid>
      {viewModel.data?.auto==false?
      <React.Fragment>
        <Grid item sm>
          <FormControlLabel control={<Checkbox color='primary' checked={viewModel.data?.isPolymorph} onChange={()=>{
            viewModel.updateData((d) => (d.isPolymorph = !d.isPolymorph));}}/>} label={t("workflow.properties_dialog.export.polymorph") as string}/>
        </Grid>
        <Grid item sm>
          <FormControlLabel disabled={
            viewModel.workflowViewModel.elements.filter((d)=>d.type==NodeType.join).length==0
          } control={<Checkbox color='primary' checked={viewModel.data.setFk} onChange={(e)=>{
            viewModel.updateData((d) => (d.setPk = false));
            viewModel.updateData((d) => (d.setFk = !d.setFk));
            }}/>} label={t("workflow.properties_dialog.export.setFk") as string}/>
        </Grid>
        <Grid item sm>
          <FormControlLabel disabled={viewModel.data?.setFk==false} control={<Checkbox color='primary' checked={viewModel.data.setPk} onChange={()=>{
            viewModel.updateData((d) => (d.setPk = !d.setPk))}}/>} label={t("workflow.properties_dialog.export.setPk") as string}/>
        </Grid>
        </React.Fragment>:''}
      {
      /*<Grid item sm>
        <FormControl fullWidth margin="dense">
          <InputLabel>
            {t("workflow.properties_dialog.export.target")}
          </InputLabel>
          <Select
            value={viewModel.data?.target ?? ""}
            onChange={(e) =>
              viewModel.updateData(
                (data) => (data.target = e.target.value as string)
              )
            }
          >
            <MenuItem value="HDFS">HDFS</MenuItem>
            <MenuItem value="MongoDB">MongoDB</MenuItem>
          </Select>
        </FormControl>
      </Grid>*/
      }
    </Grid>
  );
});

export default Dialog;
