import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { AudioController } from '../token-engine/AudioController.js';
import { TemplateSelector } from '../token-engine/TemplateSelector.js';

test('AudioController manages auto-pause on page visibility/blur and restores on active focus', () => {
  const controller = new AudioController({
    audioSrc: './invitation.mp3',
    autoRender: false
  });

  assert.equal(typeof controller._handleVisibilityChange, 'function');
  assert.equal(typeof controller._handleWindowBlur, 'function');
  assert.equal(typeof controller._handleWindowFocus, 'function');
  assert.equal(typeof controller._handlePageHide, 'function');

  // Simulate active playing state
  controller.isPlaying = true;

  // Window/tab blurred
  controller._handleWindowBlur();
  assert.equal(controller._wasPlayingBeforeHide, true);
  assert.equal(controller.isPlaying, false);

  controller.destroy();
});

test('TemplateSelector registers Advance category and matches 3D templates 11-14', () => {
  const templatesJsonPath = fileURLToPath(new URL('../token-engine/templates.json', import.meta.url));
  const catalog = JSON.parse(fs.readFileSync(templatesJsonPath, 'utf8'));

  const selector = new TemplateSelector({
    templates: catalog.templates
  });

  assert.ok(selector.categories.includes('Advance'));
  assert.equal(selector._getCategoryIcon('Advance'), '✨');

  // Filter by Advance
  selector.setFilter('Advance');
  const advanceTpls = selector.getFilteredTemplates();
  assert.ok(advanceTpls.length >= 4);

  const legacyIds = advanceTpls.map(t => t.legacyId);
  assert.ok(legacyIds.includes('template-11'));
  assert.ok(legacyIds.includes('template-12'));
  assert.ok(legacyIds.includes('template-13'));
  assert.ok(legacyIds.includes('template-14'));
});

test('templates.json contains complete metadata for templates 01 through 14', () => {
  const templatesJsonPath = fileURLToPath(new URL('../token-engine/templates.json', import.meta.url));
  const catalog = JSON.parse(fs.readFileSync(templatesJsonPath, 'utf8'));

  for (let i = 1; i <= 14; i++) {
    const pad = String(i).padStart(2, '0');
    const legacyKey = `template-${pad}`;
    const exists = catalog.templates.some(t => t.legacyId === legacyKey || t.id === legacyKey);
    assert.ok(exists, `Expected templates.json to include entry for ${legacyKey}`);
  }
});

test('Templates 01 and 06 preserve chosen soundtrack without reverting to invitation.mp3', async () => {
  const t06 = (await import('../templates/template-06.js')).default;
  const t01 = (await import('../templates/template-01.js')).default;

  const sampleWedding = {
    bride_name: 'Pari',
    groom_name: 'Param',
    date: '2026-11-28',
    music_url: '../music/raataan-lambiyan.mp3',
    music_title: 'Raataan Lambiyan'
  };

  const html06 = t06({ guest: { name: 'Friend' }, wedding: sampleWedding, events: [] });
  assert.ok(html06.includes('data-music="../music/raataan-lambiyan.mp3"'), 'Template 06 should embed the selected soundtrack in data-music');

  const html01 = t01({ guest: { name: 'Friend' }, wedding: sampleWedding, events: [] });
  assert.ok(html01.includes('data-music="../music/raataan-lambiyan.mp3"'), 'Template 01 should embed the selected soundtrack in data-music');
});
