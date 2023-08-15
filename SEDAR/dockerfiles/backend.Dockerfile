FROM python:3.9-buster
COPY . /application
WORKDIR /application
RUN rm -rf /backend/services
RUN apt-get install curl -y && \
    cd /tmp && \
    curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    apt-get install nodejs -y
WORKDIR /application/frontend
RUN rm -rf /node_modules
RUN npm install
RUN npm run build
RUN apt-get update && \
    apt-get install -y openjdk-11-jre-headless && \
    apt-get install -y ant && \
    apt-get clean;
RUN apt-get update && \
    apt-get install ca-certificates-java && \
    apt-get clean && \
    update-ca-certificates -f;
WORKDIR /application/backend/commons
RUN pip install --upgrade pip
RUN pip install -r requirements.txt
WORKDIR /application/backend/mainbackend
RUN pip install -r requirements.txt
CMD gunicorn --bind=0.0.0.0:${BACKEND_PORT} --workers=${SERVER_WORKER_NUMBER} 'server:create_app()' --access-logfile=access.log --error-logfile=error.log --capture-output --enable-stdio-inheritance --access-logformat '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s"'
