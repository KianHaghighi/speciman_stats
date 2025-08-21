import { NextApiRequest, NextApiResponse } from 'next';
import { METRIC_GUARDS } from '@/server/guards';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // This endpoint is GUARDED - users cannot create metrics
    const guardResult = METRIC_GUARDS.preventUserMetricCreation();
    
    return res.status(403).json(guardResult);
  } catch (error) {
    console.error('Error in metric creation guard:', error);
    return res.status(500).json({ 
      ok: false, 
      error: 'Internal server error' 
    });
  }
}
