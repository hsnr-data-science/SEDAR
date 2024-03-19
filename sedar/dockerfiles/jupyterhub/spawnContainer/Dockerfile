FROM jupyter/scipy-notebook
ARG JUPYTERHUB_VERSION=1.3

USER root
RUN pip3 install --no-cache \
    jupyterhub==$JUPYTERHUB_VERSION

COPY requirements.txt /tmp/requirements.txt
RUN python3 -m pip install --no-cache -r /tmp/requirements.txt

RUN apt-get update && \
    apt-get install -y openjdk-11-jre-headless && \
    apt-get install -y ant && \
    apt-get clean;
RUN apt-get update && \
    apt-get install ca-certificates-java && \
    apt-get clean && \
    update-ca-certificates -f;

COPY hdfs_artifact_repo.py /opt/conda/lib/python3.10/site-packages/mlflow/store/artifact/hdfs_artifact_repo.py
COPY createRun.ipynb /home/jovyan/createRun.ipynb
COPY jupyter_notebook_config.py /home/jovyan/.jupyter/jupyter_notebook_config.py