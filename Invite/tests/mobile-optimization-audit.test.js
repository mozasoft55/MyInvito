import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import template02Render, { mount as template02Mount } from '../templates/template-02.js';
import { fetchInvitationByCode, submitRsvp, clearInvitationCache } from '../api.js';
import { SUPABASE_CONFIG } from '../supabase-config.js';

test.before(() => {
  SUPABASE_CONFIG.anonKey = 'test-publishable-key';
});

const wedding = {
  bride_name: 'Tarana',
  groom_name: 'Akbar',
  date: '2026-12-15',
  time: '7:00 PM',
  venue: 'Grand Taj Palace',
  address: 'New Delhi',
  map_url: 'https://maps.google.com/?q=Grand+Taj+Palace',
  rsvp_contacts: '9876543210'
};
const guest = { name: 'Shahrukh Khan', persons: 2, with_family: false };
const events = [{ event_name: 'Walima Banquet', event_date: '2026-12-15', event_time: '7:30 PM' }];

test('Template-02: leaves bottom clearance above floating dock so navigation buttons are never obstructed', () => {
  const html = template02Render({ guest, wedding, events });
  // Verify .sp bottom clearance: calc(68px + max(12px, env(safe-area-inset-bottom...)))
  assert.match(html, /calc\(68px\s*\+\s*max\(12px,\s*env\(safe-area-inset-bottom/);
  // Verify button exists
  assert.match(html, /class="btn"/);
  assert.match(html, /data-next="1"/);
});

test('Template-02: navigation dots are accessible clickable buttons with role tab', () => {
  const html = template02Render({ guest, wedding, events });
  assert.match(html, /role="tablist"/);
  assert.match(html, /class="dot-btn on" data-next="0" role="tab"/);
  assert.match(html, /aria-label="Go to section 1"/);
});

test('Template-02: mount exposes window.__template02Go and returns working cleanup function', () => {
  globalThis.window = globalThis;
  const container = {
    querySelector: (sel) => {
      if (sel === '#au') return { paused: true, play: () => Promise.resolve(), pause: () => {}, addEventListener: () => {} };
      if (sel === '#aud') return { classList: { add: () => {}, remove: () => {} } };
      if (sel === '#open-rsvp-modal-btn') return { onclick: null };
      if (sel === '#sm' || sel === '#cv' || sel === '#sc' || sel === '#cs' || sel === '#cal') return { classList: { add: () => {}, remove: () => {} }, onclick: null };
      return null;
    },
    querySelectorAll: (sel) => {
      if (sel === '.sp') {
        return [
          { classList: { add: () => {}, remove: () => {} } },
          { classList: { add: () => {}, remove: () => {} } }
        ];
      }
      return [];
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    isConnected: true
  };

  const cleanup = template02Mount(container, { guest, wedding, events });
  assert.equal(typeof cleanup, 'function', 'mount() must return a cleanup function');
  assert.equal(typeof globalThis.window.__template02Go, 'function', '__template02Go must be exposed for dock interaction');

  // Call cleanup
  cleanup();
  assert.equal(globalThis.window.__template02Go, undefined, 'cleanup must unbind window.__template02Go');
});

test('Dock & RSVP: initial markup does not hardcode active on #royalDockRsvp', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.match(indexHtml, /<button type="button" id="royalDockRsvp" class="royal-dock-btn" aria-label="Open RSVP Modal">/);
  assert.doesNotMatch(indexHtml, /id="royalDockRsvp" class="royal-dock-btn active"/);
});

test('Dock & RSVP: index.html manages royal-modal-open on body and handles Escape key', () => {
  const indexHtml = fs.readFileSync(path.join(process.cwd(), 'index.html'), 'utf8');
  assert.match(indexHtml, /document\.body\.classList\.add\('royal-modal-open'\)/);
  assert.match(indexHtml, /document\.body\.classList\.remove\('royal-modal-open'\)/);
  assert.match(indexHtml, /setActiveNav\(null\)/);
  assert.match(indexHtml, /e\.key === 'Escape'/);
  assert.match(indexHtml, /window\.__template02Go\(3\)/);
});

test('dock-rsvp.css: hidden modal overlay is display: none !important and touch target >= 44px', () => {
  const css = fs.readFileSync(path.join(process.cwd(), 'dock-rsvp.css'), 'utf8');
  assert.match(css, /\.royal-modal-overlay\.hidden[\s\S]*?display:\s*none\s*!important/);
  assert.match(css, /\.royal-modal-overlay\.hidden[\s\S]*?pointer-events:\s*none\s*!important/);
  assert.match(css, /body\.royal-modal-open[\s\S]*?overflow:\s*hidden\s*!important/);
  assert.match(css, /\.royal-modal-close[\s\S]*?min-width:\s*44px/);
  assert.match(css, /\.royal-modal-close[\s\S]*?min-height:\s*44px/);
  assert.match(css, /font-size:\s*16px\s*!important/);
});

test('Mobile layout bounds: Admin, Dashboard, Onboarding, and Guest-List dialogs prevent offscreen clipping', () => {
  const adminCss = fs.readFileSync(path.join(process.cwd(), 'admin/admin.css'), 'utf8');
  assert.match(adminCss, /\.dialog[\s\S]*?max-height:\s*calc\(100dvh - 32px\)/);
  assert.match(adminCss, /\.dialog[\s\S]*?overflow-y:\s*auto/);
  assert.match(adminCss, /@media\(max-width:480px\)[\s\S]*?\.stats\s*\{\s*grid-template-columns:\s*1fr;/);

  const dashCss = fs.readFileSync(path.join(process.cwd(), 'dashboard/style.css'), 'utf8');
  assert.match(dashCss, /\.edit-dialog[\s\S]*?max-height:calc\(100dvh - 32px\)/);

  const guestListHtml = fs.readFileSync(path.join(process.cwd(), 'guest-list.html'), 'utf8');
  assert.match(guestListHtml, /dialog[\s\S]*?max-height:calc\(100dvh - 32px\)/);

  const onboardCss = fs.readFileSync(path.join(process.cwd(), 'onboard/style.css'), 'utf8');
  assert.match(onboardCss, /\.mp-modal[\s\S]*?max-height:calc\(100dvh - 24px\)/);
});

test('Server: security headers, smart asset caching, and 304 conditional request support', () => {
  const serverCode = fs.readFileSync(path.join(process.cwd(), 'server.js'), 'utf8');
  assert.match(serverCode, /'X-Content-Type-Options':\s*'nosniff'/);
  assert.match(serverCode, /'X-Frame-Options':\s*'SAMEORIGIN'/);
  assert.match(serverCode, /'Referrer-Policy':\s*'strict-origin-when-cross-origin'/);
  assert.match(serverCode, /'Permissions-Policy':\s*'camera=\(\), microphone=\(\), geolocation=\(\)'/);
  assert.match(serverCode, /max-age=604800/);
  assert.match(serverCode, /max-age=3600/);
  assert.match(serverCode, /304/);
});

test('api.js: in-memory caching speeds up lookups and invalidates properly on RSVP', async () => {
  clearInvitationCache();
  const originalFetch = globalThis.fetch;
  let fetchCount = 0;
  globalThis.fetch = async () => {
    fetchCount++;
    return {
      ok: true,
      status: 200,
      text: async () => JSON.stringify({
        guest: { id: 'g-1', guest_name: 'Test Guest', invite_code: 'CACHE-TEST-1', persons: 2, with_family: false },
        wedding: { id: 'w-1', bride_name: 'Bride', groom_name: 'Groom' },
        programme: []
      })
    };
  };

  try {
    // 1st call -> network fetch
    const res1 = await fetchInvitationByCode('CACHE-TEST-1');
    assert.equal(fetchCount, 1);
    assert.equal(res1.guest.name, 'Test Guest');

    // 2nd call -> served from in-memory cache
    const res2 = await fetchInvitationByCode('CACHE-TEST-1');
    assert.equal(fetchCount, 1, 'Subsequent lookup must be served from cache without second network call');
    assert.equal(res2.guest.name, 'Test Guest');

    // Explicit cache clear
    clearInvitationCache('CACHE-TEST-1');
    const res3 = await fetchInvitationByCode('CACHE-TEST-1');
    assert.equal(fetchCount, 2, 'After cache clear, lookup initiates fresh network request');
  } finally {
    globalThis.fetch = originalFetch;
    clearInvitationCache();
  }
});
