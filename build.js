const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  fs.rmSync(distDir, { recursive: true, force: true });
}
fs.mkdirSync(distDir, { recursive: true });

// 1. Copy main entrypoint index.html
fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));

// 2. Copy Invite suite (templates, studio, onboard, assets)
fs.cpSync(path.join(__dirname, 'Invite'), path.join(distDir, 'Invite'), { recursive: true });

// 3. Copy music directory if present
if (fs.existsSync(path.join(__dirname, 'music'))) {
  fs.cpSync(path.join(__dirname, 'music'), path.join(distDir, 'music'), { recursive: true });
}
if (fs.existsSync(path.join(__dirname, 'user-music'))) {
  fs.cpSync(path.join(__dirname, 'user-music'), path.join(distDir, 'user-music'), { recursive: true });
}

// 4. Copy Cloudflare Pages _headers to dist root if present
if (fs.existsSync(path.join(__dirname, 'Invite', '_headers'))) {
  fs.copyFileSync(path.join(__dirname, 'Invite', '_headers'), path.join(distDir, '_headers'));
} else if (fs.existsSync(path.join(__dirname, '_headers'))) {
  fs.copyFileSync(path.join(__dirname, '_headers'), path.join(distDir, '_headers'));
}

// 5. Ensure .nojekyll for static hosting
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

console.log('✅ Prime eCard static build completed successfully into ./dist');
