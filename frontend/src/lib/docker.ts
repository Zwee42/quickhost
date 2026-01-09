import Dockerode from 'dockerode';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { Container, CreateContainerRequest } from '@/types';

// Connect to Docker socket
const docker = new Dockerode({ socketPath: '/var/run/docker.sock' });

// Store container metadata (in production, use a database)
const DATA_DIR = process.env.DATA_DIR || '/data/quickhost';
const CONTAINERS_FILE = path.join(DATA_DIR, 'containers.json');
const PROJECTS_DIR = path.join(DATA_DIR, 'projects');

// Ensure directories exist
function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(PROJECTS_DIR)) {
    fs.mkdirSync(PROJECTS_DIR, { recursive: true });
  }
}

// Load containers from file
export function loadContainers(): Container[] {
  ensureDataDir();
  if (fs.existsSync(CONTAINERS_FILE)) {
    const data = fs.readFileSync(CONTAINERS_FILE, 'utf-8');
    return JSON.parse(data);
  }
  return [];
}

// Save containers to file
function saveContainers(containers: Container[]) {
  ensureDataDir();
  fs.writeFileSync(CONTAINERS_FILE, JSON.stringify(containers, null, 2));
}

// Parse GitHub URL to extract user and repo
function parseGitUrl(url: string): { user: string; repo: string } {
  // Handle SSH URLs: git@github.com:user/repo.git
  const sshMatch = url.match(/git@github\.com:([^/]+)\/(.+?)(?:\.git)?$/);
  if (sshMatch) {
    return { user: sshMatch[1], repo: sshMatch[2] };
  }
  
  // Handle HTTPS URLs: https://github.com/user/repo.git
  const httpsMatch = url.match(/github\.com\/([^/]+)\/(.+?)(?:\.git)?$/);
  if (httpsMatch) {
    return { user: httpsMatch[1], repo: httpsMatch[2] };
  }
  
  throw new Error('Invalid GitHub URL format');
}

// Generate Dockerfile for a project
function generateDockerfile(user: string, repo: string, isSSH: boolean): string {
  const cloneCommand = isSSH 
    ? `git clone git@github.com:${user}/${repo}.git /app`
    : `git clone https://github.com/${user}/${repo}.git /app`;

  const sshSetup = isSSH ? `
# Add deploy key
ADD id_deploy /root/.ssh/id_rsa
RUN chmod 600 /root/.ssh/id_rsa
RUN touch /root/.ssh/known_hosts && ssh-keyscan github.com >> /root/.ssh/known_hosts
` : '';

  return `FROM node:20-alpine

# Install dependencies
RUN apk add --no-cache bash git openssh
${sshSetup}
# Clone your repo
RUN ${cloneCommand}

WORKDIR /app

# Install deps + build
RUN npm install
RUN npm run build

# Install PM2 globally
RUN npm install -g pm2

# Add entrypoint
COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

EXPOSE 3000
CMD ["/bin/bash", "/entrypoint.sh"]
`;
}

// Generate entrypoint script
function generateEntrypoint(branch: string = 'main'): string {
  return `#!/bin/bash

echo "Starting Next.js with PM2..."
pm2 start npm --name nextjs -- start

while true; do
    git fetch origin ${branch}

    LOCAL=$(git rev-parse HEAD)
    REMOTE=$(git rev-parse origin/${branch})

    if [ "$LOCAL" != "$REMOTE" ]; then
        echo "Changes detected! Pulling…"
        git pull origin ${branch}

        echo "Rebuilding application..."
        npm install --production=false
        npm run build

        echo "Reloading PM2 with zero downtime..."
        pm2 reload nextjs
    fi

    sleep 60
done
`;
}

// Generate docker-compose.yml
function generateDockerCompose(containerName: string, port: number, envVars?: Record<string, string>): string {
  const envSection = envVars 
    ? Object.entries(envVars).map(([key, value]) => `      - ${key}=${value}`).join('\n')
    : '';

  return `services:
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: ${containerName}
    restart: always
    ports:
      - "${port}:3000"
    environment:
      - NODE_ENV=production
${envSection}
`;
}

// Create a new container
export async function createContainer(request: CreateContainerRequest): Promise<Container> {
  const { repoUrl, port, envVars, deployKeyPath } = request;
  const { user, repo } = parseGitUrl(repoUrl);
  
  const id = uuidv4();
  const containerName = `quickhost-${repo}-${id.substring(0, 8)}`;
  const projectDir = path.join(PROJECTS_DIR, containerName);
  
  // Create project directory
  fs.mkdirSync(projectDir, { recursive: true });
  
  // Check if SSH URL
  const isSSH = repoUrl.startsWith('git@');
  
  // Generate files
  fs.writeFileSync(
    path.join(projectDir, 'Dockerfile'),
    generateDockerfile(user, repo, isSSH)
  );
  fs.writeFileSync(
    path.join(projectDir, 'entrypoint.sh'),
    generateEntrypoint()
  );
  fs.writeFileSync(
    path.join(projectDir, 'docker-compose.yml'),
    generateDockerCompose(containerName, port, envVars)
  );
  
  // Copy deploy key if provided and SSH URL
  if (isSSH && deployKeyPath && fs.existsSync(deployKeyPath)) {
    fs.copyFileSync(deployKeyPath, path.join(projectDir, 'id_deploy'));
  }
  
  // Create container metadata
  const container: Container = {
    id,
    name: containerName,
    repoUrl,
    user,
    repo,
    port,
    status: 'building',
    createdAt: new Date().toISOString(),
  };
  
  // Save to containers list
  const containers = loadContainers();
  containers.push(container);
  saveContainers(containers);
  
  return container;
}

// Build and start a container
export async function buildAndStartContainer(containerId: string): Promise<void> {
  const containers = loadContainers();
  const containerData = containers.find(c => c.id === containerId);
  
  if (!containerData) {
    throw new Error('Container not found');
  }
  
  const projectDir = path.join(PROJECTS_DIR, containerData.name);
  
  // Build the image
  const stream = await docker.buildImage(
    {
      context: projectDir,
      src: ['Dockerfile', 'entrypoint.sh', 'id_deploy'].filter(f => 
        fs.existsSync(path.join(projectDir, f))
      ),
    },
    { t: containerData.name }
  );
  
  // Wait for build to complete
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err: Error | null, res: unknown) => {
      if (err) reject(err);
      else resolve(res);
    });
  });
  
  // Create and start container
  const container = await docker.createContainer({
    Image: containerData.name,
    name: containerData.name,
    ExposedPorts: { '3000/tcp': {} },
    HostConfig: {
      PortBindings: {
        '3000/tcp': [{ HostPort: containerData.port.toString() }],
      },
      RestartPolicy: { Name: 'always' },
    },
  });
  
  await container.start();
  
  // Update status
  containerData.status = 'running';
  containerData.image = containerData.name;
  saveContainers(containers);
}

// List all managed containers
export async function listContainers(): Promise<Container[]> {
  const savedContainers = loadContainers();
  
  // Get actual Docker containers status
  const dockerContainers = await docker.listContainers({ all: true });
  
  return savedContainers.map(container => {
    const dockerContainer = dockerContainers.find(
      dc => dc.Names.some(name => name === `/${container.name}`)
    );
    
    if (dockerContainer) {
      container.status = dockerContainer.State === 'running' ? 'running' : 'stopped';
    }
    
    return container;
  });
}

// Get container by ID
export async function getContainer(id: string): Promise<Container | null> {
  const containers = await listContainers();
  return containers.find(c => c.id === id) || null;
}

// Start a container
export async function startContainer(id: string): Promise<void> {
  const containerData = loadContainers().find(c => c.id === id);
  if (!containerData) throw new Error('Container not found');
  
  const container = docker.getContainer(containerData.name);
  await container.start();
}

// Stop a container
export async function stopContainer(id: string): Promise<void> {
  const containerData = loadContainers().find(c => c.id === id);
  if (!containerData) throw new Error('Container not found');
  
  const container = docker.getContainer(containerData.name);
  await container.stop();
}

// Restart a container
export async function restartContainer(id: string): Promise<void> {
  const containerData = loadContainers().find(c => c.id === id);
  if (!containerData) throw new Error('Container not found');
  
  const container = docker.getContainer(containerData.name);
  await container.restart();
}

// Delete a container
export async function deleteContainer(id: string): Promise<void> {
  const containers = loadContainers();
  const containerData = containers.find(c => c.id === id);
  
  if (!containerData) throw new Error('Container not found');
  
  try {
    const container = docker.getContainer(containerData.name);
    await container.stop().catch(() => {}); // Ignore if already stopped
    await container.remove();
  } catch {
    // Container might not exist in Docker
  }
  
  // Try to remove the image
  try {
    const image = docker.getImage(containerData.name);
    await image.remove();
  } catch {
    // Image might not exist
  }
  
  // Remove project directory
  const projectDir = path.join(PROJECTS_DIR, containerData.name);
  if (fs.existsSync(projectDir)) {
    fs.rmSync(projectDir, { recursive: true });
  }
  
  // Remove from saved containers
  const updatedContainers = containers.filter(c => c.id !== id);
  saveContainers(updatedContainers);
}

// Get container logs
export async function getContainerLogs(id: string, tail: number = 100): Promise<string> {
  const containerData = loadContainers().find(c => c.id === id);
  if (!containerData) throw new Error('Container not found');
  
  const container = docker.getContainer(containerData.name);
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail,
    timestamps: true,
  });
  
  return logs.toString();
}

// Get container stats
export async function getContainerStats(id: string): Promise<unknown> {
  const containerData = loadContainers().find(c => c.id === id);
  if (!containerData) throw new Error('Container not found');
  
  const container = docker.getContainer(containerData.name);
  const stats = await container.stats({ stream: false });
  
  return stats;
}

export default docker;
