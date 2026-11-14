import test from 'node:test';
import assert from 'node:assert/strict';
import renderT07, { mount } from '../templates/template-07.js';

test('template-07 renders royal ivory archway with lights-off, couple names, and dynamic events', () => {
  const payload = {
    guest: { name: 'Roy Family', persons: 4, with_family: true },
    wedding: {
      bride_name: 'Zoya',
      groom_name: 'Aarav',
      date: '2026-11-20',
      time: '7:00 PM',
      venue: 'The Royal Heritage Banquet Palace',
      address: '14 Palace Courtyard Road, Alipore, Kolkata',
      comment: 'Opposite Botanical Garden • Valet Parking',
      invocation: 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيم'
    },
    events: [
      { event_name: 'Grand Reception', event_date: '2026-11-20', event_time: '7:00 PM', venue: 'Royal Rose Ballroom' },
      { event_name: 'Gaye Holud', event_date: '2026-11-28', event_time: '10:30 AM', venue: 'Marigold Courtyard' },
      { event_name: 'Mehdi & Sangeet', event_date: '2026-11-28', event_time: '3:30 PM', venue: 'Gulab Mahal' },
      { event_name: 'Biye / Shubho Bibaho', event_date: '2026-11-28', event_time: '8:00 PM', venue: 'The Grand Crimson Mandap' }
    ]
  };

  const html = renderT07(payload);
  assert.equal(typeof html, 'string');
  assert.ok(html.includes('Aarav'), 'Should contain groom name Aarav');
  assert.ok(html.includes('Zoya'), 'Should contain bride name Zoya');
  assert.ok(html.includes('Roy Family'), 'Should contain guest name Roy Family');
  assert.ok(html.includes('Grand Reception'), 'Should contain Grand Reception');
  assert.ok(html.includes('Gaye Holud'), 'Should contain Gaye Holud');
  assert.ok(html.includes('Mehdi &amp; Sangeet') || html.includes('Mehdi & Sangeet'), 'Should contain Mehdi ceremony');
  assert.ok(html.includes('Biye / Shubho Bibaho'), 'Should contain Biye ceremony');
  assert.ok(html.includes('t07LightsOffOverlay'), 'Should contain lights off overlay');
  assert.ok(html.includes('t07IgniteBtn'), 'Should contain lantern ignition button');
  assert.ok(html.includes('t07FxCanvas'), 'Should contain pyrotechnics canvas');
  assert.ok(html.includes('t07CdDays'), 'Should contain live countdown timer tiles');
  assert.ok(html.includes('The Royal Heritage Banquet Palace'), 'Should contain banquet palace name');
});

test('template-07 mount initializes safely and returns working cleanup function', () => {
  const listeners = {};
  const mockClassList = new Set(['t07-root']);
  const mockElement = {
    firstElementChild: null,
    classList: {
      add(c) { mockClassList.add(c); },
      remove(c) { mockClassList.delete(c); },
      toggle(c, v) { if (v) mockClassList.add(c); else mockClassList.delete(c); },
      contains(c) { return mockClassList.has(c); }
    },
    dataset: {},
    getAttribute(attr) { return '1763640000000'; },
    style: { setProperty() {} },
    querySelector(sel) { return null; },
    querySelectorAll(sel) { return []; },
    addEventListener(evt, fn) {
      listeners[evt] = listeners[evt] || [];
      listeners[evt].push(fn);
    },
    removeEventListener(evt, fn) {
      if (listeners[evt]) {
        listeners[evt] = listeners[evt].filter(f => f !== fn);
      }
    }
  };

  const cleanup = mount(mockElement, {
    guest: { name: 'Test Guest' },
    wedding: { bride_name: 'Zoya', groom_name: 'Aarav' },
    events: []
  });

  assert.equal(typeof cleanup, 'function');
  assert.doesNotThrow(() => cleanup());
});
