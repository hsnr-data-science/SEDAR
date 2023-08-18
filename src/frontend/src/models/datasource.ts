export interface IIngestion {
    ended: string;
    error: string;
    number: number; 
    revision: number; 
    started: string;
    state: string;
}

export interface IRevision{
    continuation_timers: string[];
    created: string;
    name: string;
    number: number;
    plugin_files: string;
    plugin_packages: string;
    read_format: string;
    read_options: [key: string];
    read_type: string;
    source_files: string[];
    spark_packages: string[];
    update_for: string;
    write_format: string;
    write_mode: string;
    write_options: [key: string];
    write_type: string;
}
  
export interface IDatasource {
    currentRevision: number;
    id: string;
    ingestions: IIngestion[];
    last_successful_ingestion: string;
    lates_ingestion: number;
    revisions: IRevision[];
}