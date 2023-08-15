import { makeObservable, observable } from "mobx";
import React from "react";
import ContentStore from "../../../../../models/contentStore";
import { useTranslation } from "react-i18next";
import { IDataset } from "../../../../../models/dataset";
import StoreStatus from "../../../../../models/storeStatus.enum";
import DeequViewModel from "../viewModel";
import workspacesStore from "../../../../../stores/workspaces.store";
import View from "./main.component";

class ViewModel extends ContentStore {
    @observable dataset: IDataset | null = null;
    @observable constraints: string | null = null;
    @observable filterErg: string | null = null;
    @observable deequErg: string | null = null;
    @observable superViewModel: DeequViewModel | null = null;
    @observable version: string | null = null;


    @observable datasourceDefinition: string = '';
    @observable isUpdateFor: boolean = false;
    @observable filters: object | null = null;
    @observable flag: boolean = false;

    constructor(item: IDataset, superViewModel: DeequViewModel, validation_result: object | null = null, constraints: string | null = null, version: string | null = null) {
        super();
        this.dataset = item;
        this.superViewModel = superViewModel;
        this.version = version;
        this.datasourceDefinition = JSON.stringify(this.dataset.datasource.revisions.find((r) => r.number == this.dataset.datasource.currentRevision), null, 2);

        if (validation_result == null && constraints == null) {
            console.error("received neither validation_result nor constraints");
        } else if (validation_result == null) {
            this.constraints = constraints;
        }
        this.initialize();

        makeObservable(this);
    }



    private async initialize() {
        this.setStatus(StoreStatus.initializing);
        try {
            if (this.deequErg == null) await this.getValidationResult();
            await this.getFilters();
            this.setStatus(StoreStatus.ready);
        } catch (ex) {
            this.setStatus(StoreStatus.failed);
            console.error(ex);
        }
    }

    private async getValidationResult() {
        if (!workspacesStore.currentWorkspace)
            throw new Error("Current workspace must be set.");


        const substring = "constraint";
        if (this.constraints.includes(substring)) {
            const response = await fetch(
                `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/cleaning/verify?version=${this.version}`,
                {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: this.constraints,
                    credentials: 'include',
                }
            );

            if (!response.ok) throw new Error(response.statusText);
            const deequTemp = (await response.json());
            this.deequErg = JSON.stringify(deequTemp);
        }
    }

    private async getFilters() {
        if (!workspacesStore.currentWorkspace)
            throw new Error("Current workspace must be set.");


        const substring = "constraint";
        if (this.constraints.includes(substring)) {
            const response = await fetch(
                `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/cleaning/filters?version=${this.version}`,
                {
                    method: "POST",
                    headers: {'Content-Type': 'application/json'},
                    body: this.constraints,
                    credentials: 'include',
                }
            );

            if (!response.ok) throw new Error(response.statusText);
            const filterTemp = (await response.json());
            this.filterErg = JSON.stringify(filterTemp);
        }
    }

    async filterPut(flag, data) {
        var object;
        if (flag) {
            object = { "filters": [] };
            object["filters"].push(data);
        } else {
            object = data;
        }

        var json = JSON.parse(JSON.stringify(object));

        json['datasourcedefinition'] = this.datasourceDefinition
        console.log("json", json)

        
        if (!this.dataset) return;
        if (JSON.parse(json['datasourcedefinition']).id_column === undefined){
            alert("You must specify an identifier column in the datasource definition!");
            return;
        } 

        this.setStatus(StoreStatus.working);
        try {
            if (!workspacesStore.currentWorkspace)
                throw new Error("Current workspace must be set.");

            const response = await fetch(
                `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/cleaning/filters?version=${this.version}`,
                {
                    method: "PUT",
                    headers: {'Content-Type': 'application/json'},
                    body: JSON.stringify(json),
                    credentials: 'include',
                }
            );

            if (!response.ok) throw new Error(response.statusText);

            this.initialize();
            this.setStatus(StoreStatus.ready);
            return response
        } catch (ex) {
            alert(ex.message);
            this.setStatus(StoreStatus.failed);
        }
    }

    async deleteResult() {
        this.setStatus(StoreStatus.working);
        try {
            if (!workspacesStore.currentWorkspace)
                throw new Error("Current workspace must be set.");

            const configs = {
                method: "DELETE",
                // headers: { Accept: "application/json" },
            };

            const response = await fetch(
                `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/cleaning/verify?version=${this.version}`,
                configs
            );
            if (!response.ok) throw new Error(response.statusText);
            this.deequErg = JSON.stringify({
                    "summary": {
                        "status": "Undefined",
                        "index": 0
                    },
                    "details": [
                        {
                            "type": "",
                            "column": "",
                            "status": "",
                            "index": "",
                            "constraint": "",
                            "message": ""
                        }
                    ]
                }
            );
                this.setStatus(StoreStatus.ready);
        } catch (ex) {
            console.error(ex.message);
            this.setStatus(StoreStatus.failed);
        }
    }



    getView = () => <View viewModel={this} />;
}

export default ViewModel;