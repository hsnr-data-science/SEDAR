FROM sedar-commons:latest
COPY ./backend/services/continuation /application/backend/services/continuation
WORKDIR /application/backend/services/continuation
CMD python3.9 server.py
