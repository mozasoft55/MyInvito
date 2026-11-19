import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeWeddingRecord, buildMapEmbedUrl, buildNavigateUrl } from '../api.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Fresh session / incognito: normalizeWeddingRecord preserves all custom database fields with zero localStorage', () => {
  const dbPayload = {
    id: 'w-12345',
    bride_name: 'Pooja',
    groom_name: 'Rahul',
    bride_full: 'Pooja Sharma',
    groom_full: 'Rahul Verma',
    event_date: '2026-12-18',
    time: '19:30',
    venue: 'The Grand Hyatt Ballroom',
    address: 'Vasant Kunj, Phase 2, New Delhi 110070',
    map_url: 'https://maps.google.com/?q=The+Grand+Hyatt+Ballroom+Delhi',
    music_url: 'https://my-bucket.supabase.co/storage/v1/object/public/music/wedding-shehnai.mp3',
    music_title: 'Sacred Shehnai Raag',
    music_id: 'custom-shehnai-01',
    image1: 'https://my-bucket.supabase.co/storage/v1/object/public/photos/groom-hd.webp',
    image2: 'https://my-bucket.supabase.co/storage/v1/object/public/photos/bride-hd.webp',
    image3: 'https://my-bucket.supabase.co/storage/v1/object/public/photos/couple-hd.webp',
    image4: 'https://my-bucket.supabase.co/storage/v1/object/public/photos/venue-hd.webp',
    image5: 'https://my-bucket.supabase.co/storage/v1/object/public/photos/front-bg-hd.webp'
  };

  const normalized = normalizeWeddingRecord(dbPayload);

  // 1. Music persistence
  assert.equal(normalized.music_url, 'https://my-bucket.supabase.co/storage/v1/object/public/music/wedding-shehnai.mp3');
  assert.equal(normalized.audio_url, 'https://my-bucket.supabase.co/storage/v1/object/public/music/wedding-shehnai.mp3');
  assert.equal(normalized.music_title, 'Sacred Shehnai Raag');
  assert.equal(normalized.music_id, 'custom-shehnai-01');

  // 2. Venue & Directions persistence
  assert.equal(normalized.venue, 'The Grand Hyatt Ballroom');
  assert.equal(normalized.venue_name, 'The Grand Hyatt Ballroom');
  assert.equal(normalized.banquet_name, 'The Grand Hyatt Ballroom');
  assert.equal(normalized.address, 'Vasant Kunj, Phase 2, New Delhi 110070');
  assert.equal(normalized.venue_address, 'Vasant Kunj, Phase 2, New Delhi 110070');
  assert.equal(normalized.map_url, 'https://maps.google.com/?q=The+Grand+Hyatt+Ballroom+Delhi');

  // 3. Photos persistence across all alias slots
  assert.equal(normalized.groom_photo, 'https://my-bucket.supabase.co/storage/v1/object/public/photos/groom-hd.webp');
  assert.equal(normalized.groom_photo_url, 'https://my-bucket.supabase.co/storage/v1/object/public/photos/groom-hd.webp');
  assert.equal(normalized.bride_photo, 'https://my-bucket.supabase.co/storage/v1/object/public/photos/bride-hd.webp');
  assert.equal(normalized.bride_photo_url, 'https://my-bucket.supabase.co/storage/v1/object/public/photos/bride-hd.webp');
  assert.equal(normalized.couple_photo, 'https://my-bucket.supabase.co/storage/v1/object/public/photos/couple-hd.webp');
  assert.equal(normalized.venue_photo, 'https://my-bucket.supabase.co/storage/v1/object/public/photos/venue-hd.webp');
  assert.equal(normalized.landing_background, 'https://my-bucket.supabase.co/storage/v1/object/public/photos/front-bg-hd.webp');
});

test('SQL schema & migrations: public.provision_new_customer inserts music_url and all photo slots into wedding_details', () => {
  const onboardingSql = fs.readFileSync(path.join(rootDir, 'supabase/migrations/20261012230000_customer_onboarding.sql'), 'utf-8');
  assert.ok(onboardingSql.includes('music_url'), 'Migration must insert music_url into wedding_details');
  assert.ok(onboardingSql.includes('image1, image2, image3, image4, image5, music_url'), 'Migration must insert image1..5 and music_url');
  assert.ok(onboardingSql.includes("coalesce(p_input->>'music_url'"), 'Migration must read music_url from onboarding input payload');
  assert.ok(onboardingSql.includes("coalesce(p_input->>'venue', p_input->>'venue_name'"), 'Migration must check venue aliases');
  assert.ok(onboardingSql.includes("coalesce(p_input->>'address', p_input->>'venue_address'"), 'Migration must check address aliases');
});

test('SQL schema & final-fix: private.wedding_card_payload outputs all photo, venue, and music aliases', () => {
  const finalFixSql = fs.readFileSync(path.join(rootDir, 'supabase-final-fix.sql'), 'utf-8');
  assert.ok(finalFixSql.includes("'music_url', d.music_url"), 'Payload must output music_url');
  assert.ok(finalFixSql.includes("'groom_photo', coalesce(d.image1, '')"), 'Payload must output groom_photo');
  assert.ok(finalFixSql.includes("'bride_photo', coalesce(d.image2, '')"), 'Payload must output bride_photo');
  assert.ok(finalFixSql.includes("'couple_photo', coalesce(d.image3, '')"), 'Payload must output couple_photo');
  assert.ok(finalFixSql.includes("'venue_photo', coalesce(d.image4, '')"), 'Payload must output venue_photo');
  assert.ok(finalFixSql.includes("'venue_name', d.venue"), 'Payload must output venue_name');
  assert.ok(finalFixSql.includes("'venue_address', d.address"), 'Payload must output venue_address');
});

test('Template 12 renders custom uploaded groom & bride photos from pure database payload', async () => {
  const template12 = (await import('../templates/template-12.js')).default;
  const invitation = {
    guest: { name: 'Respected Guest', invite_code: 'TEST1234', persons: 1 },
    wedding: {
      bride_name: 'Pooja',
      groom_name: 'Rahul',
      date: '2026-12-18',
      venue: 'The Grand Hyatt Ballroom',
      address: 'Vasant Kunj, New Delhi',
      map_url: 'https://maps.google.com/?q=Grand+Hyatt+Delhi',
      groom_photo: 'https://images.unsplash.com/custom-groom.jpg',
      bride_photo: 'https://images.unsplash.com/custom-bride.jpg'
    },
    events: []
  };

  const html = template12(invitation);
  assert.ok(html.includes('https://images.unsplash.com/custom-groom.jpg'), 'Template 12 must render custom groom photo');
  assert.ok(html.includes('https://images.unsplash.com/custom-bride.jpg'), 'Template 12 must render custom bride photo');
  assert.ok(html.includes('The Grand Hyatt Ballroom'), 'Template 12 must render custom venue name');
  assert.ok(html.includes('Vasant Kunj, New Delhi'), 'Template 12 must render custom address');
});
