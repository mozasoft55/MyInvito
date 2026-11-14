import test from 'node:test';
import assert from 'node:assert/strict';

test('template-11 renders palace gate opening with lights-off, couple names, and dynamic events', async () => {
  const module = await import('../templates/template-11.js');
  assert.equal(typeof module.default, 'function');
  assert.equal(typeof module.mount, 'function');

  const html = module.default({
    guest: { name: 'Roy Family', persons: 4, with_family: true },
    wedding: {
      groom_name: 'Purushottam',
      bride_name: 'Sanjukta',
      groom_parents: 'Mr. & Mrs. Roy',
      bride_parents: 'Mr. & Mrs. Sharma',
      date: '2026-11-28',
      time: '7:00 PM',
      venue: 'Royal Palace Banquet',
      address: 'Grand Heritage Avenue, Kolkata',
      map_url: 'https://maps.google.com/?q=Kolkata',
      rsvp_contacts: '+91 98765 43210',
      footer_text: 'The Roy & Sharma Families'
    },
    events: [
      { event_name: 'Gaye Holud', event_date: '2026-11-27', event_time: '5:00 PM', venue: 'Palace Mandap' },
      { event_name: 'Shubho Bibaho', event_date: '2026-11-28', event_time: '7:00 PM', venue: 'Royal Palace Banquet' }
    ]
  });

  assert.equal(typeof html, 'string');
  assert.ok(html.length > 500);

  // Check key elements
  assert.match(html, /id="t11-stage"/);
  assert.match(html, /id="t11-intro"/);
  assert.match(html, /id="t11-open-btn"/);
  assert.match(html, /Purushottam/);
  assert.match(html, /Sanjukta/);
  assert.match(html, /Roy Family/);
  assert.match(html, /Family Invitation · 4 Persons/);
  assert.match(html, /Gaye Holud/);
  assert.match(html, /Shubho Bibaho/);
  assert.match(html, /dates-section/);
  assert.match(html, /map-section/);
  assert.match(html, /rsvp-section/);
  assert.match(html, /template-11-border\.png/);
});

test('template-11 mount initializes safely and returns working cleanup function', async () => {
  const module = await import('../templates/template-11.js');

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
    querySelectorAll: () => [fakeElement]
  };

  const cleanup = module.mount(fakeElement, {
    guest: { name: 'Respected Guest', persons: 2 },
    wedding: { groom_name: 'Purushottam', bride_name: 'Sanjukta' },
    events: []
  });

  assert.equal(typeof cleanup, 'function');
  cleanup();
});
