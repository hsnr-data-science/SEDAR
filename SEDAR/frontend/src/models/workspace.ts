import { IBasicPermission } from "./basicPermission";
import { IWithKey } from "./common";
import { ITag } from "./dataset";
import { IOntology } from "./ontology";
import { IUser } from "./user";

export interface IWorkspaceExchange {
    id: string;
    title: string;
    description: string;
    permission: IBasicPermission;
    owner: IUser;
    users: IUser[]; 
    ontologies: IOntology[];
    tags: ITag[];
    countDatasets: string;
    createdOn:string;
    lastUpdatedOn:string;
    isDefault:boolean;
}

export type IWorkspace = IWithKey<IWorkspaceExchange>
