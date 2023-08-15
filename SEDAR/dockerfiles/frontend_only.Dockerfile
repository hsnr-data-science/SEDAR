FROM nginx:latest
COPY ./frontend /application/frontend
COPY ./.env /application
COPY ./backend/mainbackend/static /application/backend/mainbackend/static
COPY ./nginx.conf.template /application
WORKDIR /application
RUN apt-get install curl -y && \
    cd /tmp && \
    curl -sL https://deb.nodesource.com/setup_12.x -o nodesource_setup.sh && \
    bash nodesource_setup.sh && \
    apt-get install nodejs -y
WORKDIR /application/frontend
RUN rm -rf /node_modules
RUN npm install
RUN npm run build
WORKDIR /application
CMD ["/bin/sh", "-c", "envsubst '$BACKEND_URL_PROXY' < ./nginx.conf.template > /etc/nginx/nginx.conf && exec nginx -g 'daemon off;'"]
