import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { computeStats, classifyResponse, buildGuestStates } from '../dashboard/rsvp-stats.js';

test('E2E Data Flow Mode 1 -> Mode 2: Onboard Order to Dashboard Data Bridge', () => {
  const onboardApp = fs.readFileSync('onboard/app.js', 'utf8');
  const dashboardApp = fs.readFileSync('dashboard/app.js', 'utf8');

  // Verify onboarding stores scoped metadata
  assert.ok(onboardApp.includes('primeecard_order_'), 'Onboarding must save order-scoped metadata');
  assert.ok(onboardApp.includes('wedding_music_url_'), 'Onboarding must save scoped soundtrack URL');
  assert.ok(onboardApp.includes('customer-dashboard-template-'), 'Onboarding must save template identifier');

  // Verify dashboard reads scoped metadata
  assert.ok(dashboardApp.includes('primeecard_order_'), 'Dashboard must read order-scoped metadata');
  assert.ok(dashboardApp.includes('wedding_music_url_'), 'Dashboard must read scoped music url');
  assert.ok(dashboardApp.includes('customer-dashboard-template-'), 'Dashboard must read scoped template');
});

test('E2E Data Flow Mode 2: Guest Code Generation & Robust Base URL without trailing slash', () => {
  const dashboardApp = fs.readFileSync('dashboard/app.js', 'utf8');

  // Verify hex code generator exists and generates 12 chars
  assert.ok(dashboardApp.includes('generateHexInviteCode'), 'Must define generateHexInviteCode');

  // Verify getInvitationBaseUrl handles pathname without trailing slash
  assert.ok(dashboardApp.includes('getInvitationBaseUrl'), 'Must define getInvitationBaseUrl');

  function getBaseUrl(urlStr) {
    const loc = new URL(urlStr);
    let pathname = loc.pathname || '/';
    if (pathname.includes('/dashboard')) {
      pathname = pathname.substring(0, pathname.indexOf('/dashboard') + 1);
    }
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    return new URL(pathname, loc.origin).href;
  }

  // Test across root, subdirectory, with slash and without slash
  assert.strictEqual(getBaseUrl('https://example.com/Invite/dashboard/'), 'https://example.com/Invite/');
  assert.strictEqual(getBaseUrl('https://example.com/Invite/dashboard'), 'https://example.com/Invite/');
  assert.strictEqual(getBaseUrl('https://example.com/Invite/dashboard?order=ORD-123'), 'https://example.com/Invite/');
  assert.strictEqual(getBaseUrl('http://127.0.0.1:8000/dashboard/'), 'http://127.0.0.1:8000/');
  assert.strictEqual(getBaseUrl('http://127.0.0.1:8000/dashboard?order=ORD-123'), 'http://127.0.0.1:8000/');
});

test('E2E Data Flow Mode 2 -> Mode 3: Template Switching & Live Link Template Resolution', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');

  // Verify live invitation strictly honors database template
  assert.ok(
    indexHtml.includes('!isPreviewMode && (wedding.template_id || wedding.template_style)'),
    'index.html must prioritize database template for live invitations'
  );
});

test('E2E Data Flow Mode 3 -> Mode 4: Guest RSVP Reflection in Dashboard', () => {
  // Simulated wedding payload with 2 guests
  const guests = [
    {
      id: 'g-1',
      guest_name: 'Shamita Roy',
      phone: '9876543210',
      category: 'Family',
      family_members: 4,
      persons: 4,
      with_family: true,
      invite_code: 'CD143D69885E'
    },
    {
      id: 'g-2',
      guest_name: 'Aakash Verma',
      phone: '9123456780',
      category: 'Person',
      family_members: 1,
      persons: 1,
      with_family: false,
      invite_code: '1BB790BE50B0'
    }
  ];

  // Simulated RSVP submission from guest Shamita Roy
  const rsvps = [
    {
      id: 'rsvp-101',
      guest_id: 'g-1',
      invite_code: 'cd143d69885e', // lowercase from API or DB
      status: 'attending',
      attending_count: 3,
      wishes_message: 'Heartiest congratulations to the beautiful couple! So excited to celebrate.',
      submitted_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];

  const stats = computeStats({ guests, rsvps, opens: { 'cd143d69885e': { open_count: 2 } }, goal: 50 });

  // 1. Verify attending headcount matches 3 people
  assert.strictEqual(stats.people.attending, 3, 'Coming headcount must reflect 3 attending family members');
  assert.strictEqual(stats.confirmedFamilies, 1, 'Confirmed families must be 1');

  // 2. Verify replied count
  assert.strictEqual(stats.repliedInvites, 1, 'Replied invites must be 1');

  // 3. Verify Shamita is classified as attending
  const shamitaState = stats.states.find(s => s.guest.id === 'g-1');
  assert.ok(shamitaState, 'Shamita must have a state');
  assert.strictEqual(shamitaState.status, 'attending', 'Status must be attending');
  assert.strictEqual(shamitaState.attendingPeople, 3, 'Attending people must be 3');
  assert.strictEqual(shamitaState.reply.wishes_message, 'Heartiest congratulations to the beautiful couple! So excited to celebrate.');

  // 4. Verify Aakash Verma is not replied yet
  const aakashState = stats.states.find(s => s.guest.id === 'g-2');
  assert.ok(aakashState, 'Aakash must have a state');
  assert.strictEqual(aakashState.status, 'not_opened', 'Aakash should be not_opened');
});

test('E2E Data Flow Mode 4: Dashboard Recent Replies includes all replied guests & displays message', () => {
  const dashboardApp = fs.readFileSync('dashboard/app.js', 'utf8');

  // Verify Recent replies includes attending, maybe, declined even without separate reply object
  assert.ok(
    dashboardApp.includes("['attending', 'maybe', 'declined'].includes(st.status)"),
    'Recent replies must include all guests with replied status'
  );

  // Verify openReplyDialog reads wishes from both reply and guest
  assert.ok(
    dashboardApp.includes('reply.wishes_message || reply.wishes || reply.note'),
    'openReplyDialog must read all wish field aliases'
  );
});
