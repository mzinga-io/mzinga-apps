#!/bin/bash
set -e

if [ "$1" = 'node' ]; then
    node /docker-entrypoint/build-env.js /app/dist/
    exec "$@"
fi

exec "$@"