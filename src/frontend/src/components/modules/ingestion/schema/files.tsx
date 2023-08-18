import { Accordion, AccordionDetails, AccordionSummary, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from "@material-ui/core";
import React from "react";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { IFile } from "../../../../models/schema";

/**
* Component that represents the schema view for files.
*/
export const Files = (props: { file: IFile })=> {
    const { file } = props;

    return (
        <React.Fragment>
            <Accordion>
                <AccordionSummary
                expandIcon={<ExpandMoreIcon />}
                aria-controls="panel2a-content"
                id="panel2a-header"
                >
                <Typography>{file.filename + ' ('+file.sizeInBytes.toString()+' Byte)'}</Typography>
                </AccordionSummary>
                <AccordionDetails>
                    <TableContainer component={Paper}>
                        <Table aria-label="collapsible table">
                            <TableHead>
                                <TableRow>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {Object.entries(file.properties).map((t,k) => (
                                    <TableRow>
                                        <TableCell>{t[0]}:</TableCell>
                                        <TableCell>{t[1]}</TableCell>
                                    </TableRow>
                                    
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </AccordionDetails>
            </Accordion>
        </React.Fragment>
    );
}