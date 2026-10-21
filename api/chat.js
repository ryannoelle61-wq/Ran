import { createHash } from 'node:crypto';
import { buildMessages, offlineAnswer } from '../lib/qa.mjs';

// 每实例的基础限流：不跨实例共享；正式公开时应另配共享限流或防火墙。
const buckets = new Map();
function allow(req) {
  const now = Date.now();
  for (const [key, bucket] of buckets) if (bucket.reset <= now) buckets.delete(key);
  const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown';
  const key = createHash('sha256').update(String(ip)).digest('hex');
  let bucket = buckets.get(key);
  if (!bucket) {
    if (buckets.size >= 10000) return false;
    bucket = { count: 0, reset: now + 60000 };
    buckets.set(key, bucket);
  }
  return ++bucket.count <= 10;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: '仅支持 POST' });
  if (!allow(req)) {
    res.setHeader('Retry-After', '60');
    return res.status(429).json({ error: '请求过于频繁，请一分钟后再试。' });
  }
  let body = req.body;
  try { if (typeof body === 'string') body = JSON.parse(body); }
  catch { return res.status(400).json({ error: '请求格式错误' }); }
  const message = body?.message;
  const history = body?.history ?? [];
  if (typeof message !== 'string' || !message.trim() || message.length > 2000) return res.status(400).json({ error: '请输入 1～2000 字的问题。' });
  if (!Array.isArray(history) || history.length > 20 || history.some(item => !item || !['user', 'assistant'].includes(item.role) || typeof item.content !== 'string' || item.content.length > 6000)) return res.status(400).json({ error: '对话历史格式不正确或过长。' });
  const key = process.env.DEEPSEEK_API_KEY?.trim();
  if (!key) return res.status(200).json({ reply: offlineAnswer(message), mode: 'offline' });
  try {
    const upstream = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: process.env.DEEPSEEK_MODEL || 'deepseek-flash', messages: buildMessages(message.trim(), history), stream: false, max_tokens: 1000 }),
      signal: AbortSignal.timeout(45000)
    });
    if (!upstream.ok) return res.status(502).json({ error: upstream.status === 401 ? '模型服务鉴权失败，请站点管理员检查密钥。' : '模型服务暂不可用，请稍后重试。' });
    const data = await upstream.json();
    const reply = data?.choices?.[0]?.message?.content;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('Empty reply');
    return res.status(200).json({ reply, mode: 'deepseek' });
  } catch (error) {
    return res.status(error.name === 'TimeoutError' ? 504 : 502).json({ error: '模型服务连接失败或超时，请稍后重试。' });
  }
}
