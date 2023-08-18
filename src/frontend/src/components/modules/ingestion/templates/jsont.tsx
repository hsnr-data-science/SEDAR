import React, { useEffect } from "react";
import { observer } from "mobx-react-lite";
import ViewModel from "../viewModel";
import IViewProps from "../../../../models/iViewProps";
import { TextField, MenuItem } from "@material-ui/core";
import { useTranslation } from "react-i18next";

const multiLines = [
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
* JSON component for the ingestion view. 
*/
const JSONtemplate: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
  const { t } = useTranslation();
  const [idcolumn, setIdColumn] = React.useState('');
  const [multiLine, setMultiLine] = React.useState('true');

  function handleForm() {
    var def = JSON.parse(viewModel.datasourceDefinition);
    def.read_format = "json";
    def.spark_packages = ["org.mongodb.spark:mongo-spark-connector_2.12:3.0.0"];
    def.read_options = { "multiLine": multiLine }
    if (idcolumn !== '') {
      def.id_column = idcolumn;
    }
    viewModel.datasourceDefinition = JSON.stringify(def, null, "\t");
  }

  useEffect(() => {
    handleForm();
  }, [idcolumn, multiLine]);

  return (
    <React.Fragment>

      <div>
        <TextField
          id="outlined-select-delimiter"
          margin="normal"
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
          label="MultiLine"
          value={multiLine}
          onChange={(e) => {
            setMultiLine(e.target.value);
          }}
          helperText="Please select if JSON is multi line, i.e. whether in one line (false) or multiple lines (true)"
        >
          {multiLines.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

      </div>
    </React.Fragment>
  );
});

export default JSONtemplate;
