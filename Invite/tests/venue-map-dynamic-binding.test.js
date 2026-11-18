import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { buildMapEmbedUrl, buildNavigateUrl, normalizeWeddingRecord } from '../api.js';

test('buildMapEmbedUrl & buildNavigateUrl dynamically generate accurate map URLs for Delhi vs Mumbai', () => {
  // User A: Delhi wedding venue & address
  const delhiVenue = 'The Oberoi New Delhi';
  const delhiAddress = 'Dr Zakir Hussain Marg, Delhi Golf Club, New Delhi, Delhi 110003';
  const delhiEmbed = buildMapEmbedUrl('', delhiVenue, delhiAddress);
  const delhiNav = buildNavigateUrl('', delhiVenue, delhiAddress);

  assert.ok(delhiEmbed.includes('The%20Oberoi%20New%20Delhi'), 'Delhi embed should contain Delhi venue');
  assert.ok(delhiEmbed.includes('New%20Delhi'), 'Delhi embed should contain New Delhi');
  assert.ok(delhiEmbed.includes('output=embed'), 'Embed should specify output=embed');
  assert.ok(!delhiEmbed.includes('88.3320'), 'Must not contain hardcoded Howrah coordinates');
  assert.ok(!delhiEmbed.includes('Howrah'), 'Must not contain Howrah');
  assert.ok(delhiNav.includes('New%20Delhi'), 'Delhi navigation should direct to Delhi');

  // User B: Mumbai wedding venue & address with custom Google Maps short link
  const mumbaiVenue = 'Taj Lands End';
  const mumbaiAddress = 'Bandstand Promenade, Bandra West, Mumbai, Maharashtra 400050';
  const customMapLink = 'https://maps.app.goo.gl/BandraMumbaiTaj123';
  const mumbaiEmbed = buildMapEmbedUrl(customMapLink, mumbaiVenue, mumbaiAddress);
  const mumbaiNav = buildNavigateUrl(customMapLink, mumbaiVenue, mumbaiAddress);

  assert.ok(mumbaiEmbed.includes('Taj%20Lands%20End'), 'Mumbai embed should contain Mumbai venue');
  assert.ok(mumbaiEmbed.includes('Mumbai'), 'Mumbai embed should contain Mumbai address');
  assert.ok(!mumbaiEmbed.includes('Howrah'), 'Must not contain Howrah');
  assert.equal(mumbaiNav, customMapLink, 'Navigate button must use user-provided custom Google Maps URL');
});

test('buildMapEmbedUrl handles Google Maps search query links and direct embed links', () => {
  // Direct Google Maps embed link
  const directEmbed = 'https://www.google.com/maps/embed?pb=!1m18!1m12!1d3502!2d77.2!3d28.6!2m3!1f0!2f0!3f0!3m2!1i1024!2i768';
  assert.equal(buildMapEmbedUrl(directEmbed), directEmbed, 'Should keep direct embed link as is');

  // Google Maps link with query parameter
  const queryLink = 'https://maps.google.com/?q=28.6139,77.2090';
  const parsedEmbed = buildMapEmbedUrl(queryLink);
  assert.ok(parsedEmbed.includes('28.6139%2C77.2090'), 'Should extract query parameter from Google Maps link');
  assert.ok(parsedEmbed.includes('output=embed'), 'Should append output=embed');

  // Safe fallback when venue and address are empty
  const emptyEmbed = buildMapEmbedUrl('', '', '');
  assert.equal(emptyEmbed, '', 'Should return empty string without hardcoding Howrah');
  const emptyNav = buildNavigateUrl('', '', '');
  assert.equal(emptyNav, 'https://maps.google.com', 'Should safely fallback to Google Maps without hardcoding Howrah');
});

test('index.html contains zero hardcoded Howrah coordinates or Grand Trunk Road text in Map modal', () => {
  const indexHtml = fs.readFileSync(path.resolve('index.html'), 'utf8');

  // Check that old hardcoded strings are completely removed
  assert.ok(!indexHtml.includes('148 Grand Trunk Road, Shibpur, Howrah'), 'Old hardcoded address must be removed');
  assert.ok(!indexHtml.includes('Opposite Botanical Garden Gate No. 2 • Valet Parking Available'), 'Old hardcoded note must be removed');
  assert.ok(!indexHtml.includes('The Royal Heritage Banquet & Lawn'), 'Old hardcoded venue must be removed');
  assert.ok(!indexHtml.includes('bbox=88.3320'), 'Old hardcoded Howrah bbox must be removed');
  assert.ok(!indexHtml.includes('marker=22.5850%2C88.3420'), 'Old hardcoded Howrah marker must be removed');

  // Check that dynamic binding functions and elements are present
  assert.ok(indexHtml.includes('buildMapEmbedUrl(mapUrl, venueName, venueAddress)'), 'Must call buildMapEmbedUrl');
  assert.ok(indexHtml.includes('buildNavigateUrl(mapUrl, venueName, venueAddress)'), 'Must call buildNavigateUrl');
  assert.ok(indexHtml.includes('${escapeHtml(navUrl)}'), 'Must bind Navigate button to dynamic navUrl');
  assert.ok(indexHtml.includes('${escapeHtml(embedMapUrl)}'), 'Must bind iframe src to dynamic embedMapUrl');
  assert.ok(indexHtml.includes('wedding.venue = (wedding.venue || orderMetadata?.venue'), 'Must resolve venue from orderMetadata');
  assert.ok(indexHtml.includes('wedding.map_url = (wedding.map_url || orderMetadata?.map_url'), 'Must resolve map_url from orderMetadata');
});
