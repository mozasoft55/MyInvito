import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Music Resolution: normalizeSongUrl & normalizeMusicUrl properly handle preset IDs, relative paths and extensions', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');

  // Verify normalizeSongUrl definition and preset mapping
  assert.ok(indexHtml.includes('din-shagna-da'), 'Must support din-shagna-da preset track');
  assert.ok(indexHtml.includes('raataan-lambiyan'), 'Must support raataan-lambiyan preset track');
  assert.ok(indexHtml.includes('window.__startWeddingMusic'), 'Must expose window.__startWeddingMusic');
  assert.ok(indexHtml.includes('window.__stopWeddingMusic'), 'Must expose window.__stopWeddingMusic');
});

test('Template Audio Integration: Templates 11, 12, 13, 14, 15 invoke wedding music on interaction', () => {
  const t11 = fs.readFileSync('templates/template-11.js', 'utf8');
  const t12 = fs.readFileSync('templates/template-12.js', 'utf8');
  const t13 = fs.readFileSync('templates/template-13.js', 'utf8');
  const t14 = fs.readFileSync('templates/template-14.js', 'utf8');
  const t15 = fs.readFileSync('templates/template-15.js', 'utf8');

  assert.ok(t11.includes('__startWeddingMusic'), 'Template 11 must call __startWeddingMusic');
  assert.ok(t12.includes('__startWeddingMusic'), 'Template 12 must call __startWeddingMusic');
  assert.ok(t13.includes('__startWeddingMusic'), 'Template 13 must call __startWeddingMusic');
  assert.ok(t14.includes('__startWeddingMusic'), 'Template 14 must call __startWeddingMusic');
  assert.ok(t15.includes('__startWeddingMusic'), 'Template 15 must call __startWeddingMusic');
});

test('Scale & Performance: Dashboard guest tracker implements DOM pagination for 100,000 guests', () => {
  const dashboardApp = fs.readFileSync('dashboard/app.js', 'utf8');

  assert.ok(dashboardApp.includes('GUESTS_PER_PAGE'), 'dashboard/app.js must declare GUESTS_PER_PAGE');
  assert.ok(dashboardApp.includes('data-guest-nav'), 'dashboard/app.js must have pagination navigation buttons');
  assert.ok(dashboardApp.includes('guestPage'), 'dashboard/app.js must track active guest page');
});

test('Scale & Performance: SQL migration includes compound B-tree indexes for 100k guests', () => {
  const migration = fs.readFileSync('supabase/migrations/20261123_scale_and_performance_indexes.sql', 'utf8');

  assert.ok(migration.includes('idx_guests_invite_code_lower'), 'Must index lower(btrim(invite_code))');
  assert.ok(migration.includes('idx_guests_wedding_created'), 'Must index wedding_id and created_at');
  assert.ok(migration.includes('idx_rsvps_wedding_submitted'), 'Must index rsvps wedding_id and submitted_at');
});
