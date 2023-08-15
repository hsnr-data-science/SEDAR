import { IBasicPermission } from "./basicPermission";
import { IDatasource } from "./datasource";
import { IAnnotation, ISchema } from "./schema";
import { IUser } from "./user";

export interface ITag {
    id: string;
    title: string;
    annotation: IAnnotation;
    links: string[];
}

export interface IChange {
    key: string;
    from: string;
    to: string;
}

export interface ILog {
    type: string;
    version: number;
    description;
    user: IUser; 
    createdOn: Date;
    changes: IChange[];
}

export interface INotebook {
    id: string,
    title: string,
    description: string,
    author: IUser,
    createdOn: string,
    lastUpdatedOn: string,
    type: string,
    isPublic: boolean,
    version: string,
    mlruns: string,
}

export interface IDataset {
    id: string;
    title: string;
    language: string,
    description: string; 
    owner: IUser;
    createdOn: string; 
    lastUpdatedOn: string; 
    datasource: IDatasource;
    author: string;
    longitude: string;
    latitude: string;
    rangeStart: Date;
    rangeEnd: Date;
    license: string;
    isPublic: boolean;
    users: IUser[];
    permission: IBasicPermission;
    lineage:  string[];
    tags: ITag[];
    schema: ISchema;
    isFavorite: boolean;
    isIndexed: boolean;
    notebooks: INotebook[];
    polymorph: IDataset[];
    customLinkDescription: string;
    isUpdateFor: boolean;
}