import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { validateOnboarding } from '../onboarding-core.js';

test('validateOnboarding preserves custom wedding music fields without validation errors', () => {
  const result = validateOnboarding({
    customer_name: 'Anirudh Roy',
    phone: '9876543210',
    email: 'anirudh@example.com',
    city: 'Kolkata',
    bride_name: 'Pari',
    groom_name: 'Param',
    event_date: '2026-12-05',
    template_style: 'template-14',
    theme_name: 'royal-blue',
    package_code: 'standard',
    payment_mode: 'upi',
    music_id: 'raataan-lambiyan',
    music_title: 'Raataan Lambiyan',
    music_url: '../music/raataan-lambiyan.mp3',
    events: [
      { event_name: 'Wedding Ceremony', event_date: '2026-12-05', event_time: '19:00' }
    ]
  });

  assert.equal(result.valid, true);
  assert.equal(result.value.music_id, 'raataan-lambiyan');
  assert.equal(result.value.music_title, 'Raataan Lambiyan');
  assert.equal(result.value.music_url, '../music/raataan-lambiyan.mp3');
});

test('preset wedding music tracks exist on disk with valid audio bytes', () => {
  const expectedTracks = [
    'raataan-lambiyan.mp3',
    'tere-vaaste.mp3',
    'din-shagna-da.mp3',
    'kabira-encore.mp3',
    'piya-ghar-aavenge.mp3',
    'aaj-se-teri.mp3',
    'tere-dware-pe-aayi-baraat.mp3',
    'flute.mp3',
    'instrumental-1.mp3',
    'instrumental-2.mp3'
  ];

  for (const track of expectedTracks) {
    const invitePath = path.resolve('Invite/music', track);
    const rootPath = path.resolve('music', track);
    assert.ok(fs.existsSync(invitePath), `Invite/music/${track} must exist`);
    assert.ok(fs.existsSync(rootPath), `music/${track} must exist`);
    assert.ok(fs.statSync(invitePath).size > 1000, `Invite/music/${track} must not be empty`);
  }
});

test('onboarding HTML contains wedding music picker modal and form section', () => {
  const onboardHtml = fs.readFileSync('Invite/onboard/index.html', 'utf8');
  assert.ok(onboardHtml.includes('id="open-music-picker-btn"'), 'Must have music picker open button');
  assert.ok(onboardHtml.includes('id="selected-music-card"'), 'Must have selected music card display');
  assert.ok(onboardHtml.includes('id="mpBack"'), 'Must have music picker modal backdrop');
  assert.ok(onboardHtml.includes('id="mpList"'), 'Must have music picker tracks list');
  assert.ok(onboardHtml.includes('id="mpUpBtn"'), 'Must have custom song upload button');
  assert.ok(onboardHtml.includes('Your song'), 'Must display "Your song" heading');
  assert.ok(onboardHtml.includes('Plays softly when guests open the invite'), 'Must display reframe subtext');
});

test('onboarding CSS matches luxury wine and gold aesthetic for music elements', () => {
  const css = fs.readFileSync('Invite/onboard/style.css', 'utf8');
  assert.ok(css.includes('.selected-music-card'), 'Must contain .selected-music-card styles');
  assert.ok(css.includes('.mp-modal'), 'Must contain .mp-modal styling');
  assert.ok(css.includes('.mp-row.sel'), 'Must contain active selection .mp-row.sel styling');
  assert.ok(css.includes('--wine'), 'Must use royal wine styling');
});

test('guest invitation card supports dynamic wedding music playback', () => {
  const inviteHtml = fs.readFileSync('Invite/index.html', 'utf8');
  assert.ok(inviteHtml.includes('startMusic'), 'Must have startMusic function');
  assert.ok(inviteHtml.includes('wedding.music_url') || inviteHtml.includes('currentWedding.music_url'), 'Must check wedding music url');
  assert.ok(inviteHtml.includes('wedding-music-url'), 'Must check stored music url fallback');
  assert.ok(inviteHtml.includes('unveilInvitation'), 'Must start softly on unveil');
});
