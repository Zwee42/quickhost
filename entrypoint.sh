#!/bin/bash

echo "Starting Next.js with PM2..."
pm2 start npm --name nextjs -- start

while true; do
    git fetch origin main

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/main)

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "Changes detected! Pulling…"
        git pull origin main

        echo "Rebuilding application..."
        npm install --production=false
        npm run build

        echo "Reloading PM2 with zero downtime..."
        pm2 reload nextjs
    fi

    sleep 60
done

