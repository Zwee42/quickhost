import type { NextApiRequest, NextApiResponse } from 'next';
import { 
  getContainer, 
  startContainer, 
  stopContainer, 
  restartContainer, 
  deleteContainer 
} from '@/lib/docker';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Container ID is required' });
  }

  try {
    switch (req.method) {
      case 'GET':
        const container = await getContainer(id);
        if (!container) {
          return res.status(404).json({ error: 'Container not found' });
        }
        return res.status(200).json(container);

      case 'DELETE':
        await deleteContainer(id);
        return res.status(200).json({ success: true });

      default:
        res.setHeader('Allow', ['GET', 'DELETE']);
        return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
    }
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
