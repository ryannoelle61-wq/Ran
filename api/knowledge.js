import { documents } from '../lib/qa.mjs';
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: '仅支持 GET' });
  res.setHeader('Cache-Control', 'public, max-age=60');
  return res.status(200).json({ documents });
}
