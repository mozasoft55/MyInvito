import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Template 15 — module renders 5-page cinematic wedding invitation with customer backgrounds and dynamic data', async () => {
  const module = await import('../templates/template-15.js');
  assert.equal(typeof module.default, 'function', 'Template 15 exports default render function');
  assert.equal(typeof module.mount, 'function', 'Template 15 exports mount function');
  assert.equal(typeof module.initTemplate15, 'function', 'Template 15 exports initTemplate15 function');

  const html = module.default({
    guest: { name: 'Roy Family', party_size: 4, is_family: true },
    wedding: {
      groom_name: 'Param',
      bride_name: 'Pari',
      groom_father: 'Abdul Chowdhury',
      bride_father: 'Kalam Sen',
      groom_address: 'Riverfront Promenade, Heritage Boulevard',
      bride_address: 'Park Street Cross, Kolkata',
      date: '2026-11-28',
      time: '7:00 PM',
      venue_name: 'Royal Palace Banquet',
      venue_address: '148 Grand Trunk Road, Shibpur',
      map_url: 'https://maps.google.com/?q=Royal+Palace+Banquet',
      rsvp_contacts: '+91 98765 43210',
      landing_background: 'https://example.com/custom-landing-bg.webp',
      page_background: 'https://example.com/custom-page-bg.webp',
      groom_photo: 'https://example.com/groom.jpg',
      bride_photo: 'https://example.com/bride.jpg'
    },
    events: [
      { event_name: 'Ceremony 1 · Gaye Holud', event_date: '2026-11-20', event_time: '10:00 AM', venue: 'Royal Palace Banquet' },
      { event_name: 'Ceremony 2 · Sangeet & Mehendi', event_date: '2026-11-24', event_time: '6:30 PM', venue: 'Royal Palace Banquet' },
      { event_name: 'Ceremony 3 · Shubho Bibaho', event_date: '2026-11-28', event_time: '7:00 PM', venue: 'Royal Palace Banquet' }
    ]
  });

  assert.equal(typeof html, 'string');
  assert.ok(html.length > 1000);

  // 1. Check structure & CSS variable binding of custom backgrounds
  assert.match(html, /id="t15-stage"/);
  assert.match(html, /class="[^"]*t15-stage[^"]*locked[^"]*"/);
  assert.match(html, /--t15-landing:\s*url\('https:\/\/example\.com\/custom-landing-bg\.webp'\)/);
  assert.match(html, /--t15-page:\s*url\('https:\/\/example\.com\/custom-page-bg\.webp'\)/);

  // 2. Page 1: Cover / Landing Stage with Frosted Glass Board & Curtains
  assert.match(html, /id="t15-p1"/);
  assert.match(html, /id="t15-gb"/);
  assert.match(html, /class="[^"]*t15-curt[^"]*t15-cl[^"]*"/);
  assert.match(html, /class="[^"]*t15-curt[^"]*t15-cr[^"]*"/);
  assert.match(html, /id="t15-dark"/);
  assert.match(html, /id="t15-flash"/);
  assert.match(html, /class="[^"]*t15-rule[^"]*"/);
  assert.match(html, /id="t15-open"/);
  assert.match(html, /Param/);
  assert.match(html, /Pari/);
  assert.match(html, /Roy Family/);

  // 3. Family vs Individual: Family invite should display "Family", not person count
  assert.match(html, /Family/);
  assert.doesNotMatch(html, /4 Persons/);

  // 4. Page 2: Couple details with father names only (no mother names)
  assert.match(html, /id="t15-p2"/);
  assert.match(html, /Kalam Sen/);
  assert.match(html, /Abdul Chowdhury/);
  assert.match(html, /D\/O/);
  assert.match(html, /S\/O/);
  assert.doesNotMatch(html, /M\/O/i);
  assert.match(html, /https:\/\/example\.com\/groom\.jpg/);
  assert.match(html, /https:\/\/example\.com\/bride\.jpg/);

  // 5. Page 3: Auspicious Wedding Muhurat, scratch card & countdown
  assert.match(html, /id="t15-p3"/);
  assert.match(html, /Auspicious Wedding Muhurat/);
  assert.match(html, /id="t15-sc"/);
  assert.match(html, /id="t15-cd"/);
  assert.match(html, /id="t15-save"/);

  // 6. Page 4: Wedding Programme
  assert.match(html, /id="t15-p4"/);
  assert.match(html, /Wedding Programme/);
  assert.match(html, /Gaye Holud/);
  assert.match(html, /Sangeet &amp; Mehendi/);
  assert.match(html, /Shubho Bibaho/);

  // 7. Page 5: Banquet & Venue with falling petals & Google Maps
  assert.match(html, /id="t15-p5"/);
  assert.match(html, /id="t15-pet"/);
  assert.match(html, /Royal Palace Banquet/);
  assert.match(html, /148 Grand Trunk Road, Shibpur/);
  assert.match(html, /VIEW ON GOOGLE MAPS/);
  assert.match(html, /href="https:\/\/maps\.google\.com\/\?q=Royal\+Palace\+Banquet"/);
  assert.match(html, /The Param &amp; Pari Families/);
});

test('Template 15 — fallback monogram initial renders when Bride or Groom photo is omitted', async () => {
  const module = await import('../templates/template-15.js');
  const html = module.default({
    guest: { name: 'Aarav Gupta', party_size: 1, is_family: false },
    wedding: {
      groom_name: 'Vikram',
      bride_name: 'Ananya',
      groom_father: 'Rajesh',
      bride_father: 'Suresh',
      groom_photo: '',
      bride_photo: '',
      date: '2026-12-10'
    }
  });

  // Verify initial letter fallbacks inside ring inner containers
  assert.match(html, /<div class="t15-ring-inner"[^>]*>\s*V\s*<\/div>/);
  assert.match(html, /<div class="t15-ring-inner"[^>]*>\s*A\s*<\/div>/);
});

test('Template 15 — mount() initializes without throwing and returns a cleanup function', async () => {
  const module = await import('../templates/template-15.js');
  const mockContainer = {
    querySelector: () => null,
    querySelectorAll: () => []
  };
  const cleanup = module.mount(mockContainer, {
    wedding: { date: '2026-11-28', time: '7:00 PM' }
  });
  assert.equal(typeof cleanup, 'function', 'mount returns a callable cleanup function');
  assert.doesNotThrow(() => cleanup(), 'cleanup function executes cleanly without throwing');
});

test('Template 15 — front cover frosted-glass board & locked scrolling before OPEN sequence', async () => {
  const templateHtml = fs.readFileSync(path.join(rootDir, 'template-15.html'), 'utf8');

  // Ivory-parchment card styling & markup in standalone template-15.html
  assert.match(templateHtml, /#gb\s*\{[^}]*backdrop-filter:\s*blur/);
  assert.match(templateHtml, /#b8923f/);
  assert.match(templateHtml, /❖/);
  assert.match(templateHtml, /curtainOpacity\s*==\s*null\s*\?\s*\.62/);
  assert.match(templateHtml, /<div id="gb">/);
  assert.match(templateHtml, /<main class="stage locked" id="stage">/);

  // Cinematic 3D curtains
  assert.match(templateHtml, /\.curt\s*\{[^}]*transition:\s*transform 3\.4s cubic-bezier/);
  assert.match(templateHtml, /<div class="curt cl"><\/div>/);
  assert.match(templateHtml, /<div class="curt cr"><\/div>/);

  // Strict scrolling lock event handlers present
  assert.match(templateHtml, /\["wheel",\s*"touchmove"\]\.forEach/);
  assert.match(templateHtml, /stage\.classList\.add\("locked"\)/);
  assert.match(templateHtml, /setTimeout\(function\(\)\s*\{[\s\S]*stage\.classList\.remove\("locked"\)[\s\S]*\},\s*5400\)/);

  // Modular template-15.js verification
  const templateJs = fs.readFileSync(path.join(rootDir, 'templates', 'template-15.js'), 'utf8');
  assert.match(templateJs, /#t15-gb[\s\S]*backdrop-filter:\s*blur/);
  assert.match(templateJs, /❖/);
  assert.match(templateJs, /curtainOpacity\s*==\s*null\s*\?\s*\.62/);
  assert.match(templateJs, /\.t15-stage\.locked/);
  assert.match(templateJs, /overflow:\s*hidden !important/);
  assert.match(templateJs, /\.t15-curt[\s\S]*transition:\s*transform 3\.4s/);
  assert.match(templateJs, /stage\.classList\.remove\('locked'\)/);
});

test('Onboarding validation — requires both background images strictly for Template 15 and NEVER for Templates 01–14', async () => {
  const { validateOnboarding } = await import('../onboarding-core.js');

  const baseValidData = {
    customer_name: 'Test Customer',
    email: 'customer@example.com',
    phone: '+919876543210',
    city: 'Kolkata',
    bride_name: 'Pari',
    groom_name: 'Param',
    event_date: '2026-11-28',
    theme_name: 'maroon',
    package_code: 'standard',
    payment_mode: 'upi',
    events: [{ event_name: 'Wedding', event_date: '2026-11-28', event_time: '19:00', venue: 'Banquet' }]
  };

  // 1. Template 15 without backgrounds -> FAILS
  const resT15Missing = validateOnboarding({
    ...baseValidData,
    template_style: 'template-15'
  });
  assert.equal(resT15Missing.valid, false);
  assert.ok(resT15Missing.errors.landing_background, 'landing_background must be required for Template 15');
  assert.ok(resT15Missing.errors.page_background, 'page_background must be required for Template 15');

  // 2. Template 15 with only one background -> FAILS
  const resT15One = validateOnboarding({
    ...baseValidData,
    template_style: 'template-15',
    landing_background: 'data:image/webp;base64,AAA...'
  });
  assert.equal(resT15One.valid, false);
  assert.equal(resT15One.errors.landing_background, undefined);
  assert.ok(resT15One.errors.page_background, 'page_background must still be required');

  // 3. Template 15 with both backgrounds -> PASSES
  const resT15Complete = validateOnboarding({
    ...baseValidData,
    template_style: 'template-15',
    landing_background: 'data:image/webp;base64,AAA...',
    page_background: 'data:image/webp;base64,BBB...'
  });
  assert.equal(resT15Complete.valid, true);
  assert.equal(Object.keys(resT15Complete.errors).length, 0);
  assert.equal(resT15Complete.value.landing_background, 'data:image/webp;base64,AAA...');
  assert.equal(resT15Complete.value.page_background, 'data:image/webp;base64,BBB...');

  // 4. Templates 01 through 14 WITHOUT any background images -> MUST ALL PASS
  const legacyTemplates = [
    'template-01', 'template-02', 'template-03', 'template-04',
    'template-05', 'template-06', 'template-07', 'template-08',
    'template-09', 'template-10', 'template-11', 'template-12',
    'template-13', 'template-14'
  ];

  for (const tpl of legacyTemplates) {
    const res = validateOnboarding({
      ...baseValidData,
      template_style: tpl
    });
    assert.equal(res.valid, true, `${tpl} must be valid without background images`);
    assert.equal(res.errors.landing_background, undefined, `${tpl} must not require landing_background`);
    assert.equal(res.errors.page_background, undefined, `${tpl} must not require page_background`);
  }
});

test('Multi-Customer Isolation — 10 distinct customer invitations render strictly isolated backgrounds with zero cross-contamination', async () => {
  const module = await import('../templates/template-15.js');

  const customers = Array.from({ length: 10 }, (_, i) => ({
    id: `cust_${i + 1}`,
    orderRef: `REF-T15-${1000 + i}`,
    bride: `Bride_${i + 1}`,
    groom: `Groom_${i + 1}`,
    landingBg: `https://storage.primeecard.com/customer_${i + 1}/landing_${i + 1}.webp`,
    pageBg: `https://storage.primeecard.com/customer_${i + 1}/page_${i + 1}.webp`
  }));

  const renderedHtmls = customers.map(cust => {
    return {
      cust,
      html: module.default({
        guest: { name: `Guest of ${cust.id}`, party_size: 2, is_family: false },
        wedding: {
          bride_name: cust.bride,
          groom_name: cust.groom,
          landing_background: cust.landingBg,
          page_background: cust.pageBg,
          date: '2026-12-01'
        }
      })
    };
  });

  // Verify that each customer's output contains ONLY their own assets and never another customer's
  renderedHtmls.forEach(({ cust, html }, index) => {
    assert.match(html, new RegExp(cust.landingBg), `Customer ${cust.id} must have their own landing background`);
    assert.match(html, new RegExp(cust.pageBg), `Customer ${cust.id} must have their own page background`);
    assert.match(html, new RegExp(cust.bride), `Customer ${cust.id} must have their own bride name`);

    // Verify ZERO presence of any other customer's assets
    customers.forEach((otherCust, otherIndex) => {
      if (index !== otherIndex) {
        assert.doesNotMatch(html, new RegExp(otherCust.landingBg), `Customer ${cust.id} must NOT contain Customer ${otherCust.id}'s landing background`);
        assert.doesNotMatch(html, new RegExp(otherCust.pageBg), `Customer ${cust.id} must NOT contain Customer ${otherCust.id}'s page background`);
      }
    });
  });
});

test('Standalone single self-contained HTML deliverable template-15.html exists and is complete', () => {
  const filePath = path.join(rootDir, 'template-15.html');
  assert.ok(fs.existsSync(filePath), 'template-15.html must exist in project root');

  const content = fs.readFileSync(filePath, 'utf8');
  assert.ok(content.length > 5000, 'template-15.html must contain full self-contained markup');

  // Verify Google Fonts
  assert.match(content, /family=Cinzel/);
  assert.match(content, /family=Cormorant\+Garamond/);
  assert.match(content, /family=Great\+Vibes/);

  // Verify 5 pages
  assert.match(content, /id="stage"|id="t15-stage"/);
  assert.match(content, /id="p1"|id="t15-cover"/);
  assert.match(content, /id="p2"|id="t15-p2"/);
  assert.match(content, /id="p3"|id="t15-p3"/);
  assert.match(content, /id="p4"|id="t15-p4"/);
  assert.match(content, /id="p5"|id="t15-p5"/);

  // Verify interactive components: Scratch canvas, countdown, petals canvas
  assert.match(content, /id="sc"|id="t15-scratch-canvas"/);
  assert.match(content, /id="pet"|id="t15-petals-canvas"/);
  assert.match(content, /id="open"|id="t15-hit-open"/);
  assert.match(content, /id="save"|id="t15-add-calendar"/);
});

test('Registration across system files — index.html, onboarding-core.js, studio.html, token-engine/templates.json', () => {
  // 1. onboarding-core.js
  const core = fs.readFileSync(path.join(rootDir, 'onboarding-core.js'), 'utf8');
  assert.match(core, /'template-15'/);
  assert.match(core, /template_id:\s*'template-15'/);

  // 2. index.html
  const index = fs.readFileSync(path.join(rootDir, 'index.html'), 'utf8');
  assert.match(index, /'template-15'/);
  assert.match(index, /LEGACY_TEMPLATES/);

  // 3. token-engine/templates.json
  const templatesJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'token-engine/templates.json'), 'utf8'));
  const t15Entry = templatesJson.templates.find(t => t.legacyId === 'template-15' || t.id === 'advance-custom-background-suite');
  assert.ok(t15Entry, 'token-engine/templates.json must contain template-15');
  assert.ok(t15Entry.category.includes('Advance'), 'template-15 must be in Advance category');

  // 4. studio.html
  const studio = fs.readFileSync(path.join(rootDir, 'studio.html'), 'utf8');
  assert.match(studio, /'template-15'/);
  assert.match(studio, /advance-custom-background-suite/);
});

test('Onboard HTML & CSS — contains dynamic upload slot markup and responsive styling', () => {
  const onboardHtml = fs.readFileSync(path.join(rootDir, 'onboard/index.html'), 'utf8');
  assert.match(onboardHtml, /id="template-15-bg-section"/);
  assert.match(onboardHtml, /id="t15-front-input"/);
  assert.match(onboardHtml, /id="t15-page-input"/);
  assert.match(onboardHtml, /name="landing_background"/);
  assert.match(onboardHtml, /name="page_background"/);

  const onboardCss = fs.readFileSync(path.join(rootDir, 'onboard/style.css'), 'utf8');
  assert.match(onboardCss, /\.t15-bg-box/);
  assert.match(onboardCss, /\.t15-upload-grid/);
  assert.match(onboardCss, /\.t15-dropzone/);
  assert.match(onboardCss, /\.t15-preview-img/);
});
