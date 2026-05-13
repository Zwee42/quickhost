import type { NextApiRequest, NextApiResponse } from 'next';
import projectService from '../../../../lib/project-service';

interface ErrorResponse {
  error: string;
  details?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const projectId = req.query.id as string;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' } as ErrorResponse);
  }

  try {
    if (req.method === 'GET') {
      // Get project details
      const project = projectService.getProjectStatus(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' } as ErrorResponse);
      }

      res.status(200).json(project);
    } else if (req.method === 'DELETE') {
      // Delete project
      const project = projectService.getProjectStatus(projectId);

      if (!project) {
        return res.status(404).json({ error: 'Project not found' } as ErrorResponse);
      }

      try {
        await projectService.deleteProject(projectId);
        res.status(200).json({ message: 'Project deleted successfully' });
      } catch (error: any) {
        res.status(500).json({
          error: 'Failed to delete project',
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
