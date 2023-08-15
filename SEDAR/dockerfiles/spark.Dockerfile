FROM docker.io/bitnami/spark:3.1.2

USER root

WORKDIR /

RUN apt update && apt upgrade -y
RUN apt install build-essential zlib1g-dev libncurses5-dev libgdbm-dev libnss3-dev libssl-dev libsqlite3-dev libreadline-dev libffi-dev curl libbz2-dev -y

RUN curl https://www.python.org/ftp/python/3.9.0/Python-3.9.0.tgz --output Python-3.9.0.tgz
RUN tar -zxvf /Python-3.9.0.tgz

WORKDIR /Python-3.9.0

RUN rm -rf /opt/bitnami/python 

RUN ./configure --enable-optimizations --prefix=/opt/bitnami/python

RUN make -j 4

RUN make install

USER 1001
