import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = process.env.PORT || 3000;

// User music configuration: 90 days retention, max 400KB compressed
const USER_MUSIC_DIR = path.join(__dirname, 'user-music');
const DAYS_90_MS = 90 * 864e5;
const MAX_UPLOAD_BYTES = 400 * 1024; // 400 KB

if (!fs.existsSync(USER_MUSIC_DIR)) {
  fs.mkdirSync(USER_MUSIC_DIR, { recursive: true });
}

// 90-day retention cleanup
function cleanupOldMusic() {
  const cutoff = Date.now() - DAYS_90_MS;
  try {
    for (const file of fs.readdirSync(USER_MUSIC_DIR)) {
      const filePath = path.join(USER_MUSIC_DIR, file);
      try {
        if (fs.statSync(filePath).mtimeMs < cutoff) {
          fs.unlinkSync(filePath);
        }
      } catch (_) {}
    }
  } catch (_) {}
}
cleanupOldMusic();
setInterval(cleanupOldMusic, 36e5); // run hourly

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
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
  // CORS & caching headers for local development
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // Parse path & sanitize
  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  // POST /api/music: Upload compressed wedding song
  if (req.method === 'POST' && (pathname === '/api/music' || pathname === '/api/music/')) {
    const contentType = req.headers['content-type'] || '';
    const chunks = [];
    let totalSize = 0;

    req.on('data', chunk => {
      chunks.push(chunk);
      totalSize += chunk.length;
      if (totalSize > 2 * 1024 * 1024) {
        res.writeHead(413, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'File size exceeds maximum allowable limit' }));
        req.destroy();
      }
    });

    req.on('end', () => {
      const fullBuffer = Buffer.concat(chunks);
      let fileBytes = fullBuffer;

      // Extract file from multipart if boundary exists
      if (contentType.includes('multipart/form-data')) {
        const match = contentType.match(/boundary=([-a-zA-Z0-9'()+_./:=?]+)/);
        if (match && match[1]) {
          const boundaryBuf = Buffer.from('--' + match[1]);
          const startIdx = fullBuffer.indexOf(boundaryBuf);
          if (startIdx !== -1) {
            const headerSep = Buffer.from('\r\n\r\n');
            const headerStart = startIdx + boundaryBuf.length + 2;
            const headerEnd = fullBuffer.indexOf(headerSep, headerStart);
            if (headerEnd !== -1) {
              const fileStart = headerEnd + 4;
              const nextBoundary = fullBuffer.indexOf(boundaryBuf, fileStart);
              if (nextBoundary !== -1) {
                let fileEnd = nextBoundary;
                if (fullBuffer[fileEnd - 2] === 13 && fullBuffer[fileEnd - 1] === 10) fileEnd -= 2;
                fileBytes = fullBuffer.slice(fileStart, fileEnd);
              }
            }
          }
        }
      }

      if (!fileBytes || fileBytes.length === 0) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'No audio data received' }));
        return;
      }

      if (fileBytes.length > MAX_UPLOAD_BYTES) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `File too large (${(fileBytes.length / 1024).toFixed(0)} KB). Limit is 400 KB.` }));
        return;
      }

      const songFileName = crypto.randomBytes(8).toString('hex') + '.mp3';
      const destPath = path.join(USER_MUSIC_DIR, songFileName);
      fs.writeFileSync(destPath, fileBytes);

      // Mirror to Invite/user-music for path flexibility
      for (const subDir of [path.join(__dirname, 'Invite', 'user-music')]) {
        try {
          if (!fs.existsSync(subDir)) fs.mkdirSync(subDir, { recursive: true });
          fs.writeFileSync(path.join(subDir, songFileName), fileBytes);
        } catch (_) {}
      }

      const responsePayload = {
        url: '/user-music/' + songFileName,
        expiresAt: Date.now() + DAYS_90_MS
      };

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(responsePayload));
    });
    return;
  }

  // Canonical alias: Map root and legacy duplicate names seamlessly to single index.html
  if (['/', '/index.html', '/vivaah.html', '/vivaah-cards.html', '/vivaah', '/vivaah-cards', '/showcase.html'].includes(pathname)) {
    pathname = '/index.html';
  }

  let filePath = path.join(__dirname, pathname);

  // If path points to directory, look for index.html inside
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }

  // Prevent directory traversal
  if (!filePath.startsWith(__dirname)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('403 Forbidden');
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(`
        <!DOCTYPE html>
        <html lang="en">
        <head><meta charset="utf-8"><title>404 Not Found</title></head>
        <body style="font-family:sans-serif;padding:40px;background:#140105;color:#fff;">
          <h2 style="color:#d4af37;">404 — Page Not Found</h2>
          <p>Requested: <code>${pathname}</code></p>
          <hr style="border-color:#33111b;">
          <h3>Available Quick Links:</h3>
          <ul>
            <li><a style="color:#fae19c;" href="/">👑 Prime eCard Main Landing Page</a></li>
            <li><a style="color:#fae19c;" href="/Invite/studio.html">🎨 10 Royal Templates Studio</a></li>
            <li><a style="color:#fae19c;" href="/Invite/onboard/index.html">💍 Customer Onboarding Wizard</a></li>
            <li><a style="color:#fae19c;" href="/Invite/token-engine/demo.html">🌟 Token Studio &amp; Template Selector Demo</a></li>
            <li><a style="color:#fae19c;" href="/Invite/index.html">💌 Live Guest Invitation Card</a></li>
          </ul>
        </body>
        </html>
      `);
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    res.writeHead(200, {
      'Content-Type': contentType,
      'Content-Length': stats.size
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`[Prime eCard Server] Running at:`);
  console.log(`  > Local:   http://localhost:${PORT}/`);
  console.log(`  > Network: http://127.0.0.1:${PORT}/`);
  console.log(`  > Studio:  http://localhost:${PORT}/Invite/token-engine/demo.html`);
});
