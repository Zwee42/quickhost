import db from './db';
import dockerService from './docker';
import gitService from './git';
import nginxService from './nginx';
import sslService from './ssl';
import { v4 as uuidv4 } from 'uuid';

export interface CreateProjectInput {
  name: string;
  gitUrl: string;
  gitBranch?: string;
  subdomain: string;
  enableSsl?: boolean;
  environmentVariables?: Record<string, string>;
  port?: number;
}

export interface ProjectStatus {
  id: string;
  name: string;
  status: 'pending' | 'building' | 'running' | 'stopped' | 'error';
  subdomain: string;
  url: string;
  containerName: string;
  containerPort: number;
  lastError?: string;
  lastUpdated: string;
}

export class ProjectService {
  private basePort = parseInt(process.env.BASE_PORT || '5000', 10);
  private domain = process.env.ROOT_DOMAIN || 'localhost';
  private enableSsl = process.env.ENABLE_SSL === 'true';

  constructor() {
    db.exec('PRAGMA foreign_keys = ON');
  }

  /**
   * Get next available port
   */
  private getNextAvailablePort(): number {
    const stmt = db.prepare(
      'SELECT MAX(containerPort) as maxPort FROM projects WHERE containerPort IS NOT NULL'
    );
    const result = stmt.get() as any;
    return (result?.maxPort || this.basePort - 1) + 1;
  }

  /**
   * Create new project
   */
  async createProject(input: CreateProjectInput): Promise<ProjectStatus> {
    const projectId = uuidv4();
    const containerPort = input.port || this.getNextAvailablePort();
    const containerName = `quickhost-${input.subdomain}`;
    const gitBranch = input.gitBranch || 'main';

    try {
      // Insert project into database
      const stmt = db.prepare(
        `INSERT INTO projects (
          id, name, gitUrl, gitBranch, subdomain, status, 
          containerName, containerPort, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      );

      stmt.run(
        projectId,
        input.name,
        input.gitUrl,
        gitBranch,
        input.subdomain,
        'pending',
        containerName,
        containerPort,
        JSON.stringify({
          enableSsl: input.enableSsl || this.enableSsl,
          environmentVariables: input.environmentVariables || {},
        })
      );

      // Start deployment in background
      this.deployProject(projectId).catch((error) => {
        console.error(`Deployment failed for project ${projectId}:`, error);
        this.updateProjectStatus(projectId, 'error', error.message);
      });

      return this.getProjectStatus(projectId)!;
    } catch (error: any) {
      throw new Error(`Failed to create project: ${error.message}`);
    }
  }

  /**
   * Deploy project (orchestrate full workflow)
   */
  async deployProject(projectId: string): Promise<void> {
    const project = db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    try {
      this.updateProjectStatus(projectId, 'building');

      // 1. Clone repository
      console.log(`[${projectId}] Cloning repository...`);
      const projectPath = await gitService.cloneRepository(
        project.gitUrl,
        project.name,
        { branch: project.gitBranch }
      );

      this.addLog(projectId, 'info', 'Repository cloned successfully');

      // 2. Check for Dockerfile
      if (!gitService.hasDockerfile(projectPath)) {
        throw new Error(
          'Repository does not contain a Dockerfile. QuickHost requires a Dockerfile in the repository root.'
        );
      }

      // 3. Build Docker image
      console.log(`[${projectId}] Building Docker image...`);
      const imageName = `quickhost:${project.name}`;

      try {
        await dockerService.buildImage(projectPath, imageName);
        this.addLog(projectId, 'info', 'Docker image built successfully');
      } catch (error: any) {
        throw new Error(`Failed to build Docker image: ${error.message}`);
      }

      // 4. Prepare environment variables
      const metadata = JSON.parse(project.metadata || '{}');
      const env: Record<string, string> = {
        NODE_ENV: 'production',
        ...metadata.environmentVariables,
      };

      // 5. Run container
      console.log(`[${projectId}] Starting container...`);

      await dockerService.ensureNetwork();

      const containerId = await dockerService.runContainer({
        name: project.containerName,
        image: imageName,
        ports: { [project.containerPort]: project.containerPort },
        env,
        networks: ['quickhost-network'],
      });

      this.addLog(projectId, 'info', `Container started: ${containerId}`);

      // 6. Configure SSL if enabled
      const fullDomain = `${project.subdomain}.${this.domain}`;

      if (metadata.enableSsl && this.domain !== 'localhost') {
        console.log(`[${projectId}] Requesting SSL certificate...`);

        try {
          const { cert, key } = await sslService.requestCertificate(
            fullDomain
          );

          db.prepare(
            `INSERT OR REPLACE INTO ssl_certificates 
            (id, projectId, domain, certPath, keyPath) 
            VALUES (?, ?, ?, ?, ?)`
          ).run(uuidv4(), projectId, fullDomain, cert, key);

          this.addLog(projectId, 'info', 'SSL certificate obtained');
        } catch (error: any) {
          // Non-critical error, log it but continue
          this.addLog(projectId, 'warn', `SSL setup failed: ${error.message}`);
        }
      }

      // 7. Configure NGINX
      console.log(`[${projectId}] Configuring NGINX...`);

      const certPaths = db
        .prepare('SELECT certPath, keyPath FROM ssl_certificates WHERE projectId = ?')
        .get(projectId) as any;

      await nginxService.writeConfig({
        serverName: fullDomain,
        upstreamName: `upstream_${project.subdomain}`,
        containerPort: project.containerPort,
        containerName: project.containerName,
        useSsl: metadata.enableSsl && !!certPaths,
        certPath: certPaths?.certPath,
        keyPath: certPaths?.keyPath,
      });

      // 8. Reload NGINX
      console.log(`[${projectId}] Reloading NGINX...`);

      try {
        if (await nginxService.testConfig()) {
          await nginxService.reloadNginx();
          this.addLog(projectId, 'info', 'NGINX configured and reloaded');
        }
      } catch (error: any) {
        // Non-critical error
        this.addLog(
          projectId,
          'warn',
          `NGINX reload issue: ${error.message}`
        );
      }

      // 9. Mark as running
      this.updateProjectStatus(projectId, 'running');
      this.addLog(projectId, 'info', 'Project deployed successfully');

      console.log(
        `[${projectId}] Deployment complete: ${fullDomain}`
      );
    } catch (error: any) {
      console.error(`[${projectId}] Deployment failed:`, error);

      // Cleanup on failure
      try {
        if (project.containerName) {
          const exists = await dockerService.containerExists(
            project.containerName
          );
          if (exists) {
            await dockerService.stopContainer(project.containerName);
            await dockerService.removeContainer(project.containerName, true);
          }
        }

        await gitService.deleteRepository(
          gitService.getProjectPath(project.name)
        );
      } catch (cleanupError) {
        console.error(`[${projectId}] Cleanup error:`, cleanupError);
      }

      this.updateProjectStatus(
        projectId,
        'error',
        error.message
      );

      this.addLog(projectId, 'error', error.message);
      throw error;
    }
  }

  /**
   * Get project status
   */
  getProjectStatus(projectId: string): ProjectStatus | null {
    const project = db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;

    if (!project) return null;

    const fullDomain = `${project.subdomain}.${this.domain}`;

    return {
      id: project.id,
      name: project.name,
      status: project.status,
      subdomain: project.subdomain,
      url: `https://${fullDomain}`,
      containerName: project.containerName,
      containerPort: project.containerPort,
      lastUpdated: new Date(project.updatedAt * 1000).toISOString(),
    };
  }

  /**
   * List all projects
   */
  listProjects(): ProjectStatus[] {
    const projects = db.prepare('SELECT * FROM projects ORDER BY createdAt DESC').all() as any[];

    return projects.map((project) => {
      const fullDomain = `${project.subdomain}.${this.domain}`;
      return {
        id: project.id,
        name: project.name,
        status: project.status,
        subdomain: project.subdomain,
        url: `https://${fullDomain}`,
        containerName: project.containerName,
        containerPort: project.containerPort,
        lastUpdated: new Date(project.updatedAt * 1000).toISOString(),
      };
    });
  }

  /**
   * Stop project
   */
  async stopProject(projectId: string): Promise<void> {
    const project = db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    try {
      const exists = await dockerService.containerExists(
        project.containerName
      );
      if (exists) {
        await dockerService.stopContainer(project.containerName);
      }

      this.updateProjectStatus(projectId, 'stopped');
      this.addLog(projectId, 'info', 'Project stopped');
    } catch (error: any) {
      throw new Error(`Failed to stop project: ${error.message}`);
    }
  }

  /**
   * Restart project
   */
  async restartProject(projectId: string): Promise<void> {
    const project = db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    try {
      const exists = await dockerService.containerExists(
        project.containerName
      );
      if (exists) {
        await dockerService.restartContainer(project.containerName);
      } else {
        throw new Error('Container does not exist');
      }

      this.updateProjectStatus(projectId, 'running');
      this.addLog(projectId, 'info', 'Project restarted');
    } catch (error: any) {
      throw new Error(`Failed to restart project: ${error.message}`);
    }
  }

  /**
   * Delete project
   */
  async deleteProject(projectId: string): Promise<void> {
    const project = db
      .prepare('SELECT * FROM projects WHERE id = ?')
      .get(projectId) as any;

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    try {
      // Stop container
      const containerExists = await dockerService.containerExists(
        project.containerName
      );
      if (containerExists) {
        await dockerService.stopContainer(project.containerName);
        await dockerService.removeContainer(project.containerName, true);
      }

      // Remove NGINX config
      const fullDomain = `${project.subdomain}.${this.domain}`;
      await nginxService.removeConfig(fullDomain);
      await nginxService.reloadNginx();

      // Delete SSL certificate
      try {
        await sslService.deleteCertificate(fullDomain);
      } catch {
        // Ignore SSL deletion errors
      }

      // Delete repository
      await gitService.deleteRepository(gitService.getProjectPath(project.name));

      // Delete from database (cascades to deployments, logs, ssl_certificates)
      db.prepare('DELETE FROM projects WHERE id = ?').run(projectId);

      this.addLog(projectId, 'info', 'Project deleted');
    } catch (error: any) {
      throw new Error(`Failed to delete project: ${error.message}`);
    }
  }

  /**
   * Get project logs
   */
  getLogs(projectId: string, limit: number = 100): Array<{
    type: string;
    message: string;
    createdAt: string;
  }> {
    const logs = db
      .prepare('SELECT type, message, createdAt FROM logs WHERE projectId = ? ORDER BY createdAt DESC LIMIT ?')
      .all(projectId, limit) as any[];

    return logs.map((log) => ({
      type: log.type,
      message: log.message,
      createdAt: new Date(log.createdAt * 1000).toISOString(),
    }));
  }

  /**
   * Get container logs
   */
  async getContainerLogs(projectId: string, lines: number = 100): Promise<string> {
    const project = db
      .prepare('SELECT containerName FROM projects WHERE id = ?')
      .get(projectId) as any;

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    try {
      return await dockerService.getContainerLogs(project.containerName, lines);
    } catch (error: any) {
      throw new Error(`Failed to get logs: ${error.message}`);
    }
  }

  /**
   * Update project environment variables
   */
  async updateEnvironmentVariables(
    projectId: string,
    env: Record<string, string>
  ): Promise<void> {
    const project = db
      .prepare('SELECT metadata FROM projects WHERE id = ?')
      .get(projectId) as any;

    if (!project) {
      throw new Error(`Project not found: ${projectId}`);
    }

    const metadata = JSON.parse(project.metadata || '{}');
    metadata.environmentVariables = env;

    db.prepare('UPDATE projects SET metadata = ? WHERE id = ?').run(
      JSON.stringify(metadata),
      projectId
    );

    // Restart container to apply changes
    await this.restartProject(projectId);
  }

  /**
   * Update project status
   */
  private updateProjectStatus(
    projectId: string,
    status: string,
    error?: string
  ): void {
    const now = Math.floor(Date.now() / 1000);

    if (error) {
      db.prepare(
        'UPDATE projects SET status = ?, updatedAt = ? WHERE id = ?'
      ).run(status, now, projectId);
    } else {
      db.prepare(
        'UPDATE projects SET status = ?, updatedAt = ? WHERE id = ?'
      ).run(status, now, projectId);
    }
  }

  /**
   * Add log entry
   */
  private addLog(
    projectId: string,
    type: 'info' | 'warn' | 'error',
    message: string
  ): void {
    db.prepare(
      'INSERT INTO logs (id, projectId, type, message) VALUES (?, ?, ?, ?)'
    ).run(uuidv4(), projectId, type, message);
  }
}

const projectService = new ProjectService();
export default projectService;
