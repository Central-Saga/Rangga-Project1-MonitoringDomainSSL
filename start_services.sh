#!/bin/bash
cd /home/asu/projects/percobaan/backend
php -d memory_limit=-1 artisan serve --host=0.0.0.0 --port=8080 > /tmp/backend.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

cd /home/asu/projects/percobaan/frontend
./node_modules/.bin/next dev > /tmp/frontend.log 2>&1 &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo "Services started. Backend on port 8080, Frontend on port 3000"
wait