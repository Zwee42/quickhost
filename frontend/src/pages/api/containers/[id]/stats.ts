import type { NextApiRequest, NextApiResponse } from 'next';
import { getContainerStats, getContainer } from '@/lib/docker';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
  }

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Container ID is required' });
  }

  try {
    const container = await getContainer(id);
    if (!container) {
      return res.status(404).json({ error: 'Container not found' });
    }

    const stats = await getContainerStats(id);
    return res.status(200).json(stats);
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
}
