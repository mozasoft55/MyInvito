import test from 'node:test';
import assert from 'node:assert/strict';

test('template-12 renders 3D royal gate opening with welcome board, couple details, and dynamic events', async () => {
  const module = await import('../templates/template-12.js');
  assert.equal(typeof module.default, 'function');
  assert.equal(typeof module.mount, 'function');

  const html = module.default({
    guest: { name: 'Roy Family', party_size: 4, is_family: true },
    wedding: {
      groom_name: 'Param',
      bride_name: 'Pari',
      groom_father: 'Abdul',
      bride_father: 'Kalam',
      groom_address: 'Riverfront Promenade, Heritage Boulevard',
      bride_address: 'Riverfront Promenade, Heritage Boulevard',
      date: '2026-11-28',
      time: '7:00 PM',
      venue_name: 'Royal Palace Banquet',
      venue_address: 'Riverfront Promenade, Heritage Boulevard',
      map_url: 'https://maps.google.com/?q=Kolkata',
      rsvp_contacts: '+91 98765 43210'
    },
    events: [
      { event_name: 'Ceremony 1 · Gaye Holud', event_date: '2026-11-20', event_time: '10:00 AM', venue: 'Royal Palace Banquet' },
      { event_name: 'Ceremony 2 · Sangeet & Mehendi', event_date: '2026-11-24', event_time: '6:30 PM', venue: 'Royal Palace Banquet' },
      { event_name: 'Ceremony 3 · Shubho Bibaho', event_date: '2026-11-28', event_time: '7:00 PM', venue: 'Royal Palace Banquet' }
    ]
  });

  assert.equal(typeof html, 'string');
  assert.ok(html.length > 500);

  // Check key elements
  assert.match(html, /id="t12-stage"/);
  assert.match(html, /id="t12-intro"/);
  assert.match(html, /id="t12-open-btn"/);
  assert.match(html, /Param/);
  assert.match(html, /Pari/);
  assert.match(html, /Roy Family/);
  assert.match(html, /Family Invitation · 4 Persons/);
  assert.match(html, /Two Hearts · One Destiny/);
  assert.match(html, /Together with their Families/);
  assert.match(html, /The Journey of Love &amp; Togetherness/);
  assert.match(html, /Kalam/);
  assert.match(html, /Abdul/);
  assert.match(html, /dates-section/);
  assert.match(html, /events-section/);
  assert.match(html, /map-section/);
  assert.match(html, /rsvp-section/);
  assert.match(html, /template-12-cover\.webp/);
  assert.match(html, /template-12-page\.webp/);
  assert.match(html, /template-12-border\.webp/);
});

test('template-12 mount initializes safely and returns working cleanup function', async () => {
  const module = await import('../templates/template-12.js');

  // Minimal fake DOM
  const listeners = {};
  const fakeElement = {
    classList: {
      add: () => {},
      remove: () => {},
      contains: () => false
    },
    style: {},
    getAttribute: () => '2026-11-28',
    setAttribute: () => {},
    getBoundingClientRect: () => ({ width: 400, height: 600 }),
    addEventListener: (evt, handler) => { listeners[evt] = handler; },
    removeEventListener: (evt) => { delete listeners[evt]; },
    querySelector: () => fakeElement,
    querySelectorAll: () => [fakeElement],
    getContext: () => ({
      scale: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
      createRadialGradient: () => ({ addColorStop: () => {} }),
      fillRect: () => {},
      fillText: () => {},
      beginPath: () => {},
      arc: () => {},
      fill: () => {},
      stroke: () => {},
      moveTo: () => {},
      lineTo: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: new Uint8ClampedArray(100) })
    })
  };

  const cleanup = module.mount(fakeElement, {
    guest: { name: 'Respected Guest', party_size: 2 },
    wedding: { groom_name: 'Param', bride_name: 'Pari' },
    events: []
  });

  assert.equal(typeof cleanup, 'function');
  cleanup();
});
