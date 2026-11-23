import test from 'node:test';
import assert from 'node:assert/strict';

test('Template 11, 12, 13, 14 properly distinguish 1 Person Personal Invitation vs Family Invitation', async () => {
  const t11 = (await import('../templates/template-11.js')).default;
  const t12 = (await import('../templates/template-12.js')).default;
  const t13 = (await import('../templates/template-13.js')).default;
  const t14 = (await import('../templates/template-14.js')).default;

  const templates = [
    { id: '11', fn: t11 },
    { id: '12', fn: t12 },
    { id: '13', fn: t13 },
    { id: '14', fn: t14 }
  ];

  // Case 1: 1 Person invitation
  const singleGuest = { name: 'Rahul Sharma', persons: 1, with_family: false, category: 'Person' };
  const customWedding = {
    groom_name: 'Param',
    bride_name: 'Pari',
    venue: 'Taj Bengal Palace Banquet',
    address: 'Alipore Road, Kolkata',
    date: '2026-11-28',
    bride_photo: 'https://example.com/custom-bride.jpg',
    groom_photo: 'https://example.com/custom-groom.jpg',
    venue_photo: 'https://example.com/custom-venue.jpg'
  };

  for (const t of templates) {
    const html = t.fn({ guest: singleGuest, wedding: customWedding });
    
    // Check 1 Person badge
    assert.match(html, /Personal Invitation · 1 Person/, `Template ${t.id} must show Personal Invitation · 1 Person`);
    assert.doesNotMatch(html, /Family Invitation · 2 Persons/, `Template ${t.id} must not default to 2 persons`);
    assert.doesNotMatch(html, /Rahul Sharma &amp; Family/, `Template ${t.id} must not append Family for personal invitation`);
    assert.match(html, /Rahul Sharma/, `Template ${t.id} must show guest name`);

    // Check custom venue name
    assert.match(html, /Taj Bengal Palace Banquet/, `Template ${t.id} must reflect custom venue name`);
    assert.doesNotMatch(html, /Royal Palace Banquet/, `Template ${t.id} must not fallback to Royal Palace Banquet when venue is provided`);

    // Check custom uploaded photos
    assert.match(html, /https:\/\/example\.com\/custom-bride\.jpg/, `Template ${t.id} must render uploaded bride photo`);
    assert.match(html, /https:\/\/example\.com\/custom-groom\.jpg/, `Template ${t.id} must render uploaded groom photo`);
    assert.match(html, /https:\/\/example\.com\/custom-venue\.jpg/, `Template ${t.id} must render uploaded venue photo`);
  }

  // Case 2: Family Invitation with 3 persons
  const familyGuest = { name: 'Aarav Gupta', persons: 3, with_family: true, category: 'Family' };
  for (const t of templates) {
    const html = t.fn({ guest: familyGuest, wedding: customWedding });
    assert.match(html, /Family/, `Template ${t.id} must show Family`);
    assert.doesNotMatch(html, /3 Persons/, `Template ${t.id} must not show person count for family invitation`);
    assert.match(html, /Aarav Gupta &amp; Family/, `Template ${t.id} must append Family for family invitation`);
  }
});

test('Strict data isolation: customer uploaded photos are strictly isolated to selected template and never leak to other templates or studio', async () => {
  const t06 = (await import('../templates/template-06.js')).default;
  const t11 = (await import('../templates/template-11.js')).default;
  const t12 = (await import('../templates/template-12.js')).default;
  const t13 = (await import('../templates/template-13.js')).default;
  const t14 = (await import('../templates/template-14.js')).default;

  const uploadedBride = 'https://example.com/customer-uploaded-bride-private.jpg';
  const uploadedGroom = 'https://example.com/customer-uploaded-groom-private.jpg';
  const uploadedVenue = 'https://example.com/customer-uploaded-banquet-private.jpg';

  // Order created specifically for Template 12
  const orderRef = 'ORDER-T12-CONFIDENTIAL';
  const weddingT12 = {
    template_id: 'template-12',
    order_reference: orderRef,
    bride_photo: uploadedBride,
    groom_photo: uploadedGroom,
    venue_photo: uploadedVenue
  };

  // 1. Template 12 must render the customer's uploaded photos
  const htmlT12 = t12({ guest: { name: 'Respected Guest' }, wedding: weddingT12 });
  assert.ok(htmlT12.includes(uploadedBride), 'Template 12 must render customer bride photo');
  assert.ok(htmlT12.includes(uploadedGroom), 'Template 12 must render customer groom photo');
  assert.ok(htmlT12.includes(uploadedVenue), 'Template 12 must render customer venue photo');

  // 2. Template 11, 13, 14, 06 previewing another template or standard catalog must NOT leak Template 12's photos
  const otherTemplates = [
    { id: '11', fn: t11, defaultBride: 'template-06-bride.webp', defaultVenue: 'template-11-cover.webp' },
    { id: '13', fn: t13, defaultBride: 'template-06-bride.webp', defaultVenue: 'template-13-page.webp' },
    { id: '14', fn: t14, defaultBride: 'template-06-bride.webp', defaultVenue: 'template-14-page.webp' },
    { id: '06', fn: t06, defaultBride: 'default-bride.webp', defaultVenue: 'template-06-palace.jpg' }
  ];

  for (const ot of otherTemplates) {
    // If other template is rendered with its own template_id (or in Studio)
    const otherWedding = {
      template_id: `template-${ot.id}`,
      order_reference: 'ORDER-OTHER-001'
    };
    const htmlOther = ot.fn({ guest: { name: 'Guest' }, wedding: otherWedding });
    
    // Verify customer's private photos do NOT appear in other templates
    assert.ok(!htmlOther.includes(uploadedBride), `Template ${ot.id} must NOT leak customer bride photo`);
    assert.ok(!htmlOther.includes(uploadedGroom), `Template ${ot.id} must NOT leak customer groom photo`);
    assert.ok(!htmlOther.includes(uploadedVenue), `Template ${ot.id} must NOT leak customer venue photo`);

    // Verify default fallback placeholder is used
    assert.ok(htmlOther.includes(ot.defaultBride), `Template ${ot.id} must use standard default bride placeholder`);
    assert.ok(htmlOther.includes(ot.defaultVenue), `Template ${ot.id} must use standard default venue placeholder`);
  }
});
