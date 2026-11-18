import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';

test('Onboarding Segmented Pill Switch replaces old dropdown', () => {
  const html = fs.readFileSync('onboard/index.html', 'utf8');
  const css = fs.readFileSync('onboard/style.css', 'utf8');

  // 1. Old dropdown select must NOT be present
  assert.ok(!html.includes('<select name="name_order"'), 'onboard/index.html must not contain old <select name="name_order">');
  assert.ok(!html.includes('id="name-order-select"'), 'onboard/index.html must not contain old id="name-order-select"');

  // 2. Segmented Pill Switch structure
  assert.ok(html.includes('class="pill-switch"'), 'Must have .pill-switch container');
  assert.ok(html.includes('role="radiogroup"'), 'Must have accessible radiogroup role');
  assert.ok(html.includes('Name shown first on the invite'), 'Must display "Name shown first on the invite" label');

  // 3. Radio inputs for Groom and Bride
  assert.ok(
    html.includes('name="name_order"') && html.includes('value="groom_first"'),
    'Must have groom_first radio option'
  );
  assert.ok(
    html.includes('name="name_order"') && html.includes('value="bride_first"'),
    'Must have bride_first radio option'
  );

  // 4. Button labels
  assert.ok(html.includes('class="pill-switch-btn">Groom</span>'), 'Must display Groom button');
  assert.ok(html.includes('class="pill-switch-btn">Bride</span>'), 'Must display Bride button');

  // 5. CSS styles
  assert.ok(css.includes('.pill-switch'), 'CSS must style .pill-switch');
  assert.ok(css.includes('.pill-switch-btn'), 'CSS must style .pill-switch-btn');
  assert.ok(css.includes('.pill-switch-opt input[type="radio"]:checked + .pill-switch-btn'), 'CSS must style active pill state');
  assert.ok(css.includes('background: #000000') || css.includes('background:#000000') || css.includes('background: #0d0d0f'), 'Active pill must have dark/black background');
  assert.ok(css.includes('border-radius: 9999px') || css.includes('border-radius:9999px'), 'Must have capsule pill border-radius');
});

test('Onboarding Bride and Groom fields are separated into 2 distinct white rounded frames', () => {
  const html = fs.readFileSync('onboard/index.html', 'utf8');
  const css = fs.readFileSync('onboard/style.css', 'utf8');

  // 1. Check container structure
  assert.ok(html.includes('class="couple-cards-grid"'), 'Must have .couple-cards-grid container');
  assert.ok(html.includes('couple-card bride-card'), 'Must have distinct bride-card');
  assert.ok(html.includes('couple-card groom-card'), 'Must have distinct groom-card');

  // 2. Groom card contents
  const groomCardSlice = html.slice(html.indexOf('couple-card groom-card'), html.indexOf('couple-card bride-card'));
  assert.ok(groomCardSlice.includes('Groom’s Details'), 'Groom card must have Groom’s Details heading');
  assert.ok(groomCardSlice.includes('Dulha'), 'Groom card must have Dulha tag');
  assert.ok(groomCardSlice.includes('name="groom_name"'), 'Groom card must contain groom_name input');
  assert.ok(groomCardSlice.includes('name="groom_parents"'), 'Groom card must contain groom_parents input');
  assert.ok(groomCardSlice.includes('name="groom_address"'), 'Groom card must contain groom_address input');

  // 3. Bride card contents
  const brideCardSlice = html.slice(html.indexOf('couple-card bride-card'), html.indexOf('</div>\n              </div>\n              <label class="field field-wide">Host'));
  assert.ok(brideCardSlice.includes('Bride’s Details'), 'Bride card must have Bride’s Details heading');
  assert.ok(brideCardSlice.includes('Dulhan'), 'Bride card must have Dulhan tag');
  assert.ok(brideCardSlice.includes('name="bride_name"'), 'Bride card must contain bride_name input');
  assert.ok(brideCardSlice.includes('name="bride_parents"'), 'Bride card must contain bride_parents input');
  assert.ok(brideCardSlice.includes('name="bride_address"'), 'Bride card must contain bride_address input');

  // 4. CSS styles & Dynamic Reordering
  assert.ok(css.includes('.couple-cards-grid'), 'CSS must define .couple-cards-grid');
  assert.ok(css.includes('.couple-card'), 'CSS must define .couple-card');
  assert.ok(css.includes('.couple-card.bride-card') || css.includes('.bride-card'), 'CSS must define .bride-card accent');
  assert.ok(css.includes('.couple-card.groom-card') || css.includes('.groom-card'), 'CSS must define .groom-card accent');
  assert.ok(css.includes('border-radius: 16px') || css.includes('border-radius:16px'), 'Couple cards must have rounded borders');
  assert.ok(css.includes('data-order="groom_first"'), 'CSS must support groom_first reordering');
  assert.ok(css.includes('data-order="bride_first"'), 'CSS must support bride_first reordering');
  assert.ok(css.includes('.couple-order-field'), 'CSS must define .couple-order-field');
  assert.ok(css.includes('border-top: 1px solid #ebd9c8') || css.includes('border-top:1px solid #ebd9c8'), 'Must have top divider line matching design spec');
  assert.ok(css.includes(':has(input[name="name_order"][value="groom_first"]:checked)'), 'Must have :has() instant zero-latency reactivity for groom');
  assert.ok(css.includes(':has(input[name="name_order"][value="bride_first"]:checked)'), 'Must have :has() instant zero-latency reactivity for bride');
});
