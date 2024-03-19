import { IOntology } from "./ontology";

export interface IFK {
    dataset: string;
    attribute: IAttribute;
}

export interface IAttribute {
    id: string;
    name: string;
    dataType: string;
    dataTypeInternal: string;
    nullable: boolean;
    attributes: IAttribute[];
    isArrayOfObjects: boolean;
    isObject: boolean;
    description: string;
    isPk: boolean;
    isFk: boolean;
    containsPII: boolean;
    annotation: IAnnotation[];
    stats: IStat;
    foreignKeysTo: IFK[];
}

export interface IEntity {
    id: string;
    internalname: string;
    displayName: string;
    attributes: IAttribute[];
    description: string;
    annotation: IAnnotation[];
    customAnnotation: IAnnotation[];
    countOfRows: number;
}
  
export interface IFile {
    id: string;
    filename: string;
    properties: [key: string];
    description: string;
    annotation: IAnnotation[];
    customAnnotation: IAnnotation[];
    sizeInBytes: number;
}

export interface ISchema {
    id: string;
    type: string;
    files: IFile[];
    entities: IEntity[];
}

export interface IStat {
    id : string;
    type: string;
    completeness: number;
    approximateCountDistinctValues: number;
    dataType: string;
    isDataTypeInferred: boolean,
    mean: number;
    maximum: number;
    minimum: number;
    sum: number;
    standardDeviation: number;
}

export interface IAnnotation{
    id: string;
    instance: string;
    description: string;
    key: string;
    ontology: IOntology;
}
