import test from 'node:test';
import assert from 'node:assert/strict';
import renderT01 from '../templates/template-01.js';
import renderT02 from '../templates/template-02.js';
import renderT03 from '../templates/template-03.js';
import renderT04 from '../templates/template-04.js';
import renderT05 from '../templates/template-05.js';
import renderT06 from '../templates/template-06.js';
import renderT07 from '../templates/template-07.js';
import renderT08 from '../templates/template-08.js';
import renderT09 from '../templates/template-09.js';
import renderT10 from '../templates/template-10.js';
import renderT11 from '../templates/template-11.js';
import renderT12 from '../templates/template-12.js';
import renderT13 from '../templates/template-13.js';
import renderT14 from '../templates/template-14.js';
import renderT15 from '../templates/template-15.js';
import { normalizeWeddingRecord } from '../api.js';

test('Issue 1: Hide Person Count for Family Invitations across all templates (04, 06, 07, 11-14)', () => {
  const familyGuest = {
    name: 'Khan Family',
    persons: 5,
    family_members: 5,
    with_family: true,
    category: 'Family'
  };

  const sampleWedding = {
    bride_name: 'Zoya',
    groom_name: 'Faizan',
    bride_parents: 'Mrs. Fatima & Mr. Tariq Khan',
    groom_parents: 'Mrs. Parveen & Mr. Naseem Ahmad',
    bride_address: 'Park Circus, Kolkata',
    groom_address: 'Ballygunge, Kolkata',
    venue: 'Grand Kohinoor Banquet',
    address: '78 Diamond Harbour Road, Kolkata',
    map_url: 'https://maps.google.com/?q=Grand+Kohinoor+Banquet',
    venue_photo: 'https://example.com/kohinoor.jpg'
  };

  const allRenderers = [
    { id: '04', fn: renderT04 },
    { id: '06', fn: renderT06 },
    { id: '07', fn: renderT07 },
    { id: '11', fn: renderT11 },
    { id: '12', fn: renderT12 },
    { id: '13', fn: renderT13 },
    { id: '14', fn: renderT14 }
  ];

  for (const { id, fn } of allRenderers) {
    const html = fn({ guest: familyGuest, wedding: sampleWedding });
    // Family badge must display "Family" (or Bengali "পরিবার" in bilingual T06)
    assert.match(html, /Family|পরিবার/, `Template ${id} must display Family badge`);
    // Person count must NOT be displayed for Family invitations
    assert.doesNotMatch(html, /Family Invitation · \d+ Persons/, `Template ${id} must not show count in Family Invitation badge`);
    assert.doesNotMatch(html, /5 Persons/, `Template ${id} must not render "5 Persons" for family invitation`);
  }

  // Individual invitations MUST still display person count
  const individualGuest = {
    name: 'Farhan Akhtar',
    persons: 1,
    with_family: false,
    category: 'Person'
  };

  for (const { id, fn } of allRenderers) {
    const html = fn({ guest: individualGuest, wedding: sampleWedding });
    assert.match(
      html,
      /Individual|Personal|1 Person|সাদর নিমন্ত্রণ/,
      `Template ${id} must show individual / 1 Person indicator for individual invitations`
    );
  }
});

test('Issue 2: Strictly display exact Hall/Banquet location name, map link, and venue image submitted on Onboarding', () => {
  const customWedding = {
    bride_name: 'Nusrat',
    groom_name: 'Zaid',
    venue: 'Taj Bengal Crystal Hall',
    venue_name: 'Taj Bengal Crystal Hall',
    venue_title: 'Crystal Hall',
    address: '34B Belvedere Road, Alipore, Kolkata - 700027',
    venue_address: '34B Belvedere Road, Alipore, Kolkata - 700027',
    map_url: 'https://maps.app.goo.gl/customTajBengalLink123',
    venue_photo: 'https://example.com/taj-bengal-venue.webp'
  };

  const templatesWithVenue = [
    { id: '04', fn: renderT04 },
    { id: '06', fn: renderT06 },
    { id: '07', fn: renderT07 },
    { id: '11', fn: renderT11 },
    { id: '12', fn: renderT12 },
    { id: '13', fn: renderT13 },
    { id: '14', fn: renderT14 }
  ];

  for (const { id, fn } of templatesWithVenue) {
    const html = fn({ guest: { name: 'Guest' }, wedding: customWedding });
    
    // Exact banquet/hall name
    assert.match(html, /Taj Bengal Crystal Hall/, `Template ${id} must strictly display submitted venue name`);
    
    // Exact map URL
    assert.match(html, /https:\/\/maps\.app\.goo\.gl\/customTajBengalLink123/, `Template ${id} must strictly link to submitted map_url`);
    
    // Exact venue photo
    assert.match(html, /https:\/\/example\.com\/taj-bengal-venue\.webp/, `Template ${id} must strictly render submitted venue photo`);
    
    // No hardcoded fake fallback addresses
    assert.doesNotMatch(html, /Riverfront Promenade, Heritage Boulevard/, `Template ${id} must not fall back to Riverfront Promenade`);
    assert.doesNotMatch(html, /Grand Heritage Avenue/, `Template ${id} must not fall back to Grand Heritage Avenue`);
  }
});

test('Issue 3: Exact Bride & Groom Parents names without butchering and accurate family address rendering', () => {
  const weddingWithParentsAndAddr = {
    bride_name: 'Pari',
    groom_name: 'Param',
    bride_parents: 'Mrs. & Mr. Md Kalim Khan',
    groom_parents: 'Mrs. Amina & Mr. Rashid Siddiqui',
    bride_address: 'Flat 4B, Park Mansions, Park Street, Kolkata',
    groom_address: 'House 12, Queens Court, Ballygunge, Kolkata'
  };

  const templatesWithParents = [
    { id: '01', fn: renderT01 },
    { id: '02', fn: renderT02 },
    { id: '03', fn: renderT03 },
    { id: '04', fn: renderT04 },
    { id: '05', fn: renderT05 },
    { id: '06', fn: renderT06 },
    { id: '07', fn: renderT07 },
    { id: '08', fn: renderT08 },
    { id: '09', fn: renderT09 },
    { id: '10', fn: renderT10 },
    { id: '11', fn: renderT11 },
    { id: '12', fn: renderT12 },
    { id: '13', fn: renderT13 },
    { id: '14', fn: renderT14 },
    { id: '15', fn: renderT15 }
  ];

  for (const { id, fn } of templatesWithParents) {
    const html = fn({ guest: { name: 'Guest' }, wedding: weddingWithParentsAndAddr });

    // Bride parents must render complete without butchering/splitting
    assert.match(html, /Mrs\. &amp; Mr\. Md Kalim Khan|Mrs\. & Mr\. Md Kalim Khan/, `Template ${id} must render exact bride parents`);
    
    // Groom parents must render complete without butchering/splitting
    assert.match(html, /Mrs\. Amina &amp; Mr\. Rashid Siddiqui|Mrs\. Amina & Mr\. Rashid Siddiqui/, `Template ${id} must render exact groom parents`);

    // Strictly no fake default parents
    assert.doesNotMatch(html, /s\/o Abdul/, `Template ${id} must not render s/o Abdul default`);
    assert.doesNotMatch(html, /d\/o Kalam/, `Template ${id} must not render d/o Kalam default`);
  }

  // When parents are omitted, no fake Kalam/Abdul should ever appear
  const weddingWithoutParents = {
    bride_name: 'Pari',
    groom_name: 'Param'
  };

  for (const { id, fn } of templatesWithParents) {
    const html = fn({ guest: { name: 'Guest' }, wedding: weddingWithoutParents });
    assert.doesNotMatch(html, />Kalam</, `Template ${id} must not default bride father to Kalam`);
    assert.doesNotMatch(html, />Abdul</, `Template ${id} must not default groom father to Abdul`);
  }
});

test('api.js normalizeWeddingRecord preserves parents, addresses, map_url and venue fields', () => {
  const input = {
    couple_name: 'Pari & Param',
    bride_parents: 'Mrs. & Mr. Md Kalim Khan',
    groom_parents: 'Mrs. Amina & Mr. Rashid Siddiqui',
    bride_address: 'Kolkata, WB',
    groom_address: 'Howrah, WB',
    venue: 'Royal Emerald Banquet',
    address: '12 VIP Road',
    map_url: 'https://maps.google.com/?q=Royal+Emerald+Banquet'
  };

  const norm = normalizeWeddingRecord(input);
  assert.equal(norm.bride_parents, 'Mrs. & Mr. Md Kalim Khan');
  assert.equal(norm.groom_parents, 'Mrs. Amina & Mr. Rashid Siddiqui');
  assert.equal(norm.bride_address, 'Kolkata, WB');
  assert.equal(norm.groom_address, 'Howrah, WB');
  assert.equal(norm.venue, 'Royal Emerald Banquet');
  assert.equal(norm.address, '12 VIP Road');
  assert.equal(norm.map_url, 'https://maps.google.com/?q=Royal+Emerald+Banquet');
});

test('Defect 3: Event comment/note reflects across all 15 templates when provided', () => {
  const sampleWedding = {
    bride_name: 'Zoya',
    groom_name: 'Faizan',
    date: '2026-12-15',
    time: '19:00',
    venue: 'Royal Palace Banquet'
  };

  const sampleEvents = [
    {
      event_name: 'Nikah Ceremony',
      event_date: '2026-12-15',
      event_time: '19:00',
      venue: 'Royal Palace Banquet',
      note: 'Dinner served after auspicious vows'
    }
  ];

  const all15Templates = [
    { id: '01', fn: renderT01 },
    { id: '02', fn: renderT02 },
    { id: '03', fn: renderT03 },
    { id: '04', fn: renderT04 },
    { id: '05', fn: renderT05 },
    { id: '06', fn: renderT06 },
    { id: '07', fn: renderT07 },
    { id: '08', fn: renderT08 },
    { id: '09', fn: renderT09 },
    { id: '10', fn: renderT10 },
    { id: '11', fn: renderT11 },
    { id: '12', fn: renderT12 },
    { id: '13', fn: renderT13 },
    { id: '14', fn: renderT14 },
    { id: '15', fn: renderT15 }
  ];

  for (const { id, fn } of all15Templates) {
    const html = fn({ guest: { name: 'Guest' }, wedding: sampleWedding, events: sampleEvents });
    assert.match(
      html,
      /Dinner served after auspicious vows/,
      `Template ${id} must display event note/comment`
    );
  }
});

test('Admin CSP: allows inline style attributes safely with style-src-attr', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const adminHtml = fs.readFileSync(path.resolve('admin/index.html'), 'utf8');
  assert.match(
    adminHtml,
    /style-src-attr\s+'self'\s+'unsafe-inline'/,
    'admin/index.html CSP must contain style-src-attr to avoid blocking inline style attributes'
  );
});

test('Dashboard Architecture: chosenTemplate is scoped outside previewLink and real token check avoids 401', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const dashCode = fs.readFileSync(path.resolve('dashboard/app.js'), 'utf8');

  // Verify chosenTemplate is defined before previewLink
  const chosenIndex = dashCode.indexOf('const chosenTemplate =');
  const previewIndex = dashCode.indexOf('const previewLink =');
  const templateNameIndex = dashCode.indexOf('const templateName = formatTemplateLabel(chosenTemplate);');

  assert.ok(chosenIndex > 0, 'chosenTemplate must be declared');
  assert.ok(previewIndex > chosenIndex, 'chosenTemplate must be declared before previewLink block');
  assert.ok(templateNameIndex > previewIndex, 'templateName must be formatted using in-scope chosenTemplate');

  // Verify demo-token or short token skips Edge Function to avoid 401 Unauthorized
  assert.match(
    dashCode,
    /hasRealToken\s*=\s*dashboardToken\s*&&\s*dashboardToken\s*!==\s*['"]demo-token['"]\s*&&\s*dashboardToken\.length\s*>=\s*32/,
    'dashboardRequest must skip Edge function on demo-token or invalid tokens to prevent 401 HTTP errors'
  );
});

test('Admin Verification & Status: checkIsPaymentVerified recognizes Paid and Partially Paid', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const adminCode = fs.readFileSync(path.resolve('admin/app.js'), 'utf8');

  assert.match(adminCode, /function checkIsPaymentVerified/, 'checkIsPaymentVerified helper must exist');
  assert.match(adminCode, /pStatus === 'paid' \|\| pStatus === 'partially paid'/, 'Paid and Partially Paid must be recognized as verified');
  assert.match(adminCode, /error\.code === '42501' \|\| error\.status === 401/, '401 Unauthorized / permission denied errors must be handled as session expiry');
});

test('Onboarding: payment status polling and auto-redirect to dashboard', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const onboardCode = fs.readFileSync(path.resolve('onboard/app.js'), 'utf8');

  assert.match(onboardCode, /function startPaymentStatusPolling/, 'startPaymentStatusPolling must exist');
  assert.match(onboardCode, /location\.href = `\.\.\/dashboard\/\?order=/, 'verified order must redirect to dashboard');
});

test('Defect 1 RSVP Fix: RSVP with response Gladly accepting and wishes reflects in Coming count, removes from nudges, and displays wishes', async () => {
  const { computeStats, buildGuestStates, classifyResponse } = await import('../dashboard/rsvp-stats.js');

  assert.equal(classifyResponse('Gladly accepting'), 'attending');
  assert.equal(classifyResponse('accepting'), 'attending');
  assert.equal(classifyResponse('Unable to attend'), 'declined');
  assert.equal(classifyResponse('Not sure yet'), 'maybe');

  const guests = [
    {
      id: 'g-koa',
      guest_name: 'koa',
      family_members: 1,
      persons: 1,
      category: 'Person',
      with_family: false,
      invite_code: 'KOA101',
      phone: '9876543210'
    },
    {
      id: 'g-kol',
      guest_name: 'kol',
      family_members: 1,
      persons: 1,
      category: 'Person',
      with_family: false,
      invite_code: 'KOL202',
      phone: '9876543211'
    }
  ];

  // 1. Initially without replies: both guests are not_opened and need a nudge
  const initialStats = computeStats({ guests });
  assert.equal(initialStats.people.attending, 0, 'Coming count must initially be 0');
  assert.equal(initialStats.invites.attending, 0);
  assert.equal(initialStats.states.length, 2);
  const initialNudges = initialStats.states.filter(s => ['not_opened', 'seen', 'maybe'].includes(s.status));
  assert.equal(initialNudges.length, 2, 'Both guests must initially need a nudge');

  // 2. Guest "kol" submits RSVP modal with "Gladly accepting", 1 person, and a wish note
  const rsvps = [
    {
      id: 'rsvp-1795285409',
      guest_id: 'g-kol',
      invite_code: 'KOL202',
      guest_name: 'kol',
      response: 'Gladly accepting', // note: no status property, response string only
      attending_count: 1,
      phone: '9876543211',
      wishes: 'Thank you for invite', // note: wishes instead of wishes_message
      timestamp: '2026-11-21T18:23:29.000Z'
    }
  ];

  const updatedStats = computeStats({ guests, rsvps });

  // Verify Coming count and people confirmed
  assert.equal(updatedStats.people.attending, 1, 'Coming count must increase to 1');
  assert.equal(updatedStats.invites.attending, 1);
  assert.equal(updatedStats.confirmedPersonal, 1, '1 personal invite confirmed');

  // Verify kol state is now attending and has normalized wish message
  const kolState = updatedStats.states.find(s => s.guest.guest_name === 'kol');
  assert.ok(kolState, 'kol state must exist');
  assert.equal(kolState.status, 'attending', 'kol status must be attending');
  assert.equal(kolState.attendingPeople, 1);
  assert.equal(kolState.reply.wishes_message, 'Thank you for invite', 'wishes must be normalized to wishes_message');

  // Verify kol is REMOVED from Needs a nudge
  const updatedNudges = updatedStats.states.filter(s => ['not_opened', 'seen', 'maybe'].includes(s.status));
  assert.equal(updatedNudges.length, 1, 'Only koa should remain in needs a nudge');
  assert.equal(updatedNudges[0].guest.guest_name, 'koa');

  // 3. Unmatched reply (e.g. from preview or open invitation) synthesizes an active state and increments confirmed count
  const previewRsvps = [
    {
      id: 'rsvp-preview-99',
      guest_name: 'Walk-in Guest',
      response: 'Gladly accepting',
      attending_count: 2,
      wishes: 'So happy for you both!',
      timestamp: '2026-11-21T19:00:00.000Z'
    }
  ];

  const previewStats = computeStats({ guests, rsvps: previewRsvps });
  assert.equal(previewStats.people.attending, 2, 'Unmatched reply must contribute 2 attending seats');
  assert.equal(previewStats.invites.attending, 1);
  const synthState = previewStats.states.find(s => s.guest.guest_name === 'Walk-in Guest');
  assert.ok(synthState, 'Synthesized guest state must exist');
  assert.equal(synthState.status, 'attending');
  assert.equal(synthState.reply.wishes_message, 'So happy for you both!');
});

test('Dashboard and index.html storage key resilience: verifies multi-key persistence across wedding_rsvps_ and customer-dashboard-rsvps-', async () => {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');
  const dashCode = fs.readFileSync(path.resolve('dashboard/app.js'), 'utf8');

  // Verify index.html writes to both wedding_rsvps_ and customer-dashboard-rsvps-
  assert.match(indexHtml, /'wedding_rsvps_'\s*\+\s*orderRef/, 'index.html must write to wedding_rsvps_ key');
  assert.match(indexHtml, /'customer-dashboard-rsvps-'\s*\+\s*orderRef/, 'index.html must write to customer-dashboard-rsvps- key');
  assert.match(indexHtml, /'guest_list_rsvps'/, 'index.html must write to guest_list_rsvps key');

  // Verify dashboard/app.js getStoredLocalRsvps reads from wedding_rsvps_ and customer-dashboard-rsvps-
  assert.match(dashCode, /rsvpsKey\(ref\)/, 'dashboard must read rsvpsKey(ref)');
  assert.match(dashCode, /'wedding_rsvps_'\s*\+\s*ref/, 'dashboard must read wedding_rsvps_ key');
  assert.match(dashCode, /'guest_list_rsvps'/, 'dashboard must read guest_list_rsvps key');
});
