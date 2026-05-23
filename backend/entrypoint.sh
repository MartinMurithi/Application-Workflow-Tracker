#!/bin/sh

set -e

echo "Waiting for database..."
until python -c "
import psycopg2, os, sys
try:
    psycopg2.connect(
        dbname=os.environ.get('DB_NAME', 'apptracker'),
        user=os.environ.get('DB_USER', 'apptracker'),
        password=os.environ.get('DB_PASSWORD', 'apptracker'),
        host=os.environ.get('DB_HOST', 'db'),
        port=os.environ.get('DB_PORT', '5432'),
    )
    sys.exit(0)
except Exception:
    sys.exit(1)
" 2>/dev/null; do
    echo "  DB not ready, retrying in 1s..."
    sleep 1
done

echo "Running migrations..."
python manage.py migrate --noinput

echo "Starting server..."
exec gunicorn core.wsgi:application \
    --bind 0.0.0.0:8000 \
    --workers 2 \
    --timeout 60 \
    --access-logfile - \
    --error-logfile -
