import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const execAsync = promisify(exec);

interface CloneOptions {
  branch?: string;
  depth?: number;
  singleBranch?: boolean;
}

export class GitService {
  private projectsDir = process.env.PROJECTS_PATH || '/data/projects';

  constructor() {
    if (!fs.existsSync(this.projectsDir)) {
      fs.mkdirSync(this.projectsDir, { recursive: true });
    }
  }

  /**
   * Validate Git URL format
   */
  validateUrl(url: string): boolean {
    const gitUrlRegex = /^(https?|git|ssh):\/\/(.+?)\/(.+?)(\.git)?$/;
    const sshRegex = /^git@(.+?):(.+?)\/(.+?)(\.git)?$/;
    return gitUrlRegex.test(url) || sshRegex.test(url);
  }

  /**
   * Clone a repository
   */
  async cloneRepository(
    url: string,
    projectName: string,
    options: CloneOptions = {}
  ): Promise<string> {
    const targetPath = path.join(this.projectsDir, projectName);

    if (fs.existsSync(targetPath)) {
      throw new Error(`Project directory already exists: ${targetPath}`);
    }

    let cmd = `git clone`;

    if (options.branch) {
      cmd += ` -b ${options.branch}`;
    }

    if (options.singleBranch !== false) {
      cmd += ` --single-branch`;
    }

    if (options.depth) {
      cmd += ` --depth ${options.depth}`;
    }

    cmd += ` "${url}" "${targetPath}"`;

    try {
      await execAsync(cmd, {
        timeout: 300000, // 5 minutes
        maxBuffer: 1024 * 1024,
      });
      return targetPath;
    } catch (error: any) {
      // Clean up on failure
      if (fs.existsSync(targetPath)) {
        fs.rmSync(targetPath, { recursive: true, force: true });
      }
      throw new Error(`Failed to clone repository: ${error.message}`);
    }
  }

  /**
   * Pull latest changes from repository
   */
  async pullRepository(projectPath: string, branch: string = 'main'): Promise<string> {
    const cmd = `cd "${projectPath}" && git fetch origin && git reset --hard origin/${branch}`;

    try {
      const { stdout, stderr } = await execAsync(cmd, {
        timeout: 300000,
        maxBuffer: 1024 * 1024,
      });
      return stdout + stderr;
    } catch (error: any) {
      throw new Error(`Failed to pull repository: ${error.message}`);
    }
  }

  /**
   * Get current git commit hash
   */
  async getCommitHash(projectPath: string): Promise<string> {
    const cmd = `cd "${projectPath}" && git rev-parse HEAD`;

    try {
      const { stdout } = await execAsync(cmd);
      return stdout.trim();
    } catch {
      return '';
    }
  }

  /**
   * Check for available Dockerfile
   */
  hasDockerfile(projectPath: string): boolean {
    return fs.existsSync(path.join(projectPath, 'Dockerfile'));
  }

  /**
   * Get package.json info
   */
  getPackageInfo(projectPath: string): any | null {
    const packagePath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packagePath)) {
      const content = fs.readFileSync(packagePath, 'utf-8');
      return JSON.parse(content);
    }
    return null;
  }

  /**
   * Delete project directory
   */
  async deleteRepository(projectPath: string): Promise<void> {
    try {
      if (fs.existsSync(projectPath)) {
        fs.rmSync(projectPath, { recursive: true, force: true });
      }
    } catch (error: any) {
      throw new Error(`Failed to delete repository: ${error.message}`);
    }
  }

  /**
   * Get project path
   */
  getProjectPath(projectName: string): string {
    return path.join(this.projectsDir, projectName);
  }
}

const gitService = new GitService();
export default gitService;
