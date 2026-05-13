import type { NextApiRequest, NextApiResponse } from 'next';
import projectService from '../../../lib/project-service';
import validation from '../../../lib/validation';
import db from '../../../lib/db';

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      // List all projects
      const projects = projectService.listProjects();
      res.status(200).json(projects);
    } else if (req.method === 'POST') {
      // Create new project
      const { name, gitUrl, gitBranch, subdomain, enableSsl, environmentVariables } = req.body;

      // Validation
      if (!name || !gitUrl || !subdomain) {
        return res.status(400).json({
          error: 'Missing required fields: name, gitUrl, subdomain',
        } as ErrorResponse);
      }

      if (!validation.isValidProjectName(name)) {
        return res.status(400).json({
          error: 'Invalid project name. Use 3-50 alphanumeric characters, hyphens, or underscores.',
        } as ErrorResponse);
      }

      if (!validation.isValidGitUrl(gitUrl)) {
        return res.status(400).json({
          error: 'Invalid Git URL format. Use HTTPS or SSH Git URLs.',
        } as ErrorResponse);
      }

      if (!validation.isValidSubdomain(subdomain)) {
        return res.status(400).json({
          error: 'Invalid subdomain format. Use only lowercase alphanumeric characters and hyphens.',
        } as ErrorResponse);
      }

      // Check for duplicates
      const existing = db
        .prepare('SELECT id FROM projects WHERE name = ? OR subdomain = ?')
        .get(name, subdomain);

      if (existing) {
        return res.status(409).json({
          error: 'Project name or subdomain already exists.',
        } as ErrorResponse);
      }

      // Validate environment variables
      if (environmentVariables) {
        for (const [key, value] of Object.entries(environmentVariables)) {
          if (!validation.isValidEnvVar(key, value as string)) {
            return res.status(400).json({
              error: `Invalid environment variable: ${key}`,
            } as ErrorResponse);
          }
        }
      }

      try {
        const project = await projectService.createProject({
          name,
          gitUrl,
          gitBranch: gitBranch || 'main',
          subdomain,
          enableSsl: enableSsl !== false,
          environmentVariables: environmentVariables || {},
        });

        res.status(201).json(project);
      } catch (error: any) {
        res.status(500).json({
          error: 'Failed to create project',
          details: error.message,
        } as ErrorResponse);
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' } as ErrorResponse);
    }
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
    } as ErrorResponse);
  }
}
