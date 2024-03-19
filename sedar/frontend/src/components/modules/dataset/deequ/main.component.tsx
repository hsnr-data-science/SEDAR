import AppBar from "@material-ui/core/AppBar";
import Box from '@material-ui/core/Box';
import { green, yellow } from "@material-ui/core/colors";
import Dialog from "@material-ui/core/Dialog";
import Fab from "@material-ui/core/Fab";
import Grid from "@material-ui/core/Grid";
import IconButton from "@material-ui/core/IconButton";
import Paper from '@material-ui/core/Paper';
import Slide, { SlideProps } from "@material-ui/core/Slide";
import { styled, withStyles } from "@material-ui/core/styles";
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableHead from '@material-ui/core/TableHead';
import TableRow from '@material-ui/core/TableRow';
import Typography from "@material-ui/core/Typography";
import Close from "@material-ui/icons/Close";
import StoreStatus from "../../../../models/storeStatus.enum";
import SendIcon from '@material-ui/icons/PlayArrow';
import { observer } from "mobx-react-lite";
import React from "react";
import { useTranslation } from "react-i18next";
import IViewProps from "../../../../models/iViewProps";
import { StyledToolbar } from "../../../app/header/styles";
import ViewModel from "./viewModel";
import { IDataset } from '../../../../models/dataset'
import { Accordion, AccordionDetails, AccordionSummary, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, useMediaQuery, useTheme } from "@material-ui/core";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import workspacesStore from "../../../../stores/workspaces.store";
import CropDinIcon from '@mui/icons-material/CropDin';

import Constraint from "./constraints/main.component";
import { default as vM } from "./constraints";

import Suggest from "./suggestions/main.component";
import { default as vM2 } from "./suggestions";


const Transition = React.forwardRef((props: SlideProps, ref) => (
	<Slide direction="up" ref={ref} {...props} />
));

const Demo = styled('div')(({ theme }) => ({
	backgroundColor: theme.palette.background.paper,
}));

const Block = styled(Paper)(({ theme }) => ({
	...theme.typography.body2,
	padding: theme.spacing(1),
	textAlign: 'center',
	color: theme.palette.text.secondary,
}));

const TopRightFab = withStyles({
	root: {
		position: "absolute",
		top: 10,
		right: 35,
	},
})(Fab);

const TopRightFab2 = withStyles({
	root: {
		position: "absolute",
		top: 10,
		right: 200,
	},
})(Fab);




export const Deequ = (props: { item: IDataset, viewModel: ViewModel, version, validation_results }) => {
	const { t } = useTranslation();

	const { item, viewModel, version, validation_results } = props;
	viewModel.version = version;
	viewModel.validation_results = validation_results

	const [constraints, setConstraints] = React.useState({});
	const [openConstraintDialog, setOpenConstraintDialog] = React.useState(false);
	const [openSuggestDialog, setOpenSuggestDialog] = React.useState(false);

	if (validation_results == null || validation_results == 'undefined') {
		setOpenConstraintDialog(true);
	}


	const handleSubmit = (event) => {
		event.preventDefault();
		const data = new FormData(event.target);
		const substring = "type";
		if (viewModel.handleForm(data).includes(substring)) {
			setConstraints(viewModel.handleForm(data));
			setOpenConstraintDialog(true);
		}
		else {
			alert("Please select some constraint!");
		}
	};

	const column_only_constraints = ['isComplete', 'isUnique', 'isNonNegative', 'isPositive', 'containsCreditCardNumber', 'containsEmail', 'containsSocialSecurityNumber', 'containsURL'];
	const lambda_constraints = ["hasCompleteness", "hasEntropy", "hasMinLength", "hasMaxLength", "hasMin", "hasMax", "hasMean", "hasSum", "hasStandardDeviation", "hasApproxCountDistinct"];
	const lambda_operator = ["=", "<", ">", ">=", "<="];

	return (
		<React.Fragment>
			<Typography variant="h4" align="center" gutterBottom component="div">
				Deequ Constraint Definition for dataset
				<Box fontWeight='fontWeightMedium' display='inline' sx={{ fontFamily: 'Monospace' }}> {item.title} </Box>
				version
				<Box fontWeight='fontWeightMedium' display='inline' sx={{ fontFamily: 'Monospace' }}> {version}</Box>
			</Typography>
			<form onSubmit={handleSubmit}>
				<Block style={{ margin: "1rem" }}
				// xs={4}
				>
					<Typography variant="subtitle1">
						{t("generic.dataset")}
					</Typography>
					<TableContainer>
						<Table style={{ width: 0, margin: "auto" }} aria-label="simple table">
							<TableBody>
								<TableRow>
									<TableCell style={{ border: 0 }}><label htmlFor={"dl1!_!hasSize"}>hasSize</label></TableCell>
									<TableCell style={{ border: 0 }}>
										<select name={"dl2!_!hasSize"} id={"dl2!_!hasSize"}>
											{lambda_operator.map((item1, index1) => (
												<option value={item1}>{item1}</option>
											))}
										</select>
									</TableCell>
									<TableCell style={{ border: 0 }}><input type="number" step="any" id={"dl1!_!hasSize"} name={"dl1!_!hasSize"} /></TableCell>
									Number of Rows
								</TableRow>
							</TableBody>
						</Table>
					</TableContainer>
				</Block>
				<Typography variant="h5" align="center" gutterBottom component="div">
					Columns
				</Typography>

				<Grid style={{ marginTop: "1rem", width: "100%", paddingLeft: "1rem" }} container spacing={3}>
					{item.schema.entities.at(0).attributes.map((variable) => (
						<Grid item xs={4}>

							<Accordion>
								<AccordionSummary
									expandIcon={<ExpandMoreIcon />}
									aria-controls="panel2a-content"
									id="panel2a-header"
								>	<Typography variant="h6">{variable.name}</Typography>
								</AccordionSummary>
								<AccordionDetails style={{ position: "relative" }}>

									<Block>
										<TableContainer component={Paper}>
											<Table aria-label="simple table">
												<TableHead>
													<TableRow>
														<TableCell align="left">{t("deequ.constraint")}</TableCell>
														<TableCell align="center">{t("deequ.operator")}</TableCell>
														<TableCell align="center">{t("deequ.value")}</TableCell>
													</TableRow>
												</TableHead>
												<TableBody>
													{column_only_constraints.map((item2, index2) => (
														<TableRow>
															<TableCell align="left"><label htmlFor={"c!_!" + item2 + "!_!" + variable.name}>{item2}</label></TableCell>
															<TableCell align="center"></TableCell>
															<TableCell align="center"><input type="checkbox" id={"c!_!" + item2 + "!_!" + variable.name} name={"c!_!" + item2 + "!_!" + variable.name} /></TableCell>
														</TableRow>
													))}

													{lambda_constraints.map((item3, index3) => (
														<TableRow>
															<TableCell align="left"><label htmlFor={"l1!_!" + item3 + "!_!" + variable.name}>{item3}</label></TableCell>
															<TableCell align="center">
																<select name={"l2!_!" + item3 + "!_!" + variable.name} id={"l2!_!" + item3 + "!_!" + variable.name}>
																	{lambda_operator.map((item4, index4) => (
																		<option value={item4}>{item4}</option>
																	))}
																</select>
															</TableCell>
															<TableCell align="center"><input type="number" step="any" id={"l1!_!" + item3 + "!_!" + variable.name} name={"l1!_!" + item3 + "!_!" + variable.name} /></TableCell>
														</TableRow>
													))}

													<TableRow>
														<TableCell align="left"><label htmlFor={"cc!_!hasDataType!_!" + variable.name}>hasDataType</label></TableCell>
														<TableCell align="center"></TableCell>
														<TableCell align="center">
															<select id={"cc!_!hasDataType!_!" + variable.name} name={"cc!_!hasDataType!_!" + variable.name}>
																<option value=""></option>
																<option value="Null">Null</option>
																<option value="Fractional">Fractional</option>
																<option value="Integral">Integral</option>
																<option value="Boolean">Boolean</option>
																<option value="String">String</option>
																<option value="Numeric">Numeric</option>
															</select>
														</TableCell>
													</TableRow>

													<TableRow>
														<TableCell style={{ border: 0 }} align="left"><label htmlFor={"cc!_!isContainedIn!_!" + variable.name}>isContainedIn</label></TableCell>
														<TableCell style={{ border: 0 }} align="center">{t("deequ.comma_separated")}</TableCell>
														<TableCell style={{ border: 0 }} align="center"><input type="text" id={"cc!_!isContainedIn!_!" + variable.name} name={"cc!_!isContainedIn!_!" + variable.name} /></TableCell>
													</TableRow>
												</TableBody>
											</Table>
										</TableContainer>
									</Block>

								</AccordionDetails>
							</Accordion>
						</Grid>
					))}
				</Grid>




				<TopRightFab
					variant="extended"
					type="submit"
					style={{
						backgroundColor: green[500]
					}}
					color="primary">
					<SendIcon style={{ marginRight: "0.4rem" }} />
					{t("generic.execute")}
				</TopRightFab>

			</form>
			<TopRightFab2
				variant="extended"
				type="submit"
				style={{
					backgroundColor: yellow[500]
				}}
				color="primary"
				onClick={() => {
					setOpenSuggestDialog(true);
				}}>
				<CropDinIcon style={{ marginRight: "1rem" }} />
				{t("deequ.suggest")}
			</TopRightFab2>


			<Dialog open={openConstraintDialog} style={{ zIndex: 20000, padding: 0 }} maxWidth={false}
				fullWidth>
				<DialogTitle></DialogTitle>
				<DialogContent>
					<Constraint viewModel={new vM(item as IDataset, viewModel, null, constraints.toString(), viewModel.version)} />
					<DialogActions>
						<Button variant="outlined" onClick={() => {
							setOpenConstraintDialog(false)
						}}>{t("generic.cancel")}</Button>
					</DialogActions>
				</DialogContent>
			</Dialog>

			<Dialog open={openSuggestDialog} style={{ zIndex: 20000, padding: 0 }} maxWidth={false}
				fullWidth>
				<DialogTitle></DialogTitle>
				<DialogContent>
					<Suggest viewModel={new vM2(item as IDataset, viewModel.version)} />
					<DialogActions>
						<Button variant="outlined" onClick={() => {
							setOpenSuggestDialog(false)
						}}>{t("generic.cancel")}</Button>
					</DialogActions>
				</DialogContent>
			</Dialog>

		</React.Fragment>

	);
}

export default Deequ;
