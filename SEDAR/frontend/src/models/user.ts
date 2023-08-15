import { IBasicPermission } from "./basicPermission";

export interface IUser {
    email: string,
    firstname: string,
    lastname: string,
    isAdmin: boolean,
    username: string,
    workspacePermissions: IBasicPermission,
    datasetPermissions: IBasicPermission,
    countDatasets: number,
}
