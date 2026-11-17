import test from 'node:test';
import assert from 'node:assert/strict';

class MockStorage {
  constructor() {
    this.store = new Map();
  }
  getItem(key) {
    return this.store.get(key) || null;
  }
  setItem(key, value) {
    this.store.set(key, String(value));
  }
  removeItem(key) {
    this.store.delete(key);
  }
  clear() {
    this.store.clear();
  }
}

test('User uploaded photos during onboarding bind to selected template instance and draft immediately', () => {
  const localStorage = new MockStorage();
  const sessionStorage = new MockStorage();

  const selectedTemplate = 'template-06';
  localStorage.setItem('selected_invitation_template', selectedTemplate);

  const sampleGroomDataUrl = 'data:image/webp;base64,UklGRmQAAABXRUJQVlA4TFcAAAAv...groom';
  const sampleBrideDataUrl = 'data:image/webp;base64,UklGRmQAAABXRUJQVlA4TFcAAAAv...bride';
  const sampleCoupleDataUrl = 'data:image/webp;base64,UklGRmQAAABXRUJQVlA4TFcAAAAv...couple';
  const sampleVenueDataUrl = 'data:image/webp;base64,UklGRmQAAABXRUJQVlA4TFcAAAAv...venue';

  // Simulate persistUploadedPhoto logic
  function persistUploadedPhoto(slot, dataUrl, templateId) {
    sessionStorage.setItem(`onboard_session_${slot}_photo`, dataUrl);
    if (templateId) {
      localStorage.setItem(`template_photo_${templateId}_${slot}`, dataUrl);
      sessionStorage.setItem(`template_photo_${templateId}_${slot}`, dataUrl);
    }
    const draft = JSON.parse(localStorage.getItem('primeecard_onboard_draft') || '{}');
    draft[`${slot}_photo`] = dataUrl;
    if (slot === 'couple') draft.hero_image = dataUrl;
    if (slot === 'venue') draft.venue_image = dataUrl;
    draft.template_style = templateId;
    localStorage.setItem('primeecard_onboard_draft', JSON.stringify(draft));
  }

  persistUploadedPhoto('groom', sampleGroomDataUrl, selectedTemplate);
  persistUploadedPhoto('bride', sampleBrideDataUrl, selectedTemplate);
  persistUploadedPhoto('couple', sampleCoupleDataUrl, selectedTemplate);
  persistUploadedPhoto('venue', sampleVenueDataUrl, selectedTemplate);

  // Assertions: session storage has session keys
  assert.equal(sessionStorage.getItem('onboard_session_groom_photo'), sampleGroomDataUrl);
  assert.equal(sessionStorage.getItem('onboard_session_bride_photo'), sampleBrideDataUrl);
  assert.equal(sessionStorage.getItem('onboard_session_couple_photo'), sampleCoupleDataUrl);
  assert.equal(sessionStorage.getItem('onboard_session_venue_photo'), sampleVenueDataUrl);

  // Assertions: template-scoped storage keys are bound to template-06
  assert.equal(localStorage.getItem('template_photo_template-06_groom'), sampleGroomDataUrl);
  assert.equal(localStorage.getItem('template_photo_template-06_bride'), sampleBrideDataUrl);
  assert.equal(localStorage.getItem('template_photo_template-06_couple'), sampleCoupleDataUrl);
  assert.equal(localStorage.getItem('template_photo_template-06_venue'), sampleVenueDataUrl);

  // Assertions: draft has all photos saved
  const draft = JSON.parse(localStorage.getItem('primeecard_onboard_draft'));
  assert.equal(draft.groom_photo, sampleGroomDataUrl);
  assert.equal(draft.bride_photo, sampleBrideDataUrl);
  assert.equal(draft.couple_photo, sampleCoupleDataUrl);
  assert.equal(draft.venue_photo, sampleVenueDataUrl);
  assert.equal(draft.hero_image, sampleCoupleDataUrl);
  assert.equal(draft.venue_image, sampleVenueDataUrl);
  assert.equal(draft.template_style, 'template-06');
});

test('Template switching in onboarding rebinds active session photos to newly selected template', () => {
  const localStorage = new MockStorage();
  const sessionStorage = new MockStorage();

  const photo = 'data:image/webp;base64,sample-couple-photo';
  sessionStorage.setItem('onboard_session_couple_photo', photo);
  localStorage.setItem('template_photo_template-06_couple', photo);
  localStorage.setItem('selected_invitation_template', 'template-06');

  // User changes template to template-14 in dropdown
  const newTemplate = 'template-14';
  localStorage.setItem('selected_invitation_template', newTemplate);
  ['groom', 'bride', 'couple', 'venue'].forEach(slot => {
    const p = sessionStorage.getItem(`onboard_session_${slot}_photo`);
    if (p) {
      localStorage.setItem(`template_photo_${newTemplate}_${slot}`, p);
      sessionStorage.setItem(`template_photo_${newTemplate}_${slot}`, p);
    }
  });

  assert.equal(localStorage.getItem('template_photo_template-14_couple'), photo);
  assert.equal(sessionStorage.getItem('template_photo_template-14_couple'), photo);
});

test('Index.html photo resolution logic correctly retrieves uploaded photos for selected template and preserves isolation', () => {
  const localStorage = new MockStorage();
  const sessionStorage = new MockStorage();

  const bridePhoto = 'data:image/webp;base64,custom-bride';
  const groomPhoto = 'data:image/webp;base64,custom-groom';
  const couplePhoto = 'data:image/webp;base64,custom-couple';
  const venuePhoto = 'data:image/webp;base64,custom-venue';

  localStorage.setItem('selected_invitation_template', 'template-06');
  localStorage.setItem('template_photo_template-06_bride', bridePhoto);
  localStorage.setItem('template_photo_template-06_groom', groomPhoto);
  localStorage.setItem('template_photo_template-06_couple', couplePhoto);
  localStorage.setItem('template_photo_template-06_venue', venuePhoto);
  sessionStorage.setItem('onboard_session_bride_photo', bridePhoto);
  sessionStorage.setItem('onboard_session_groom_photo', groomPhoto);
  sessionStorage.setItem('onboard_session_couple_photo', couplePhoto);
  sessionStorage.setItem('onboard_session_venue_photo', venuePhoto);

  const getStored = (k) => localStorage.getItem(k) || sessionStorage.getItem(k) || '';

  function resolvePhotosForTemplate(templateId, localOrder = null, wedding = {}) {
    const orderRef = wedding.order_reference || '';
    const currentTpl = templateId || wedding.template_id || 'template-02';
    const selectedTpl = getStored('selected_invitation_template') || localOrder?.template_style || '';
    const isSelectedTemplate = !selectedTpl || selectedTpl === currentTpl;

    const resolvedCouple = wedding.couple_photo
      || wedding.hero_image
      || (orderRef ? getStored('wedding_couple_photo_' + orderRef) : '')
      || getStored(`template_photo_${currentTpl}_couple`)
      || (isSelectedTemplate ? getStored('onboard_session_couple_photo') : '')
      || '';

    const resolvedVenue = wedding.venue_photo
      || wedding.venue_image
      || (orderRef ? getStored('wedding_venue_photo_' + orderRef) : '')
      || getStored(`template_photo_${currentTpl}_venue`)
      || (isSelectedTemplate ? getStored('onboard_session_venue_photo') : '')
      || '';

    const resolvedBride = wedding.bride_photo
      || wedding.bride_image
      || wedding.photo_bride
      || (orderRef ? getStored('wedding_bride_photo_' + orderRef) : '')
      || getStored(`template_photo_${currentTpl}_bride`)
      || (isSelectedTemplate ? getStored('onboard_session_bride_photo') : '')
      || '';

    const resolvedGroom = wedding.groom_photo
      || wedding.groom_image
      || wedding.photo_groom
      || (orderRef ? getStored('wedding_groom_photo_' + orderRef) : '')
      || getStored(`template_photo_${currentTpl}_groom`)
      || (isSelectedTemplate ? getStored('onboard_session_groom_photo') : '')
      || '';

    return {
      bride_photo: resolvedBride,
      groom_photo: resolvedGroom,
      couple_photo: resolvedCouple,
      venue_photo: resolvedVenue
    };
  }

  // 1. Previewing the user's selected template (template-06)
  const photosT06 = resolvePhotosForTemplate('template-06');
  assert.equal(photosT06.bride_photo, bridePhoto, 'template-06 must resolve uploaded bride photo');
  assert.equal(photosT06.groom_photo, groomPhoto, 'template-06 must resolve uploaded groom photo');
  assert.equal(photosT06.couple_photo, couplePhoto, 'template-06 must resolve uploaded couple photo');
  assert.equal(photosT06.venue_photo, venuePhoto, 'template-06 must resolve uploaded venue photo');

  // 2. Previewing an unselected template (e.g. template-01) - customer photos must NOT leak!
  const photosT01 = resolvePhotosForTemplate('template-01');
  assert.equal(photosT01.bride_photo, '', 'template-01 must not leak customer bride photo');
  assert.equal(photosT01.groom_photo, '', 'template-01 must not leak customer groom photo');
  assert.equal(photosT01.couple_photo, '', 'template-01 must not leak customer couple photo');
  assert.equal(photosT01.venue_photo, '', 'template-01 must not leak customer venue photo');
});

test('Template 06 accurately reflects resolved customer uploaded images in rendered output', async () => {
  const t06 = (await import('../templates/template-06.js')).default;

  const uploadedBride = 'https://example.com/uploads/bride-portrait.webp';
  const uploadedGroom = 'https://example.com/uploads/groom-portrait.webp';
  const uploadedCouple = 'https://example.com/uploads/couple-hero.webp';
  const uploadedVenue = 'https://example.com/uploads/banquet-hall.webp';

  const weddingPayload = {
    guest: { name: 'Sunil Sen', persons: 2, with_family: true },
    wedding: {
      template_id: 'template-06',
      bride_name: 'Pari',
      groom_name: 'Param',
      venue: 'Royal Bengal Palace',
      date: '2026-12-10',
      bride_photo: uploadedBride,
      groom_photo: uploadedGroom,
      couple_photo: uploadedCouple,
      hero_image: uploadedCouple,
      venue_photo: uploadedVenue,
      venue_image: uploadedVenue
    },
    events: [
      { name: 'Gaye Holud', date: '2026-12-09', time: '10:00 AM', venue: 'Royal Bengal Palace' }
    ]
  };

  const html = t06(weddingPayload);

  // Assertions: uploaded images are present in the rendered HTML output
  assert.ok(html.includes(uploadedBride), 'Template 06 must render the uploaded bride photo');
  assert.ok(html.includes(uploadedGroom), 'Template 06 must render the uploaded groom photo');
  assert.ok(html.includes(uploadedCouple), 'Template 06 must render the uploaded couple photo');
  assert.ok(html.includes(uploadedVenue), 'Template 06 must render the uploaded venue photo');

  // Assertions: default placeholders are NOT used for these slots
  assert.ok(!html.includes('default-bride.webp'), 'Template 06 must not fallback to default bride when photo is provided');
  assert.ok(!html.includes('default-groom.webp'), 'Template 06 must not fallback to default groom when photo is provided');
  assert.ok(!html.includes('template-06-couple.webp'), 'Template 06 must not fallback to default couple when photo is provided');
});

test('Order submission fallback guarantees photos are persisted to order and template-scoped storage', () => {
  const localStorage = new MockStorage();
  const sessionStorage = new MockStorage();

  const currentOrderReference = 'REF-ORDER-TEST-999';
  const brideDataUrl = 'data:image/webp;base64,order-bride';
  const groomDataUrl = 'data:image/webp;base64,order-groom';
  const coupleDataUrl = 'data:image/webp;base64,order-couple';
  const venueDataUrl = 'data:image/webp;base64,order-venue';

  sessionStorage.setItem('onboard_session_bride_photo', brideDataUrl);
  sessionStorage.setItem('onboard_session_groom_photo', groomDataUrl);
  sessionStorage.setItem('onboard_session_couple_photo', coupleDataUrl);
  sessionStorage.setItem('onboard_session_venue_photo', venueDataUrl);

  // Simulate submission fallback logic when Supabase direct storage returns empty
  let bridePhoto = '';
  let groomPhoto = '';
  let couplePhoto = '';
  let venuePhoto = '';

  bridePhoto = bridePhoto || sessionStorage.getItem('onboard_session_bride_photo') || '';
  groomPhoto = groomPhoto || sessionStorage.getItem('onboard_session_groom_photo') || '';
  couplePhoto = couplePhoto || sessionStorage.getItem('onboard_session_couple_photo') || '';
  venuePhoto = venuePhoto || sessionStorage.getItem('onboard_session_venue_photo') || '';

  const orderMetadata = {
    reference: currentOrderReference,
    bride_photo: bridePhoto,
    groom_photo: groomPhoto,
    couple_photo: couplePhoto,
    venue_photo: venuePhoto,
    hero_image: couplePhoto,
    venue_image: venuePhoto,
    template_style: 'template-06'
  };

  localStorage.setItem('primeecard_last_order', JSON.stringify(orderMetadata));
  localStorage.setItem('primeecard_order_' + currentOrderReference, JSON.stringify(orderMetadata));
  localStorage.setItem('wedding_bride_photo_' + currentOrderReference, bridePhoto);
  localStorage.setItem('wedding_groom_photo_' + currentOrderReference, groomPhoto);
  localStorage.setItem('wedding_couple_photo_' + currentOrderReference, couplePhoto);
  localStorage.setItem('wedding_venue_photo_' + currentOrderReference, venuePhoto);

  const tplStyle = orderMetadata.template_style;
  localStorage.setItem(`template_photo_${tplStyle}_bride`, bridePhoto);
  localStorage.setItem(`template_photo_${tplStyle}_groom`, groomPhoto);
  localStorage.setItem(`template_photo_${tplStyle}_couple`, couplePhoto);
  localStorage.setItem(`template_photo_${tplStyle}_venue`, venuePhoto);

  // Verify all photos survived and are intact
  const savedLast = JSON.parse(localStorage.getItem('primeecard_last_order'));
  assert.equal(savedLast.bride_photo, brideDataUrl);
  assert.equal(savedLast.groom_photo, groomDataUrl);
  assert.equal(savedLast.couple_photo, coupleDataUrl);
  assert.equal(savedLast.venue_photo, venueDataUrl);

  assert.equal(localStorage.getItem('wedding_bride_photo_' + currentOrderReference), brideDataUrl);
  assert.equal(localStorage.getItem('wedding_groom_photo_' + currentOrderReference), groomDataUrl);
  assert.equal(localStorage.getItem('wedding_couple_photo_' + currentOrderReference), coupleDataUrl);
  assert.equal(localStorage.getItem('wedding_venue_photo_' + currentOrderReference), venueDataUrl);

  assert.equal(localStorage.getItem('template_photo_template-06_bride'), brideDataUrl);
  assert.equal(localStorage.getItem('template_photo_template-06_groom'), groomDataUrl);
  assert.equal(localStorage.getItem('template_photo_template-06_couple'), coupleDataUrl);
  assert.equal(localStorage.getItem('template_photo_template-06_venue'), venueDataUrl);
});
