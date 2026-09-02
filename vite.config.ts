import { defineConfig, type PluginOption } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// 本地开发 API 中间件：把 /api/* 交给对应的自包含 handler。
// 生产部署由 Vercel 用同名 serverless function 处理，复用同一批 handler。
function apiPlugin(): PluginOption {
  return {
    name: 'creative-kitchen-api',
    configureServer(server) {
      const mount = (path: string, mod: string, fn: string) =>
        server.middlewares.use(path, async (req, res) => {
          if (req.method !== 'POST') { res.statusCode = 405; return res.end('Method Not Allowed'); }
          try {
            const chunks: Buffer[] = [];
            for await (const c of req) chunks.push(c as Buffer);
            const body = JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
            const handler = (await server.ssrLoadModule(mod))[fn];
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify(await handler(body)));
          } catch (e) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ ok: false, error: 'API_ERROR', detail: String(e) }));
          }
        });
      mount('/api/proxy', '/api/proxy.ts', 'handleProxy');
    },
  };
}

export default defineConfig({
  base: './',
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  plugins: [react(), tailwindcss(), apiPlugin()],
});
