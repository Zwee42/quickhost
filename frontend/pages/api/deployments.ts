import type { NextApiRequest, NextApiResponse } from 'next';

interface Deployment {
  id: string;
  name: string;
  status: 'running' | 'stopped' | 'error';
  url: string;
  port: number;
  lastUpdated: string;
}

// Mock deployments - in production, this would connect to a real database or backend service
const mockDeployments: Deployment[] = [
  {
    id: '1',
    name: 'My First App',
    status: 'running',
    url: 'http://localhost:3046',
    port: 3046,
    lastUpdated: new Date().toISOString(),
  },
];

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<Deployment[] | Deployment | { message: string }>
) {
  if (req.method === 'GET') {
    res.status(200).json(mockDeployments);
  } else if (req.method === 'POST') {
    const { user, repo, branch } = req.body;
    
    if (!user || !repo) {
      res.status(400).json({ message: 'User and repo are required' });
      return;
    }

    const newDeployment: Deployment = {
      id: Date.now().toString(),
      name: `${user}/${repo}`,
      status: 'running',
      url: `http://${repo}-${user}.local`,
      port: 3000 + mockDeployments.length + 1,
      lastUpdated: new Date().toISOString(),
    };

    mockDeployments.push(newDeployment);
    res.status(201).json(newDeployment);
  } else {
    res.status(405).json({ message: 'Method not allowed' });
  }
}
