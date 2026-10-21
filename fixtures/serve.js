import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.png': 'image/png',
};

const server = http.createServer((req, res) => {
  let reqPath = req.url === '/' ? '/scholarship-form.html' : req.url;
  reqPath = reqPath.split('?')[0];

  const filePath = path.join(__dirname, reqPath);

  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  } else {
    // Index directory list
    const files = fs.readdirSync(__dirname).filter(f => f.endsWith('.html'));
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.end(`
      <!DOCTYPE html>
      <html>
      <head><title>FormAssist Test Fixtures</title></head>
      <body style="font-family: sans-serif; padding: 40px; line-height: 1.6;">
        <h2>FormAssist Test Fixtures Server (localhost:${PORT})</h2>
        <ul>
          ${files.map(f => `<li><a href="/${f}">${f}</a></li>`).join('')}
        </ul>
      </body>
      </html>
    `);
  }
});

server.listen(PORT, () => {
  console.log(`📡 Fixtures server running at http://localhost:${PORT}/`);
  console.log(`   - http://localhost:${PORT}/scholarship-form.html`);
  console.log(`   - http://localhost:${PORT}/risky-form.html`);
  console.log(`   - http://localhost:${PORT}/bank-kyc-form.html`);
});
