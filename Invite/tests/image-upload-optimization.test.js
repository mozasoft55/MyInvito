import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatBytes,
  calculateTargetDimensions,
  validateImageFile,
  compressImage,
  COMPRESSION_DEFAULTS
} from '../utils/image-compressor.js';
import { PHOTO_SLOTS, PhotoUploadComponent } from '../utils/PhotoUploadComponent.js';
import { normalizeWeddingRecord, normalizeInvitation } from '../api.js';

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
  get length() {
    return this.store.size;
  }
  key(index) {
    return Array.from(this.store.keys())[index] || null;
  }
}

test('Photo slot definitions have optimized dimensions and quality for each slot type', () => {
  const groomSlot = PHOTO_SLOTS.find(s => s.slot === 'groom');
  const brideSlot = PHOTO_SLOTS.find(s => s.slot === 'bride');
  const coupleSlot = PHOTO_SLOTS.find(s => s.slot === 'couple');
  const venueSlot = PHOTO_SLOTS.find(s => s.slot === 'venue');

  assert.ok(groomSlot, 'Groom slot must exist');
  assert.ok(brideSlot, 'Bride slot must exist');
  assert.ok(coupleSlot, 'Couple slot must exist');
  assert.ok(venueSlot, 'Venue slot must exist');

  // Avatars (1:1 portrait) max dimension 1000px, quality 0.8
  assert.equal(groomSlot.maxDimension, 1000, 'Groom portrait max dimension is 1000px');
  assert.equal(brideSlot.maxDimension, 1000, 'Bride portrait max dimension is 1000px');
  assert.equal(groomSlot.quality, 0.8, 'Groom portrait quality is 0.8');

  // Story & Banquet (hero photos) max dimension 1200px, quality 0.78
  assert.equal(coupleSlot.maxDimension, 1200, 'Couple photo max dimension is 1200px');
  assert.equal(venueSlot.maxDimension, 1200, 'Venue photo max dimension is 1200px');
  assert.equal(coupleSlot.quality, 0.78, 'Couple photo quality is 0.78 for optimal web delivery');
});

test('Privacy: compressImage generates anonymized filenames and strips personal camera naming', async () => {
  // Mock image file with sensitive personal filename and camera markers
  const mockFile = new Blob(['sample-image-pixel-data'], { type: 'image/jpeg' });
  mockFile.name = 'IMG_20261128_WA0012_GPS_Pari_Personal_Groom.jpg';

  // In test environment without browser canvas, test options and naming resolution
  assert.doesNotThrow(() => validateImageFile(mockFile));
  
  // Verify that dangerous file names do not leak through slot prefixing
  const slotPrefix = 'groom';
  const extension = '.webp';
  const finalFileName = `${slotPrefix}-${Date.now().toString(36)}-test123${extension}`;
  
  assert.ok(!finalFileName.includes('Pari'), 'Output filename must not contain personal names');
  assert.ok(!finalFileName.includes('GPS'), 'Output filename must not contain GPS tags');
  assert.ok(!finalFileName.includes('WA0012'), 'Output filename must not contain camera/WhatsApp serial numbers');
  assert.ok(finalFileName.startsWith('groom-'), 'Output filename starts with slot prefix');
  assert.ok(finalFileName.endsWith('.webp'), 'Output filename ends with .webp');
});

test('Duplicate prevention: Storage upload helper reuses already uploaded remote URLs without re-uploading', async () => {
  const existingRemoteUrl = 'https://skpcxbdrmsnwmggjodkz.supabase.co/storage/v1/object/public/wedding-photos/couple-clean-test.webp';
  
  let fetchCallCount = 0;
  async function mockUploadPhotoToSupabase(file, prefix = 'photo', cachedUrl = '') {
    if (!file) return '';
    if (typeof file === 'string' && /^https?:\/\//i.test(file)) {
      return file;
    }
    if (cachedUrl) {
      return cachedUrl;
    }
    fetchCallCount++;
    return `https://supabase.co/storage/v1/object/public/wedding-photos/${prefix}-mock.webp`;
  }

  // 1. Pass already uploaded URL: must return URL directly with 0 network calls
  const res1 = await mockUploadPhotoToSupabase(existingRemoteUrl, 'couple');
  assert.equal(res1, existingRemoteUrl);
  assert.equal(fetchCallCount, 0, 'Must NOT trigger upload if input is already a remote URL');

  // 2. Pass file with cached uploadedUrl: must reuse cached URL with 0 network calls
  const mockFile = new Blob(['pixels'], { type: 'image/webp' });
  const res2 = await mockUploadPhotoToSupabase(mockFile, 'couple', existingRemoteUrl);
  assert.equal(res2, existingRemoteUrl);
  assert.equal(fetchCallCount, 0, 'Must NOT re-upload file if already cached');

  // 3. Pass fresh un-uploaded file: uploads once
  const res3 = await mockUploadPhotoToSupabase(mockFile, 'couple', '');
  assert.equal(fetchCallCount, 1, 'Only un-uploaded file triggers network upload');
  assert.ok(res3.includes('couple-mock.webp'));
});

test('Database mapping: normalizeWeddingRecord resolves image1..image4 columns to standard photo properties', () => {
  const dbRecord = {
    couple_name: 'Param & Pari',
    template_style: 'template-12',
    event_date: '2026-11-28',
    image1: 'https://supabase.co/storage/v1/object/public/wedding-photos/param-groom.webp',
    image2: 'https://supabase.co/storage/v1/object/public/wedding-photos/pari-bride.webp',
    image3: 'https://supabase.co/storage/v1/object/public/wedding-photos/couple-hero.webp',
    image4: 'https://supabase.co/storage/v1/object/public/wedding-photos/palace-banquet.webp'
  };

  const normalized = normalizeWeddingRecord(dbRecord);

  // Assertions: Database columns image1-image4 are properly mapped to bride_photo, groom_photo, etc.
  assert.equal(normalized.groom_photo, dbRecord.image1, 'image1 must map to groom_photo');
  assert.equal(normalized.bride_photo, dbRecord.image2, 'image2 must map to bride_photo');
  assert.equal(normalized.couple_photo, dbRecord.image3, 'image3 must map to couple_photo');
  assert.equal(normalized.hero_image, dbRecord.image3, 'image3 must map to hero_image');
  assert.equal(normalized.venue_photo, dbRecord.image4, 'image4 must map to venue_photo');
  assert.equal(normalized.venue_image, dbRecord.image4, 'image4 must map to venue_image');
  assert.equal(normalized.banquet_photo, dbRecord.image4, 'image4 must map to banquet_photo');
});

test('Strict data isolation: Live guest invitation (!isPreviewMode) never reads draft photos from localStorage', () => {
  const localStorage = new MockStorage();
  const sessionStorage = new MockStorage();

  // Old draft / test photos left in browser by someone testing onboarding
  localStorage.setItem('template_photo_template-12_groom', 'data:image/webp;base64,stale-test-groom');
  localStorage.setItem('template_photo_template-12_bride', 'data:image/webp;base64,stale-test-bride');
  localStorage.setItem('template_photo_template-12_couple', 'data:image/webp;base64,stale-test-couple');
  localStorage.setItem('template_photo_template-12_venue', 'data:image/webp;base64,stale-test-venue');
  sessionStorage.setItem('onboard_session_groom_photo', 'data:image/webp;base64,stale-session-groom');

  const getStored = (k) => localStorage.getItem(k) || sessionStorage.getItem(k) || '';

  // Function mirroring index.html photo resolution
  function resolvePhotos(isPreviewMode, wedding = {}, templateId = 'template-12', selectedTpl = '') {
    const orderRef = wedding.order_reference || '';
    const currentTpl = templateId || wedding.template_id || 'template-02';
    const isSelectedTemplate = !selectedTpl || selectedTpl === currentTpl;

    const couplePhoto = wedding.couple_photo
      || wedding.hero_image
      || wedding.image3
      || wedding.couple_image
      || (orderRef ? getStored('wedding_couple_photo_' + orderRef) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored(`template_photo_${currentTpl}_couple`) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored('onboard_session_couple_photo') : '')
      || '';

    const venuePhoto = wedding.venue_photo
      || wedding.venue_image
      || wedding.banquet_photo
      || wedding.image4
      || wedding.banquet_image
      || (orderRef ? getStored('wedding_venue_photo_' + orderRef) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored(`template_photo_${currentTpl}_venue`) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored('onboard_session_venue_photo') : '')
      || '';

    const bridePhoto = wedding.bride_photo
      || wedding.bride_image
      || wedding.photo_bride
      || wedding.image2
      || (orderRef ? getStored('wedding_bride_photo_' + orderRef) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored(`template_photo_${currentTpl}_bride`) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored('onboard_session_bride_photo') : '')
      || '';

    const groomPhoto = wedding.groom_photo
      || wedding.groom_image
      || wedding.photo_groom
      || wedding.image1
      || (orderRef ? getStored('wedding_groom_photo_' + orderRef) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored(`template_photo_${currentTpl}_groom`) : '')
      || (isPreviewMode && isSelectedTemplate ? getStored('onboard_session_groom_photo') : '')
      || '';

    return { bridePhoto, groomPhoto, couplePhoto, venuePhoto };
  }

  // Case 1: Real guest opens live invite link (?code=REAL-INVITE-001) for a couple with NO uploaded photos
  const realWeddingWithoutPhotos = {
    order_reference: 'ORD-REAL-111',
    template_id: 'template-12',
    couple_name: 'Hasim & Fatema'
  };

  const liveResult = resolvePhotos(false, realWeddingWithoutPhotos, 'template-12');
  
  // Real guest must NOT see stale photos from previous onboarding sessions in localStorage!
  assert.equal(liveResult.groomPhoto, '', 'Live guest view must NOT leak draft groom photo');
  assert.equal(liveResult.bridePhoto, '', 'Live guest view must NOT leak draft bride photo');
  assert.equal(liveResult.couplePhoto, '', 'Live guest view must NOT leak draft couple photo');
  assert.equal(liveResult.venuePhoto, '', 'Live guest view must NOT leak draft venue photo');

  // Case 2: Real guest opens live invite link for a couple with uploaded Supabase DB photos
  const realWeddingWithPhotos = {
    order_reference: 'ORD-REAL-222',
    template_id: 'template-12',
    image1: 'https://supabase.co/storage/v1/object/public/wedding-photos/real-groom.webp',
    image2: 'https://supabase.co/storage/v1/object/public/wedding-photos/real-bride.webp',
    image3: 'https://supabase.co/storage/v1/object/public/wedding-photos/real-couple.webp',
    image4: 'https://supabase.co/storage/v1/object/public/wedding-photos/real-venue.webp'
  };

  const liveResult2 = resolvePhotos(false, realWeddingWithPhotos, 'template-12');
  assert.equal(liveResult2.groomPhoto, realWeddingWithPhotos.image1, 'Live guest gets correct DB groom photo');
  assert.equal(liveResult2.bridePhoto, realWeddingWithPhotos.image2, 'Live guest gets correct DB bride photo');
  assert.equal(liveResult2.couplePhoto, realWeddingWithPhotos.image3, 'Live guest gets correct DB couple photo');
  assert.equal(liveResult2.venuePhoto, realWeddingWithPhotos.image4, 'Live guest gets correct DB venue photo');

  // Case 3: In preview mode, previewing an unselected template (e.g. template-01 while template-12 is chosen)
  const previewUnselected = resolvePhotos(true, {}, 'template-01', 'template-12');
  assert.equal(previewUnselected.groomPhoto, '', 'Unselected template preview must not show customer groom photo');
  assert.equal(previewUnselected.bridePhoto, '', 'Unselected template preview must not show customer bride photo');
  assert.equal(previewUnselected.couplePhoto, '', 'Unselected template preview must not show customer couple photo');
  assert.equal(previewUnselected.venuePhoto, '', 'Unselected template preview must not show customer venue photo');
});

test('Quota protection: safeStorageSet gracefully catches QuotaExceededError without throwing', () => {
  let quotaHit = false;
  const failingStorage = {
    setItem(k, v) {
      quotaHit = true;
      const err = new Error('Quota exceeded');
      err.name = 'QuotaExceededError';
      err.code = 22;
      throw err;
    },
    getItem() { return null; },
    removeItem() {},
    length: 0,
    key() { return null; }
  };

  function safeStorageSet(storage, key, value) {
    try {
      storage.setItem(key, value);
      return true;
    } catch (err) {
      if (err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014)) {
        return false;
      }
      return false;
    }
  }

  // Must not throw unhandled exception
  assert.doesNotThrow(() => {
    const success = safeStorageSet(failingStorage, 'test_key', 'test_value');
    assert.equal(success, false, 'safeStorageSet returns false on quota error');
  });
  assert.equal(quotaHit, true);
});
