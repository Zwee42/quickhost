#!/bin/bash

set -e

echo "Starting QuickHost services with Supervisor..."

# Check if this is the backend service
if [ "$BACKEND_MODE" = "true" ] || [ -z "$FRONTEND_MODE" ]; then
    echo "Starting backend application..."
    cd /app
    
    # Start auto-deployment update check
    {
        while true; do
            git fetch origin main 2>/dev/null || true

            LOCAL=$(git rev-parse HEAD 2>/dev/null || echo "")
            REMOTE=$(git rev-parse origin/main 2>/dev/null || echo "")

            if [ -n "$LOCAL" ] && [ -n "$REMOTE" ] && [ "$LOCAL" != "$REMOTE" ]; then
                echo "Changes detected! Pulling…"
                git pull origin main

                echo "Rebuilding application..."
                npm install --production=false
                npm run build

                echo "Reloading PM2 with zero downtime..."
                pm2 reload backend || npm run start &
            fi

            sleep 60
        done
    } &
fi

# Check if this is the frontend service
if [ "$FRONTEND_MODE" = "true" ]; then
    echo "Starting frontend application..."
    cd /frontend
    exec npm start
fi

# Default: start supervisord to manage all services
exec /usr/bin/supervisord -c /etc/supervisord.conf
#!/bin/bash


