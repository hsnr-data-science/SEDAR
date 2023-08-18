import Box from '@material-ui/core/Box';
import Button from '@material-ui/core/Button';
import { red } from "@material-ui/core/colors";
import Paper from '@material-ui/core/Paper';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from "@material-ui/core/Typography";
import DeleteIcon from '@material-ui/icons/Delete';
import { observer } from "mobx-react-lite";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Grid, TextField, Checkbox, FormControlLabel } from '@material-ui/core';
import React from "react";
import { useTranslation } from "react-i18next";
import IViewProps from "../../../../../models/iViewProps";
import ViewModel from "./viewModel";
import { withStyles } from "@material-ui/core/styles";
import Fab from "@material-ui/core/Fab";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';
import { useEffect } from 'react';
import routingStore from "../../../../../stores/routing.store";

const TopRightFab = withStyles({
	root: {
		position: "absolute",
		top: 0,
		right: 0,
	},
})(Fab);

const Suggest: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
	const { t } = useTranslation();

	const [open, setOpen] = React.useState(true);

	const tablecontent = JSON.parse(viewModel.suggestErg);
	console.log("tablecontent", tablecontent);
	var details;
	var keys = ['Column', 'Current Value', 'Explanation', "Suggestion Rule", 'Rule Description']
	if (tablecontent != null) {
		details = tablecontent["constraint_suggestions"];
	} else {
		details = [
			{
				"constraint_name": "",
				"column_name": "",
				"current_value": "",
				"description": "",
				"suggesting_rule": "",
				"rule_description": "",
				"code_for_constraint": ""
			},
		];
	}

	useEffect(() => {
		if (tablecontent != null) {
			setOpen(false);
		};
	});

	if (open) {
		return (
			<Backdrop
				sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}
				open={open}>
				<CircularProgress color="inherit" />
			</Backdrop>
		)
	}

	return (
		<div>
			<Box style={{ position: "relative", margin: "1rem" }}>


				<TableContainer component={Paper}>
					<Table>
						<TableHead>
							<TableRow>
								{keys.map((item, index) => (
									<TableCell align="center">{keys[index]}</TableCell>
								))}
							</TableRow>
						</TableHead>
						<TableBody>

							{details.map(function (item, index) {
								return (
									<TableRow>
										<TableCell align="center">{item.column_name}</TableCell>
										<TableCell align="center">{item.current_value}</TableCell>
										<TableCell align="center">{item.description}</TableCell>
										<TableCell align="center">{item.suggesting_rule}</TableCell>
										<TableCell align="center">{item.rule_description}</TableCell>
									</TableRow>
								);
							})}
						</TableBody>
					</Table>
				</TableContainer>
			</Box>
		</div>
	);
});

export default Suggest;
