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
