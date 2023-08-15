import Typography from "@material-ui/core/Typography";
import React, { memo } from "react";

import { Handle, Position } from "react-flow-renderer";
import { useTranslation } from "react-i18next";
import HubIcon from '@mui/icons-material/Hub';
import { IData } from "./data";

export default memo(({ data }: { data: IData }) =>

    /**
     *
     * @param data
     */
{
  const { t } = useTranslation();
  return (
      /**
       * @param input styling
       */
    <>
      <div
        style={{
          display: "flex",
          border: "1px solid #777",
          borderRadius: "0.4rem",
          backgroundColor: "#fff",
          padding: 10,
        }}
      >
        <HubIcon />
        <Typography style={{ margin: "0 0.5rem" }}>
          {t("workflow.items.obda")}
        </Typography>
      </div>
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: "#555" }}
      />
    </>
  );
});
