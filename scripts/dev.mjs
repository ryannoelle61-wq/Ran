import http from 'node:http';
import { readFile } from 'node:fs/promises';
import chat from '../api/chat.js';
import health from '../api/health.js';
import knowledge from '../api/knowledge.js';

const handlers = { '/api/chat': chat, '/api/health': health, '/api/knowledge': knowledge };
http.createServer(async (req, res) => {
  res.status = code => { res.statusCode = code; return res; };
  res.json = data => { res.setHeader('Content-Type', 'application/json; charset=utf-8'); res.end(JSON.stringify(data)); };
  try {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (handlers[path]) {
      const chunks = [];
      let size = 0;
      for await (const chunk of req) {
        size += chunk.length;
        if (size > 150000) return res.status(413).json({ error: '请求过大' });
        chunks.push(chunk);
      }
      req.body = Buffer.concat(chunks).toString();
      return await handlers[path](req, res);
    }
    if (path !== '/' && path !== '/index.html') return res.status(404).json({ error: '未找到页面' });
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(await readFile(new URL('../public/index.html', import.meta.url)));
  } catch { res.status(500).json({ error: '服务内部错误' }); }
}).listen(3000, '127.0.0.1', () => console.log('本地预览：http://127.0.0.1:3000'));
