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
    @observable suggestErg: string | null = null;
    @observable version: string | null = null;

    constructor(item: IDataset, version: string | null = null) {
        super();
        this.dataset = item;
        this.version = version;

        this.initialize();

        makeObservable(this);
    }

    private async initialize() {
        await this.getSuggestions();
        this.setStatus(StoreStatus.initializing);
        try {
            this.setStatus(StoreStatus.ready);
        } catch (ex) {
            this.setStatus(StoreStatus.failed);
            console.error(ex);
        }
    }

    private async getSuggestions() {
        if (!workspacesStore.currentWorkspace)
            throw new Error("Current workspace must be set.");
        
        const response = await fetch(
            `${process.env.MAIN_BACKEND_URL}/api/v${process.env.MAIN_BACKEND_API_VERSION}/workspaces/${workspacesStore.currentWorkspace.id}/datasets/${this.dataset.id}/cleaning/suggest?session_id=-&version=${this.version}`,
            {
                method: "GET",
                headers: { Accept: "application/json" },
                credentials: 'include',
            }
        );

        if (!response.ok) throw new Error(response.statusText);
        
        const deequTemp = (await response.json());
        console.log(deequTemp);
        this.suggestErg = JSON.stringify(deequTemp);
    }

    getView = () => <View viewModel={this} />;
}

export default ViewModel;