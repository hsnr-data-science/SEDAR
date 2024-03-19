from endpoints.v1.datasources import DatasourceDefinitionInput
from pywebhdfs.webhdfs import PyWebHdfsClient
from werkzeug.datastructures import FileStorage
from typing import Dict
from commons.models.datasource import DatasourceDefinition, Revision
from datetime import datetime
from commons.configuration.settings import Settings

def build_revision(
    input: DatasourceDefinitionInput,
    uploaded_files: Dict[str, FileStorage],
    datasource: DatasourceDefinition,
    workspace_id: str,
) -> Revision:
    settings = Settings()
    hdfs = PyWebHdfsClient(host=settings.hdfs_storage.namenode, port=settings.hdfs_storage.web_port)

    current_revision: Revision = datasource.resolve_current_revision()
    next_revision = current_revision.number + 1 if current_revision else 0

    # save source files
    sources_path = f"/datalake/{workspace_id}/sources/{str(datasource.pk)}"
    source_files = []
    for key in input.source_files:
        if key in uploaded_files:
            file = uploaded_files[key]
            data = file.read()
            name = f"r{next_revision:03}_{key}.{file.filename.split('.')[-1]}"
            hdfs.create_file(f"{sources_path}/{name}", data, mode="overwrite")
            source_files.append(name)
        elif hdfs.exists_file_dir(f"{sources_path}/{key}"):
            source_files.append(key)

    # save plugin files
    plugins_path = f"/datalake/{workspace_id}/plugins/{str(datasource.pk)}"
    plugin_files = []
    for key in input.plugin_files:
        if key in uploaded_files:
            file = uploaded_files[key]
            data = file.read()
            name = f"r{next_revision:03}_{key}.{file.filename.split('.')[-1]}"
            hdfs.create_file(f"{plugins_path}/{name}", data, mode="overwrite")
            plugin_files.append(name)
        elif hdfs.exists_file_dir(f"{plugins_path}/{key}"):
            plugin_files.append(key)

    # create revision
    return Revision(
        # general
        number=next_revision,
        created=datetime.now(),
        name=input.name,
        id_column=input.id_column,
        spark_packages=input.spark_packages,
        # read
        source_files=source_files,
        read_type=input.read_type,
        read_format=input.read_format,
        read_options=input.read_options,
        # save
        update_for=input.update_for,
        write_type=input.write_type,
        write_format=input.write_format,
        write_options=input.write_options,
        write_mode=input.write_mode,
        # continuation
        continuation_timers=input.continuation_timers,
        # plugins
        plugin_packages=input.plugin_packages,
        plugin_files=plugin_files,
    )
