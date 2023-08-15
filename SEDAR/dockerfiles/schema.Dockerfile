FROM sedar-commons:latest
COPY ./backend/services/schema /application/backend/services/schema
WORKDIR /application/backend/services/schema
CMD python3.9 server.py
