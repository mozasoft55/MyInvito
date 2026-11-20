import { PhotoUploadComponent } from '../utils/PhotoUploadComponent.js';
import { ONBOARDING_CONFIG } from '../onboarding-config.js';
import {
  AVAILABLE_TEMPLATES,
  DEFAULT_STYLES,
  DEFAULT_THEMES,
  DEFAULT_EVENTS,
  STANDARDIZED_EVENTS,
  getEventImage,
  buildUpiUri,
  formatINR,
  validateCashRequest,
  validateOnboarding,
  normalizePhone10,
  maskOrderCouple,
  OrderSecurityShield,
  matchOrderCredentials
} from '../onboarding-core.js';

const form = document.getElementById('onboarding-form');
const steps = [...document.querySelectorAll('.form-step')];
const nextButton = document.getElementById('next-button');
const backButton = document.getElementById('back-button');
const submitButton = document.getElementById('submit-button');
const errorBox = document.getElementById('form-error');
const packageList = document.getElementById('package-list');
const upiPanel = document.getElementById('upi-panel');
const cashPanel = document.getElementById('cash-panel');
const eventList = document.getElementById('event-list');
const designWarning = document.getElementById('design-warning');
let currentStep = 0;
let currentOrderReference = '';
let currentDashboardToken = '';
let eventRows = DEFAULT_EVENTS.map(event => ({ ...event, event_date: '', note: '' }));
let packages = [];
let appliedPromo = null;
let paymentConfig = { upi_vpa: '', merchant_name: '' };
let themes = [];
let captchaWidget;
let packageConfigurationLoaded = false;
let designConfigurationLoaded = false;
let cashRequestMode = false;
let busy = false;

// ── Safe Storage Wrapper with Quota Protection ────────────────────────
export function safeStorageSet(storage, key, value) {
  try {
    storage.setItem(key, value);
    return true;
  } catch (err) {
    if (err && (err.name === 'QuotaExceededError' || err.code === 22 || err.code === 1014)) {
      console.warn(`[Storage] Storage quota reached writing "${key}". Evicting stale caches...`);
      try {
        const activeTpl = typeof localStorage !== 'undefined' ? localStorage.getItem('selected_invitation_template') : '';
        for (let i = (storage.length - 1); i >= 0; i--) {
          const k = storage.key(i);
          if (k && k.startsWith('template_photo_') && (!activeTpl || !k.includes(`_${activeTpl}_`))) {
            storage.removeItem(k);
          }
          if (k && (k.startsWith('wedding-') || k.startsWith('onboard-'))) {
            storage.removeItem(k);
          }
        }
        storage.setItem(key, value);
        return true;
      } catch (_) {
        return false;
      }
    }
    return false;
  }
}

// ── Photo Upload & Compression Pipeline ──────────────────────────────
function persistUploadedPhoto(slot, result) {
  const dataUrl = result.dataUrl || result.previewUrl || '';
  if (!dataUrl) return;

  const selectedTpl = form?.elements?.template_style?.value
    || (typeof localStorage !== 'undefined' && localStorage.getItem('selected_invitation_template'))
    || 'template-02';

  try {
    sessionStorage.setItem(`onboard_session_${slot}_photo`, dataUrl);
    // Bind to template-scoped storage so it binds to the selected template instance
    if (selectedTpl) {
      safeStorageSet(localStorage, `template_photo_${selectedTpl}_${slot}`, dataUrl);
      sessionStorage.setItem(`template_photo_${selectedTpl}_${slot}`, dataUrl);
    }
    // Immediately update primeecard_onboard_draft in localStorage
    try {
      const draft = JSON.parse(localStorage.getItem('primeecard_onboard_draft') || '{}');
      draft[`${slot}_photo`] = dataUrl;
      if (slot === 'couple') draft.hero_image = dataUrl;
      if (slot === 'venue') draft.venue_image = dataUrl;
      if (selectedTpl) draft.template_style = selectedTpl;
      safeStorageSet(localStorage, 'primeecard_onboard_draft', JSON.stringify(draft));
    } catch (_) {}

    // Purge any legacy un-scoped keys so customer photos never leak to other templates or Studio
    localStorage.removeItem(`wedding-${slot}-photo`);
    localStorage.removeItem(`wedding_${slot}_photo`);
    sessionStorage.removeItem(`wedding-${slot}-photo`);
    sessionStorage.removeItem(`onboard-${slot}-photo`);
  } catch (err) {
    console.warn(`[Onboard] Could not persist ${slot} photo to storage:`, err);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wedding-photo-updated', { detail: { slot, dataUrl, templateId: selectedTpl } }));
  }
}

function clearUploadedPhoto(slot) {
  const selectedTpl = form?.elements?.template_style?.value
    || (typeof localStorage !== 'undefined' && localStorage.getItem('selected_invitation_template'))
    || 'template-02';

  try {
    sessionStorage.removeItem(`onboard_session_${slot}_photo`);
    if (selectedTpl) {
      localStorage.removeItem(`template_photo_${selectedTpl}_${slot}`);
      sessionStorage.removeItem(`template_photo_${selectedTpl}_${slot}`);
    }
    try {
      const draft = JSON.parse(localStorage.getItem('primeecard_onboard_draft') || '{}');
      delete draft[`${slot}_photo`];
      if (slot === 'couple') delete draft.hero_image;
      if (slot === 'venue') delete draft.venue_image;
      safeStorageSet(localStorage, 'primeecard_onboard_draft', JSON.stringify(draft));
    } catch (_) {}

    localStorage.removeItem(`wedding-${slot}-photo`);
    localStorage.removeItem(`wedding_${slot}_photo`);
    sessionStorage.removeItem(`wedding-${slot}-photo`);
    sessionStorage.removeItem(`onboard-${slot}-photo`);
  } catch (_) {}

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('wedding-photo-removed', { detail: { slot, templateId: selectedTpl } }));
  }
}

let photoUploader = null;
const uploaderContainer = document.getElementById('onboard-photo-uploader');
if (uploaderContainer) {
  try {
    photoUploader = new PhotoUploadComponent({
      container: uploaderContainer,
      maxWidth: 1200,
      quality: 0.8,
      onPhotoReady: (slot, result) => {
        persistUploadedPhoto(slot, result);
      },
      onPhotoRemoved: (slot) => {
        clearUploadedPhoto(slot);
      }
    });

    try {
      // Purge legacy un-scoped keys to ensure strict privacy and data isolation
      ['groom', 'bride', 'couple', 'venue'].forEach(s => {
        localStorage.removeItem(`wedding-${s}-photo`);
        localStorage.removeItem(`wedding_${s}_photo`);
        sessionStorage.removeItem(`wedding-${s}-photo`);
        sessionStorage.removeItem(`onboard-${s}-photo`);
      });

      let draftPhotos = null;
      try {
        draftPhotos = JSON.parse(localStorage.getItem('primeecard_onboard_draft') || '{}');
      } catch (_) {}

      const savedGroom = sessionStorage.getItem('onboard_session_groom_photo') || draftPhotos?.groom_photo;
      const savedBride = sessionStorage.getItem('onboard_session_bride_photo') || draftPhotos?.bride_photo;
      const savedCouple = sessionStorage.getItem('onboard_session_couple_photo') || draftPhotos?.couple_photo;
      const savedVenue = sessionStorage.getItem('onboard_session_venue_photo') || draftPhotos?.venue_photo;
      if (savedGroom) { sessionStorage.setItem('onboard_session_groom_photo', savedGroom); photoUploader.loadExisting('groom', savedGroom, 'Saved'); }
      if (savedBride) { sessionStorage.setItem('onboard_session_bride_photo', savedBride); photoUploader.loadExisting('bride', savedBride, 'Saved'); }
      if (savedCouple) { sessionStorage.setItem('onboard_session_couple_photo', savedCouple); photoUploader.loadExisting('couple', savedCouple, 'Saved'); }
      if (savedVenue) { sessionStorage.setItem('onboard_session_venue_photo', savedVenue); photoUploader.loadExisting('venue', savedVenue, 'Saved'); }
    } catch (_) {}
  } catch (err) {
    console.warn('[Onboard] PhotoUploadComponent initialization deferred:', err);
  }
}

async function uploadPhotoToSupabase(file, prefix = 'photo') {
  if (!file) return '';

  // 1. If already a remote URL, return immediately (stops duplicate storage creation)
  if (typeof file === 'string' && /^https?:\/\//i.test(file)) {
    return file;
  }

  // 2. Check if component already cached uploaded URL
  if (photoUploader?.state?.[prefix]?.uploadedUrl) {
    return photoUploader.state[prefix].uploadedUrl;
  }

  const supabaseBase = ONBOARDING_CONFIG.supabaseUrl 
    || (ONBOARDING_CONFIG.onboardingEndpoint ? ONBOARDING_CONFIG.onboardingEndpoint.split('/functions/')[0] : 'https://skpcxbdrmsnwmggjodkz.supabase.co');
  const bucket = 'wedding-photos';
  const cleanName = `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}.webp`;
  const uploadUrl = `${supabaseBase}/storage/v1/object/${bucket}/${cleanName}`;

  try {
    const res = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        'apikey': ONBOARDING_CONFIG.publishableKey,
        'Authorization': `Bearer ${ONBOARDING_CONFIG.publishableKey}`,
        'Content-Type': 'image/webp',
        'x-upsert': 'true'
      },
      body: file
    });
    if (res.ok) {
      const publicUrl = `${supabaseBase}/storage/v1/object/public/${bucket}/${cleanName}`;
      if (photoUploader?.state?.[prefix]) {
        photoUploader.state[prefix].uploadedUrl = publicUrl;
      }
      return publicUrl;
    }
  } catch (err) {
    console.warn('[Onboard] Supabase direct storage upload failed, using persistent data URL:', err);
  }

  // Fallback: Convert compressed WebP blob to Base64 data URL (<250KB)
  if (typeof file === 'string') return file;
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result || '');
    reader.onerror = () => resolve('');
    reader.readAsDataURL(file);
  });
}

const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[character]));

// ── Wedding Invitation Music Engine & Picker ──────────────────────────
const MP_TRACKS = [
  { id: 'raataan-lambiyan', title: 'Raataan Lambiyan', sub: 'Shershaah · soft and warm',        src: '../music/raataan-lambiyan.mp3' },
  { id: 'tere-vaaste',      title: 'Tere Vaaste',      sub: 'Zara Hatke Zara Bachke · sweet',   src: '../music/tere-vaaste.mp3' },
  { id: 'din-shagna-da',    title: 'Din Shagna Da',    sub: 'Phillauri · wedding classic',      src: '../music/din-shagna-da.mp3' },
  { id: 'kabira-encore',    title: 'Kabira (Encore)',  sub: 'Yeh Jawaani Hai Deewani · emotional', src: '../music/kabira-encore.mp3' },
  { id: 'piya-ghar-aavenge',title: 'Piya Ghar Aavenge',sub: 'Folk · warm and traditional',      src: '../music/piya-ghar-aavenge.mp3' },
  { id: 'aaj-se-teri',      title: 'Aaj Se Teri',      sub: 'Padman · romantic',                src: '../music/aaj-se-teri.mp3' },
  { id: 'tere-dware',       title: 'Tere Dware Pe Aayi Baraat', sub: 'Baraat · festive',        src: '../music/tere-dware-pe-aayi-baraat.mp3' },
  { id: 'flute',            title: 'Flute',            sub: 'Instrumental · calm',              src: '../music/flute.mp3' },
  { id: 'instrumental-1',   title: 'Instrumental 1',   sub: 'Instrumental',                     src: '../music/instrumental-1.mp3' },
  { id: 'instrumental-2',   title: 'Instrumental 2',   sub: 'Instrumental',                     src: '../music/instrumental-2.mp3' }
];

const MP_UPLOAD_ENDPOINT = '/api/music';
const MP_MAX_INPUT = 1024 * 1024; // 1 MB
const MP_TARGET_KB = 200;
const MP_MAX_SECONDS = 40;

const ICON_PLAY = '<svg viewBox="0 0 14 14"><path d="M3 1.5v11l9-5.5z"/></svg>';
const ICON_PAUSE = '<svg viewBox="0 0 14 14"><path d="M2.5 1.5h3v11h-3zM8.5 1.5h3v11h-3z"/></svg>';

let selectedMusic = null; // { id, title, sub, src, type }
let mpTracks = MP_TRACKS.slice();
let mpSelId = null;
let mpUpload = null;
let mpAudio = new Audio();
let mpPlayingId = null;

function updateSelectedMusicUi() {
  const card = document.getElementById('selected-music-card');
  const openBtn = document.getElementById('open-music-picker-btn');
  const titleEl = document.getElementById('selected-music-title');
  const subEl = document.getElementById('selected-music-sub');
  const idInput = document.getElementById('input-music-id');
  const titleInput = document.getElementById('input-music-title');
  const urlInput = document.getElementById('input-music-url');

  if (selectedMusic && selectedMusic.id) {
    if (card) card.style.display = 'flex';
    if (openBtn) openBtn.style.display = 'none';
    if (titleEl) titleEl.textContent = selectedMusic.title;
    if (subEl) subEl.textContent = selectedMusic.sub || 'Selected wedding soundtrack';
    if (idInput) idInput.value = selectedMusic.id;
    if (titleInput) titleInput.value = selectedMusic.title;
    if (urlInput) urlInput.value = selectedMusic.src;
  } else {
    if (card) card.style.display = 'none';
    if (openBtn) {
      openBtn.style.display = 'inline-flex';
      openBtn.textContent = '♪ Select your Music';
    }
    if (idInput) idInput.value = '';
    if (titleInput) titleInput.value = '';
    if (urlInput) urlInput.value = '';
  }
}

function renderMpList() {
  const list = document.getElementById('mpList');
  if (!list) return;
  list.innerHTML = '';
  const allTracks = mpUpload ? [mpUpload.track, ...mpTracks] : mpTracks;
  allTracks.forEach(t => {
    const row = document.createElement('div');
    row.className = 'mp-row' + (t.id === mpSelId ? ' sel' : '');
    row.setAttribute('role', 'radio');
    row.setAttribute('aria-checked', t.id === mpSelId);
    row.tabIndex = 0;
    row.innerHTML = `
      <button type="button" class="mp-play" aria-label="Play ${escapeHtml(t.title)}">${mpPlayingId === t.id ? ICON_PAUSE : ICON_PLAY}</button>
      <div class="mp-txt"><b>${escapeHtml(t.title)}</b><span>${escapeHtml(t.sub || '')}</span></div>
      <div class="mp-dot"></div>
    `;
    const playBtn = row.querySelector('.mp-play');
    playBtn.onclick = e => {
      e.stopPropagation();
      toggleMpAudio(t);
    };
    row.onclick = () => {
      mpSelId = t.id;
      const saveBtn = document.getElementById('mpSave');
      if (saveBtn) saveBtn.disabled = false;
      renderMpList();
    };
    row.onkeydown = e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        row.click();
      }
    };
    list.appendChild(row);
  });
}

function toggleMpAudio(t) {
  if (mpPlayingId === t.id) {
    mpAudio.pause();
    mpPlayingId = null;
    return renderMpList();
  }
  mpAudio.src = t.src;
  const p = mpAudio.play();
  if (p && typeof p.catch === 'function') p.catch(() => {});
  mpPlayingId = t.id;
  renderMpList();
}
mpAudio.onended = () => {
  mpPlayingId = null;
  renderMpList();
};

function stopMpAudio() {
  try {
    mpAudio.pause();
  } catch (_) {}
  mpPlayingId = null;
}

function openMpModal() {
  const modal = document.getElementById('mpBack');
  if (!modal) return;
  modal.style.display = 'flex';
  modal.classList.add('on');
  mpSelId = selectedMusic ? selectedMusic.id : null;
  const saveBtn = document.getElementById('mpSave');
  if (saveBtn) saveBtn.disabled = !mpSelId;
  renderMpList();
  const closeBtn = document.getElementById('mpClose');
  if (closeBtn) closeBtn.focus();
}

function closeMpModal() {
  stopMpAudio();
  const modal = document.getElementById('mpBack');
  if (!modal) return;
  modal.classList.remove('on');
  modal.style.display = 'none';
  renderMpList();
}

function setMpMsg(text, isErr = false) {
  const m = document.getElementById('mpMsg');
  if (!m) return;
  m.textContent = text;
  m.className = 'mp-msg' + (isErr ? ' err' : '');
}

function loadLameJs() {
  return new Promise((resolve, reject) => {
    if (window.lamejs) return resolve(window.lamejs);
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/lamejs/1.2.1/lame.min.js';
    s.onload = () => resolve(window.lamejs);
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

async function compressMpAudio(file) {
  await loadLameJs();
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const buf = await ctx.decodeAudioData(await file.arrayBuffer());
  ctx.close();

  const RATE = 22050;
  const secs = Math.min(buf.duration, MP_MAX_SECONDS);
  const frames = Math.floor(secs * RATE);
  const off = new OfflineAudioContext(1, frames, RATE);
  const src = off.createBufferSource();
  src.buffer = buf;
  src.connect(off.destination);
  src.start(0);

  const pcm = (await off.startRendering()).getChannelData(0);
  const fade = Math.min(2 * RATE, frames);
  const i16 = new Int16Array(frames);
  for (let i = 0; i < frames; i++) {
    let v = pcm[i];
    if (i > frames - fade) v *= (frames - i) / fade;
    i16[i] = Math.max(-1, Math.min(1, v)) * 32767;
  }
  const kbps = Math.max(24, Math.min(64, Math.floor(MP_TARGET_KB * 1024 * 8 / secs / 1000)));
  const enc = new window.lamejs.Mp3Encoder(1, RATE, kbps);
  const out = [];
  for (let i = 0; i < i16.length; i += 1152) {
    const c = enc.encodeBuffer(i16.subarray(i, i + 1152));
    if (c.length) out.push(c);
  }
  const end = enc.flush();
  if (end.length) out.push(end);
  return new Blob(out, { type: 'audio/mpeg' });
}

function initMusicPicker() {
  const openBtn = document.getElementById('open-music-picker-btn');
  const changeBtn = document.getElementById('change-music-btn');
  const removeBtn = document.getElementById('remove-music-btn');
  const closeBtn = document.getElementById('mpClose');
  const skipBtn = document.getElementById('mpSkip');
  const saveBtn = document.getElementById('mpSave');
  const modalBack = document.getElementById('mpBack');
  const upBtn = document.getElementById('mpUpBtn');
  const fileInput = document.getElementById('mpFile');

  if (openBtn) openBtn.onclick = openMpModal;
  if (changeBtn) changeBtn.onclick = openMpModal;
  if (closeBtn) closeBtn.onclick = closeMpModal;
  if (modalBack) {
    modalBack.onclick = e => {
      if (e.target === modalBack) closeMpModal();
    };
  }
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && modalBack && modalBack.classList.contains('on')) {
      closeMpModal();
    }
  });

  if (removeBtn) {
    removeBtn.onclick = () => {
      selectedMusic = null;
      mpSelId = null;
      try {
        localStorage.removeItem('wedding-music-url');
        localStorage.removeItem('wedding-music-title');
        localStorage.removeItem('wedding-music-id');
        sessionStorage.removeItem('wedding-music-url');
      } catch (_) {}
      updateSelectedMusicUi();
    };
  }

  if (skipBtn) {
    skipBtn.onclick = () => {
      selectedMusic = null;
      mpSelId = null;
      try {
        localStorage.removeItem('wedding-music-url');
        localStorage.removeItem('wedding-music-title');
        localStorage.removeItem('wedding-music-id');
        sessionStorage.removeItem('wedding-music-url');
      } catch (_) {}
      updateSelectedMusicUi();
      closeMpModal();
    };
  }

  if (upBtn && fileInput) {
    upBtn.onclick = () => fileInput.click();
    fileInput.onchange = async e => {
      const f = e.target.files[0];
      e.target.value = '';
      if (!f) return;
      if (!/^audio\//.test(f.type) && !/\.(mp3|m4a|aac|wav|ogg)$/i.test(f.name)) {
        return setMpMsg('Please choose an audio file (MP3, M4A, AAC, WAV or OGG).', true);
      }
      if (f.size > MP_MAX_INPUT) {
        return setMpMsg(`That file is ${(f.size / 1048576).toFixed(1)} MB. Please choose a song under 1 MB.`, true);
      }
      upBtn.disabled = true;
      setMpMsg('Preparing and optimizing your song…');

      try {
        const blob = await compressMpAudio(f);
        if (mpUpload && mpUpload.url) URL.revokeObjectURL(mpUpload.url);
        const url = URL.createObjectURL(blob);
        const cleanTitle = f.name.replace(/\.[^.]+$/, '');
        mpUpload = {
          blob,
          url,
          track: {
            id: 'upload',
            title: cleanTitle,
            sub: 'Your song · ' + Math.round(blob.size / 1024) + ' KB',
            src: url,
            type: 'upload'
          }
        };
        mpSelId = 'upload';
        if (saveBtn) saveBtn.disabled = false;
        renderMpList();
        setMpMsg(`Optimized: ${(f.size / 1024).toFixed(0)} KB reduced to ${Math.round(blob.size / 1024)} KB.`);
      } catch (err) {
        console.error('Audio compression failed:', err);
        setMpMsg('We could not read that file. Try another MP3 or WAV.', true);
      }
      upBtn.disabled = false;
    };
  }

  if (saveBtn) {
    saveBtn.onclick = async () => {
      stopMpAudio();
      if (mpSelId === 'upload' && mpUpload) {
        let finalSrc = mpUpload.url;
        saveBtn.disabled = true;
        setMpMsg('Saving your song…');

        // Attempt server upload
        try {
          const fd = new FormData();
          fd.append('song', mpUpload.blob, 'song.mp3');
          const res = await fetch(MP_UPLOAD_ENDPOINT, { method: 'POST', body: fd });
          if (res.ok) {
            const data = await res.json();
            if (data.url) finalSrc = data.url;
          } else {
            finalSrc = await new Promise(r => {
              const reader = new FileReader();
              reader.onload = () => r(reader.result);
              reader.readAsDataURL(mpUpload.blob);
            });
          }
        } catch (_) {
          try {
            finalSrc = await new Promise(r => {
              const reader = new FileReader();
              reader.onload = () => r(reader.result);
              reader.readAsDataURL(mpUpload.blob);
            });
          } catch (e) {
            finalSrc = mpUpload.url;
          }
        }

        selectedMusic = {
          id: 'custom-upload',
          title: mpUpload.track.title,
          sub: 'Custom uploaded song',
          src: finalSrc,
          type: 'upload'
        };
      } else {
        const found = mpTracks.find(t => t.id === mpSelId);
        if (found) {
          selectedMusic = { ...found, type: 'preset' };
        } else {
          selectedMusic = null;
        }
      }

      if (selectedMusic) {
        try {
          localStorage.setItem('wedding-music-url', selectedMusic.src);
          localStorage.setItem('wedding-music-title', selectedMusic.title);
          localStorage.setItem('wedding-music-id', selectedMusic.id);
          sessionStorage.setItem('wedding-music-url', selectedMusic.src);
          sessionStorage.setItem('wedding-music-title', selectedMusic.title);
        } catch (_) {}
      }

      updateSelectedMusicUi();
      closeMpModal();
    };
  }

  // Restore saved music if present
  try {
    const savedUrl = localStorage.getItem('wedding-music-url') || sessionStorage.getItem('wedding-music-url');
    const savedTitle = localStorage.getItem('wedding-music-title') || sessionStorage.getItem('wedding-music-title');
    const savedId = localStorage.getItem('wedding-music-id') || sessionStorage.getItem('wedding-music-id');
    if (savedUrl && savedTitle) {
      selectedMusic = {
        id: savedId || 'saved-song',
        title: savedTitle,
        sub: 'Selected wedding soundtrack',
        src: savedUrl,
        type: savedId === 'custom-upload' ? 'upload' : 'preset'
      };
      updateSelectedMusicUi();
    }
  } catch (_) {}
}

// ── Time helpers (12h AM/PM <-> 24h HH:MM) ──────────────────────────────────
function to12h(time24) {
  if (!time24 || !/^\d{2}:\d{2}$/.test(time24)) return { hour12: '', minute: '', ampm: '' };
  let [h, m] = time24.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  h = h % 12 || 12;
  return { hour12: String(h).padStart(2, '0'), minute: String(m).padStart(2, '0'), ampm };
}
function to24h(hour12, minute, ampm) {
  const h = parseInt(hour12, 10);
  const m = parseInt(minute, 10);
  if (!hour12 || !minute || !ampm || isNaN(h) || isNaN(m)) return '';
  const h24 = ampm === 'PM' ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h);
  return String(h24).padStart(2, '0') + ':' + String(m).padStart(2, '0');
}
function buildTimePicker12h(value, prefix, eventIndex) {
  const t = to12h(value);
  const di = eventIndex !== undefined ? 'data-event-index="' + eventIndex + '"' : '';
  const ho = ['','01','02','03','04','05','06','07','08','09','10','11','12'].map(function(v) {
    return '<option value="' + v + '"' + (t.hour12 === v ? ' selected' : '') + '>' + (v === '' ? 'HH' : parseInt(v, 10)) + '</option>';
  }).join('');
  const mo = ['','00','15','30','45'].map(function(v) {
    return '<option value="' + v + '"' + (t.minute === v ? ' selected' : '') + '>' + (v === '' ? 'MM' : v) + '</option>';
  }).join('');
  const ao = ['','AM','PM'].map(function(v) {
    return '<option value="' + v + '"' + (t.ampm === v ? ' selected' : '') + '>' + (v === '' ? 'AM/PM' : v) + '</option>';
  }).join('');
  return '<div class="time-picker-row" data-time-prefix="' + prefix + '" ' + di + '>' +
    '<select class="time-part" data-time-part="hour" data-time-prefix="' + prefix + '" ' + di + '>' + ho + '</select>' +
    '<span class="time-sep">:</span>' +
    '<select class="time-part" data-time-part="minute" data-time-prefix="' + prefix + '" ' + di + '>' + mo + '</select>' +
    '<select class="time-part time-ampm" data-time-part="ampm" data-time-prefix="' + prefix + '" ' + di + '>' + ao + '</select>' +
    '</div>';
}


function checkIsPaymentVerified(paymentStatus, advanceVerifiedPaise = 0, orderStatus = '') {
  const p = String(paymentStatus || '').trim().toLowerCase();
  const o = String(orderStatus || '').trim().toLowerCase();
  if (p.includes('pending') || p.includes('reject') || p === '') return false;
  if (['paid', 'partially paid', 'verified', 'settled', 'confirmed', 'active'].includes(p)) return true;
  if (['confirmed', 'active', 'delivered'].includes(o)) return true;
  if (Number(advanceVerifiedPaise) > 0) return true;
  return false;
}

function applyPaymentStatusState(paymentStatus, advanceVerifiedPaise = 0, orderStatus = '') {
  const isVerified = checkIsPaymentVerified(paymentStatus, advanceVerifiedPaise, orderStatus);
  const paymentEl = document.getElementById('success-payment');
  const dashboardLink = document.getElementById('dashboard-link');
  const previewLink = document.getElementById('preview-invitation-link');
  const linkIcon = document.getElementById('dashboard-link-icon');
  const linkText = document.getElementById('dashboard-link-text');
  const pendingNotice = document.getElementById('payment-pending-notice');
  const verifiedNotice = document.getElementById('payment-verified-notice');
  const finePrint = document.getElementById('dashboard-fine-print');
  const refreshMsg = document.getElementById('refresh-status-msg');

  const displayStatus = paymentStatus || (isVerified ? 'Paid' : 'Pending Verification');

  if (paymentEl) {
    paymentEl.innerHTML = isVerified
      ? '<span class="badge-status badge-verified">✓ ' + escapeHtml(displayStatus) + '</span>'
      : '<span class="badge-status badge-pending">⏱ ' + escapeHtml(displayStatus) + '</span>';
  }

  if (isVerified) {
    if (dashboardLink) {
      dashboardLink.classList.remove('is-disabled');
      dashboardLink.setAttribute('aria-disabled', 'false');
      dashboardLink.href = '../dashboard/?order=' + encodeURIComponent(currentOrderReference) + '&token=' + encodeURIComponent(currentDashboardToken);
    }
    if (previewLink) {
      previewLink.hidden = false;
      previewLink.classList.remove('is-disabled');
      previewLink.setAttribute('aria-disabled', 'false');
      previewLink.href = '../share.html?order=' + encodeURIComponent(currentOrderReference);
    }
    if (linkIcon) linkIcon.textContent = '➔';
    if (linkText) linkText.textContent = 'Open Secure Dashboard';
    if (pendingNotice) pendingNotice.hidden = true;
    if (verifiedNotice) verifiedNotice.hidden = false;
    if (finePrint) finePrint.hidden = false;
  } else {
    if (dashboardLink) {
      dashboardLink.classList.add('is-disabled');
      dashboardLink.setAttribute('aria-disabled', 'true');
      dashboardLink.href = 'javascript:void(0)';
    }
    if (previewLink) {
      previewLink.hidden = true;
      previewLink.classList.add('is-disabled');
      previewLink.setAttribute('aria-disabled', 'true');
      previewLink.href = 'javascript:void(0)';
    }
    if (linkIcon) linkIcon.textContent = '🔒';
    if (linkText) linkText.textContent = 'Open Secure Dashboard (Pending Verification)';
    if (pendingNotice) pendingNotice.hidden = false;
    if (verifiedNotice) verifiedNotice.hidden = true;
    if (finePrint) finePrint.hidden = true;
  }
}
function showError(message, fieldErrors = {}) {
  const fieldMessages = Object.values(fieldErrors).filter(fieldMessage => !message.includes(fieldMessage));
  errorBox.textContent = [message, ...fieldMessages].filter(Boolean).join(' ');
  errorBox.hidden = !message;
  for (const control of form.querySelectorAll('[name]')) {
    const invalid = Boolean(fieldErrors[control.name]);
    control.setAttribute('aria-invalid', String(invalid));
  }
  for (const control of eventList.querySelectorAll('[data-event-field]')) {
    const key = `event_${control.dataset.eventIndex}_${control.dataset.eventField}`;
    control.setAttribute('aria-invalid', String(Boolean(fieldErrors[key])));
  }
  const firstError = Object.keys(fieldErrors)[0];
  if (firstError) {
    const eventMatch = firstError.match(/^event_(\d+)_(name|date|time)$/);
    const control = eventMatch
      ? eventList.querySelector(`[data-event-index="${eventMatch[1]}"][data-event-field="${eventMatch[2]}"]`)
      : firstError === 'events'
        ? document.getElementById('add-event')
        : form.elements[firstError];
    control?.focus();
  }
}

function renderStep({ focus = true } = {}) {
  steps.forEach((step, index) => { step.hidden = index !== currentStep; });
  document.querySelectorAll('[data-progress]').forEach(item => {
    const index = Number(item.dataset.progress);
    item.classList.toggle('active', index === currentStep);
    item.classList.toggle('complete', index < currentStep);
    if (index === currentStep) item.setAttribute('aria-current', 'step');
    else item.removeAttribute('aria-current');
  });
  document.getElementById('step-count').textContent = `Step ${currentStep + 1} of ${steps.length}`;
  backButton.hidden = currentStep === 0;
  nextButton.hidden = currentStep === steps.length - 1;
  submitButton.hidden = currentStep !== steps.length - 1;
  submitButton.textContent = cashRequestMode ? 'Send cash quote request' : 'Create my order';
  if (currentStep === 3) updateReview();
  if (currentStep === 2) {
    updatePaymentPanel();
    updateConfigurationWarnings();
    if (cashRequestMode) document.getElementById('cash-fallback').hidden = false;
  }
  syncNavigationAvailability();
  syncSubmitAvailability();
  showError('');
  if (focus) {
    const heading = steps[currentStep].querySelector('h3');
    if (heading) {
      heading.tabIndex = -1;
      heading.focus();
    }
  }
}

function renderEvents() {
  if (!eventRows.length) {
    eventList.innerHTML = '<p class="event-empty">No programme events yet. Add at least one event to continue.</p>';
    return;
  }
  eventList.innerHTML = eventRows.map((event, index) => {
    const curName = (event.event_name || '').trim();
    const isCustom = Boolean(curName && !STANDARDIZED_EVENTS.some(se => se.name.toLowerCase() === curName.toLowerCase()));
    const eventImg = event.image || getEventImage(curName);

    const options = [
      '<option value="">-- Select Event Name --</option>',
      ...STANDARDIZED_EVENTS.map(se => {
        const sel = se.name.toLowerCase() === curName.toLowerCase() ? ' selected' : '';
        return `<option value="${escapeHtml(se.name)}"${sel}>${escapeHtml(se.name)} (${escapeHtml(se.tradition)})</option>`;
      }),
      `<option value="__custom__"${isCustom ? ' selected' : ''}>✍ Custom Type / Enter Your Own...</option>`
    ].join('');

    return `
    <article class="event-card" data-event-card="${index}">
      <div class="event-card-head">
        <div class="event-select-wrap">
          <select class="event-dropdown" aria-label="Event ${index + 1} type" data-event-index="${index}" data-event-field="select_name" required>
            ${options}
          </select>
          <input class="event-custom-input" aria-label="Custom event name" data-event-index="${index}" data-event-field="custom_name" value="${isCustom ? escapeHtml(curName) : ''}" maxlength="100" placeholder="Enter custom ceremony name..." ${isCustom ? '' : 'style="display:none;"'}>
        </div>
        <div class="event-thumb-preview" title="Linked ceremony image">
          <img src="../assets/${escapeHtml(eventImg)}" alt="" class="event-thumb-img" onerror="this.src='../assets/template-06-phere.jpg'">
        </div>
        <button type="button" class="event-action" data-move="${index}" data-direction="-1" aria-label="Move event up" ${index === 0 ? 'disabled' : ''}>↑</button>
        <button type="button" class="event-action" data-move="${index}" data-direction="1" aria-label="Move event down" ${index === eventRows.length - 1 ? 'disabled' : ''}>↓</button>
        <button type="button" class="event-action" data-remove="${index}" aria-label="Remove event">Remove</button>
      </div>
      <div class="event-fields">
        <label class="field">Date<input type="date" data-event-index="${index}" data-event-field="date" value="${escapeHtml(event.event_date)}" required></label>
        <label class="field">Time${buildTimePicker12h(event.event_time, `event-time`, index)}</label>
        <label class="field field-wide">Notes<input data-event-index="${index}" data-event-field="note" value="${escapeHtml(event.note)}" maxlength="500" placeholder="Optional notes"></label>
      </div>
    </article>`;
  }).join('');
}

function readEventInputs() {
  eventRows = eventRows.map((event, index) => {
    const selectEl = eventList.querySelector(`[data-event-index="${index}"][data-event-field="select_name"]`);
    const customEl = eventList.querySelector(`[data-event-index="${index}"][data-event-field="custom_name"]`);
    const selVal = selectEl?.value ?? '';
    const nameVal = selVal === '__custom__' ? (customEl?.value.trim() || '') : selVal;
    const getValue = field => eventList.querySelector(`[data-event-index="${index}"][data-event-field="${field}"]`)?.value ?? '';
    const getTimePart = part => eventList.querySelector(`[data-time-prefix="event-time"][data-event-index="${index}"][data-time-part="${part}"]`)?.value ?? '';
    const eventTime24 = to24h(getTimePart('hour'), getTimePart('minute'), getTimePart('ampm')) || event.event_time || '';
    const finalName = nameVal || event.event_name;
    const eventImg = getEventImage(finalName);

    return {
      event_name: finalName,
      event_date: getValue('date') || event.event_date,
      event_time: eventTime24,
      note: getValue('note'),
      image: eventImg
    };
  });
}

function calculatePackagePricing(item) {
  if (!item) return null;
  let globalDiscount = item.discount_paise || 0;
  let promoDiscount = 0;
  if (appliedPromo && appliedPromo.valid) {
    promoDiscount = appliedPromo.promo_discount_paise || 0;
    if (!appliedPromo.is_stackable) {
      globalDiscount = 0;
    }
  }
  const totalDiscount = globalDiscount + promoDiscount;
  const netPayable = Math.max(0, item.list_price_paise - totalDiscount);
  const advanceExpected = Math.min(item.advance_paise, netPayable);
  const balance = Math.max(0, netPayable - advanceExpected);
  return {
    list_price_paise: item.list_price_paise,
    global_discount_paise: globalDiscount,
    promo_discount_paise: promoDiscount,
    total_discount_paise: totalDiscount,
    net_payable_paise: netPayable,
    advance_paise: advanceExpected,
    balance_paise: balance
  };
}

function renderPackageChoices() {
  if (!packages.length) {
    showConfigurationFailure(new Error(packageConfigurationLoaded
      ? 'No active packages are available.'
      : 'Package prices could not be loaded. Try again or contact the business.'));
    return;
  }
  document.getElementById('cash-fallback').hidden = true;
  const previousChoice = form.elements.package_code?.value;
  packageList.innerHTML = packages.map((item, index) => {
    const pricing = calculatePackagePricing(item);
    const features = Array.isArray(item.features)
      ? `<ul>${item.features.map(feature => `<li>${escapeHtml(feature)}</li>`).join('')}</ul>`
      : '';
    const promoBadge = (appliedPromo && appliedPromo.valid)
      ? `<span class="promo-applied-tag">Promo: -${formatINR(pricing.promo_discount_paise)}</span>`
      : '';
    return `<label class="package-card">
      <input type="radio" name="package_code" value="${escapeHtml(item.code)}" ${item.code === previousChoice || (!previousChoice && index === 0) ? 'checked' : ''}>
      <span class="package-copy">
        <b>${escapeHtml(item.name)} ${promoBadge}</b>
        <span class="package-price">${formatINR(pricing.net_payable_paise)}</span>
        <small>List ${formatINR(pricing.list_price_paise)} · Advance ${formatINR(pricing.advance_paise)}</small>
        <small>Discount ${formatINR(pricing.total_discount_paise)} · Balance ${formatINR(pricing.balance_paise)}</small>
        ${features}
      </span>
    </label>`;
  }).join('');
  syncSubmitAvailability();
}

function renderThemePreview() {
  const theme = themes.find(item => item.theme_name === form.elements.theme_name.value);
  const preview = document.getElementById('theme-preview');
  if (!theme) {
    preview.textContent = 'Choose a palette to preview its colours.';
    return;
  }
  const colors = [theme.primary_color, theme.primary_dark_color, theme.accent_color, theme.paper_top_color, theme.paper_bottom_color, theme.text_color]
    .filter(color => /^#[\da-f]{6}$/i.test(String(color || '')));
  preview.replaceChildren(document.createTextNode(`${theme.label || theme.theme_name} palette `));
  for (const color of colors) {
    const swatch = document.createElement('span');
    swatch.className = 'theme-swatch';
    swatch.style.backgroundColor = color;
    swatch.setAttribute('aria-label', color);
    preview.append(swatch);
  }
}

function updateTemplatePreview() {
  const select = form.elements.template_style;
  const link = document.getElementById('template-preview-link');
  if (link && select) {
    const val = select.value || 'template-02';
    link.href = `../studio.html#${encodeURIComponent(val)}`;
    link.textContent = `👁 Preview ${val} ↗`;
  }
  toggleTemplate15BackgroundUploads();
}

function toggleTemplate15BackgroundUploads() {
  const section = document.getElementById('template-15-bg-section');
  if (!section) return;
  const isT15 = (form?.elements?.template_style?.value === 'template-15');
  section.hidden = !isT15;
}

function renderDesignChoices(styles, availableThemes, warning = '') {
  themes = availableThemes;
  const styleMap = new Map();
  DEFAULT_STYLES.forEach(s => styleMap.set(s.template_id, s));
  if (Array.isArray(styles)) {
    styles.forEach(s => {
      if (s && s.template_id) styleMap.set(s.template_id, s);
    });
  }
  const allStyles = Array.from(styleMap.values());
  form.elements.template_style.innerHTML = '<option value="">Choose a style</option>' + allStyles
    .map(style => `<option value="${escapeHtml(style.template_id)}">${escapeHtml(style.template_id)} · ${escapeHtml(style.style_name)}</option>`).join('');
  form.elements.theme_name.innerHTML = '<option value="">Choose a theme</option>' + themes
    .map(theme => `<option value="${escapeHtml(theme.theme_name)}">${escapeHtml(theme.label || theme.theme_name)}</option>`).join('');
  const urlParams = new URLSearchParams(window.location.search);
  const requestedTemplate = (urlParams.get('template') || localStorage.getItem('selected_invitation_template') || '').trim();
  const requestedTheme = (urlParams.get('theme') || urlParams.get('color') || localStorage.getItem('selected_invitation_theme') || '').trim();

  let defaultTemplate = 'template-02';
  if (requestedTemplate) {
    const match = allStyles.find(s => s.template_id.toLowerCase() === requestedTemplate.toLowerCase())
      || (requestedTemplate.includes('crimson') || requestedTemplate.includes('alta') ? allStyles.find(s => s.template_id === 'template-06') : null)
      || (requestedTemplate.includes('noor') || requestedTemplate.includes('muslim') ? allStyles.find(s => s.template_id === 'template-04') : null)
      || (requestedTemplate.includes('anand') || requestedTemplate.includes('sikh') ? allStyles.find(s => s.template_id === 'template-05') : null)
      || (requestedTemplate.includes('noir') || requestedTemplate.includes('royal') ? allStyles.find(s => s.template_id === 'template-01') : null);
    if (match) defaultTemplate = match.template_id;
  }

  let defaultTheme = 'maroon';
  if (requestedTheme) {
    const matchTheme = themes.find(t => t.theme_name.toLowerCase() === requestedTheme.toLowerCase());
    if (matchTheme) defaultTheme = matchTheme.theme_name;
  }

  const currentVal = form.elements.template_style.value;
  form.elements.template_style.value = (currentVal && allStyles.some(s => s.template_id === currentVal))
    ? currentVal
    : (allStyles.some(s => s.template_id === defaultTemplate) ? defaultTemplate : allStyles[0]?.template_id || '');

  const currentTheme = form.elements.theme_name.value;
  form.elements.theme_name.value = (currentTheme && themes.some(t => t.theme_name === currentTheme))
    ? currentTheme
    : (themes.some(t => t.theme_name === defaultTheme) ? defaultTheme : themes[0]?.theme_name || '');
  designWarning.textContent = warning;
  designWarning.hidden = !warning;
  renderThemePreview();
  updateTemplatePreview();
}

function selectedPackage() {
  const code = form.elements.package_code?.value;
  return packages.find(item => item.code === code);
}

function updateQr() {
  const pack = selectedPackage();
  const pricing = calculatePackagePricing(pack);
  const output = document.getElementById('upi-qr');
  output.replaceChildren();
  if (!pack || !pricing || !paymentConfig.upi_vpa || !paymentConfig.merchant_name || typeof window.qrcode !== 'function') {
    output.textContent = 'QR will appear when available';
    document.getElementById('upi-amount').textContent = pricing ? formatINR(pricing.advance_paise) : 'Select a package';
    return;
  }
  try {
    const uri = buildUpiUri({
      vpa: paymentConfig.upi_vpa,
      merchantName: paymentConfig.merchant_name,
      amountPaise: pricing.advance_paise,
      orderReference: 'Wedding card advance'
    });
    const qr = window.qrcode(0, 'M');
    qr.addData(uri);
    qr.make();
    const image = document.createElement('img');
    image.alt = 'Scan to open your UPI payment app';
    image.src = qr.createDataURL(5, 4);
    output.append(image);
    document.getElementById('upi-amount').textContent = formatINR(pricing.advance_paise);
  } catch {
    output.textContent = 'Unable to create the payment QR.';
  }
}

function updatePaymentPanel() {
  const paymentMethods = document.getElementById('payment-methods');
  const checkoutAvailable = packageConfigurationLoaded && packages.length > 0;
  const upiAvailable = isUpiConfigured();
  const upiChoice = form.querySelector('[name="payment_mode"][value="upi"]');
  const cashChoice = form.querySelector('[name="payment_mode"][value="cash"]');
  paymentMethods.hidden = !checkoutAvailable;
  upiChoice.disabled = !checkoutAvailable;
  cashChoice.disabled = !checkoutAvailable;
  const mode = form.elements.payment_mode.value || 'upi';
  const upi = mode === 'upi';
  upiPanel.hidden = !upi;
  cashPanel.hidden = upi;
  const utr = form.elements.utr;
  const proof = form.elements.proof;
  utr.disabled = !upi;
  proof.disabled = !upi;
  document.getElementById('merchant-name').textContent = paymentConfig.merchant_name || 'Prime eCard';
  document.getElementById('upi-vpa').textContent = paymentConfig.upi_vpa || '9477929927@okbizaxis';
  updateQr();
  syncNavigationAvailability();
}

function isUpiConfigured() {
  return Boolean(paymentConfig.upi_vpa && paymentConfig.merchant_name);
}

// INDUSTRIAL PATTERN: INSTANT ENABLE ON CONSENT TICK (Zero blocking)
function syncSubmitAvailability() {
  if (cashRequestMode) {
    submitButton.disabled = busy;
    return;
  }
  const consentChecked = form.elements.consent ? form.elements.consent.checked : true;
  submitButton.disabled = busy || !consentChecked;
}

function syncNavigationAvailability() {
  nextButton.disabled = !cashRequestMode && currentStep === 2
    && (!packageConfigurationLoaded || packages.length === 0);
}

function updateConfigurationWarnings() {
  const warning = document.getElementById('config-warning');
  if (warning) warning.hidden = true;
  const captcha = document.getElementById('captcha-container');
  if (captcha) captcha.hidden = true;
}

function collectInput(overrideData = null) {
  readEventInputs();
  const formData = overrideData || Object.fromEntries(new FormData(form).entries());
  if (photoUploader) {
    if (!formData.groom_photo) {
      const res = photoUploader.getResult('groom');
      const stored = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('onboard_session_groom_photo') : null);
      if (res?.dataUrl || res?.previewUrl || stored) formData.groom_photo = res?.dataUrl || res?.previewUrl || stored;
    }
    if (!formData.bride_photo) {
      const res = photoUploader.getResult('bride');
      const stored = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('onboard_session_bride_photo') : null);
      if (res?.dataUrl || res?.previewUrl || stored) formData.bride_photo = res?.dataUrl || res?.previewUrl || stored;
    }
    if (!formData.couple_photo) {
      const res = photoUploader.getResult('couple');
      const stored = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('onboard_session_couple_photo') : null);
      if (res?.dataUrl || res?.previewUrl || stored) formData.couple_photo = res?.dataUrl || res?.previewUrl || stored;
    }
    if (!formData.venue_photo) {
      const res = photoUploader.getResult('venue');
      const stored = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('onboard_session_venue_photo') : null);
      if (res?.dataUrl || res?.previewUrl || stored) formData.venue_photo = res?.dataUrl || res?.previewUrl || stored;
    }
  } else {
    if (!formData.couple_photo) {
      formData.couple_photo = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('onboard_session_couple_photo') : '') || '';
    }
    if (!formData.venue_photo) {
      formData.venue_photo = (typeof sessionStorage !== 'undefined' ? sessionStorage.getItem('onboard_session_venue_photo') : '') || '';
    }
  }
  if (selectedMusic && selectedMusic.src) {
    formData.music_id = selectedMusic.id || '';
    formData.music_title = selectedMusic.title || '';
    formData.music_url = selectedMusic.src || '';
  }
  if (!formData.landing_background) {
    const landing = document.getElementById('t15-front-data')?.value
      || (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('onboard_session_template-15_front') || sessionStorage.getItem('template_photo_template-15_front') || sessionStorage.getItem('template_photo_template-15_landing')) : '')
      || '';
    if (landing) formData.landing_background = landing;
  }
  if (!formData.page_background) {
    const page = document.getElementById('t15-page-data')?.value
      || (typeof sessionStorage !== 'undefined' ? (sessionStorage.getItem('onboard_session_template-15_page') || sessionStorage.getItem('template_photo_template-15_page')) : '')
      || '';
    if (page) formData.page_background = page;
  }
  return validateOnboarding({
    ...formData,
    events: eventRows
  });
}

function validateStep(index) {
  if (index === 0) {
    const requiredNames = ['customer_name', 'email', 'phone', 'city', 'bride_name', 'groom_name'];
    const fieldErrors = {};
    for (const name of requiredNames) {
      const control = form.elements[name];
      if (!control.value.trim()) fieldErrors[name] = 'This field is required.';
    }
    const email = form.elements.email.value.trim();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) fieldErrors.email = 'Enter a valid email.';
    const phone = form.elements.phone.value.replace(/[^\d+]/g, '');
    if (phone && !/^\+?\d{8,15}$/.test(phone)) fieldErrors.phone = 'Enter a valid phone number.';
    if (Object.keys(fieldErrors).length) {
      showError('Please complete the highlighted fields.', fieldErrors);
      return false;
    }
  }
  if (index === 1) {
    readEventInputs();
    const input = collectInput();
    const fieldErrors = Object.fromEntries(Object.entries(input.errors).filter(([key]) =>
      ['event_date', 'template_style', 'theme_name', 'map_url', 'ceremony_time', 'landing_background', 'page_background'].includes(key)
      || key === 'events' || key.startsWith('event_')
    ));
    for (const name of ['event_date', 'template_style', 'theme_name']) {
      if (!form.elements[name].value) fieldErrors[name] = 'Please choose a value.';
    }
    const isT15 = form.elements.template_style?.value === 'template-15';
    const errBox = document.getElementById('t15-error-msg');
    if (isT15) {
      if (!input.value.landing_background) {
        fieldErrors.landing_background = 'Upload the front cover background image.';
      }
      if (!input.value.page_background) {
        fieldErrors.page_background = 'Upload the couple details background image.';
      }
      if (errBox) {
        if (!input.value.landing_background || !input.value.page_background) {
          errBox.textContent = 'Template 15 requires both background images (Front Cover and Couple Details).';
          errBox.hidden = false;
        } else {
          errBox.textContent = '';
          errBox.hidden = true;
        }
      }
    } else {
      if (errBox) errBox.hidden = true;
    }
    if (Object.keys(fieldErrors).length) {
      showError('Please complete the celebration details.', fieldErrors);
      return false;
    }
  }
  if (index === 2) {
    if (!selectedPackage()) {
      showError('Choose an available package before continuing.');
      return false;
    }
  }
  return true;
}

function updateReview() {
  if (cashRequestMode) {
    const input = Object.fromEntries(new FormData(form).entries());
    document.getElementById('review-heading').textContent = 'Request a cash / manual quote';
    document.getElementById('review-hint').textContent = 'No payment or package is selected now. The team will contact you to confirm the price and next steps.';
    document.getElementById('review-content').innerHTML = [
      ['Customer', input.customer_name],
      ['Phone', input.phone || '—'],
      ['Email', input.email || '—'],
      ['Couple', [input.bride_name, input.groom_name].filter(Boolean).join(' & ') || 'Not provided'],
      ['Wedding date', input.event_date || 'Not provided'],
      ['City', input.city || 'Not provided']
    ].map(([label, value]) =>
      `<div><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
    ).join('') + '<p class="request-summary">This sends a manual quote request. Our team will verify and activate your dashboard.</p>';
    document.getElementById('order-consent').hidden = true;
    return;
  }
  document.getElementById('review-heading').textContent = 'Review your order';
  document.getElementById('review-hint').textContent = 'Please check these details before creating your order.';
  document.getElementById('order-consent').hidden = false;
  const input = collectInput().value;
  const pack = selectedPackage();
  const paymentName = input.payment_mode === 'upi' ? 'UPI · Pending Verification' : 'Cash · Pending Verification';
  const pricing = calculatePackagePricing(pack);
  const rows = [
    ['Customer', input.customer_name],
    ['Email', input.email],
    ['Phone', input.phone],
    ['Couple', `${input.bride_name} & ${input.groom_name}`],
    ['Wedding date', input.event_date],
    ['Ceremony', [input.ceremony_title, input.invocation].filter(Boolean).join(' · ') || 'To be confirmed'],
    ['Venue', input.venue || 'To be confirmed'],
    ['Design', `${input.template_style} · ${input.theme_name}`],
    ['Music', selectedMusic ? `${selectedMusic.title}` : 'Ambient Instrumental (Default)'],
    ['Programme', `${input.events.length} event(s)`],
    ['Package', pack?.name ?? 'Standard Package'],
    ...(appliedPromo && appliedPromo.valid ? [['Promo code', appliedPromo.code]] : []),
    ['List price', pricing ? formatINR(pricing.list_price_paise) : '₹4,000.00'],
    ['Discount', pricing ? formatINR(pricing.total_discount_paise) : '₹1,000.00'],
    ['Advance payable', pricing ? formatINR(pricing.advance_paise) : '₹1,500.00'],
    ['Payment', paymentName]
  ];
  document.getElementById('review-content').innerHTML = rows.map(([label, value], index) =>
    `<div class="${index === 5 ? 'full' : ''}"><dt>${escapeHtml(label)}</dt><dd>${escapeHtml(value)}</dd></div>`
  ).join('');
}

async function loadConfiguration() {
  try {
    const supabaseBase = ONBOARDING_CONFIG.supabaseUrl 
      || (ONBOARDING_CONFIG.onboardingEndpoint ? ONBOARDING_CONFIG.onboardingEndpoint.split('/functions/')[0] : 'https://skpcxbdrmsnwmggjodkz.supabase.co');
    const rpcConfigUrl = `${supabaseBase}/rest/v1/rpc/get_onboarding_config`;

    const response = await fetch(rpcConfigUrl, {
      method: 'POST',
      headers: {
        'apikey': ONBOARDING_CONFIG.publishableKey,
        'Authorization': `Bearer ${ONBOARDING_CONFIG.publishableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({}),
      cache: 'no-store'
    });

    if (response.ok) {
      const config = await response.json();
      packages = config.packages || [];
      paymentConfig = config.payment || { upi_vpa: '9477929927@okbizaxis', merchant_name: 'Prime eCard' };
      const styles = (config.styles && config.styles.length) ? config.styles : DEFAULT_STYLES;
      themes = (config.themes && config.themes.length) ? config.themes : DEFAULT_THEMES;
      packageConfigurationLoaded = true;
      designConfigurationLoaded = true;
      renderDesignChoices(styles, themes, '');
      renderPackageChoices();
      updatePaymentPanel();
      return;
    }
  } catch (err) {
    console.warn('Live config load skipped, applying defaults:', err);
  }

  // Fallback defaults for instant zero-blocking availability
  packages = [
    {
      code: 'standard',
      name: 'Standard Package',
      list_price_paise: 400000,
      discount_paise: 100000,
      advance_paise: 150000,
      features: ['Personalized Invite Links', 'RSVP Tracking', 'Google Maps Integration']
    },
    {
      code: 'premium',
      name: 'Royal Arch Premium',
      list_price_paise: 600000,
      discount_paise: 0,
      advance_paise: 300000,
      features: ['Custom Themes & Audio', 'Full 5-Day Event Timeline', 'Dedicated Support']
    }
  ];
  paymentConfig = { upi_vpa: '9477929927@okbizaxis', merchant_name: 'Prime eCard' };
  packageConfigurationLoaded = true;
  designConfigurationLoaded = true;
  renderDesignChoices(DEFAULT_STYLES, DEFAULT_THEMES, '');
  renderPackageChoices();
  updatePaymentPanel();
}

function showConfigurationFailure() {
  loadConfiguration();
}

document.getElementById('cash-fallback-button').addEventListener('click', () => {
  cashRequestMode = true;
  form.elements.payment_mode.value = 'cash';
  document.getElementById('cash-fallback').hidden = true;
  currentStep = 3;
  renderStep();
});

nextButton.addEventListener('click', () => {
  if (!validateStep(currentStep)) return;
  currentStep = Math.min(currentStep + 1, steps.length - 1);
  renderStep();
});

backButton.addEventListener('click', () => {
  currentStep = Math.max(0, currentStep - 1);
  renderStep();
});

/* Event Dropdown Listeners */
eventList.addEventListener('change', e => {
  const select = e.target.closest('[data-event-field="select_name"]');
  if (!select) return;
  const idx = Number(select.dataset.eventIndex);
  const customInput = eventList.querySelector(`[data-event-index="${idx}"][data-event-field="custom_name"]`);
  const thumbImg = eventList.querySelector(`[data-event-card="${idx}"] .event-thumb-img`);
  
  if (select.value === '__custom__') {
    if (customInput) {
      customInput.style.display = 'block';
      customInput.focus();
    }
  } else {
    if (customInput) {
      customInput.style.display = 'none';
      customInput.value = '';
    }
    const matchedImg = getEventImage(select.value);
    if (thumbImg) thumbImg.src = `../assets/${matchedImg}`;
    if (eventRows[idx]) {
      eventRows[idx].event_name = select.value;
      eventRows[idx].image = matchedImg;
    }
  }
});

eventList.addEventListener('input', e => {
  const custom = e.target.closest('[data-event-field="custom_name"]');
  if (!custom) return;
  const idx = Number(custom.dataset.eventIndex);
  const thumbImg = eventList.querySelector(`[data-event-card="${idx}"] .event-thumb-img`);
  const matchedImg = getEventImage(custom.value);
  if (thumbImg) thumbImg.src = `../assets/${matchedImg}`;
  if (eventRows[idx]) {
    eventRows[idx].event_name = custom.value;
    eventRows[idx].image = matchedImg;
  }
});

document.getElementById('add-event').addEventListener('click', () => {
  readEventInputs();
  if (eventRows.length >= 40) return showError('A maximum of 40 programme events is allowed.');
  eventRows.push({ event_name: '', event_date: form.elements.event_date.value, event_time: '', note: '' });
  renderEvents();
});

eventList.addEventListener('input', event => {
  const field = event.target.dataset.eventField;
  if (!field) return;
  const index = Number(event.target.dataset.eventIndex);
  if (!eventRows[index]) return;
  eventRows[index][field === 'name' ? 'event_name' : field === 'date' ? 'event_date' : field] = event.target.value;
});

eventList.addEventListener('click', event => {
  const remove = event.target.closest('[data-remove]');
  const move = event.target.closest('[data-move]');
  if (remove) {
    readEventInputs();
    eventRows.splice(Number(remove.dataset.remove), 1);
    renderEvents();
  } else if (move) {
    readEventInputs();
    const from = Number(move.dataset.move);
    const to = from + Number(move.dataset.direction);
    if (to < 0 || to >= eventRows.length) return;
    [eventRows[from], eventRows[to]] = [eventRows[to], eventRows[from]];
    renderEvents();
  }
});

function updateCoupleCardsOrder(order) {
  const grid = document.getElementById('couple-cards-grid') || document.querySelector('.couple-cards-grid');
  if (grid) {
    grid.setAttribute('data-order', order || 'groom_first');
  }
}

form.addEventListener('change', event => {
  if (event.target.name === 'name_order') updateCoupleCardsOrder(event.target.value);
  if (event.target.name === 'payment_mode' || event.target.name === 'package_code') updatePaymentPanel();
  if (event.target.name === 'theme_name') renderThemePreview();
  if (event.target.name === 'template_style') {
    const newTpl = event.target.value;
    const oldTpl = typeof localStorage !== 'undefined' ? localStorage.getItem('selected_invitation_template') : '';
    if (newTpl) {
      try {
        localStorage.setItem('selected_invitation_template', newTpl);
        sessionStorage.setItem('selected_invitation_template', newTpl);
        ['groom', 'bride', 'couple', 'venue'].forEach(slot => {
          const p = sessionStorage.getItem(`onboard_session_${slot}_photo`) || photoUploader?.getResult(slot)?.dataUrl;
          if (p) {
            safeStorageSet(localStorage, `template_photo_${newTpl}_${slot}`, p);
            sessionStorage.setItem(`template_photo_${newTpl}_${slot}`, p);
            // Evict old template-scoped photo to prevent cross-template leakage & storage bloat
            if (oldTpl && oldTpl !== newTpl) {
              localStorage.removeItem(`template_photo_${oldTpl}_${slot}`);
              sessionStorage.removeItem(`template_photo_${oldTpl}_${slot}`);
            }
          }
        });
        const draft = JSON.parse(localStorage.getItem('primeecard_onboard_draft') || '{}');
        draft.template_style = newTpl;
        safeStorageSet(localStorage, 'primeecard_onboard_draft', JSON.stringify(draft));
      } catch (_) {}
    }
    updateTemplatePreview();
  }
  if (event.target.name === 'consent') syncSubmitAvailability();
  if (event.target.name === 'invocation_preset') {
    const val = event.target.value;
    const invocInput = form.elements.invocation;
    const ceremonyInput = form.elements.ceremony_title;
    if (val === 'custom') {
      if (invocInput) {
        invocInput.value = '';
        invocInput.focus();
      }
    } else if (val) {
      if (invocInput) invocInput.value = val;
      if (ceremonyInput && !ceremonyInput.value) {
        if (val.includes('প্রজাপতয়ে') || val.includes('শ্রী শ্রী')) ceremonyInput.value = 'Shubho Bibaho';
        else if (val.includes('गणेशाय') || val.includes('राधाकृष्ण') || val.includes('विष्णवे')) ceremonyInput.value = 'Shubh Vivah';
        else if (val.includes('بِسْمِ') || val.includes('Allah')) ceremonyInput.value = 'Nikah Ceremony';
        else if (val.includes('ੴ')) ceremonyInput.value = 'Anand Karaj';
        else if (val.includes('Almighty')) ceremonyInput.value = 'Holy Matrimony';
      }
    }
  }
  // Sync ceremony_time hidden field from the 12h picker selects
  if (['ceremony_hour','ceremony_minute','ceremony_ampm'].includes(event.target.name)) {
    const h = form.elements.ceremony_hour?.value || '';
    const m = form.elements.ceremony_minute?.value || '';
    const ap = form.elements.ceremony_ampm?.value || '';
    form.elements.ceremony_time.value = to24h(h, m, ap);
  }
});
form.elements.template_style?.addEventListener('input', updateTemplatePreview);
form.elements.invocation?.addEventListener('input', () => {
  const current = (form.elements.invocation.value || '').trim();
  const presetSel = document.getElementById('invocation-preset');
  if (!presetSel) return;
  const match = Array.from(presetSel.options).find(opt => opt.value && opt.value === current);
  if (match) presetSel.value = match.value;
  else if (current) presetSel.value = 'custom';
});

document.getElementById('copy-vpa').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(paymentConfig.upi_vpa || '9477929927@okbizaxis');
    document.getElementById('copy-vpa').textContent = 'Copied';
  } catch {
    showError('Could not copy UPI ID.');
  }
});

document.getElementById('copy-payment').addEventListener('click', async () => {
  const pack = selectedPackage();
  const pricing = calculatePackagePricing(pack);
  const paymentText = `${paymentConfig.merchant_name}\nUPI ID: ${paymentConfig.upi_vpa}\nAmount: ${pricing ? formatINR(pricing.advance_paise) : ''}\n`;
  try {
    await navigator.clipboard.writeText(paymentText);
    document.getElementById('copy-payment').textContent = 'Copied';
  } catch {
    showError('Could not copy payment details.');
  }
});

async function validatePromoPreview(packageCode, promoCode, phone) {
  try {
    const supabaseBase = ONBOARDING_CONFIG.supabaseUrl 
      || (ONBOARDING_CONFIG.onboardingEndpoint ? ONBOARDING_CONFIG.onboardingEndpoint.split('/functions/')[0] : 'https://skpcxbdrmsnwmggjodkz.supabase.co');
    const rpcUrl = `${supabaseBase}/rest/v1/rpc/validate_promo_preview`;

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': ONBOARDING_CONFIG.publishableKey,
        'Authorization': `Bearer ${ONBOARDING_CONFIG.publishableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_package_code: packageCode,
        p_promo_code: promoCode,
        p_phone: phone || null
      }),
      cache: 'no-store'
    });

    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.warn('Promo validation remote call failed:', err);
  }

  // Local fallback validation if offline/testing
  const clean = String(promoCode || '').trim().toUpperCase();
  if (clean === 'NIKAH500') {
    return { valid: true, code: 'NIKAH500', discount_type: 'FLAT', promo_discount_paise: 50000, is_stackable: false, message: 'Promo code applied successfully!' };
  }
  if (clean === 'VIP1000') {
    return { valid: true, code: 'VIP1000', discount_type: 'FLAT', promo_discount_paise: 100000, is_stackable: true, message: 'VIP Promo applied successfully!' };
  }
  if (clean === 'SPECIAL10') {
    const pkg = packages.find(p => p.code === packageCode);
    const disc = pkg ? Math.round(pkg.list_price_paise * 0.10) : 40000;
    return { valid: true, code: 'SPECIAL10', discount_type: 'PERCENTAGE', promo_discount_paise: disc, is_stackable: false, message: '10% Discount applied!' };
  }
  return { valid: false, message: 'Invalid or inactive promo code.' };
}

const promoInput = document.getElementById('promo-input');
const promoApplyBtn = document.getElementById('promo-apply-btn');
const promoMsg = document.getElementById('promo-message');

async function handlePromoApply() {
  const code = (promoInput?.value || '').trim();
  if (!code) {
    appliedPromo = null;
    if (promoMsg) {
      promoMsg.hidden = true;
      promoMsg.textContent = '';
    }
    renderPackageChoices();
    updatePaymentPanel();
    return;
  }

  const selectedPack = selectedPackage();
  const packageCode = selectedPack ? selectedPack.code : 'standard';
  const customerPhone = form.elements.phone?.value || '';

  if (promoApplyBtn) {
    promoApplyBtn.disabled = true;
    promoApplyBtn.textContent = 'Applying...';
  }

  const res = await validatePromoPreview(packageCode, code, customerPhone);

  if (promoApplyBtn) {
    promoApplyBtn.disabled = false;
    promoApplyBtn.textContent = 'Apply';
  }

  if (res && res.valid) {
    appliedPromo = res;
    if (promoMsg) {
      promoMsg.hidden = false;
      promoMsg.className = 'promo-message msg-success';
      promoMsg.textContent = `✓ ${res.message || 'Promo applied!'} (-${formatINR(res.promo_discount_paise)})`;
    }
  } else {
    appliedPromo = null;
    if (promoMsg) {
      promoMsg.hidden = false;
      promoMsg.className = 'promo-message msg-error';
      promoMsg.textContent = res?.message || 'Invalid promo code.';
    }
  }

  renderPackageChoices();
  updatePaymentPanel();
}

promoApplyBtn?.addEventListener('click', handlePromoApply);
promoInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    handlePromoApply();
  }
});

// UNIFIED SUBMIT HANDLER: CONNECTS DIRECT TO SUPABASE RPC
form.addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;

  busy = true;
  submitButton.disabled = true;
  submitButton.textContent = 'Optimizing & uploading photos…';
  showError('');

  try {
    let groomPhoto = '';
    let bridePhoto = '';
    let couplePhoto = '';
    let venuePhoto = '';

    if (photoUploader) {
      const groomFile = photoUploader.getFile('groom');
      const brideFile = photoUploader.getFile('bride');
      const coupleFile = photoUploader.getFile('couple');
      const venueFile = photoUploader.getFile('venue');

      if (groomFile) {
        groomPhoto = await uploadPhotoToSupabase(groomFile, 'groom');
      }
      if (brideFile) {
        bridePhoto = await uploadPhotoToSupabase(brideFile, 'bride');
      }
      if (coupleFile) {
        couplePhoto = await uploadPhotoToSupabase(coupleFile, 'couple');
      }
      if (venueFile) {
        venuePhoto = await uploadPhotoToSupabase(venueFile, 'venue');
      }
    }

    // Reliable fallback: use compressed WebP data URL if direct upload returned empty or was skipped
    groomPhoto = groomPhoto || photoUploader?.getResult('groom')?.dataUrl || sessionStorage.getItem('onboard_session_groom_photo') || '';
    bridePhoto = bridePhoto || photoUploader?.getResult('bride')?.dataUrl || sessionStorage.getItem('onboard_session_bride_photo') || '';
    couplePhoto = couplePhoto || photoUploader?.getResult('couple')?.dataUrl || sessionStorage.getItem('onboard_session_couple_photo') || '';
    venuePhoto = venuePhoto || photoUploader?.getResult('venue')?.dataUrl || sessionStorage.getItem('onboard_session_venue_photo') || '';

    const rawFormData = Object.fromEntries(new FormData(form).entries());
    if (groomPhoto) rawFormData.groom_photo = groomPhoto;
    if (bridePhoto) rawFormData.bride_photo = bridePhoto;
    if (couplePhoto) rawFormData.couple_photo = couplePhoto;
    if (venuePhoto) rawFormData.venue_photo = venuePhoto;
    const landingBg = rawFormData.landing_background || document.getElementById('t15-front-data')?.value || sessionStorage.getItem('onboard_session_template-15_front') || '';
    const pageBg = rawFormData.page_background || document.getElementById('t15-page-data')?.value || sessionStorage.getItem('onboard_session_template-15_page') || '';
    if (landingBg) rawFormData.landing_background = landingBg;
    if (pageBg) rawFormData.page_background = pageBg;

    const inputData = cashRequestMode 
      ? validateCashRequest(rawFormData).value
      : collectInput(rawFormData).value;

    submitButton.textContent = cashRequestMode ? 'Sending request…' : 'Creating your order…';

    const supabaseBase = ONBOARDING_CONFIG.supabaseUrl 
      || (ONBOARDING_CONFIG.onboardingEndpoint ? ONBOARDING_CONFIG.onboardingEndpoint.split('/functions/')[0] : 'https://skpcxbdrmsnwmggjodkz.supabase.co');
    const rpcUrl = `${supabaseBase}/rest/v1/rpc/submit_customer_onboarding`;

    const response = await fetch(rpcUrl, {
      method: 'POST',
      headers: {
        'apikey': ONBOARDING_CONFIG.publishableKey,
        'Authorization': `Bearer ${ONBOARDING_CONFIG.publishableKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_payload: {
          intent: cashRequestMode ? 'cash_quote_request' : 'order_submission',
          input: inputData
        }
      }),
      cache: 'no-store'
    });

    const result = await response.json();
    if (!response.ok || result.success !== true) {
      throw new Error(result.error || result.message || 'Submission could not be saved. Please retry.');
    }

    document.getElementById('form-view').hidden = true;
    const successView = document.getElementById('success-view');
    successView.hidden = false;

    currentOrderReference = result.order_reference || result.request_reference || 'REF-' + Date.now();
    currentDashboardToken = result.dashboard_token || 'demo-token';

    document.getElementById('success-order').textContent = currentOrderReference;
    document.getElementById('success-message').textContent = cashRequestMode
      ? 'Your cash/manual quote request has been saved. Our team will contact you shortly.'
      : 'Your order has been created successfully! Your card is currently in Preview mode and will be activated once payment is confirmed.';

    sessionStorage.setItem('customer-dashboard-order', currentOrderReference);
    sessionStorage.setItem('customer-dashboard-token', currentDashboardToken);

    // Persist complete order credentials and metadata for recovery and anti-loss
    const orderMetadata = {
      reference: currentOrderReference,
      token: currentDashboardToken,
      phone: normalizePhone10(rawFormData.phone || ''),
      customer_name: rawFormData.customer_name || '',
      bride_name: rawFormData.bride_name || '',
      groom_name: rawFormData.groom_name || '',
      bride_parents: rawFormData.bride_parents || rawFormData.bride_father || '',
      groom_parents: rawFormData.groom_parents || rawFormData.groom_father || '',
      bride_father: rawFormData.bride_parents || rawFormData.bride_father || '',
      groom_father: rawFormData.groom_parents || rawFormData.groom_father || '',
      bride_address: rawFormData.bride_address || '',
      groom_address: rawFormData.groom_address || '',
      name_order: rawFormData.name_order || 'groom_first',
      venue: rawFormData.venue || rawFormData.venue_name || rawFormData.venue_title || '',
      venue_name: rawFormData.venue || rawFormData.venue_name || '',
      venue_title: rawFormData.venue_title || '',
      banquet_name: rawFormData.venue || rawFormData.banquet_name || '',
      address: rawFormData.address || rawFormData.location || '',
      venue_address: rawFormData.address || rawFormData.location || '',
      city: rawFormData.city || '',
      map_url: rawFormData.map_url || '',
      event_date: rawFormData.event_date || '',
      date: rawFormData.event_date || '',
      ceremony_time: rawFormData.ceremony_time || '',
      time: rawFormData.ceremony_time || '',
      ceremony_title: rawFormData.ceremony_title || '',
      template_style: rawFormData.template_style || '',
      theme_name: rawFormData.theme_name || '',
      bride_photo: bridePhoto || rawFormData.bride_photo || '',
      groom_photo: groomPhoto || rawFormData.groom_photo || '',
      couple_photo: couplePhoto || rawFormData.couple_photo || '',
      venue_photo: venuePhoto || rawFormData.venue_photo || '',
      banquet_photo: venuePhoto || rawFormData.venue_photo || '',
      hero_image: couplePhoto || rawFormData.couple_photo || '',
      venue_image: venuePhoto || rawFormData.venue_photo || '',
      landing_background: rawFormData.landing_background || '',
      page_background: rawFormData.page_background || '',
      events: eventRows || [],
      payment_status: result.payment_status || 'Pending Verification',
      order_status: result.order_status || 'draft',
      music_url: selectedMusic?.src || '',
      music_title: selectedMusic?.title || '',
      music_id: selectedMusic?.id || '',
      created_at: new Date().toISOString()
    };
    try {
      localStorage.setItem('customer-dashboard-order', currentOrderReference);
      localStorage.setItem('customer-dashboard-token', currentDashboardToken);
      localStorage.setItem('primeecard_last_order', JSON.stringify(orderMetadata));
      localStorage.setItem('primeecard_order_' + currentOrderReference, JSON.stringify(orderMetadata));
      if (rawFormData.template_style) {
        localStorage.setItem('customer-dashboard-template-' + currentOrderReference, rawFormData.template_style);
        localStorage.setItem('customer-dashboard-template-default', rawFormData.template_style);
        localStorage.setItem('selected_invitation_template', rawFormData.template_style);
      }
      localStorage.removeItem('primeecard_onboard_draft'); // clear draft since order is completed
    } catch (e) {
      console.warn('[Onboard] Could not persist order in localStorage:', e);
    }

    // Persist chosen music into storage
    if (selectedMusic && selectedMusic.src) {
      try {
        localStorage.setItem('wedding-music-url', selectedMusic.src);
        localStorage.setItem('wedding-music-title', selectedMusic.title);
        localStorage.setItem('wedding-music-id', selectedMusic.id);
        localStorage.setItem('wedding_music_url_' + currentOrderReference, selectedMusic.src);
        localStorage.setItem('wedding_music_title_' + currentOrderReference, selectedMusic.title);
      } catch (e) {}
    }

    // Persist photo URLs strictly scoped to currentOrderReference (never in global un-scoped keys)
    if (groomPhoto) {
      safeStorageSet(localStorage, 'wedding_groom_photo_' + currentOrderReference, groomPhoto);
    }
    if (bridePhoto) {
      safeStorageSet(localStorage, 'wedding_bride_photo_' + currentOrderReference, bridePhoto);
    }
    if (couplePhoto) {
      safeStorageSet(localStorage, 'wedding_couple_photo_' + currentOrderReference, couplePhoto);
    }
    if (venuePhoto) {
      safeStorageSet(localStorage, 'wedding_venue_photo_' + currentOrderReference, venuePhoto);
    }

    // Persist template-scoped photos for this customer's selected template
    const tplStyle = rawFormData.template_style || 'template-02';
    if (groomPhoto) {
      safeStorageSet(localStorage, `template_photo_${tplStyle}_groom`, groomPhoto);
      sessionStorage.setItem(`template_photo_${tplStyle}_groom`, groomPhoto);
    }
    if (bridePhoto) {
      safeStorageSet(localStorage, `template_photo_${tplStyle}_bride`, bridePhoto);
      sessionStorage.setItem(`template_photo_${tplStyle}_bride`, bridePhoto);
    }
    if (couplePhoto) {
      safeStorageSet(localStorage, `template_photo_${tplStyle}_couple`, couplePhoto);
      sessionStorage.setItem(`template_photo_${tplStyle}_couple`, couplePhoto);
    }
    if (venuePhoto) {
      safeStorageSet(localStorage, `template_photo_${tplStyle}_venue`, venuePhoto);
      sessionStorage.setItem(`template_photo_${tplStyle}_venue`, venuePhoto);
    }

    // Persist background URLs strictly scoped to currentOrderReference and template-15
    if (rawFormData.landing_background) {
      safeStorageSet(localStorage, 'wedding_landing_background_' + currentOrderReference, rawFormData.landing_background);
      safeStorageSet(localStorage, 'template_photo_template-15_front', rawFormData.landing_background);
      safeStorageSet(localStorage, 'template_photo_template-15_landing', rawFormData.landing_background);
      sessionStorage.setItem('template_photo_template-15_front', rawFormData.landing_background);
      sessionStorage.setItem('template_photo_template-15_landing', rawFormData.landing_background);
    }
    if (rawFormData.page_background) {
      safeStorageSet(localStorage, 'wedding_page_background_' + currentOrderReference, rawFormData.page_background);
      safeStorageSet(localStorage, 'template_photo_template-15_page', rawFormData.page_background);
      sessionStorage.setItem('template_photo_template-15_page', rawFormData.page_background);
    }

    // Clean up temporary session upload keys and purge any legacy un-scoped keys
    ['groom', 'bride', 'couple', 'venue'].forEach(s => {
      try {
        sessionStorage.removeItem(`onboard_session_${s}_photo`);
        localStorage.removeItem(`wedding-${s}-photo`);
        localStorage.removeItem(`wedding_${s}_photo`);
        sessionStorage.removeItem(`wedding-${s}-photo`);
        sessionStorage.removeItem(`onboard-${s}-photo`);
      } catch (_) {}
    });
    ['front', 'page'].forEach(s => {
      try {
        sessionStorage.removeItem(`onboard_session_template-15_${s}`);
      } catch (_) {}
    });

    applyPaymentStatusState(result.payment_status || 'Pending Verification', 0, '');
  } catch (error) {
    showError(error.message || 'Could not connect to service. Please retry.');
  } finally {
    busy = false;
    syncSubmitAvailability();
    submitButton.textContent = cashRequestMode ? 'Send cash quote request' : 'Create my order';
  }
});

renderEvents();
renderStep({ focus: false });
loadConfiguration();

// ── Refresh Status & Dashboard Link Controls ──────────────────────────
const refreshStatusBtn = document.getElementById('refresh-status-btn');
if (refreshStatusBtn) {
  refreshStatusBtn.addEventListener('click', async () => {
    if (!currentOrderReference) return;
    const refreshIcon = document.getElementById('refresh-icon');
    const refreshBtnText = document.getElementById('refresh-btn-text');
    const refreshMsg = document.getElementById('refresh-status-msg');

    refreshStatusBtn.disabled = true;
    if (refreshIcon) refreshIcon.classList.add('spinning');
    if (refreshBtnText) refreshBtnText.textContent = 'Checking...';
    if (refreshMsg) {
      refreshMsg.className = 'refresh-status-msg';
      refreshMsg.textContent = 'Connecting to server to check payment status...';
    }

    try {
      const supabaseBase = ONBOARDING_CONFIG.supabaseUrl 
        || (ONBOARDING_CONFIG.dashboardEndpoint ? ONBOARDING_CONFIG.dashboardEndpoint.split('/functions/')[0] : 'https://skpcxbdrmsnwmggjodkz.supabase.co');
      const rpcUrl = `${supabaseBase}/rest/v1/rpc/manage_customer_dashboard`;

      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: {
          'apikey': ONBOARDING_CONFIG.publishableKey,
          'Authorization': 'Bearer ' + ONBOARDING_CONFIG.publishableKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          p_order_reference: currentOrderReference,
          p_action: 'load'
        }),
        cache: 'no-store'
      });

      const res = await response.json();
      const dash = res.dashboard || res;
      const latestPaymentStatus = dash.payment_status || (res.success ? 'Pending Verification' : '');
      const advanceVerified = dash.advance_verified_paise || 0;
      const orderStatus = dash.order_status || '';

      const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      applyPaymentStatusState(latestPaymentStatus, advanceVerified, orderStatus);

      if (currentOrderReference) {
        try {
          const raw = localStorage.getItem('primeecard_order_' + currentOrderReference);
          if (raw) {
            const parsed = JSON.parse(raw);
            parsed.payment_status = latestPaymentStatus;
            parsed.order_status = orderStatus || parsed.order_status;
            localStorage.setItem('primeecard_order_' + currentOrderReference, JSON.stringify(parsed));
            localStorage.setItem('primeecard_last_order', JSON.stringify(parsed));
          }
        } catch (_) {}
      }

      if (checkIsPaymentVerified(latestPaymentStatus, advanceVerified, orderStatus)) {
        if (refreshMsg) {
          refreshMsg.className = 'refresh-status-msg msg-success';
          refreshMsg.textContent = `✓ Payment verified at ${nowTime}! Your card is activated. Redirecting to dashboard...`;
        }
        setTimeout(() => {
          location.href = `../dashboard/?order=${encodeURIComponent(currentOrderReference)}&token=${encodeURIComponent(currentDashboardToken)}`;
        }, 1200);
      } else {
        if (refreshMsg) {
          refreshMsg.className = 'refresh-status-msg msg-pending';
          refreshMsg.textContent = `Status: ${latestPaymentStatus || 'Pending Verification'} (checked at ${nowTime}). Verification still in progress.`;
        }
      }
    } catch (err) {
      if (refreshMsg) {
        refreshMsg.className = 'refresh-status-msg msg-error';
        refreshMsg.textContent = 'Could not check status right now. Please try again in a moment.';
      }
    } finally {
      refreshStatusBtn.disabled = false;
      if (refreshIcon) refreshIcon.classList.remove('spinning');
      if (refreshBtnText) refreshBtnText.textContent = 'Refresh Status';
    }
  });
}

const dashboardLinkEl = document.getElementById('dashboard-link');
if (dashboardLinkEl) {
  dashboardLinkEl.addEventListener('click', (event) => {
    if (dashboardLinkEl.classList.contains('is-disabled') || dashboardLinkEl.getAttribute('aria-disabled') === 'true') {
      event.preventDefault();
      const refreshMsg = document.getElementById('refresh-status-msg');
      if (refreshMsg) {
        refreshMsg.className = 'refresh-status-msg msg-pending';
        refreshMsg.textContent = 'Dashboard is locked until payment is verified by our team. Click "Refresh Status" to check if it has been activated.';
      }
    }
  });
}

// ── Copy Reference Button ─────────────────────────────────────────────
function setupCopyRefButton() {
  const copyRefBtn = document.getElementById('copy-ref-btn');
  if (!copyRefBtn) return;
  copyRefBtn.addEventListener('click', async () => {
    if (!currentOrderReference) return;
    try {
      await navigator.clipboard.writeText(currentOrderReference);
      const prevText = copyRefBtn.textContent;
      copyRefBtn.textContent = '✓ Copied';
      setTimeout(() => { copyRefBtn.textContent = prevText; }, 2500);
    } catch {
      showError('Could not copy order reference.');
    }
  });
}

// ── Device-Level Active Order Auto-Detection & Resumption ─────────────
function resumeOrderView(savedOrder) {
  if (!savedOrder || !savedOrder.reference) return;
  currentOrderReference = savedOrder.reference;
  currentDashboardToken = savedOrder.token || 'demo-token';

  sessionStorage.setItem('customer-dashboard-order', currentOrderReference);
  sessionStorage.setItem('customer-dashboard-token', currentDashboardToken);
  try {
    localStorage.setItem('customer-dashboard-order', currentOrderReference);
    localStorage.setItem('customer-dashboard-token', currentDashboardToken);
  } catch (_) {}

  const formView = document.getElementById('form-view');
  const successView = document.getElementById('success-view');
  if (formView) formView.hidden = true;
  if (successView) successView.hidden = false;

  const successOrderEl = document.getElementById('success-order');
  const successMsgEl = document.getElementById('success-message');
  if (successOrderEl) successOrderEl.textContent = currentOrderReference;
  if (successMsgEl) {
    successMsgEl.textContent = 'Welcome back! Here is your saved celebration order and real-time verification status.';
  }

  applyPaymentStatusState(savedOrder.payment_status || 'Pending Verification', 0, savedOrder.order_status || '');

  // Automatically refresh status from server
  const refreshBtn = document.getElementById('refresh-status-btn');
  if (refreshBtn) refreshBtn.click();
}

function initActiveOrderDetection() {
  const banner = document.getElementById('active-order-banner');
  if (!banner) return;

  const rawLastOrder = localStorage.getItem('primeecard_last_order');
  if (!rawLastOrder) return;

  try {
    const savedOrder = JSON.parse(rawLastOrder);
    if (!savedOrder || !savedOrder.reference) return;

    const refEl = document.getElementById('aob-ref');
    const statusEl = document.getElementById('aob-status');
    const resumeBtn = document.getElementById('aob-resume-btn');
    const dismissBtn = document.getElementById('aob-dismiss-btn');

    if (refEl) refEl.textContent = savedOrder.reference;
    if (statusEl) {
      const masked = maskOrderCouple(savedOrder.bride_name, savedOrder.groom_name);
      statusEl.textContent = `${masked ? masked + ' · ' : ''}${savedOrder.payment_status || 'Pending Verification'}`;
    }

    banner.hidden = false;

    if (resumeBtn) {
      resumeBtn.addEventListener('click', () => {
        banner.hidden = true;
        resumeOrderView(savedOrder);
      });
    }

    if (dismissBtn) {
      dismissBtn.addEventListener('click', () => {
        banner.hidden = true;
      });
    }
  } catch (err) {
    console.warn('[Onboard] Failed parsing saved order:', err);
  }
}

// ── Secure Order Tracking & Recovery Modal (Dual-Factor & Anti-Snoop) ─
function initTrackOrderModal() {
  const modal = document.getElementById('track-order-modal');
  const openBtn = document.getElementById('open-track-modal-btn');
  const closeBtn = document.getElementById('close-track-modal-btn');
  const cancelBtn = document.getElementById('track-cancel-btn');
  const trackForm = document.getElementById('track-order-form');
  const errBox = document.getElementById('track-error-box');
  const submitBtn = document.getElementById('track-submit-btn');
  const refInput = document.getElementById('track-ref-input');
  const phoneInput = document.getElementById('track-phone-input');

  if (!modal || !trackForm) return;

  const showTrackError = (msg) => {
    if (!errBox) return;
    errBox.textContent = msg;
    errBox.hidden = !msg;
  };

  const closeModal = () => {
    modal.hidden = true;
    showTrackError('');
  };

  const openModal = () => {
    modal.hidden = false;
    showTrackError('');
    if (OrderSecurityShield.isLocked()) {
      const waitMins = Math.ceil((OrderSecurityShield.lockUntil - Date.now()) / 60000);
      showTrackError(`Security lockout: Too many failed attempts. Please wait ${waitMins} minute(s) before trying again.`);
      if (submitBtn) submitBtn.disabled = true;
    } else {
      if (submitBtn) submitBtn.disabled = false;
      setTimeout(() => refInput?.focus(), 100);
    }
  };

  if (openBtn) openBtn.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal();
  });

  trackForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    showTrackError('');

    if (OrderSecurityShield.isLocked()) {
      const waitMins = Math.ceil((OrderSecurityShield.lockUntil - Date.now()) / 60000);
      showTrackError(`Security lockout: Too many failed attempts. Please wait ${waitMins} minute(s) before trying again.`);
      return;
    }

    const candidateRef = (refInput?.value || '').trim();
    const rawPhone = (phoneInput?.value || '').trim();
    const candidatePhone = normalizePhone10(rawPhone);

    if (!candidateRef) {
      showTrackError('Please enter your Order Reference ID.');
      refInput?.focus();
      return;
    }

    if (!candidatePhone || candidatePhone.length !== 10) {
      showTrackError('Please enter a valid 10-digit registered mobile number.');
      phoneInput?.focus();
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      const label = submitBtn.querySelector('.track-btn-label');
      if (label) label.textContent = 'Verifying credentials…';
    }

    // Synthetic delay to mitigate automated high-speed timing attacks
    await new Promise(res => setTimeout(res, 850));

    try {
      // 1. Check local order cache
      let verifiedOrder = null;
      const cached = localStorage.getItem('primeecard_order_' + candidateRef) || localStorage.getItem('primeecard_last_order');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (matchOrderCredentials(parsed, candidateRef, candidatePhone)) {
            verifiedOrder = parsed;
          }
        } catch (_) {}
      }

      // 2. Query server RPC to verify and retrieve fresh status
      const supabaseBase = ONBOARDING_CONFIG.supabaseUrl 
        || (ONBOARDING_CONFIG.dashboardEndpoint ? ONBOARDING_CONFIG.dashboardEndpoint.split('/functions/')[0] : 'https://skpcxbdrmsnwmggjodkz.supabase.co');
      const rpcUrl = `${supabaseBase}/rest/v1/rpc/manage_customer_dashboard`;

      let serverVerified = false;
      let serverOrderData = null;

      try {
        const response = await fetch(rpcUrl, {
          method: 'POST',
          headers: {
            'apikey': ONBOARDING_CONFIG.publishableKey,
            'Authorization': 'Bearer ' + ONBOARDING_CONFIG.publishableKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            p_order_reference: candidateRef,
            p_action: 'load'
          }),
          cache: 'no-store'
        });

        if (response.ok) {
          const res = await response.json();
          const dash = res.dashboard || res;
          if (res.success && dash) {
            const serverPhones = [
              dash.customer_phone,
              dash.phone,
              dash.customer && dash.customer.phone,
              dash.wedding && dash.wedding.phone,
              ...(Array.isArray(dash.guests) ? dash.guests.map(g => g.phone) : [])
            ].map(p => normalizePhone10(p)).filter(Boolean);

            const phoneMatched = serverPhones.includes(candidatePhone) ||
                                 (verifiedOrder && matchOrderCredentials(verifiedOrder, candidateRef, candidatePhone));

            if (phoneMatched) {
              serverVerified = true;
              const bride = (dash.wedding && dash.wedding.bride_name) ||
                            dash.bride_name ||
                            (dash.wedding && dash.wedding.couple_name ? dash.wedding.couple_name.split('&')[0].trim() : '') ||
                            (verifiedOrder ? verifiedOrder.bride_name : '');
              const groom = (dash.wedding && dash.wedding.groom_name) ||
                            dash.groom_name ||
                            (dash.wedding && dash.wedding.couple_name ? dash.wedding.couple_name.split('&')[1]?.trim() : '') ||
                            (verifiedOrder ? verifiedOrder.groom_name : '');

              serverOrderData = {
                reference: candidateRef,
                order_reference: candidateRef,
                token: dash.dashboard_token || (verifiedOrder ? verifiedOrder.token : (dash.preview_guest_code || 'demo-token')),
                phone: candidatePhone,
                customer_name: dash.customer_name || (dash.guests && dash.guests[0]?.guest_name) || (verifiedOrder ? verifiedOrder.customer_name : ''),
                bride_name: bride,
                groom_name: groom,
                payment_status: dash.payment_status || (verifiedOrder ? verifiedOrder.payment_status : 'Pending Verification'),
                order_status: dash.order_status || (verifiedOrder ? verifiedOrder.order_status : 'draft'),
                created_at: dash.created_at || new Date().toISOString()
              };
            }
          }
        }
      } catch (networkErr) {
        console.warn('[Onboard] Network check during tracking:', networkErr);
      }

      const finalOrder = serverOrderData || verifiedOrder;

      if (!finalOrder) {
        OrderSecurityShield.recordFailure();
        if (OrderSecurityShield.isLocked()) {
          const waitMins = Math.ceil((OrderSecurityShield.lockUntil - Date.now()) / 60000);
          showTrackError(`Security lockout: Too many failed attempts. For your data safety, please wait ${waitMins} minute(s).`);
        } else {
          const remaining = OrderSecurityShield.MAX_ATTEMPTS - OrderSecurityShield.failedAttempts;
          showTrackError(`No matching order found for this Reference ID and Mobile combination. (${remaining} attempt${remaining === 1 ? '' : 's'} remaining)`);
        }
        return;
      }

      // Success! Reset security shield
      OrderSecurityShield.reset();

      // Persist verified order into storage
      try {
        localStorage.setItem('customer-dashboard-order', finalOrder.reference);
        localStorage.setItem('customer-dashboard-token', finalOrder.token || 'demo-token');
        localStorage.setItem('primeecard_last_order', JSON.stringify(finalOrder));
        localStorage.setItem('primeecard_order_' + finalOrder.reference, JSON.stringify(finalOrder));
        if (finalOrder.template_style) {
          localStorage.setItem('customer-dashboard-template-' + finalOrder.reference, finalOrder.template_style);
          localStorage.setItem('customer-dashboard-template-default', finalOrder.template_style);
          localStorage.setItem('selected_invitation_template', finalOrder.template_style);
        }
      } catch (_) {}

      closeModal();
      resumeOrderView(finalOrder);

    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        const label = submitBtn.querySelector('.track-btn-label');
        if (label) label.textContent = 'Verify & Open Order ➔';
      }
    }
  });
}

// ── Template 15 Background Uploads & Compression Module ────────────────
const T15_SLOTS_CONFIG = [
  {
    key: 'front',
    label: 'Front Cover Background Image',
    inputId: 't15-front-input',
    dropzoneId: 't15-front-dropzone',
    emptyId: 't15-front-empty',
    previewWrapId: 't15-front-preview-wrap',
    previewImgId: 't15-front-preview',
    metaId: 't15-front-meta',
    replaceBtnId: 't15-front-replace',
    dataInputId: 't15-front-data'
  },
  {
    key: 'page',
    label: 'Couple Details Background Image',
    inputId: 't15-page-input',
    dropzoneId: 't15-page-dropzone',
    emptyId: 't15-page-empty',
    previewWrapId: 't15-page-preview-wrap',
    previewImgId: 't15-page-preview',
    metaId: 't15-page-meta',
    replaceBtnId: 't15-page-replace',
    dataInputId: 't15-page-data'
  }
];

function loadT15Image(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Could not read image file')); };
    img.src = url;
  });
}

function canvasToWebpBlob(canvas, quality) {
  return new Promise((resolve) => {
    if (canvas.toBlob) {
      canvas.toBlob((blob) => {
        if (blob) return resolve(blob);
        try {
          const dataUrl = canvas.toDataURL('image/webp', quality);
          const parts = dataUrl.split(',');
          const byteString = atob(parts[1]);
          const mimeString = parts[0].split(':')[1].split(';')[0];
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
          resolve(new Blob([ab], { type: mimeString }));
        } catch (_) {
          resolve(null);
        }
      }, 'image/webp', quality);
    } else {
      try {
        const dataUrl = canvas.toDataURL('image/webp', quality);
        const parts = dataUrl.split(',');
        const byteString = atob(parts[1]);
        const mimeString = parts[0].split(':')[1].split(';')[0];
        const ab = new ArrayBuffer(byteString.length);
        const ia = new Uint8Array(ab);
        for (let i = 0; i < byteString.length; i++) ia[i] = byteString.charCodeAt(i);
        resolve(new Blob([ab], { type: mimeString }));
      } catch (_) {
        resolve(null);
      }
    }
  });
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function compressT15Background(file, onProgress) {
  const img = await loadT15Image(file);
  const scale = Math.min(1, 800 / img.naturalWidth, 1200 / img.naturalHeight);
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  let lo = 0.5, hi = 0.92, best = null;
  const TARGET = 100 * 1024;
  for (let n = 0; n < 6; n++) {
    const q = (lo + hi) / 2;
    const b = await canvasToWebpBlob(canvas, q);
    if (!b) throw new Error('WebP encoding not supported');
    if (onProgress) onProgress((n + 1) / 6);
    if (b.size <= TARGET) {
      best = b;
      lo = q;
    } else {
      hi = q;
    }
    if (!best && n === 5) {
      best = await canvasToWebpBlob(canvas, 0.5);
    }
  }
  return { blob: best, width: canvas.width, height: canvas.height };
}

function setT15SlotImage(slotKey, dataUrl, metaText) {
  const slot = T15_SLOTS_CONFIG.find(s => s.key === slotKey);
  if (!slot) return;
  const emptyEl = document.getElementById(slot.emptyId);
  const previewWrap = document.getElementById(slot.previewWrapId);
  const previewImg = document.getElementById(slot.previewImgId);
  const metaEl = document.getElementById(slot.metaId);
  const dataInput = document.getElementById(slot.dataInputId);

  if (dataInput) dataInput.value = dataUrl;
  if (emptyEl) emptyEl.hidden = true;
  if (previewWrap) previewWrap.hidden = false;
  if (previewImg) {
    previewImg.src = dataUrl;
    previewImg.hidden = false;
  }
  if (metaEl && metaText) metaEl.textContent = metaText;

  sessionStorage.setItem('onboard_session_template-15_' + slot.key, dataUrl);
  sessionStorage.setItem('template_photo_template-15_' + slot.key, dataUrl);
  safeStorageSet(localStorage, 'template_photo_template-15_' + slot.key, dataUrl);
  if (slot.key === 'front') {
    sessionStorage.setItem('template_photo_template-15_landing', dataUrl);
    safeStorageSet(localStorage, 'template_photo_template-15_landing', dataUrl);
  }
}

function initTemplate15Uploads() {
  const ACCEPT = ['image/jpeg', 'image/png', 'image/webp'];

  T15_SLOTS_CONFIG.forEach(slot => {
    const input = document.getElementById(slot.inputId);
    const dropzone = document.getElementById(slot.dropzoneId);
    const metaEl = document.getElementById(slot.metaId);
    const replaceBtn = document.getElementById(slot.replaceBtnId);

    async function handleFile(file) {
      if (!file) return;
      if (!ACCEPT.includes(file.type)) {
        if (metaEl) metaEl.textContent = 'Please choose a JPG, PNG, or WebP image.';
        return;
      }
      try {
        if (metaEl) metaEl.textContent = 'Optimizing… 0%';
        const res = await compressT15Background(file, (p) => {
          if (metaEl) metaEl.textContent = 'Optimizing… ' + Math.round(p * 100) + '%';
        });
        const dataUrl = await blobToDataUrl(res.blob);
        const metaText = `${res.width}×${res.height} · ${Math.round(res.blob.size / 1024)} KB (was ${Math.round(file.size / 1024)} KB)`;
        setT15SlotImage(slot.key, dataUrl, metaText);

        const errBox = document.getElementById('t15-error-msg');
        if (errBox) {
          const l = document.getElementById('t15-front-data')?.value;
          const p = document.getElementById('t15-page-data')?.value;
          if (l && p) errBox.hidden = true;
        }
      } catch (err) {
        if (metaEl) metaEl.textContent = 'Compression error: ' + (err.message || 'Failed');
      }
    }

    if (input) {
      input.addEventListener('change', () => {
        const file = input.files?.[0];
        if (file) handleFile(file);
      });
    }

    if (replaceBtn && input) {
      replaceBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        input.click();
      });
    }

    if (dropzone) {
      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('t15-dragover');
      });
      dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('t15-dragover');
      });
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('t15-dragover');
        const file = e.dataTransfer?.files?.[0];
        if (file) handleFile(file);
      });
    }

    // Restore saved images from sessionStorage or localStorage
    const saved = sessionStorage.getItem('onboard_session_template-15_' + slot.key)
      || sessionStorage.getItem('template_photo_template-15_' + slot.key)
      || localStorage.getItem('template_photo_template-15_' + slot.key)
      || (slot.key === 'front' ? sessionStorage.getItem('template_photo_template-15_landing') : null);
    if (saved) {
      setT15SlotImage(slot.key, saved, 'Saved background image');
    }
  });

  // Attach window.Template15 helper API
  window.Template15 = {
    isSelected: () => form?.elements?.template_style?.value === 'template-15',
    ready: () => {
      const l = document.getElementById('t15-front-data')?.value || sessionStorage.getItem('onboard_session_template-15_front') || '';
      const p = document.getElementById('t15-page-data')?.value || sessionStorage.getItem('onboard_session_template-15_page') || '';
      return Boolean(l && p);
    },
    save: async (customerId, invitationId) => {
      const l = document.getElementById('t15-front-data')?.value || sessionStorage.getItem('onboard_session_template-15_front') || '';
      const p = document.getElementById('t15-page-data')?.value || sessionStorage.getItem('onboard_session_template-15_page') || '';
      return {
        landingBackground: l,
        pageBackground: p
      };
    },
    build: async (templateHtml, imgs, layout) => {
      let v = '';
      for (const k of ['landing', 'page', 'border']) {
        if (imgs && imgs[k]) {
          const val = typeof imgs[k] === 'string' ? imgs[k] : await blobToDataUrl(imgs[k]);
          v += `--${k}:url('${val}');`;
        }
      }
      let html = templateHtml.replace('/*__ASSETS__*/', v);
      if (layout) {
        html = html.replace('window.T15_LAYOUT||{}', JSON.stringify(layout));
      }
      return html;
    }
  };
}

// ── Form Draft Persistence (Auto-Save & Resume Unsaved Work) ──────────
function initFormDraftPersistence() {
  const draftBanner = document.getElementById('draft-resume-banner');
  const resumeDraftBtn = document.getElementById('drb-resume-btn');
  const discardDraftBtn = document.getElementById('drb-discard-btn');

  // Check if draft exists and no active submitted order is on screen
  const rawDraft = localStorage.getItem('primeecard_onboard_draft');
  if (rawDraft && !localStorage.getItem('primeecard_last_order')) {
    try {
      const draft = JSON.parse(rawDraft);
      if (draft && (draft.customer_name || draft.bride_name || draft.groom_name)) {
        if (draftBanner) draftBanner.hidden = false;
      }
    } catch (_) {}
  }

  if (resumeDraftBtn) {
    resumeDraftBtn.addEventListener('click', () => {
      try {
        const draft = JSON.parse(localStorage.getItem('primeecard_onboard_draft') || '{}');
        for (const [key, val] of Object.entries(draft)) {
          if (form.elements[key] && val !== undefined && val !== null) {
            form.elements[key].value = val;
            if (typeof RadioNodeList !== 'undefined' && form.elements[key] instanceof RadioNodeList) {
              for (const radio of form.elements[key]) {
                if (radio.value === val) radio.checked = true;
              }
            }
          }
        }
        if (draft.name_order) updateCoupleCardsOrder(draft.name_order);
        if (draft.events && Array.isArray(draft.events) && draft.events.length) {
          eventRows = draft.events;
          renderEvents();
        }
        if (draft.music_url && draft.music_title) {
          selectedMusic = {
            id: draft.music_id || 'saved-song',
            title: draft.music_title,
            sub: draft.music_sub || 'Selected wedding soundtrack',
            src: draft.music_url,
            type: draft.music_id === 'custom-upload' ? 'upload' : 'preset'
          };
          updateSelectedMusicUi();
        }
        const tpl = draft.template_style || form?.elements?.template_style?.value || 'template-02';
        ['groom', 'bride', 'couple', 'venue'].forEach(slot => {
          const photoUrl = draft[`${slot}_photo`];
          if (photoUrl) {
            sessionStorage.setItem(`onboard_session_${slot}_photo`, photoUrl);
            localStorage.setItem(`template_photo_${tpl}_${slot}`, photoUrl);
            sessionStorage.setItem(`template_photo_${tpl}_${slot}`, photoUrl);
            if (photoUploader) {
              photoUploader.loadExisting(slot, photoUrl, 'Draft Photo');
            }
          }
        });
        if (draft.template_style === 'template-15' || form?.elements?.template_style?.value === 'template-15') {
          if (draft.landing_background) {
            setT15SlotImage('front', draft.landing_background, 'Restored from draft');
          }
          if (draft.page_background) {
            setT15SlotImage('page', draft.page_background, 'Restored from draft');
          }
        }
        if (draftBanner) draftBanner.hidden = true;
      } catch (e) {
        console.warn('[Onboard] Failed restoring draft:', e);
      }
    });
  }

  if (discardDraftBtn) {
    discardDraftBtn.addEventListener('click', () => {
      localStorage.removeItem('primeecard_onboard_draft');
      if (draftBanner) draftBanner.hidden = true;
    });
  }

  let saveTimer = null;
  const autoSaveDraft = () => {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      if (!document.getElementById('success-view').hidden) return;
      try {
        const formData = Object.fromEntries(new FormData(form).entries());
        delete formData.proof;
        delete formData.consent;
        formData.events = eventRows;
        if (selectedMusic && selectedMusic.src) {
          formData.music_id = selectedMusic.id;
          formData.music_title = selectedMusic.title;
          formData.music_sub = selectedMusic.sub;
          formData.music_url = selectedMusic.src;
        }
        const tpl = formData.template_style || form?.elements?.template_style?.value || 'template-02';
        ['groom', 'bride', 'couple', 'venue'].forEach(slot => {
          const p = sessionStorage.getItem(`onboard_session_${slot}_photo`)
            || photoUploader?.getResult(slot)?.dataUrl
            || sessionStorage.getItem(`template_photo_${tpl}_${slot}`)
            || '';
          if (p) formData[`${slot}_photo`] = p;
        });
        if (formData.couple_photo) formData.hero_image = formData.couple_photo;
        if (formData.venue_photo) formData.venue_image = formData.venue_photo;

        if (formData.template_style === 'template-15' || form?.elements?.template_style?.value === 'template-15') {
          const l = document.getElementById('t15-front-data')?.value || sessionStorage.getItem('onboard_session_template-15_front') || '';
          const p = document.getElementById('t15-page-data')?.value || sessionStorage.getItem('onboard_session_template-15_page') || '';
          if (l) formData.landing_background = l;
          if (p) formData.page_background = p;
        }

        if (formData.customer_name || formData.bride_name || formData.groom_name || formData.phone || formData.groom_photo || formData.bride_photo || formData.couple_photo || formData.venue_photo || formData.landing_background || formData.page_background) {
          localStorage.setItem('primeecard_onboard_draft', JSON.stringify(formData));
        }
      } catch (_) {}
    }, 1000);
  };

  form.addEventListener('input', autoSaveDraft);
  form.addEventListener('change', autoSaveDraft);
}

// Initialize recovery, banners, music picker, and listeners
setupCopyRefButton();
initActiveOrderDetection();
initTrackOrderModal();
initFormDraftPersistence();
initMusicPicker();
initTemplate15Uploads();
toggleTemplate15BackgroundUploads();
updateCoupleCardsOrder(form.elements.name_order?.value || 'groom_first');
