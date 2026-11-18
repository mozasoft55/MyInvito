import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeWeddingRecord, normalizeInvitation } from '../api.js';
import renderT11 from '../templates/template-11.js';
import renderT12 from '../templates/template-12.js';
import renderT13 from '../templates/template-13.js';
import renderT14 from '../templates/template-14.js';
import renderT04 from '../templates/template-04.js';
import renderT06 from '../templates/template-06.js';
import renderT07 from '../templates/template-07.js';

const SAMPLE_CUSTOM_GROOM = 'https://skpcxbdrmsnwmggjodkz.supabase.co/storage/v1/object/public/wedding-photos/groom-custom-test.webp';
const SAMPLE_CUSTOM_BRIDE = 'https://skpcxbdrmsnwmggjodkz.supabase.co/storage/v1/object/public/wedding-photos/bride-custom-test.webp';
const SAMPLE_CUSTOM_VENUE = 'https://skpcxbdrmsnwmggjodkz.supabase.co/storage/v1/object/public/wedding-photos/venue-custom-test.webp';
const SAMPLE_BASE64_PHOTO = 'data:image/webp;base64,' + 'UklGR'.repeat(1000); // 5000+ chars data URL

test('api.js normalizeWeddingRecord does NOT truncate long base64 data URLs to 2000 chars', () => {
  const normalized = normalizeWeddingRecord({
    bride_name: 'Pari',
    groom_name: 'Param',
    groom_photo: SAMPLE_BASE64_PHOTO,
    bride_photo: SAMPLE_BASE64_PHOTO
  });

  assert.equal(normalized.groom_photo, SAMPLE_BASE64_PHOTO, 'Groom photo data URL must not be truncated');
  assert.equal(normalized.bride_photo, SAMPLE_BASE64_PHOTO, 'Bride photo data URL must not be truncated');
  assert.ok(normalized.groom_photo.length > 5000, 'Must preserve full base64 payload');
});

test('Template 12 renders custom uploaded photos even if template_id is mismatched or default', () => {
  // Scenario matching user screenshot: order created with template_id 'template-02', viewed with &template=template-12
  const wedding = {
    bride_name: 'Software Tester 1',
    groom_name: 'Software Tester 1',
    template_id: 'template-02', // mismatched!
    groom_photo: SAMPLE_CUSTOM_GROOM,
    bride_photo: SAMPLE_CUSTOM_BRIDE,
    venue_photo: SAMPLE_CUSTOM_VENUE
  };

  const html = renderT12({ guest: { name: 'Guest' }, wedding });

  // 1. Must render custom photos
  assert.ok(html.includes(SAMPLE_CUSTOM_GROOM), 'Template 12 must render custom groom photo');
  assert.ok(html.includes(SAMPLE_CUSTOM_BRIDE), 'Template 12 must render custom bride photo');

  // 2. Must NOT render default stock fallback when custom photo is present
  assert.ok(!html.includes('./assets/template-06-groom.webp'), 'Template 12 must NOT fallback to stock groom illustration when custom photo is present');
  assert.ok(!html.includes('./assets/template-06-bride.webp'), 'Template 12 must NOT fallback to stock bride illustration when custom photo is present');
});

test('Template 11, 13, 14 render custom uploaded photos across mismatched template IDs', () => {
  const wedding = {
    bride_name: 'Pari',
    groom_name: 'Param',
    template_id: 'template-02', // mismatched!
    groom_photo: SAMPLE_CUSTOM_GROOM,
    bride_photo: SAMPLE_CUSTOM_BRIDE,
    venue_photo: SAMPLE_CUSTOM_VENUE
  };

  // Template 11
  const html11 = renderT11({ guest: { name: 'Guest' }, wedding });
  assert.ok(html11.includes(SAMPLE_CUSTOM_GROOM), 'Template 11 must render custom groom photo');
  assert.ok(html11.includes(SAMPLE_CUSTOM_BRIDE), 'Template 11 must render custom bride photo');
  assert.ok(!html11.includes('./assets/template-06-groom.webp'), 'Template 11 must not fallback to stock groom');

  // Template 13
  const html13 = renderT13({ guest: { name: 'Guest' }, wedding });
  assert.ok(html13.includes(SAMPLE_CUSTOM_GROOM), 'Template 13 must render custom groom photo');
  assert.ok(html13.includes(SAMPLE_CUSTOM_BRIDE), 'Template 13 must render custom bride photo');
  assert.ok(!html13.includes('./assets/template-06-groom.webp'), 'Template 13 must not fallback to stock groom');

  // Template 14
  const html14 = renderT14({ guest: { name: 'Guest' }, wedding });
  assert.ok(html14.includes(SAMPLE_CUSTOM_GROOM), 'Template 14 must render custom groom photo');
  assert.ok(html14.includes(SAMPLE_CUSTOM_BRIDE), 'Template 14 must render custom bride photo');
  assert.ok(!html14.includes('./assets/template-06-groom.webp'), 'Template 14 must not fallback to stock groom');
});

test('Template 04, 06, 07 render custom uploaded photos with full alias resolution', () => {
  const wedding = {
    bride_name: 'Pari',
    groom_name: 'Param',
    image1: SAMPLE_CUSTOM_GROOM,
    image2: SAMPLE_CUSTOM_BRIDE,
    image4: SAMPLE_CUSTOM_VENUE
  };

  const norm = normalizeWeddingRecord(wedding);

  const html04 = renderT04({ guest: { name: 'Guest' }, wedding: norm });
  assert.ok(html04.includes(SAMPLE_CUSTOM_GROOM), 'Template 04 must render custom groom photo');
  assert.ok(html04.includes(SAMPLE_CUSTOM_BRIDE), 'Template 04 must render custom bride photo');

  const html06 = renderT06({ guest: { name: 'Guest' }, wedding: norm });
  assert.ok(html06.includes(SAMPLE_CUSTOM_GROOM), 'Template 06 must render custom groom photo');
  assert.ok(html06.includes(SAMPLE_CUSTOM_BRIDE), 'Template 06 must render custom bride photo');

  const html07 = renderT07({ guest: { name: 'Guest' }, wedding: norm });
  assert.ok(html07.includes(SAMPLE_CUSTOM_GROOM), 'Template 07 must render custom groom photo');
  assert.ok(html07.includes(SAMPLE_CUSTOM_BRIDE), 'Template 07 must render custom bride photo');
});

test('Default stock illustrations render ONLY when photos are empty', () => {
  const emptyWedding = {
    bride_name: 'Pari',
    groom_name: 'Param',
    groom_photo: '',
    bride_photo: ''
  };

  const html12 = renderT12({ guest: { name: 'Guest' }, wedding: emptyWedding });
  assert.ok(html12.includes('./assets/template-06-groom.webp'), 'Template 12 must use default stock groom when empty');
  assert.ok(html12.includes('./assets/template-06-bride.webp'), 'Template 12 must use default stock bride when empty');
});

test('index.html declares localOrder in bootstrap scope to prevent ReferenceError in incognito mode', async () => {
  const fs = await import('node:fs');
  const indexHtml = fs.readFileSync('index.html', 'utf8');

  // Verify let localOrder = null is declared before try/catch blocks in bootstrap
  const bootstrapStart = indexHtml.indexOf('async function bootstrap()');
  const bootstrapBody = indexHtml.slice(bootstrapStart, indexHtml.indexOf('window.addEventListener(\'DOMContentLoaded\', bootstrap);'));

  assert.ok(bootstrapBody.includes('let localOrder = null;'), 'localOrder must be declared with let in bootstrap scope');
  
  // Verify that it is declared before the catch block
  const localOrderDeclPos = bootstrapBody.indexOf('let localOrder = null;');
  const catchPos = bootstrapBody.indexOf('catch (fetchErr)');
  assert.ok(localOrderDeclPos < catchPos, 'localOrder must be declared before catch block so it is in scope across bootstrap');
});
