import test from 'node:test';
import assert from 'node:assert/strict';
import renderT04, { mount } from '../templates/template-04.js';

test('template-04 renders butterfly entrance, stage, couple portraits, and programme cards', () => {
  const html = renderT04({
    guest: { name: 'Aarav Sharma', persons: 2, with_family: true },
    wedding: {
      bride_name: 'Zoya',
      groom_name: 'Faizan',
      bride_full: 'Zoya Fatima',
      groom_full: 'Faizan Ahmad',
      bride_parents: 'Mrs. & Mr. Tariq Fatima',
      groom_parents: 'Mrs. & Mr. Naseem Ahmad',
      couple_photo: 'https://example.com/couple.jpg',
      date: '2026-11-20',
      time: '8:00 PM',
      venue: 'Grand Imperial Palace',
      address: 'Kolkata, WB'
    },
    events: [
      { event_name: 'Nikah Ceremony', event_date: '2026-11-20', event_time: '20:00' }
    ]
  });

  // Entrance & Stage
  assert.match(html, /id="stage"/);
  assert.match(html, /id="intro"/);
  assert.match(html, /id="pill"/);
  assert.match(html, /id="bf"/);
  assert.match(html, /id="fx"/);

  // Page 1: First screen with text layers
  assert.match(html, /WELCOME/);
  assert.match(html, /A CELEBRATION OF LOVE/);
  assert.match(html, /CORDIALLY INVITED/);
  assert.match(html, /Aarav Sharma &amp; Family/);
  assert.match(html, /Family/);

  // Page 2: Couple details, Parents, and Photographs
  assert.match(html, /id="p2"/);
  assert.match(html, /THE WEDDING OF/);
  assert.match(html, /Faizan/);
  assert.match(html, /Zoya/);
  assert.match(html, /Mrs\. &amp; Mr\. Naseem Ahmad/);
  assert.match(html, /Mrs\. &amp; Mr\. Tariq Fatima/);
  assert.match(html, /SON OF/);
  assert.match(html, /DAUGHTER OF/);

  // Subsequent Pages: Programme, Muhurat/Date, Venue
  assert.match(html, /WEDDING PROGRAMME/);
  assert.match(html, /Nikah Ceremony/);
  assert.match(html, /AUSPICIOUS TIMING/);
  assert.match(html, /Grand Imperial Palace/);
  assert.match(html, /id="t04-scratch-canvas"/);
  assert.match(html, /t04-scratch-btn/);
  assert.match(html, /data-restart>Start Again ↻/);
});

test('template-04 mount initializes safely and returns cleanup function', () => {
  const listeners = {};
  const mockClassList = new Set(['t04']);
  const mockElement = {
    classList: {
      add(c) { mockClassList.add(c); },
      remove(c) { mockClassList.delete(c); },
      toggle(c, v) { if (v) mockClassList.add(c); else mockClassList.delete(c); },
      contains(c) { return mockClassList.has(c); }
    },
    dataset: {},
    style: { setProperty() {} },
    querySelector() { return null; },
    querySelectorAll() { return []; },
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
    wedding: { bride_name: 'B', groom_name: 'G' },
    events: []
  });

  assert.equal(typeof cleanup, 'function');
  assert.doesNotThrow(() => cleanup());
});
