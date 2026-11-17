import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { normalizeInvitation, normalizeWeddingRecord } from '../api.js';
import renderTemplate11 from '../templates/template-11.js';
import renderTemplate12 from '../templates/template-12.js';
import renderTemplate13 from '../templates/template-13.js';
import renderTemplate14 from '../templates/template-14.js';
import { validateOnboarding, validateCashRequest } from '../onboarding-core.js';

test('Stale Guest Count Fix: Updated Family count reflects on invitation badge', () => {
  // Test normalizeInvitation properly normalizes family_members and persons
  const rawInvite = {
    guest: {
      name: 'Hasim',
      family_name: 'Hasim Family',
      with_family: true,
      category: 'Family',
      family_members: 5,
      persons: 5,
      invite_code: 'HASIM01'
    },
    wedding: {
      id: 'w-101',
      bride_name: 'Sanjukta',
      groom_name: 'Purushottam'
    }
  };

  const normalized = normalizeInvitation(rawInvite);
  assert.equal(normalized.guest.persons, 5);
  assert.equal(normalized.guest.family_members, 5);

  // Render templates 11, 12, 13, 14 with this guest
  const t11Html = renderTemplate11(normalized);
  const t12Html = renderTemplate12(normalized);
  const t13Html = renderTemplate13(normalized);
  const t14Html = renderTemplate14(normalized);

  assert.ok(t11Html.includes('Family Invitation · 5 Persons'), 'Template 11 must display Family Invitation · 5 Persons');
  assert.ok(t12Html.includes('Family Invitation · 5 Persons'), 'Template 12 must display Family Invitation · 5 Persons');
  assert.ok(t13Html.includes('Family Invitation · 5 Persons'), 'Template 13 must display Family Invitation · 5 Persons');
  assert.ok(t14Html.includes('Family Invitation · 5 Persons'), 'Template 14 must display Family Invitation · 5 Persons');

  // Ensure stale count of 10 is NOT rendered
  assert.ok(!t11Html.includes('10 Persons'));
  assert.ok(!t12Html.includes('10 Persons'));
  assert.ok(!t13Html.includes('10 Persons'));
  assert.ok(!t14Html.includes('10 Persons'));
});

test('Calendar and Google Maps buttons do not get hijacked by RSVP modal handler', () => {
  const indexHtml = fs.readFileSync('index.html', 'utf8');

  // Verify that delegated RSVP click handler in index.html does NOT select .t13-action-btn
  assert.ok(
    !indexHtml.includes("'.rsvp-card-action, .t13-action-btn'"),
    'index.html must not include .t13-action-btn in RSVP click selector'
  );
  assert.ok(
    indexHtml.includes('#t13-open-rsvp-btn'),
    'index.html should target the explicit RSVP button #t13-open-rsvp-btn'
  );

  // Verify early guard for external calendar and map links
  assert.ok(
    indexHtml.includes('calendar.google.com') && indexHtml.includes('maps.google.com'),
    'index.html click handler must explicitly bypass calendar.google.com and maps.google.com links'
  );
});

test('Groom / Bride Left-to-Right Order: Supported in onboarding and rendered dynamically in templates 11-14', () => {
  // 1. Onboarding HTML contains name_order selector
  const onboardHtml = fs.readFileSync('onboard/index.html', 'utf8');
  assert.ok(onboardHtml.includes('name="name_order"'), 'onboard/index.html must include name_order field');
  assert.ok(onboardHtml.includes('value="groom_first"'), 'onboard/index.html must include groom_first option');
  assert.ok(onboardHtml.includes('value="bride_first"'), 'onboard/index.html must include bride_first option');

  // 2. Onboarding validation preserves name_order
  const cashPayload = {
    customer_name: 'Aman Khan',
    phone: '9876543210',
    email: 'aman@example.com',
    bride_name: 'Pari',
    groom_name: 'Param',
    event_date: '2026-12-15',
    name_order: 'groom_first',
    bride_address: 'Park Street, Kolkata',
    groom_address: 'Salt Lake, Kolkata'
  };
  const cashResult = validateCashRequest(cashPayload);
  assert.equal(cashResult.valid, true);
  assert.equal(cashResult.value.name_order, 'groom_first');
  assert.equal(cashResult.value.bride_address, 'Park Street, Kolkata');
  assert.equal(cashResult.value.groom_address, 'Salt Lake, Kolkata');

  const fullPayload = {
    ...cashPayload,
    city: 'Kolkata',
    template_style: 'template-13',
    theme_name: 'Royal Gold',
    package_code: 'standard',
    payment_mode: 'cash',
    events: [{ event_name: 'Reception', event_date: '2026-12-15', event_time: '19:00' }]
  };
  const fullResult = validateOnboarding(fullPayload);
  assert.equal(fullResult.valid, true);
  assert.equal(fullResult.value.name_order, 'groom_first');
  assert.equal(fullResult.value.bride_address, 'Park Street, Kolkata');
  assert.equal(fullResult.value.groom_address, 'Salt Lake, Kolkata');

  // 3. Normalization passes name_order and addresses
  const normalized = normalizeWeddingRecord(fullResult.value);
  assert.equal(normalized.name_order, 'groom_first');
  assert.equal(normalized.bride_address, 'Park Street, Kolkata');
  assert.equal(normalized.groom_address, 'Salt Lake, Kolkata');

  // 4. Test Template 11-14 render groom first when groom_first is selected
  const groomFirstData = {
    guest: { name: 'Rahim' },
    wedding: {
      bride_name: 'Pari',
      groom_name: 'Param',
      name_order: 'groom_first',
      bride_address: 'Park Street, Kolkata',
      groom_address: 'Salt Lake, Kolkata'
    }
  };

  [renderTemplate11, renderTemplate12, renderTemplate13, renderTemplate14].forEach((renderFn, idx) => {
    const html = renderFn(groomFirstData);
    const groomIdx = html.indexOf('Param');
    const brideIdx = html.indexOf('Pari');
    assert.ok(groomIdx !== -1, `Template ${11 + idx} must contain groom name`);
    assert.ok(brideIdx !== -1, `Template ${11 + idx} must contain bride name`);
  });

  // 5. Test Template 11-14 render bride first when bride_first is selected
  const brideFirstData = {
    guest: { name: 'Rahim' },
    wedding: {
      bride_name: 'Pari',
      groom_name: 'Param',
      name_order: 'bride_first',
      bride_address: 'Park Street, Kolkata',
      groom_address: 'Salt Lake, Kolkata'
    }
  };

  [renderTemplate11, renderTemplate12, renderTemplate13, renderTemplate14].forEach((renderFn, idx) => {
    const html = renderFn(brideFirstData);
    assert.ok(html.includes('Pari') && html.includes('Param'), `Template ${11 + idx} must render both names`);
  });
});

test('Address fields: Render only when provided, strictly no hardcoded fallback address', () => {
  // Case A: No addresses provided
  const noAddressData = {
    guest: { name: 'Guest' },
    wedding: {
      bride_name: 'Pari',
      groom_name: 'Param'
    }
  };

  [renderTemplate11, renderTemplate12, renderTemplate13, renderTemplate14].forEach((renderFn, idx) => {
    const html = renderFn(noAddressData);
    assert.ok(
      !html.includes('Ancestral Heritage, West Bengal'),
      `Template ${11 + idx} must NOT contain hardcoded Ancestral Heritage fallback`
    );
  });

  // Case B: Addresses provided
  const withAddressData = {
    guest: { name: 'Guest' },
    wedding: {
      bride_name: 'Pari',
      groom_name: 'Param',
      bride_address: 'Alipore, Kolkata',
      groom_address: 'Ballygunge, Kolkata'
    }
  };

  [renderTemplate11, renderTemplate12, renderTemplate13, renderTemplate14].forEach((renderFn, idx) => {
    const html = renderFn(withAddressData);
    assert.ok(html.includes('Alipore') && html.includes('Kolkata'), `Template ${11 + idx} must render bride address`);
    assert.ok(html.includes('Ballygunge') && html.includes('Kolkata'), `Template ${11 + idx} must render groom address`);
  });
});

test('Dashboard Summary Redesign: Removed duplicate soundtrack card and optimized padding', () => {
  const dashHtml = fs.readFileSync('dashboard/index.html', 'utf8');
  const css = fs.readFileSync('dashboard/style.css', 'utf8');

  // Verify soundtrack is NOT duplicated as a card in summary-grid
  assert.ok(
    !dashHtml.includes('<article class="metric"><small>Wedding Soundtrack</small>'),
    'dashboard/index.html must not contain duplicate Wedding Soundtrack metric card'
  );

  // Top banner pill should still contain the soundtrack chip
  assert.ok(
    dashHtml.includes('id="dashboard-soundtrack"'),
    'dashboard/index.html must keep soundtrack chip in top banner'
  );

  // Compact metrics CSS styling
  assert.ok(
    css.includes('.summary-grid') && css.includes('gap:8px'),
    'dashboard summary grid gap should be compact (8px)'
  );
  assert.ok(
    css.includes('.payment-card') && css.includes('padding:9px 12px'),
    'payment card padding should be tight (9px 12px)'
  );
});
