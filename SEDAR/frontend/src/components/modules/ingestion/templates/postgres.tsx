import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import IViewProps from "../../../../models/iViewProps";
import { Button, Box, TextField, MenuItem, Card, CardActions, CardContent, CardHeader, Checkbox, Chip, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, FormControl, FormControlLabel, Grid, IconButton, InputLabel, Paper, Select, Switch, Tab, Table, TableBody, TableCell, TableContainer, TableRow, Tabs, Typography } from "@material-ui/core";
import { useTranslation } from "react-i18next";

/**
* Postgres component for the ingestion view. 
*/
const Postgres: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t } = useTranslation();

  const [idcolumn, setIdColumn] = React.useState('');
  const [url, setUrl] = React.useState('');
  const [dbtable, setDbtable] = React.useState('');
  const [user, setUser] = React.useState('');
  const [password, setPassword] = React.useState('');


  function handleForm() {
    var def = JSON.parse(viewModel.datasourceDefinition);
    def.read_format = "jdbc";
    def.read_options = { "url": url, "dbtable": dbtable, "user": user, "password": password }
    if (idcolumn !== '') {
      def.id_column = idcolumn;
    }
    viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
  }

  useEffect(() => {
    handleForm();
}, [idcolumn, url, dbtable, user, password ]);

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
          label="URL"
          value={url}
          fullWidth
          onChange={(e) => {
            setUrl(e.target.value);
          }}
          helperText="Please specify the url! For example: jdbc:postgresql://<ip_address>:5432/smartfactory"
        >
        </TextField>

        <br></br>
        <TextField
          id="outlined-select-header"
          margin="normal"
          label="DB table"
          value={dbtable}
          onChange={(e) => {
            setDbtable(e.target.value);
          }}
          helperText="Please specify the Postgres table! For example: chemicals"
        >
        </TextField>
        <br></br>
        <TextField
          id="outlined-select-schema"
          margin="normal"
          label="User"
          value={user}
          onChange={(e) => {
            setUser(e.target.value);
          }}
          helperText="Please specify database user"
        >
        </TextField>
        <br></br>
        <TextField
          id="outlined-select-schema"
          margin="normal"
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
          }}
          helperText="Please enter the user's password!"
        >
        </TextField>


      </div>
    </React.Fragment>
  );
});

export default Postgres;
