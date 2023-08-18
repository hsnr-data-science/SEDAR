FROM python:3.9-slim-buster
RUN mkdir /src

WORKDIR /src
RUN apt-get update --fix-missing && \
  apt-get -y --force-yes install emacs git
RUN apt-get update \
    && apt-get -y install libpq-dev gcc \
    && apt-get -y install python3-pip 
RUN pip install psycopg2
COPY requirements.txt /src

RUN pip install -r /src/requirements.txt
#----------------
#COPY DIFFMLFLOW
RUN rm -rf /usr/local/lib/python3.9/site-packages/mlflow/store/artifact/hdfs_artifact_repo.py
COPY hdfs_artifact_repo.py /usr/local/lib/python3.9/site-packages/mlflow/store/artifact/hdfs_artifact_repo.py
#----------------