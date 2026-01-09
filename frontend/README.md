# QuickHost Frontend

Next.js frontend for managing QuickHost containers.

## Development

```bash
npm install
npm run dev
```

## Production

```bash
npm run build
npm start
```

## API Endpoints

### GET /api/containers
List all containers.

### POST /api/containers
Create a new container.
```json
{
  "repoUrl": "https://github.com/user/repo.git",
  "port": 3001,
  "envVars": { "KEY": "value" },
  "deployKeyPath": "/path/to/key"
}
```

### GET /api/containers/:id
Get container details.

### DELETE /api/containers/:id
Delete a container.

### POST /api/containers/:id/start
Start a container.

### POST /api/containers/:id/stop
Stop a container.

### POST /api/containers/:id/restart
Restart a container.

### GET /api/containers/:id/logs
Get container logs.

### GET /api/containers/:id/stats
Get container stats.
