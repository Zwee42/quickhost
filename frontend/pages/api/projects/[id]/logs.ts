import type { NextApiRequest, NextApiResponse } from 'next';
import projectService from '../../../../lib/project-service';

interface ErrorResponse {
  error: string;
  details?: string;
}

interface LogEntry {
  type: string;
  message: string;
  createdAt: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<LogEntry[] | string | ErrorResponse>
) {
  const projectId = req.query.id as string;
  const logType = req.query.type as string;
  const rawLimit = req.query.limit as string | undefined;

  if (!projectId) {
    return res.status(400).json({ error: 'Project ID is required' } as ErrorResponse);
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' } as ErrorResponse);
  }

  if (!logType) {
    return res.status(400).json({ error: 'Log type is required' } as ErrorResponse);
  }

  if (rawLimit && Number.isNaN(Number(rawLimit))) {
    return res.status(400).json({ error: 'Limit must be a number' } as ErrorResponse);
  }

  const project = projectService.getProjectStatus(projectId);

  if (!project) {
    return res.status(404).json({ error: 'Project not found' } as ErrorResponse);
  }

  try {
    const limit = rawLimit ? Math.min(parseInt(rawLimit, 10), 1000) : 100;

    if (logType === 'container') {
      // Get container logs
      const logs = await projectService.getContainerLogs(projectId, limit);
      res.status(200).send(logs);
    } else {
      // Get application logs
      const logs = projectService.getLogs(projectId, limit);
      res.status(200).json(logs);
    }
  } catch (error: any) {
    console.error('API error:', error);
    res.status(500).json({
      error: 'Failed to retrieve logs',
      details: error.message,
    } as ErrorResponse);
  }
}
