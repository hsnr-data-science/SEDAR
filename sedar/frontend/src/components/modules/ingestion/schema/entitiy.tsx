import { Accordion, AccordionDetails, AccordionSummary, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@material-ui/core";
import React from "react";
import ViewModel from "..";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { t } from "i18next";
import { Attribute } from "./attribute";
import { IEntity } from "../../../../models/schema";

/**
* Component that represents the schema view for entities.
*/
export const Entity = (props: { entity: IEntity, viewModel: ViewModel})=> {
    const { entity, viewModel} = props;

    return (
        <React.Fragment>
            <Accordion>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
                >
                <Typography>{entity.internalname}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TableContainer component={Paper}>
                        <Table aria-label="collapsible table">
                            <TableHead>
                                <TableRow>
                                    <TableCell align="left">{t("ingestion.publishSchemaTabAttributeNameHeader")}</TableCell>
                                    <TableCell align="left">{t("ingestion.publishSchemaTabAttributeDatatypeHeader")}</TableCell>
                                    <TableCell align="left">{t("ingestion.publishSchemaTabAttributePKHeader")}</TableCell>
                                    <TableCell align="left">{t("ingestion.publishSchemaTabAttributeNullableHeader")}</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {entity.attributes.map((item) => (
                                    <Attribute attribute={item} viewModel={viewModel} prefix={''}/>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </AccordionDetails>
            </Accordion>
        </React.Fragment>
    );
}