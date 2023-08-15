import {action, computed, IObservableArray, makeObservable, observable} from "mobx";
import React from "react";
import ContentStore from "../../../../models/contentStore";
import { IDataset } from "../../../../models/dataset";
import StoreStatus from "../../../../models/storeStatus.enum";
import workspacesStore from "../../../../stores/workspaces.store";
import ConstraintViewModel from "./constraints";
import View from "./main.component";
import appStore from "../../../../stores/app.store";

import {default as vM} from "../../dataset";

class ViewModel extends ContentStore {
	@observable dataset: IDataset | null = null;
	@observable constraints: string | null = null;
	@observable deequErg: string | null = null;
	@observable version: string | null = null;
	@observable validation_results: string | null = null;
	@observable suggestErg: string | null = null;


	constructor(item: IDataset) {
		super();
		this.dataset = item;
		makeObservable(this);
	}

	constructForm(data: FormData) {
		var object = { "constraints": [] };
		var tempValue = '';
		
		data.forEach((value, key) => {
			if (value != '') {
				var valAr = key.split('!_!');
				if (valAr[0] == 'c') {
					var eintrag = { "type": valAr[1], "params": { "column": valAr[2] } };
					object["constraints"].push(eintrag);
				} else if (valAr[0] == 'l2' || valAr[0] == 'dl2') {
					tempValue = value.toString();
				} else if (valAr[0] == 'l1') {
					if (tempValue != "") {
						var eintrag2 = { "type": valAr[1], "params": { "column": valAr[2], "operator": tempValue, "value": parseFloat(value.toString()) } };
						object["constraints"].push(eintrag2);
						tempValue = "";
					}
				} else if (valAr[0] == 'dl1') {
					if (tempValue != "") {
						var eintrag3 = { "type": valAr[1], "params": { "operator": tempValue, "value": parseFloat(value.toString()) } };
						object["constraints"].push(eintrag3);
						tempValue = "";
					}
				} else if (valAr[0] == 'cc') {
					var eintrag4 = { "type": valAr[1], "params": { "column": valAr[2], "value": value } };
					object["constraints"].push(eintrag4);
					tempValue = "";

				}
			}
		});

		return (JSON.stringify(object));
	}

	handleForm(data: FormData) {
		this.setStatus(StoreStatus.working);
		try {
			const constraints = this.constructForm(data);
			this.setStatus(StoreStatus.ready);
			this.constraints = constraints;
			return constraints
		} catch (ex) {
			alert(ex.message);
			this.setStatus(StoreStatus.failed);
		}
	}

	getView = () => <View item={this.dataset} viewModel={this} version={this.version} validation_results={this.validation_results}/>;
}

export default ViewModel;
