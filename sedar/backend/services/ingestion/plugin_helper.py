import importlib
import inspect
import json
import os
import sys
from glob import glob
from types import ModuleType
from typing import Any, Dict

from commons.models.datasource import DatasourceDefinition, Revision
from pyspark.sql import DataFrame, SparkSession, dataframe
from pywebhdfs.webhdfs import PyWebHdfsClient
from commons.configuration.settings import Settings

settings = Settings()

load_plugin = None
after_load_plugins = []

def _check_method(
    plugin: ModuleType, name: str, return_type: Any, parameters: Dict[str, Any]
) -> bool:
    # check method existens
    if name and not hasattr(plugin, name):
        return False
    # check signature
    signature = inspect.signature(getattr(plugin, name))
    # check return type
    if return_type and signature.return_annotation is not return_type:
        return False
    # check parameters
    for p_name, p_type in parameters.items():
        # check parameter existens
        if not p_name in signature.parameters:
            return False
        # check parameter type
        if signature.parameters[p_name].annotation is not p_type:
            return False
    # passed all tests
    return True


def load_plugins(datasource: DatasourceDefinition, workspace_id:str):
    global load_plugin
    global after_load_plugins

    load_plugin = None
    after_load_plugins = []

    revision: Revision = datasource.resolve_current_revision()

    # -----[ define paths ]-------------------------------------------------------------------------
    env_path = os.path.join("..", "..", "tmp", "ingestion_envs", str(datasource.pk))
    packages_path = os.path.join(env_path, "packages")
    lock_file_path = os.path.join(packages_path, "package_lock.json")
    plugin_path = os.path.join(env_path, "plugins")

    sys.path.append(plugin_path)

    # -----[ create folders and env ]---------------------------------------------------------------
    if not os.path.exists(env_path):
        print("[INGESTION-SPAWNER] Create dir")
        os.makedirs(env_path)

    if not os.path.exists(packages_path):
        print("[INGESTION-SPAWNER] Create dir")
        os.makedirs(packages_path)

    if os.path.exists(plugin_path):
        print("[INGESTION-SPAWNER] Remove old plugins")
        filelist = glob(os.path.join(plugin_path, "*.py"))
        for f in filelist:
            os.remove(f)
    else:
        print("[INGESTION-SPAWNER] Create plugins dir")
        os.mkdir(plugin_path)

    # -----[ install plugin packages ]--------------------------------------------------------------
    print("[INGESTION-SPAWNER] Install packages")
    # load locks
    existing_lock = []
    if os.path.exists(lock_file_path):
        existing_lock = json.load(open(lock_file_path, "r"))
    # install all packages that differ from locks
    new_lock = []
    for package in revision.plugin_packages:
        if not package in existing_lock:
            os.system(f"pip install {package} --upgrade --target={packages_path}")
        new_lock.append(package)
    # write new lock
    package_file = open(lock_file_path, "w")
    package_file.write(json.dumps(new_lock, indent=4))
    package_file.close()

    # -----[ add plugins ]--------------------------------------------------------------------------
    if len(revision.plugin_files) > 0:
        print("[INGESTION-SPAWNER] Download plugins")
        hdfs = PyWebHdfsClient(host=settings.hdfs_storage.namenode, port=settings.hdfs_storage.web_port)
        hdfs_path = f"/datalake/{workspace_id}/plugins/{str(datasource.pk)}"

        for plugin in revision.plugin_files:
            file_data = hdfs.read_file(f"{hdfs_path}/{plugin}")
            file = open(os.path.join(plugin_path, plugin), "wb")
            file.write(file_data)
            file.close()

        for file in glob(f"{plugin_path}/*.py"):
            moduel_file = file.split(os.sep)[-1]
            print("Found module " + moduel_file)
            plugin = importlib.import_module(moduel_file.split(".")[0])
            # check load
            if _check_method(plugin, "load", DataFrame, {"spark": SparkSession}):
                print(f"[PLUGIN-LOADER] Add load method from {plugin}")
                load_plugin = plugin.load
            # check after load
            if _check_method(plugin, "after_load", DataFrame, {"dataframe": DataFrame}):
                print(f"[PLUGIN-LOADER] Add after_load method from {plugin}")
                after_load_plugins.append(plugin.after_load)

    sys.path.remove(plugin_path)
    sys.path.append(packages_path)
