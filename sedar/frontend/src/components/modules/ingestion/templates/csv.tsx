import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import IViewProps from "../../../../models/iViewProps";
import { Button, Box, TextField, MenuItem, Card, CardActions, CardContent, CardHeader, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, FormControlLabel, Grid, IconButton, InputLabel, Paper, Select, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableRow, Tabs, Typography } from "@material-ui/core";
import { useTranslation } from "react-i18next";

const delimiters = [
  {
    value: ';',
    label: ';',
  },
  {
    value: ',',
    label: ',',
  },
];

const headers = [
  {
    value: 'true',
    label: 'true',
  },
  {
    value: 'false',
    label: 'false',
  },
];

const inferschemas = [
  {
    value: 'true',
    label: 'true',
  },
  {
    value: 'false',
    label: 'false',
  },
];

/**
* CSV component for the ingestion view. 
*/
const CSV: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t } = useTranslation();
  const [idcolumn, setIdColumn] = React.useState('');
  const [delimiter, setDelimiter] = React.useState(',');
  const [header, setHeader] = React.useState('true');
  const [inferSchema, setInferSchema] = React.useState('true');


  function handleForm() {
    var def = JSON.parse(viewModel.datasourceDefinition);
    def.read_format = "csv";
    def.read_options = { "delimiter": delimiter, "header": header, "inferSchema": inferSchema }
    if (idcolumn !== '') {
      def.id_column = idcolumn;
    }
    viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
  }

  useEffect(() => {
    handleForm();
}, [idcolumn, delimiter, header, inferSchema]);

  return (
    <React.Fragment>

      <div>
        <TextField
          id="outlined-select-delimiter"
          margin="normal"
          fullWidth
          label="ID Column"
          value={idcolumn}
          onChange={(e) => {
            setIdColumn(e.target.value);
          }}
          helperText="Please specify the id column, if any."
        >
        </TextField>

        <TextField
          id="outlined-select-delimiter"
          margin="normal"
          select
          label="Delimiter"
          value={delimiter}
          onChange={(e) => {
            setDelimiter(e.target.value);
          }}
          helperText="Please select a delimiter."
        >
          {delimiters.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <br></br>
        <TextField
          id="outlined-select-header"
          margin="normal"
          select
          label="Header"
          value={header}
          onChange={(e) => {
            setHeader(e.target.value);
          }}
          helperText="Please select whether a header is present or not."
        >
          {headers.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
        <br></br>
        <TextField
          id="outlined-select-schema"
          margin="normal"
          select
          label="Infer Schema"
          value={inferSchema}
          onChange={(e) => {
            setInferSchema(e.target.value);
          }}
          helperText="Please select whether to infer the schema automatically."
        >
          {inferschemas.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </div>
    </React.Fragment>
  );
});

export default CSV;
