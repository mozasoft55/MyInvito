import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.mp3': 'audio/mpeg',
  '.wav': 'audio/wav',
  '.ogg': 'audio/ogg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject'
};

const PORT = parseInt(process.env.PORT || '3000', 10);

const server = http.createServer((req, res) => {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse URL pathname
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let reqPath = decodeURIComponent(parsedUrl.pathname);

  // Normalize path
  let filePath = path.join(__dirname, reqPath);

  // Prevent path traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  // Directory handling
  try {
    if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    }
  } catch (_) {}

  // Check file exists
  let stat;
  try {
    if (!fs.existsSync(filePath) || !(stat = fs.statSync(filePath)).isFile()) {
      res.writeHead(404, {
        'Content-Type': 'text/html; charset=utf-8',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'SAMEORIGIN',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });
      res.end(`<h1>404 Not Found</h1><p>The requested file <code>${reqPath}</code> was not found.</p>`);
      return;
    }
  } catch (_) {
    res.writeHead(500, { 'Content-Type': 'text/plain' });
    res.end('500 Internal Server Error');
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  // Smart caching headers
  let cacheControl = 'public, max-age=0, must-revalidate';
  if (['.mp3', '.wav', '.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico', '.woff', '.woff2', '.ttf'].includes(ext)) {
    cacheControl = 'public, max-age=604800, stale-while-revalidate=86400';
  } else if (['.css', '.js'].includes(ext)) {
    cacheControl = 'public, max-age=3600, stale-while-revalidate=86400';
  }

  const mtime = stat.mtime.toUTCString();
  const etag = `W/"${stat.size.toString(16)}-${Math.floor(stat.mtimeMs).toString(16)}"`;

  const securityHeaders = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'SAMEORIGIN',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
  };

  // Conditional request (304 Not Modified)
  if (req.headers['if-none-match'] === etag || req.headers['if-modified-since'] === mtime) {
    res.writeHead(304, {
      ...securityHeaders,
      'ETag': etag,
      'Last-Modified': mtime,
      'Cache-Control': cacheControl
    });
    res.end();
    return;
  }

  res.writeHead(200, {
    ...securityHeaders,
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
    'ETag': etag,
    'Last-Modified': mtime
  });

  const stream = fs.createReadStream(filePath);
  stream.pipe(res);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log(`Port ${PORT} is in use, trying ${PORT + 1}...`);
    server.listen(PORT + 1, '0.0.0.0');
  } else {
    console.error('Server error:', err);
  }
});

server.listen(PORT, '0.0.0.0', () => {
  const addr = server.address();
  const actualPort = typeof addr === 'object' && addr ? addr.port : PORT;
  console.log(`\n==================================================`);
  console.log(`🚀 Royal Wedding Card Local Server Running!`);
  console.log(`==================================================`);
  console.log(`- Onboarding Form:   http://localhost:${actualPort}/onboard/`);
  console.log(`- Guest Invitation:  http://localhost:${actualPort}/?template=template-14`);
  console.log(`- Admin Dashboard:   http://localhost:${actualPort}/admin/`);
  console.log(`- User Dashboard:    http://localhost:${actualPort}/dashboard/`);
  console.log(`==================================================\n`);
});
