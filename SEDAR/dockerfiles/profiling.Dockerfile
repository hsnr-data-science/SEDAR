FROM sedar-commons:latest
COPY ./backend/services/profiling /application/backend/services/profiling
WORKDIR /application/backend/services/profiling
CMD python3.9 server.py
