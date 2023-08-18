import React, { memo } from "react";
import { Handle, Position } from "react-flow-renderer";
import { useTranslation } from "react-i18next";
import MergeTypeIcon from "@material-ui/icons/MergeType";
import { Typography } from "@material-ui/core";

export default memo(({ data }: { data: any }) =>
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
        <MergeTypeIcon style={{ color:"black" }}/>
        <Typography style={{ color:"black", margin: "0 0.5rem" }}>
          {t("workflow.items.join")}
        </Typography>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input_1"
        style={{ background: "#555", top: "33%" }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="input_2"
        style={{ background: "#555", top: "66%" }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="output"
        style={{ background: "#555" }}
      />
    </>
  );
});
