import React, { useEffect } from 'react';
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
import { useTranslation } from "react-i18next";
import IViewProps from "../../../../../models/iViewProps";
import ViewModel from "./viewModel";
import { withStyles } from "@material-ui/core/styles";
import Fab from "@material-ui/core/Fab";
import Backdrop from '@mui/material/Backdrop';
import CircularProgress from '@mui/material/CircularProgress';


const TopRightFab = withStyles({
	root: {
		position: "absolute",
		top: 0,
		right: 0,
	},
})(Fab);

const Constraint: React.FC<IViewProps<ViewModel>> = observer(({ viewModel }) => {
	const { t } = useTranslation();

	const [openUpdateDialog, setOpenUpdateDialog] = React.useState(false);
	const [load, setLoad] = React.useState(false);
	const [open, setOpen] = React.useState(true);

	var runner = 0;

	const tablecontent = JSON.parse(viewModel.deequErg);
	var details;
	var keys;

	if (tablecontent != null) {
		details = tablecontent["details"];
		keys = Object.keys(details[0]);
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
		]
	};

	var filtercontent = JSON.parse(viewModel.filterErg);

	useEffect(() => {
		if (filtercontent != null) {
			setOpen(false);
		};
	});

	if (filtercontent != null) {
		var filterorder = { "filters": [] };
		for (var i = 0; i < details.length; i++) {
			for (var j = 0; j < filtercontent["filters"].length; j++) {
				if ((details[i]["type"] == filtercontent["filters"][j]["type"])
					&&
					(details[i]["column"] == filtercontent["filters"][j]["column"])
				) {
					filterorder["filters"].push(filtercontent["filters"][j]);
					//flag = false;
				}
			}

		}
		filtercontent = filterorder;
	}


	const handleSubmit = function (value) {
		viewModel.filters = filtercontent["filters"][value];
		viewModel.flag = true;
		setOpenUpdateDialog(true);
	}

	const handleAll = function () {
		viewModel.filters = filtercontent;
		viewModel.flag = false;
		setOpenUpdateDialog(true);

	}
	function runnerCount(value) {
		if (value > 0) {
			if (filtercontent["filters"][value - (runner + 1)]["type"] != details[value - 1]["type"]) {
				runner++;
			}
		}
		return runner;
	}



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
		<Box style={{ position: "relative", margin: "1rem" }}>
			<TopRightFab
				style={{ backgroundColor: red[500] }}
				variant="extended"
				color="primary"
				onClick={() => viewModel.deleteResult()}
			>
				<DeleteIcon />
				{t("generic.delete")}
			</TopRightFab>
			<Typography variant="h6">
				Deequ Data Cleaning
			</Typography>


			<Dialog open={openUpdateDialog} style={{ zIndex: 20000, padding: 0 }} maxWidth="sm" fullWidth>
				<DialogTitle>{t("generic.update")}</DialogTitle>
				<DialogContent>
					<DialogContentText>{t("generic.updateMessage")}</DialogContentText>
					<form onSubmit={(e) => {
						e.preventDefault();
						setLoad(true);
						viewModel.filterPut(viewModel.flag, viewModel.filters).then((res) => {
							setLoad(false);
							if (res.ok) { alert(t("deequ.dataset.created")) };
							setOpenUpdateDialog(!openUpdateDialog);
							viewModel.isUpdateFor = false;
						}).catch(error => {
							alert(error);
							setLoad(false);
						});
					}}>
						<Grid container spacing={2} style={{ position: "relative" }}>
							<Grid item xs={12} style={{ position: "absolute", top: -10, right: 0 }}>
								<FormControlLabel
									control={
										<Checkbox
											checked={viewModel.isUpdateFor}
											color="primary"
											disabled={viewModel?.dataset?.schema?.type == 'UNSTRUCTURED' || viewModel?.dataset?.datasource?.revisions?.find((r) => r.number == viewModel?.dataset?.datasource?.currentRevision).write_type == 'CUSTOM'}
											onChange={(e) => {
												var def = JSON.parse(viewModel.datasourceDefinition);
												if (viewModel.isUpdateFor == false) {
													def['update_for'] = viewModel.dataset.datasource.id;
												} else {
													delete def['update_for'];
												}
												viewModel.datasourceDefinition = JSON.stringify(def, null, "\t")
												viewModel.isUpdateFor = !viewModel.isUpdateFor;
											}}
										/>
									}
									label={t("dataset.historyTabUpdateFor") + '?'}
								/>
							</Grid>
							<Grid item xs={12}>
								<TextField
									multiline
									rows={8}
									onChange={(e) => viewModel.datasourceDefinition = e.target.value as string}
									value={viewModel.datasourceDefinition}
									margin="dense"
									label={t("ingestion.datasetDefinition")}
									fullWidth
									required
								/>
							</Grid>
						</Grid>
						<DialogActions>
							<Button variant="outlined" onClick={() => {
								setOpenUpdateDialog(!openUpdateDialog);
								viewModel.datasourceDefinition = '';
								viewModel.isUpdateFor = false;
							}}>{t("generic.cancel")}</Button>
							<Button variant="outlined" disabled={load} type="submit">{t("generic.save")}</Button>
						</DialogActions>
					</form>
				</DialogContent>
			</Dialog>

			{tablecontent != null &&
				<Box>
					<Typography variant="subtitle1">
						{t("deequ.summary")}:
					</Typography>
					<Typography variant="subtitle2">
						{t("deequ.status")}: {tablecontent["summary"]["status"]}
					</Typography>
					<Typography variant="subtitle2">
						{t("deequ.index")}: {tablecontent["summary"]["index"]}
					</Typography>

					<TableContainer component={Paper}>
						<Table
						// sx={{ minWidth: 650 }} aria-label="simple table"
						>
							<TableHead>
								<TableRow>
									{keys.map((item, index) => (
										<TableCell align="center">{keys[index]}</TableCell>
									))}

									{filtercontent != null && filtercontent["filters"].length > 0 &&
										<TableCell align="center">
											<Button variant="contained"
												onClick={() => handleAll()}
											>
												{t("deequ.filterall")}:
											</Button>
										</TableCell>
									}
								</TableRow>
							</TableHead>
							<TableBody>

								{details.map(function (item, index) {
									return (
										<TableRow
										// sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
										>

											<TableCell align="center">{item.type}</TableCell>
											<TableCell align="center">{item.column}</TableCell>
											<TableCell align="center">{item.status}</TableCell>
											<TableCell align="center">{item.index}</TableCell>
											<TableCell align="center">{item.constraint}</TableCell>
											<TableCell align="center">{item.message}</TableCell>

											{filtercontent !== null && filtercontent["filters"].length > 0 &&
												<TableCell align="center">
													{(filtercontent["filters"].length > index - runnerCount(index) && item.type == filtercontent["filters"][index - runner]["type"]) &&
														<Button variant="contained"
															onClick={() => handleSubmit(index - runner)}
														>
															{filtercontent["filters"][index - runner]["filter_expression"]}
														</Button>
													}
												</TableCell>
											}
										</TableRow>
									);
								})}
							</TableBody>
						</Table>
					</TableContainer>
				</Box>
			}
		</Box>
	);
});

export default Constraint;
