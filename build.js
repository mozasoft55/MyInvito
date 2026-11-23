const fs = require('fs');
const path = require('path');

let esbuild = null;
try {
  esbuild = require('esbuild');
} catch (_) {
  try {
    esbuild = require('./node_modules/esbuild');
  } catch (_) {}
}

const distDir = path.join(__dirname, 'dist');
if (fs.existsSync(distDir)) {
  try {
    fs.rmSync(distDir, { recursive: true, force: true });
  } catch (_) {
    // If folder handle is temporarily locked on Windows, continue and overwrite
  }
}
if (!fs.existsSync(distDir)) {
  try {
    fs.mkdirSync(distDir, { recursive: true });
  } catch (_) {}
}

// 1. Copy main entrypoint index.html
try {
  fs.copyFileSync(path.join(__dirname, 'index.html'), path.join(distDir, 'index.html'));
} catch (e) {
  console.warn('[Build] Warning copying index.html:', e.message);
}

// 2. Copy Invite suite (templates, studio, onboard, assets)
try {
  fs.cpSync(path.join(__dirname, 'Invite'), path.join(distDir, 'Invite'), { recursive: true, force: true });
} catch (e) {
  console.warn('[Build] Warning copying Invite suite:', e.message);
}

// 3. Copy music directory if present
if (fs.existsSync(path.join(__dirname, 'music'))) {
  try {
    fs.cpSync(path.join(__dirname, 'music'), path.join(distDir, 'music'), { recursive: true, force: true });
  } catch (e) {
    console.warn('[Build] Warning copying music:', e.message);
  }
}
if (fs.existsSync(path.join(__dirname, 'user-music'))) {
  try {
    fs.cpSync(path.join(__dirname, 'user-music'), path.join(distDir, 'user-music'), { recursive: true, force: true });
  } catch (e) {
    console.warn('[Build] Warning copying user-music:', e.message);
  }
}

// 4. Copy Cloudflare Pages _headers to dist root if present
try {
  if (fs.existsSync(path.join(__dirname, 'Invite', '_headers'))) {
    fs.copyFileSync(path.join(__dirname, 'Invite', '_headers'), path.join(distDir, '_headers'));
  } else if (fs.existsSync(path.join(__dirname, '_headers'))) {
    fs.copyFileSync(path.join(__dirname, '_headers'), path.join(distDir, '_headers'));
  }
} catch (e) {
  console.warn('[Build] Warning copying _headers:', e.message);
}

// 5. Ensure .nojekyll for static hosting
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

// 6. Production Comment Stripper & Minifier
// Recursively strips ALL comments from CSS, JS, and HTML in dist so production responses are 100% clean.
// Source files in Invite/ remain completely untouched with all comments intact for developer understanding!
function processProductionFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      processProductionFiles(fullPath);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (ext === '.css') {
        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          let cleaned = '';
          if (esbuild) {
            cleaned = esbuild.transformSync(raw, { loader: 'css', minify: true, legalComments: 'none' }).code;
          } else {
            cleaned = raw.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*[\r\n]/gm, '').trim();
          }
          fs.writeFileSync(fullPath, cleaned, 'utf8');
        } catch (e) {
          console.warn(`[Build] Warning minifying CSS ${entry.name}:`, e.message);
        }
      } else if (ext === '.js' || ext === '.mjs') {
        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          let cleaned = '';
          if (esbuild) {
            cleaned = esbuild.transformSync(raw, { loader: 'js', minify: true, legalComments: 'none' }).code;
          } else {
            cleaned = raw
              .replace(/\/\*[\s\S]*?\*\//g, '')
              .replace(/(^|[^:\\])\/\/.*$/gm, '$1')
              .replace(/^\s*[\r\n]/gm, '')
              .trim();
          }
          fs.writeFileSync(fullPath, cleaned, 'utf8');
        } catch (e) {
          console.warn(`[Build] Warning minifying JS ${entry.name}:`, e.message);
        }
      } else if (ext === '.html') {
        try {
          const raw = fs.readFileSync(fullPath, 'utf8');
          const cleaned = raw.replace(/<!--(?!\[if)[\s\S]*?-->/g, '');
          fs.writeFileSync(fullPath, cleaned, 'utf8');
        } catch (e) {
          console.warn(`[Build] Warning stripping HTML comments in ${entry.name}:`, e.message);
        }
      }
    }
  }
}

console.log('⚡ Stripping developer comments and minifying assets for production...');
processProductionFiles(distDir);
console.log('✅ Prime eCard static build completed successfully into ./dist (All comments stripped for production)');
