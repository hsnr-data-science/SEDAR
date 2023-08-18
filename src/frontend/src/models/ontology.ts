import { IUser } from "./user";

export interface IOntology {
    id: string;
    title: string;
    description: string;
    author: IUser;
    createdOn: string;
    lastUpdatedOn: string;
    graphname: string;
    sizeInBytes: string;
    countTriples: string;
    countUsage: number;
    filename: string;
    mimetype: string;
    canBeDeleted: boolean;
}