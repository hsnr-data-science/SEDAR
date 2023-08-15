FROM python:3.9-buster
COPY ./backend/commons /application/backend/commons
WORKDIR /application/backend/commons
RUN apt-get update && \
    apt-get install -y openjdk-11-jre-headless nano && \
    apt-get install -y ant && \
    apt-get clean;
RUN apt-get update && \
    apt-get install ca-certificates-java && \
    apt-get clean && \
    update-ca-certificates -f;
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
CMD echo $BACKEND_HOST

