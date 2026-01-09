# QuickHost

Tools to quickly host websites from Git repositories. Currently supports Next.js applications.

## Features

- 🚀 **Quick Deployment**: Spin up Docker containers from any Git repository
- 🔄 **Auto Updates**: Automatically pulls changes and rebuilds every 60 seconds
- 📊 **Web Dashboard**: Modern Next.js frontend to manage all containers
- 🐳 **Docker-based**: Isolated containers for each project
- ⚡ **PM2 Process Management**: Zero-downtime deployments

## Quick Start

### Using the Web Dashboard

1. Start the QuickHost dashboard:
```bash
docker-compose -f docker-compose.frontend.yml up -d
```

2. Open http://localhost:3000 in your browser

3. Click "New Container" and enter your Git repository URL

### Manual Container Creation

For manual setup without the dashboard:

1. Copy the template files
2. Replace `%user%` and `%repo%` placeholders in the Dockerfile
3. Run:
```bash
docker-compose up -d
```

## Project Structure

```
quickhost/
├── frontend/           # Next.js dashboard
│   ├── src/
│   │   ├── pages/     # Page Router pages
│   │   ├── lib/       # Docker management library
│   │   ├── types/     # TypeScript types
│   │   └── styles/    # Global CSS
│   └── package.json
├── Dockerfile          # Template Dockerfile for hosted projects
├── entrypoint.sh       # Auto-update script
├── docker-compose.yml  # Template compose file
└── docker-compose.frontend.yml  # Dashboard compose file
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/containers` | List all containers |
| POST | `/api/containers` | Create new container |
| GET | `/api/containers/:id` | Get container details |
| DELETE | `/api/containers/:id` | Delete container |
| POST | `/api/containers/:id/start` | Start container |
| POST | `/api/containers/:id/stop` | Stop container |
| POST | `/api/containers/:id/restart` | Restart container |
| GET | `/api/containers/:id/logs` | Get container logs |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATA_DIR` | Directory to store container data | `/data/quickhost` |
| `NODE_ENV` | Node environment | `production` |

## Requirements

- Docker & Docker Compose
- Node.js 20+ (for development)

## Development

```bash
cd frontend
npm install
npm run dev
```

## TODO

- [ ] Support running Docker in the cloned repo
- [x] Build web UI
- [ ] Add support for other frameworks (Vite, etc.)
- [ ] Add authentication
- [ ] Add reverse proxy support 
