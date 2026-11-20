import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

test('index.html includes comprehensive anti-tamper, anti-theft, and lazy loading protections', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

  // 1. Right-click / Context Menu Prevention
  assert.ok(indexHtml.includes("addEventListener('contextmenu'"), 'Must prevent right-click context menu');
  assert.ok(indexHtml.includes('e.preventDefault()'), 'Context menu must be prevented');

  // 2. DevTools keyboard shortcut interception (F12, Ctrl+Shift+I, Ctrl+U)
  assert.ok(indexHtml.includes("e.key === 'F12'"), 'Must intercept F12 DevTools shortcut');
  assert.ok(indexHtml.includes("e.ctrlKey && e.shiftKey"), 'Must intercept Ctrl+Shift shortcuts');
  assert.ok(indexHtml.includes("['U', 'u', 'S', 's']"), 'Must intercept View Source (Ctrl+U) and Save Page (Ctrl+S)');

  // 3. Domain License & Anti-Theft Guard
  assert.ok(indexHtml.includes('Domain License & Anti-Theft Guard'), 'Must include domain license guard');
  assert.ok(indexHtml.includes('isAllowedHost'), 'Must check allowed hostnames');
  assert.ok(indexHtml.includes('eweddinghubs'), 'Must authorize eweddinghubs domain');
  assert.ok(indexHtml.includes('workers.dev'), 'Must authorize workers.dev domain');

  // 4. Text and Asset Selection Protection
  assert.ok(indexHtml.includes('user-select: none'), 'Must disable user text selection across invitation');
  assert.ok(indexHtml.includes('-webkit-user-select: none'), 'Must disable webkit user selection');

  // 5. Lazy-loading Google Maps Iframe (drastically reduces network footprint)
  assert.ok(indexHtml.includes('data-src="${escapeHtml(embedMapUrl)}"'), 'Map iframe must use data-src for on-demand lazy loading');
  assert.ok(indexHtml.includes('mapFrame.dataset.src'), 'openMap must populate src on demand');

  // 6. Developer Inspection Bypass (allows owner to test and inspect without blocking themselves)
  assert.ok(indexHtml.includes('isDevUnlocked'), 'Must implement developer bypass check');
  assert.ok(indexHtml.includes("params.has('debug') || params.has('dev')"), 'Must support ?debug or ?dev query param');
  assert.ok(indexHtml.includes("e.ctrlKey && e.altKey && (e.key === 'D' || e.key === 'd')"), 'Must support Ctrl+Alt+D secret toggle');
});
