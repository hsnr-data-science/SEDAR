import React, { memo } from "react";
import { Handle, Position } from "react-flow-renderer";
import { useTranslation } from "react-i18next";
import TrendingFlatSharpIcon from '@material-ui/icons/TrendingFlatSharp';
import { Typography } from "@material-ui/core";
import { IData } from "./data";

export default memo(({ data }: { data: IData }) => {
  const { t } = useTranslation();
  return (
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
        <TrendingFlatSharpIcon style={{ color:"black" }}/>
        <Typography style={{ color:"black", margin: "0 0.5rem" }}>
          {t("workflow.items.flatten")}
        </Typography>
      </div>
      <Handle
        type="target"
        position={Position.Left}
        id="input"
        style={{ background: "#555" }}
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
