import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'fcm-api-dev-handler',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url?.startsWith('/api/fcm') && req.method === 'POST') {
            let body = '';
            req.on('data', (chunk) => {
              body += chunk;
            });
            req.on('end', async () => {
              try {
                const parsed = body ? JSON.parse(body) : {};
                // @ts-ignore
                const { default: handler } = await import('./api/fcm.js');
                const mockReq = { method: 'POST', body: parsed };
                const mockRes = {
                  setHeader: (k: string, v: string) => res.setHeader(k, v),
                  status: (code: number) => ({
                    json: (data: any) => {
                      res.statusCode = code;
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                    },
                  }),
                };
                await handler(mockReq, mockRes);
              } catch (e: any) {
                res.statusCode = 500;
                res.end(JSON.stringify({ error: e.message }));
              }
            });
            return;
          }
          next();
        });
      },
    },
  ],
})
