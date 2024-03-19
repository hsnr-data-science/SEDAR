FROM sedar-commons:latest
COPY ./backend/services/ingestion /application/backend/services/ingestion
WORKDIR /application/backend/services/ingestion
CMD python3.9 server.py
