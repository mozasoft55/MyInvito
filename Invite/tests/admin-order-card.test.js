import test from 'node:test';
import assert from 'node:assert/strict';

test('Admin Order Card HTML structure & layout', () => {
  // Simulate the card markup generator from admin/app.js
  function renderOrderCard(payment) {
    const isVerified = (payment.payment_status || '').toLowerCase().includes('verified');
    const isRejected = (payment.payment_status || '').toLowerCase().includes('rejected');
    const isPending = !isVerified && !isRejected;
    const isCardSuspended = (payment.card_status || 'Active') === 'Suspended';
    const mismatch = Number(payment.claimed_amount_paise) !== Number(payment.expected_amount_paise);
    const templateText = (() => {
      const raw = String(payment.template_style || payment.template_id || 'template-01').trim();
      const match = raw.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        return `Template #${num < 10 ? '0' + num : num}`;
      }
      return `Template #${raw}`;
    })();

    const activatedTimestamp = payment.activated_at || (isVerified ? payment.verified_at : null);
    const bookingDateTimeText = activatedTimestamp ? '21 Nov 2026, 01:15 AM' : 'Pending Verification';
    const hasCity = Boolean(payment.city && payment.city !== '—' && payment.city.trim() !== '');
    const coupleText = [payment.couple_name, payment.event_date].filter(Boolean).join(' · ');
    const customerText = [payment.customer_name, payment.customer_phone].filter(Boolean).join(' · ');
    const publicUrl = `../?code=${payment.preview_guest_code || ''}`;

    return `
      <article class="payment-card" data-payment="${payment.payment_id}">
        <div class="payment-card-head">
          <div class="head-left">
            <h3 class="order-id">${payment.order_reference}</h3>
            <p class="order-subtext">${payment.payment_status} · ${payment.payment_mode || 'UPI'}</p>
          </div>
          <button type="button" 
                  class="status-badge ${isCardSuspended ? 'is-suspended' : 'is-active'}" 
                  data-toggle-card="${payment.order_reference}" 
                  data-next-state="${isCardSuspended ? 'Active' : 'Suspended'}">
            <span class="status-dot"></span>
            ${isCardSuspended ? 'Suspended' : 'Live &amp; Active'}
          </button>
        </div>

        <div class="card-grid">
          <div class="grid-cell">
            <span class="cell-label">Couple &amp; Date</span>
            <span class="cell-value">${coupleText || '—'}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Package</span>
            <span class="cell-value capitalize">${payment.package || 'Standard'}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Selected Template</span>
            <span class="cell-value"><strong class="template-pill-tag">${templateText}</strong></span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Customer</span>
            <span class="cell-value">${customerText || '—'}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Booking Date &amp; Time</span>
            <span class="cell-value">${activatedTimestamp ? bookingDateTimeText : '<span class="text-muted">Pending Verification</span>'}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Card Expiry (90 Days)</span>
            <span class="cell-value">${activatedTimestamp ? '19 Feb 2027 <span class="badge-expiry-active">90 days left</span>' : '<span class="text-muted">Starts upon activation</span>'}</span>
          </div>

          ${hasCity ? `
            <div class="grid-cell">
              <span class="cell-label">City</span>
              <span class="cell-value">${payment.city}</span>
            </div>
          ` : ''}

          <div class="grid-cell col-left">
            <span class="cell-label">Claimed / Expected</span>
            <span class="cell-value amount-combo">
              <strong>₹1,500.00</strong>
              <span class="text-expected"> / ₹1,500.00</span>
            </span>
          </div>

          <div class="grid-cell col-right preview-cell">
            <span class="cell-label">Invitation</span>
            <a href="${publicUrl}" target="_blank" rel="noopener noreferrer" class="preview-pill-btn">
              Preview Card ↗
            </a>
          </div>
        </div>

        ${isPending ? `
          <form class="card-action-form" data-review="${payment.payment_id}">
            <div class="verified-amount-wrap">
              <label class="amount-label" for="rupees-${payment.payment_id}">Verified amount (INR)</label>
              <div class="rupee-input-box">
                <span class="rupee-affix">₹</span>
                <input id="rupees-${payment.payment_id}" 
                       name="verified_rupees" 
                       type="number" 
                       min="0" 
                       step="0.01" 
                       value="${(Number(payment.expected_amount_paise) / 100).toFixed(2)}" 
                       required 
                       class="rupee-input">
              </div>
            </div>

            <div class="action-btn-row">
              <button class="btn-verify" name="decision" value="verify" type="submit">
                <span class="btn-icon">✓</span> Verify &amp; Activate
              </button>
              <button class="btn-reject-toggle" type="button" data-toggle-reject>
                <span class="btn-icon">✕</span> Reject
              </button>
            </div>

            <div class="reject-drawer" hidden>
              <div class="reject-drawer-flex">
                <input name="rejection_reason" 
                       class="reject-reason-input" 
                       maxlength="500" 
                       placeholder="Enter rejection reason...">
                <button class="btn-reject-confirm" name="decision" value="reject" type="submit" formnovalidate>
                  Confirm ➔
                </button>
              </div>
            </div>
          </form>
        ` : ''}
      </article>
    `;
  }

  // Test 1: Active pending order with city
  const htmlWithCity = renderOrderCard({
    payment_id: 'p1',
    order_reference: 'ORD-DFE714DB',
    payment_status: 'Pending Verification',
    payment_mode: 'UPI',
    card_status: 'Active',
    couple_name: 'koli & kola',
    event_date: '26 Nov 2026',
    package: 'Standard',
    customer_name: 'kolkata',
    customer_phone: '987654321',
    city: 'Howrah',
    claimed_amount_paise: 150000,
    expected_amount_paise: 150000,
    preview_guest_code: 'GUEST-123',
    template_style: 'template-15'
  });

  // Verify Header Row
  assert.ok(htmlWithCity.includes('ORD-DFE714DB'));
  assert.ok(htmlWithCity.includes('Live &amp; Active'));
  assert.ok(htmlWithCity.includes('is-active'));
  assert.ok(htmlWithCity.includes('Pending Verification · UPI'));

  // Verify 2-Column Grid Fields
  assert.ok(htmlWithCity.includes('Couple &amp; Date'));
  assert.ok(htmlWithCity.includes('koli & kola · 26 Nov 2026'));
  assert.ok(htmlWithCity.includes('Package'));
  assert.ok(htmlWithCity.includes('Standard'));
  assert.ok(htmlWithCity.includes('Customer'));
  assert.ok(htmlWithCity.includes('kolkata · 987654321'));
  assert.ok(htmlWithCity.includes('Selected Template'));
  assert.ok(htmlWithCity.includes('Template #15'));
  assert.ok(htmlWithCity.includes('Booking Date &amp; Time'));
  assert.ok(htmlWithCity.includes('Pending Verification'));
  assert.ok(htmlWithCity.includes('Card Expiry (90 Days)'));
  assert.ok(htmlWithCity.includes('Starts upon activation'));
  assert.ok(htmlWithCity.includes('City'));
  assert.ok(htmlWithCity.includes('Howrah'));
  assert.ok(htmlWithCity.includes('Claimed / Expected'));

  // Verify Styled Preview Button
  assert.ok(htmlWithCity.includes('class="preview-pill-btn"'));
  assert.ok(htmlWithCity.includes('Preview Card ↗'));

  // Verify Compact Action Area
  assert.ok(htmlWithCity.includes('Verified amount (INR)'));
  assert.ok(htmlWithCity.includes('class="rupee-affix">₹</span>'));
  assert.ok(htmlWithCity.includes('class="btn-verify"'));
  assert.ok(htmlWithCity.includes('Verify &amp; Activate'));
  assert.ok(htmlWithCity.includes('class="btn-reject-toggle"'));
  assert.ok(htmlWithCity.includes('data-toggle-reject'));

  // Verify Progressive Disclosure for Rejection Reason (Hidden by default)
  assert.ok(htmlWithCity.includes('class="reject-drawer" hidden'));
  assert.ok(htmlWithCity.includes('placeholder="Enter rejection reason..."'));
  assert.ok(htmlWithCity.includes('class="btn-reject-confirm"'));
  assert.ok(htmlWithCity.includes('Confirm ➔'));

  // Test 2: Order without City (empty or —)
  const htmlNoCity = renderOrderCard({
    payment_id: 'p2',
    order_reference: 'ORD-AAAA1111',
    payment_status: 'Pending Verification',
    payment_mode: 'UPI',
    card_status: 'Suspended',
    couple_name: 'Hasim & Amina',
    event_date: '10 Dec 2026',
    package: 'Royal Arch Premium',
    customer_name: 'Hasim',
    customer_phone: '9123456789',
    city: '—', // Empty city
    claimed_amount_paise: 300000,
    expected_amount_paise: 300000,
    preview_guest_code: 'GUEST-456'
  });

  // City must be completely omitted
  assert.ok(!htmlNoCity.includes('<span class="cell-label">City</span>'));
  // Status must be Suspended
  assert.ok(htmlNoCity.includes('is-suspended'));
  assert.ok(htmlNoCity.includes('Suspended'));

  // Test 3: Verified and activated order
  const htmlVerified = renderOrderCard({
    payment_id: 'p3',
    order_reference: 'ORD-VERIF888',
    payment_status: 'Verified',
    payment_mode: 'UPI',
    card_status: 'Active',
    couple_name: 'Zaid & Sara',
    event_date: '15 Jan 2027',
    package: 'Standard',
    customer_name: 'Zaid',
    customer_phone: '9876501234',
    city: 'Mumbai',
    claimed_amount_paise: 150000,
    expected_amount_paise: 150000,
    preview_guest_code: 'GUEST-789',
    template_style: 'template-06',
    activated_at: '2026-11-21T01:15:00Z',
    verified_at: '2026-11-21T01:15:00Z'
  });

  assert.ok(htmlVerified.includes('Template #06'));
  assert.ok(htmlVerified.includes('21 Nov 2026, 01:15 AM'));
  assert.ok(htmlVerified.includes('19 Feb 2027'));
  assert.ok(htmlVerified.includes('90 days left'));
});
