import { documents } from '../lib/qa.mjs';
export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') return res.status(405).json({ error: '仅支持 GET' });
  return res.status(200).json({ ok: true, knowledgeFiles: documents.length, mode: process.env.DEEPSEEK_API_KEY ? 'deepseek' : 'offline' });
}
