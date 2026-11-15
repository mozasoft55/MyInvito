import test from 'node:test';
import assert from 'node:assert/strict';

test('scratch-cracker module exports expected functions', async () => {
  const mod = await import('../utils/scratch-cracker.js');
  assert.equal(typeof mod.emitPhuljhariSparks, 'function');
  assert.equal(typeof mod.playPhuljhariCrackle, 'function');
  assert.equal(typeof mod.playFirecrackerBurstSound, 'function');
  assert.equal(typeof mod.triggerFirecrackerCelebration, 'function');
  assert.equal(typeof mod.initUniversalScratchCracker, 'function');
});

test('emitPhuljhariSparks and triggerFirecrackerCelebration run safely in headless environment', async () => {
  const mod = await import('../utils/scratch-cracker.js');

  // Should safely execute without throwing even without DOM/canvas in Node
  assert.doesNotThrow(() => {
    mod.emitPhuljhariSparks(150, 200, 8);
    mod.playPhuljhariCrackle();
    mod.playFirecrackerBurstSound();
    mod.triggerFirecrackerCelebration(200, 300);
  });
});

test('initUniversalScratchCracker discovers scratch canvas and fallback buttons in fake DOM', async () => {
  const mod = await import('../utils/scratch-cracker.js');

  const listeners = {};
  const fakeCanvas = {
    className: 't14-scratch-canvas',
    classList: {
      contains: (cls) => cls === 't14-scratch-canvas',
      add: () => {}
    },
    style: {},
    getBoundingClientRect: () => ({ left: 50, top: 100, width: 280, height: 120 }),
    addEventListener: (evt, cb) => {
      listeners[evt] = cb;
    },
    removeEventListener: (evt) => {
      delete listeners[evt];
    }
  };

  const fakeButton = {
    getAttribute: () => 'true',
    getBoundingClientRect: () => ({ left: 100, top: 250, width: 120, height: 40 }),
    addEventListener: (evt, cb) => {
      listeners['btn_' + evt] = cb;
    },
    removeEventListener: (evt) => {
      delete listeners['btn_' + evt];
    }
  };

  const fakeRoot = {
    querySelectorAll: (selector) => {
      if (selector.includes('canvas')) return [fakeCanvas];
      if (selector.includes('btn')) return [fakeButton];
      return [];
    }
  };

  const cleanup = mod.initUniversalScratchCracker(fakeRoot);
  assert.equal(typeof cleanup, 'function');

  // Simulate mouse scratch
  if (listeners['mousedown']) {
    listeners['mousedown']({ clientX: 120, clientY: 150 });
  }
  if (listeners['mousemove']) {
    listeners['mousemove']({ clientX: 125, clientY: 152 });
  }

  // Simulate button reveal
  if (listeners['btn_click']) {
    listeners['btn_click']();
  }

  cleanup();
});
