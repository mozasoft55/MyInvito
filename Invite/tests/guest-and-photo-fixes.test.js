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
    assert.match(html, /Family Invitation · 3 Persons/, `Template ${t.id} must show Family Invitation · 3 Persons`);
    assert.match(html, /Aarav Gupta &amp; Family/, `Template ${t.id} must append Family for family invitation`);
  }
});
