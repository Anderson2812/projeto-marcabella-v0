// server.ts - Custom Next.js server for production deployment
const http = require('node:http');
const { parse } = require('node:url');
const next = require('next');

const port = parseInt(process.env.PORT || '3000', 10);
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  http.createServer((req: any, res: any) => {
    const parsedUrl = parse(req.url || '/', true);
    handle(req, res, parsedUrl);
  }).listen(port, '0.0.0.0', () => {
    console.log(`> Ready on port ${port}`);
  });
});
