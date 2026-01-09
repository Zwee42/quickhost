import type { NextApiRequest, NextApiResponse } from 'next';
import { startContainer, stopContainer, restartContainer, getContainer } from '@/lib/docker';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id, action } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Container ID is required' });
  }

  if (!action || typeof action !== 'string') {
    return res.status(400).json({ error: 'Action is required' });
  }

  try {
    const container = await getContainer(id);
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    switch (action) {
      case 'start':
        await startContainer(id);
        return res.status(200).json({ success: true, message: 'Container started' });

      case 'stop':
        await stopContainer(id);
        return res.status(200).json({ success: true, message: 'Container stopped' });

      case 'restart':
        await restartContainer(id);
        return res.status(200).json({ success: true, message: 'Container restarted' });

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
