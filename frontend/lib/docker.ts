import { exec, execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';

const execAsync = promisify(exec);
const execFileAsync = promisify(execFile);

interface ContainerOptions {
  name: string;
  image: string;
  ports?: { [key: string]: number };
  env?: { [key: string]: string };
  volumes?: { [key: string]: string };
  networks?: string[];
  workingDir?: string;
}

export class DockerService {
  private networkName = 'quickhost-network';

  async ensureNetwork() {
    try {
      await execAsync(`docker network inspect ${this.networkName}`);
    } catch {
      console.log(`Creating network: ${this.networkName}`);
      await execAsync(`docker network create ${this.networkName}`);
    }
  }

  async buildImage(
    contextPath: string,
    imageName: string,
    dockerfile: string = 'Dockerfile',
    buildArgs?: { [key: string]: string }
  ): Promise<string> {
    let cmd = `docker build -t ${imageName} -f ${dockerfile}`;

    if (buildArgs) {
      for (const [key, value] of Object.entries(buildArgs)) {
        cmd += ` --build-arg ${key}="${value}"`;
      }
    }

    cmd += ` "${contextPath}"`;

    const { stdout, stderr } = await execAsync(cmd, { maxBuffer: 1024 * 1024 * 10 });
    return stdout + stderr;
  }

  async runContainer(options: ContainerOptions): Promise<string> {
    await this.ensureNetwork();

    let cmd = `docker run -d --name ${options.name}`;

    // Add ports
    if (options.ports) {
      for (const [containerPort, hostPort] of Object.entries(options.ports)) {
        cmd += ` -p ${hostPort}:${containerPort}`;
      }
    }

    // Add environment variables
    if (options.env) {
      for (const [key, value] of Object.entries(options.env)) {
        cmd += ` -e ${key}="${value}"`;
      }
    }

    // Add volumes
    if (options.volumes) {
      for (const [hostPath, containerPath] of Object.entries(options.volumes)) {
        cmd += ` -v "${hostPath}:${containerPath}"`;
      }
    }

    // Add networks
    if (options.networks?.length) {
      cmd += ` --network ${options.networks[0]}`;
    } else {
      cmd += ` --network ${this.networkName}`;
    }

    // Add working directory
    if (options.workingDir) {
      cmd += ` -w ${options.workingDir}`;
    }

    // Restart policy
    cmd += ` --restart unless-stopped`;

    cmd += ` ${options.image}`;

    const { stdout } = await execAsync(cmd);
    const containerId = stdout.trim();
    return containerId;
  }

  async stopContainer(containerId: string): Promise<void> {
    await execAsync(`docker stop ${containerId}`);
  }

  async removeContainer(containerId: string, force: boolean = false): Promise<void> {
    const forceFlag = force ? ' -f' : '';
    await execAsync(`docker rm${forceFlag} ${containerId}`);
  }

  async getContainerStatus(containerId: string): Promise<string> {
    const { stdout } = await execAsync(`docker inspect -f '{{.State.Status}}' ${containerId}`);
    return stdout.trim().replace(/'/g, '');
  }

  async getContainerLogs(containerId: string, lines: number = 100): Promise<string> {
    const { stdout } = await execAsync(`docker logs --tail ${lines} ${containerId}`);
    return stdout;
  }

  async containerExists(containerId: string): Promise<boolean> {
    try {
      await execAsync(`docker inspect ${containerId}`);
      return true;
    } catch {
      return false;
    }
  }

  async restartContainer(containerId: string): Promise<void> {
    await execAsync(`docker restart ${containerId}`);
  }

  async removeImage(imageName: string): Promise<void> {
    try {
      await execAsync(`docker rmi -f ${imageName}`);
    } catch (error) {
      console.error(`Failed to remove image ${imageName}:`, error);
    }
  }
}

const dockerService = new DockerService();
export default dockerService;
