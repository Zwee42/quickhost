export interface Container {
  id: string;
  name: string;
  repoUrl: string;
  user: string;
  repo: string;
  port: number;
  status: 'running' | 'stopped' | 'building' | 'error';
  createdAt: string;
  image?: string;
}

export interface CreateContainerRequest {
  repoUrl: string;
  port: number;
  envVars?: Record<string, string>;
  deployKeyPath?: string;
}

export interface ContainerLog {
  timestamp: string;
  message: string;
  stream: 'stdout' | 'stderr';
}

export interface DockerStats {
  cpuPercent: number;
  memoryUsage: string;
  memoryLimit: string;
  memoryPercent: number;
  networkIO: {
    rx: string;
    tx: string;
  };
}
