import { IUser } from "./user";

export interface ITestCases {
    id: string,
    description: string,
    status: string,
    started: string,
    ended: string,
    error: string,
    delta: string,
}

export interface ITest {
    id: string,
    status: string,
    started: string,
    ended: string,
    numberOfTestCases: string,
    testCases: ITestCases[],
    delta: string,
    error: string,
    startedBy: IUser,
}
