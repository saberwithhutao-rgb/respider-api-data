// /api/chat.js - 修改后的Vercel中转函数
export default async function handler(req, res) {
  // 只处理POST请求
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { messages, stream = false } = req.body;
    // 注意：这里指向你的阿里云HTTP后端
    const UPSTREAM_URL = 'http://121.43.104.134:3000/api/chat';

    console.log(`Vercel中转: 转发至阿里云服务器, stream模式: ${stream}`);

    // 转发请求到阿里云服务器
    const response = await fetch(UPSTREAM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
        // 注意：我们不再需要传递智谱API密钥，这个密钥已经安全存储在阿里云服务器上
      },
      body: JSON.stringify({
        messages: messages,
        stream: stream
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('阿里云服务器错误:', response.status, errorText);
      throw new Error(`Upstream error: ${response.status}`);
    }

    // 关键：将阿里云服务器的响应原样返回给前端
    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      // 将阿里云返回的流式响应直接管道传输给前端
      response.body.pipe(res);
    } else {
      const data = await response.json();
      res.json(data);
    }

  } catch (error) {
    console.error('Vercel中转函数错误:', error);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}