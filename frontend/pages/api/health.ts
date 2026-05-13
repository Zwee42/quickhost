import type { NextApiRequest, NextApiResponse } from 'next';

interface HealthResponse {
  status: string;
  timestamp: string;
  uptime: number;
  environment: string;
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<HealthResponse | { error: string }>
) {
  try {
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'unknown',
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Health check failed' });
  }
}
