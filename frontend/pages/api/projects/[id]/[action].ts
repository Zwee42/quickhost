import type { NextApiRequest, NextApiResponse } from 'next';
import projectService from '../../../../lib/project-service';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface SuccessResponse {
  message: string;
  status?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  const projectId = req.query.id as string;
  const action = req.query.action as string;

  if (!projectId || !action) {
    return res.status(400).json({ error: 'Project ID and action are required' } as ErrorResponse);
  }

  const project = projectService.getProjectStatus(projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' } as ErrorResponse);
  }

  try {
    if (req.method === 'POST') {
      if (action === 'restart') {
        await projectService.restartProject(projectId);
        res.status(200).json({ message: 'Project restarted successfully', status: 'running' });
      } else if (action === 'stop') {
        await projectService.stopProject(projectId);
        res.status(200).json({ message: 'Project stopped successfully', status: 'stopped' });
      } else {
        res.status(400).json({ error: `Unknown action: ${action}` } as ErrorResponse);
      }
    } else {
      res.status(405).json({ error: 'Method not allowed' } as ErrorResponse);
    }
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({
      error: `Failed to ${action} project`,
      details: error.message,
    } as ErrorResponse);
  }
}
