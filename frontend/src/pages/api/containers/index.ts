import type { NextApiRequest, NextApiResponse } from 'next';
import { listContainers, createContainer, buildAndStartContainer } from '@/lib/docker';
import { Container, CreateContainerRequest } from '@/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    switch (req.method) {
      case 'GET':
        const containers = await listContainers();
        return res.status(200).json(containers);

      case 'POST':
        const body = req.body as CreateContainerRequest;
        
        if (!body.repoUrl || !body.port) {
          return res.status(400).json({ error: 'repoUrl and port are required' });
        }

        // Validate port
        if (body.port < 1024 || body.port > 65535) {
          return res.status(400).json({ error: 'Port must be between 1024 and 65535' });
        }

        // Create container metadata and files
        const container = await createContainer(body);
        
        // Build and start in background
        buildAndStartContainer(container.id).catch(err => {
          console.error('Failed to build/start container:', err);
        });

        return res.status(201).json(container);

      default:
        res.setHeader('Allow', ['GET', 'POST']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
