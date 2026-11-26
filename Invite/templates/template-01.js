/* ==========================================================================
   Template 01 — Royal Wax-Seal Envelope Invitation Suite
   Inspired by Royal Heritage Wax-Seal Envelope, Fairy Dust Sparkles & Gold Foil
   Full Dynamic Integration matching Prime eCard Royal Architecture
   ========================================================================== */

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ESC_MAP[ch]);
const clean = v => String(v ?? '').trim();

const safeAudioUrl = u => {
  const s = clean(u);
  if (!s || /^(javascript|vbscript):/i.test(s)) return '';
  if (/^(https?:\/\/|\/|\.\/|\.\.\/|data:audio\/|music\/|user-music\/|[a-z0-9_.-]+\.mp3)/i.test(s)) return esc(s);
  return '';
};

const safeImg = u => {
  const s = clean(u);
  if (!s) return '';
  if (/^https?:\/\/[^\s'"<>]+$/i.test(s)) return s;
  if (/^blob:[^\s'"<>]+$/i.test(s)) return s;
  if (/^\.?\/?assets\/[^\s'"<>]+$/i.test(s)) return s;
  if (/^[a-z0-9_-]+\.(jpg|jpeg|png|webp|svg)$/i.test(s)) return `./assets/${s}`;
  if (s.startsWith('data:image/') && s.includes(';base64,')) {
    if (!/[\s'"<>]/.test(s.slice(0, 50))) return s;
  }
  return '';
};

const getStoredPhoto = k => {
  try {
    if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
      const v = localStorage.getItem(k);
      if (v) return v;
    }
    if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.getItem === 'function') {
      const v = sessionStorage.getItem(k);
      if (v) return v;
    }
  } catch { return ''; }
  return '';
};

const MONTHS_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DAYS_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad = n => String(n).padStart(2, '0');

function parseDate(v) {
  const s = clean(v);
  if (!s) return null;
  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) {
    const y = +m[1], mo = +m[2], d = +m[3];
    return makeDate(y, mo, d);
  }
  m = s.match(/^(\d{1,2})[\s/-]+([A-Za-z]{3,9})[\s/-]+(\d{4})/);
  if (m) {
    const d = +m[1], y = +m[3];
    const name = m[2].toLowerCase().slice(0, 3);
    const idx = MONTHS_SHORT.map(x => x.toLowerCase()).indexOf(name);
    if (idx >= 0) return makeDate(y, idx + 1, d);
  }
  m = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})/);
  if (m) {
    const d = +m[1], mo = +m[2], y = +m[3];
    return makeDate(y, mo, d);
  }
  return null;
}

function makeDate(y, mo, d) {
  if (!y || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const t = new Date(Date.UTC(y, mo - 1, d));
  if (t.getUTCFullYear() !== y || t.getUTCMonth() !== mo - 1 || t.getUTCDate() !== d) return null;
  return {
    y, mo, d,
    dayName: DAYS_LONG[t.getUTCDay()],
    dayShort: DAYS_SHORT[t.getUTCDay()],
    monthName: MONTHS_LONG[mo - 1],
    monthShort: MONTHS_SHORT[mo - 1]
  };
}

function formatDateLong(v) {
  const p = parseDate(v);
  if (!p) return 'Date to be announced';
  return `${pad(p.d)} ${p.monthName} ${p.y}`;
}

function formatEventDate(v) {
  const p = parseDate(v);
  if (!p) return clean(v) || '';
  return `${pad(p.d)} ${p.monthShort} ${p.y} (${p.dayShort})`;
}

function formatTime(v) {
  const raw = clean(v);
  if (!raw) return '';
  const m = raw.match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
  if (m) {
    let hh = Number(m[1]), mm = m[2];
    const ap = hh >= 12 ? 'PM' : 'AM';
    hh = hh % 12 || 12;
    return `${hh}:${mm} ${ap}`;
  }
  return raw;
}

function parseWhen(dv, tv, offset = '+05:30') {
  const d = parseDate(dv);
  if (!d) return null;
  const rt = clean(tv);
  const t = rt.match(/^(\d{1,2})(?::([0-5]\d))?(?::[0-5]\d)?\s*([AaPp][Mm])?$/);
  if (rt && !t) return null;
  let h = t ? +t[1] : 0;
  const mi = t ? +(t[2] || 0) : 0;
  const mer = t && t[3] ? t[3].toUpperCase() : '';
  if (mer === 'PM' && h !== 12) h += 12;
  if (mer === 'AM' && h === 12) h = 0;
  if (h > 23) return null;
  const ts = Date.parse(`${d.y}-${pad(d.mo)}-${pad(d.d)}T${pad(h)}:${pad(mi)}:00${offset}`);
  return Number.isNaN(ts) ? null : ts;
}

function buildGCalUrl({ title, start, end, details, location }) {
  const baseUrl = 'https://calendar.google.com/calendar/render?action=TEMPLATE';
  const fmt = d => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const s = start instanceof Date && !isNaN(start) ? fmt(start) : '';
  const e = end instanceof Date && !isNaN(end) ? fmt(end) : s;
  const dates = s && e ? `&dates=${s}/${e}` : '';
  return `${baseUrl}&text=${encodeURIComponent(title || 'Wedding Celebration')}${dates}&details=${encodeURIComponent(details || '')}&location=${encodeURIComponent(location || '')}`;
}

const CEREMONY_IMAGES = [
  { re: /gaye\s*holud|holud|haldi/i, img: './assets/template-06-gaye-holud.webp' },
  { re: /mehndi|mehendi/i, img: './assets/template-06-sangeet.webp' },
  { re: /sangeet|musical|dance/i, img: './assets/template-06-sangeet.webp' },
  { re: /reception|dinner|banquet/i, img: './assets/template-06-reception.webp' },
  { re: /bou\s*bhat|boubhat|walima/i, img: './assets/template-06-boubhat.webp' },
  { re: /biye|bibaho|shubho|nikah|vivah|wedding|ceremony|phere|phera/i, img: './assets/template-06-shubho-bibaho.webp' }
];

function getEventPhoto(ev, idx = 0) {
  const custom = safeImg(ev.photo || ev.photo_url || ev.event_photo || ev.image || ev.image_url);
  if (custom) return custom;
  const name = String(ev.event_name || ev.name || ev.title || '');
  for (const item of CEREMONY_IMAGES) {
    if (item.re.test(name)) return item.img;
  }
  const fallbacks = [
    './assets/template-06-shubho-bibaho.webp',
    './assets/template-06-sangeet.webp',
    './assets/template-06-reception.webp',
    './assets/template-06-gaye-holud.webp'
  ];
  return fallbacks[idx % fallbacks.length];
}

export default function renderT01({ guest, wedding, events = [] } = {}) {
  const w = wedding || {};
  const orderRef = clean(w.order_reference) || clean(w.ref) || '';
  const isT01Match = !w.template_id || w.template_id === 'template-01' || w.template_id === '01';

  const storedBride = (isT01Match && orderRef) ? getStoredPhoto(`wedding_bride_photo_${orderRef}`) : '';
  const storedGroom = (isT01Match && orderRef) ? getStoredPhoto(`wedding_groom_photo_${orderRef}`) : '';
  const storedVenue = (isT01Match && orderRef) ? getStoredPhoto(`wedding_venue_photo_${orderRef}`) : '';

  // Bride & Groom Names
  const brideName = clean(w.bride_name) || 'Bride';
  const groomName = clean(w.groom_name) || 'Groom';
  const brideInit = brideName.charAt(0).toUpperCase() || 'B';
  const groomInit = groomName.charAt(0).toUpperCase() || 'G';
  const brideFirst = clean(w.name_order) !== 'groom_first';

  // Photos
  const customBridePhoto = safeImg(w.bride_photo || w.image2 || storedBride);
  const customGroomPhoto = safeImg(w.groom_photo || w.image1 || storedGroom);
  const customVenuePhoto = safeImg(w.venue_photo || w.image4 || storedVenue);

  const bridePhoto = customBridePhoto || './assets/template-06-bride.webp';
  const groomPhoto = customGroomPhoto || './assets/template-06-groom.webp';
  const venuePhoto = customVenuePhoto || '';

  // Parents & Family Details
  const brideParents = clean(w.bride_parents || w.bride_father || '');
  const groomParents = clean(w.groom_parents || w.groom_father || '');
  const brideAddress = clean(w.bride_address || '');
  const groomAddress = clean(w.groom_address || '');

  // Venue & Location Resolution
  const hallName = clean(w.venue_title) || clean(w.banquet_name) || clean(w.hall) || clean(w.venue_name);
  const cityName = clean(w.city) || clean(w.address) || clean(w.venue_address) || clean(w.location);
  const rawVenue = clean(w.venue);
  
  let primaryVenueTitle = hallName || rawVenue || (clean(w.date) ? 'Grand Celebration Venue' : 'Venue To Follow');
  let secondaryAddress = cityName;
  if (hallName && rawVenue && rawVenue.toLowerCase() !== hallName.toLowerCase()) {
    secondaryAddress = secondaryAddress ? `${rawVenue}, ${secondaryAddress}` : rawVenue;
  }
  secondaryAddress = secondaryAddress.replace(/^,\s*|,\s*$/g, '').trim();

  const mapUrl = clean(w.map_url) || (primaryVenueTitle ? `https://maps.google.com/?q=${encodeURIComponent(primaryVenueTitle + ' ' + secondaryAddress)}` : '');
  const venueComment = clean(w.comment) || clean(w.venue_comment) || clean(w.note) || '';

  // Date & Auspicious Timing
  const rawDate = clean(w.date);
  const rawTime = clean(w.time);
  const dateObj = parseDate(rawDate);
  const dateLong = dateObj ? formatDateLong(rawDate) : 'Date to be announced';
  const timeFormatted = formatTime(rawTime);
  const timeStr = timeFormatted ? `${timeFormatted} Onwards` : (rawDate ? 'Auspicious Muhurat' : 'Time To Follow');

  // Countdown Timestamp & Target
  const countdownTimestamp = parseWhen(rawDate, rawTime, clean(w.timezone_offset) || '+05:30');
  let countdownTarget = '';
  if (dateObj) {
    let hh = 19, mm = 0;
    if (rawTime) {
      const tm = rawTime.match(/^([01]?\d|2[0-3]):([0-5]\d)/);
      if (tm) { hh = +tm[1]; mm = +tm[2]; }
    }
    const dt = new Date(dateObj.y, dateObj.mo - 1, dateObj.d, hh, mm, 0);
    countdownTarget = dt.toISOString();
  }

  // Google Calendar link (only when wedding date & host details exist)
  let gcalUrl = '';
  if (dateObj && (w.venue || w.address || w.bride_name || w.groom_name)) {
    const gcalDateStart = new Date(dateObj.y, dateObj.mo - 1, dateObj.d, 19, 0, 0);
    gcalUrl = buildGCalUrl({
      title: `${groomName} & ${brideName}'s Wedding`,
      start: gcalDateStart,
      location: `${primaryVenueTitle}, ${secondaryAddress}`,
      details: `Cordially inviting you to celebrate the wedding of ${groomName} & ${brideName}.`
    });
  }

  // Guest Details & Badge logic
  const guestName = clean(guest?.name) || clean(guest?.guest_name) || '';
  const hasFamily = Boolean(guest?.with_family);
  const isFamilyAlreadyInName = /family/i.test(guestName);
  const guestDisplayName = guestName
    ? (hasFamily && !isFamilyAlreadyInName ? `${guestName} & Family` : guestName)
    : 'Respected Guest';

  const guestBadge = hasFamily
    ? 'Family'
    : (guest?.persons && guest.persons > 1 ? `${guest.persons} Persons` : 'Personal Invitation');

  const tPText = guestBadge;

  // Events / Programme List
  const defaultEvents = [
    { event_name: 'Mehendi & Sangeet', event_date: rawDate || '2026-11-20', event_time: '17:00', venue: primaryVenueTitle, note: 'An evening of joyful music, henna, and celebratory melodies.' },
    { event_name: 'Wedding Ceremony', event_date: rawDate || '2026-11-20', event_time: rawTime || '19:30', venue: primaryVenueTitle, note: 'Auspicious wedding vows and royal banquet dinner.' }
  ];
  const eventList = (Array.isArray(events) && events.length) ? events : defaultEvents;

  // Family Signoff & Signature format: "The Pari & Param Families"
  const defaultFamilyName = (brideName && groomName && brideName !== 'Bride' && groomName !== 'Groom')
    ? `The ${brideName} & ${groomName} Families`
    : 'The Pari & Param Families';
  const familySignature = clean(w.footer_text) || clean(w.families) || defaultFamilyName;

  // Music URL
  const defaultMusic = './music/din-shagna-da.mp3';
  const rawMusic = clean(w.music_url || w.audio_url || '');
  const musicUrl = rawMusic ? safeAudioUrl(rawMusic) : defaultMusic;

  return `
<!-- Template 01: Royal Wax-Seal Envelope Invitation Suite -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Great+Vibes&display=swap" rel="stylesheet">

<style id="t01-styles">
:root {
  --envelope: url("./assets/template-01-envelope.webp");
  --border: url("./assets/template-01-border.webp");
}
.t01-wrapper {
  position: relative;
  width: 100%;
  height: 100%;
  height: 100dvh;
  min-height: 100dvh;
  margin: 0;
  padding: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #14070a;
  overflow: hidden;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}
.t01-wrapper * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.stage {
  position: relative;
  overflow: hidden;
  container-type: size;
  background: #14070a;
  width: min(56.25vh, 100vw);
  height: min(100vh, 177.78vw);
  width: min(56.25dvh, 100vw);
  height: min(100dvh, 177.78vw);
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #2b1204;
  box-shadow: 0 0 6cqw #000;
  image-rendering: -webkit-optimize-contrast;
  -webkit-font-smoothing: antialiased;
}
@media (max-width: 600px) {
  .stage {
    width: 100vw !important;
    max-width: 100% !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    box-shadow: none !important;
  }
}
.scroller {
  position: absolute;
  inset: 0;
  overflow-y: hidden;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  overscroll-behavior: contain;
  padding-bottom: 80px;
}
.scroller::-webkit-scrollbar { display: none; }

.pg {
  position: relative;
  height: 100cqh;
  height: 100dvh;
  min-height: 100dvh;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;
}

/* Page 2 Procedural Canvas Background & Card */
.p2bg {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  transform: scale(1.06);
  transition: transform 2.6s cubic-bezier(.22,1,.36,1);
  will-change: transform;
  background: radial-gradient(circle at 50% 50%, #fff9ec, #f7e8c8 70%, #ebd29d);
}
.bgset .p2bg { transform: scale(1); }

.card {
  position: absolute;
  left: 8%;
  right: 8%;
  top: 9%;
  bottom: 9%;
  border-radius: 4cqw;
  background: rgba(255, 250, 240, 0.90);
  -webkit-backdrop-filter: blur(12px) saturate(1.1);
  backdrop-filter: blur(12px) saturate(1.1);
  border: .35cqw solid rgba(201, 160, 70, 0.85);
  box-shadow: inset 0 0 0 1.1cqw rgba(255, 250, 240, 0.35),
              inset 0 0 0 1.45cqw rgba(201, 160, 70, 0.55),
              0 3cqw 7cqw rgba(60, 10, 16, 0.38),
              0 .6cqw 1.6cqw rgba(60, 10, 16, 0.25);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 4cqw 3.5cqw;
  text-align: center;
  opacity: 0;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 2;
  gap: 0;
}
.card::-webkit-scrollbar { display: none; }
.go .card { animation: cardin 1s ease forwards; }

.rv {
  opacity: 0;
  transform: translateY(2.6cqw);
}
.go .rv {
  animation: settle .9s cubic-bezier(.22, 1, .36, 1) forwards;
  animation-delay: calc(var(--i, 0) * .22s);
}
@keyframes settle { to { opacity: 1; transform: none; } }
@keyframes cardin { to { opacity: 1; } }

.p2-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  margin-bottom: 2cqw;
}
.kick {
  font: 700 3.3cqw/1.2 Cinzel, serif;
  letter-spacing: .25cqw;
  color: #5a3a08;
  text-transform: uppercase;
  margin: 0;
}
.sub-kick {
  font: 600 2.5cqw/1.2 Cinzel, serif;
  letter-spacing: .15cqw;
  color: #7a1220;
  margin-top: .5cqw;
}
.journey-tag {
  font: 500 italic 2.9cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
  letter-spacing: .06cqw;
  margin-top: .3cqw;
}
.orn {
  display: flex;
  align-items: center;
  gap: 1.4cqw;
  margin: 1.2cqw auto 0;
  width: 44cqw;
}
.orn i {
  flex: 1;
  height: .25cqw;
  background: linear-gradient(90deg, transparent, #b8872a, #f2d37a);
}
.orn i:last-child { transform: scaleX(-1); }
.orn b {
  width: 1.5cqw;
  height: 1.5cqw;
  transform: rotate(45deg);
  background: linear-gradient(135deg, #f6dc8a, #a8741c);
  box-shadow: 0 0 1.5cqw rgba(214, 168, 60, .7);
}

.pair {
  display: grid;
  grid-template-columns: 1fr 6cqw 1fr;
  align-items: start;
  width: 100%;
  margin-bottom: 2cqw;
}
.col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.ph {
  width: 21cqw;
  height: 21cqw;
  border-radius: 50%;
  padding: .85cqw;
  background: conic-gradient(from 20deg, #f7de8e, #b8872a, #fff1b8, #9b6a18, #f7de8e);
  box-shadow: 0 1.2cqw 2.8cqw rgba(70, 40, 5, .4);
  margin-bottom: 1cqw;
}
.ph div {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(#fff6df, #ecd6a0);
  display: grid;
  place-items: center;
  border: .35cqw solid #fff7e0;
}
.ph img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ph span {
  font: 400 11cqw/1 'Great Vibes', cursive;
  color: #7a1220;
}
.role-lbl {
  font: 700 2.3cqw/1 Cinzel, serif;
  letter-spacing: .22cqw;
  color: #b8892b;
  text-transform: uppercase;
  margin-bottom: .4cqw;
}
.nm {
  font: 400 8.6cqw/1.1 'Great Vibes', cursive;
  color: #0b1740;
  white-space: nowrap;
  max-width: 100%;
  filter: drop-shadow(0 .2cqw .2cqw rgba(201, 162, 74, 0.6));
  margin-bottom: .5cqw;
}
.rel {
  font: 700 2.1cqw/1 Cinzel, serif;
  letter-spacing: .15cqw;
  color: #6b3e14;
  text-transform: lowercase;
  font-style: italic;
  margin-bottom: .3cqw;
}
.fa {
  font: 700 3.8cqw/1.2 'Cormorant Garamond', serif;
  color: #2b1204;
  max-width: 100%;
  overflow-wrap: anywhere;
  margin-bottom: .4cqw;
}
.ad {
  font: 600 2.7cqw/1.2 'Cormorant Garamond', serif;
  color: #3b1f0b;
  max-width: 100%;
  overflow-wrap: anywhere;
}
.amp {
  font: 400 8.5cqw/1 'Great Vibes', cursive;
  color: #b8872a;
  padding-top: 5.5cqw;
  text-shadow: 0 .25cqw .5cqw rgba(120, 80, 10, .35);
}

.p2-quote {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 88%;
  padding-top: 1.5cqw;
  border-top: 1px solid rgba(201, 162, 74, 0.4);
}
.p2-ornament {
  font-size: 2.8cqw;
  color: #c9a24a;
  line-height: 1;
  margin-bottom: .4cqw;
}
.p2-quote-text {
  font: 500 italic 2.9cqw/1.3 'Cormorant Garamond', serif;
  color: #5a3a08;
  text-align: center;
}

/* Pages 3-5 Ornate Gold Border Paper */
.pg.bl {
  background: radial-gradient(circle at 50% 50%, #fff9ec, #f7e8c8 70%, #ebd29d);
}
.bd {
  position: absolute;
  top: 0;
  height: 100%;
  width: 21.025cqw;
  background: var(--border) 0 0/100% 100% no-repeat;
  z-index: 4;
  pointer-events: none;
}
.bd.l { left: 0; }
.bd.r { right: 0; transform: scaleX(-1); }

.card-paper {
  position: absolute;
  left: 7%;
  right: 7%;
  top: 3.5%;
  bottom: 3.5%;
  border-radius: 3.5cqw;
  background: linear-gradient(160deg, rgba(255, 252, 244, 0.92), rgba(255, 246, 228, 0.85) 55%, rgba(255, 250, 240, 0.9));
  backdrop-filter: blur(8px) saturate(1.15);
  -webkit-backdrop-filter: blur(8px) saturate(1.15);
  box-shadow: inset 0 0 0 0.2cqw rgba(201, 162, 74, 0.85),
              inset 0 0 0 0.6cqw rgba(255, 248, 230, 0.5),
              inset 0 0 0 0.9cqw rgba(201, 162, 74, 0.4),
              0 2cqw 5cqw rgba(90, 58, 8, 0.22);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  padding: 3.5cqw 3cqw;
  text-align: center;
  gap: 1cqw;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 2;
}
.card-paper::-webkit-scrollbar { display: none; }

/* Interactive Scratch Card for Muhurat */
.t01-scratch-tagline {
  font: 500 italic 2.3cqw/1.25 'Cormorant Garamond', serif;
  color: #5a3a08;
  max-width: 76cqw;
  margin: 0 auto;
  text-align: center;
}
.t01-scratch-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1cqw;
  margin: .4cqw 0;
}
.t01-scratch-box {
  position: relative;
  width: 100%;
  max-width: 58cqw;
  height: 18cqw;
  border-radius: 2cqw;
  overflow: hidden;
  box-shadow: 0 .8cqw 2.5cqw rgba(90, 58, 8, 0.22);
  border: 1.5px solid #c9a24a;
  background: #fff;
}
.t01-scratch-unveiled {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.2cqw;
  gap: .4cqw;
  background: linear-gradient(135deg, #fffdf8, #fdf4df);
  text-align: center;
}
.t01-scratch-icon { font-size: 3.6cqw; line-height: 1; }
.t01-scratch-date {
  font: 700 3.2cqw/1.1 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .08cqw;
}
.t01-scratch-time {
  font: 600 2.3cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}
.t01-scratch-badge {
  font: 700 1.8cqw/1 Cinzel, serif;
  letter-spacing: .12cqw;
  color: #b8892b;
  text-transform: uppercase;
}
.t01-scratch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  z-index: 2;
}
.t01-scratch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1cqw;
  padding: 1.3cqw 3.2cqw;
  border-radius: 50px;
  background: linear-gradient(135deg, #b8892b, #e0be6c 50%, #9a6f1c);
  color: #fff;
  font: 700 1.9cqw/1 Cinzel, serif;
  letter-spacing: .15cqw;
  border: 1px solid rgba(255, 235, 170, 0.6);
  box-shadow: 0 .4cqw 1.5cqw rgba(90, 58, 8, 0.22);
  cursor: pointer;
  text-transform: uppercase;
  transition: transform .15s;
}
.t01-scratch-btn:active { transform: scale(0.96); }

/* Live Countdown */
.cd-section-title {
  font: 700 2.0cqw/1 Cinzel, serif;
  letter-spacing: .2cqw;
  color: #6b0f1a;
  text-transform: uppercase;
  margin-top: .4cqw;
}
.countdown-grid {
  display: flex;
  gap: 1.5cqw;
  width: 100%;
  justify-content: center;
  margin: .8cqw 0;
}
.cd-box {
  flex: 1;
  max-width: 15cqw;
  padding: 1.5cqw .6cqw;
  border-radius: 1.8cqw;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(201, 162, 74, 0.6);
  box-shadow: 0 .4cqw 1.4cqw rgba(90, 58, 8, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .3cqw;
}
.cd-val {
  font: 700 4.5cqw/1 Cinzel, serif;
  color: #6b0f1a;
}
.cd-lbl {
  font: 600 1.8cqw/1 Cinzel, serif;
  letter-spacing: .1cqw;
  color: #5a3a08;
  text-transform: uppercase;
}

/* Programme Timeline with Ceremony Thumbnails */
.prog-list {
  display: flex;
  flex-direction: column;
  gap: 2.8cqw;
  width: 100%;
  margin-top: 1cqw;
}
.prog-item {
  display: flex;
  flex-direction: column;
  border-radius: 2.4cqw;
  background: rgba(255, 255, 255, 0.8);
  border: 1.5px solid rgba(201, 162, 74, 0.55);
  box-shadow: 0 .8cqw 2.5cqw rgba(90, 58, 8, 0.1);
  overflow: hidden;
  text-align: center;
}
.prog-img-wrap {
  position: relative;
  width: 100%;
  height: 22cqw;
  overflow: hidden;
  background: #ebd8b2;
}
.prog-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.prog-badge {
  position: absolute;
  top: 1.5cqw;
  left: 2cqw;
  padding: .5cqw 2.2cqw;
  border-radius: 50px;
  background: rgba(107, 15, 26, 0.9);
  color: #ffe082;
  font: 700 2.2cqw/1 Cinzel, serif;
  letter-spacing: .15cqw;
  box-shadow: 0 .4cqw 1.2cqw rgba(0, 0, 0, 0.35);
  border: 1px solid rgba(255, 224, 130, 0.6);
}
.prog-info {
  padding: 2.5cqw 3cqw;
  display: flex;
  flex-direction: column;
  gap: .8cqw;
  align-items: center;
}
.prog-item-title {
  font: 700 3.8cqw/1.15 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .15cqw;
}
.prog-item-time {
  font: 600 3.2cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}
.prog-item-venue {
  font: 600 3cqw/1.2 'Cormorant Garamond', serif;
  color: #1a1004;
}
.prog-item-note {
  font: 500 italic 2.8cqw/1.3 'Cormorant Garamond', serif;
  color: #4a2c06;
}
.add-cal-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1cqw;
  margin-top: .6cqw;
  align-self: center;
  font: 600 2.4cqw/1 Cinzel, serif;
  color: #6b0f1a;
  text-decoration: none;
  padding: 1.4cqw 3cqw;
  border-radius: 50px;
  background: rgba(201, 162, 74, 0.18);
  border: 1px solid rgba(201, 162, 74, 0.6);
  transition: all .2s;
}

/* Venue Showcase & Signoff */
.venue-photo-wrap {
  width: 100%;
  max-width: 48cqw;
  border-radius: 2.5cqw;
  padding: .6cqw;
  background: conic-gradient(#f7e08a, #b8892b, #fff3b8, #9a6f1c, #f7e08a);
  box-shadow: 0 1cqw 3cqw rgba(90, 58, 8, 0.2);
  margin: .8cqw auto;
}
.venue-photo-wrap img {
  width: 100%;
  height: 28cqw;
  object-fit: cover;
  border-radius: 2cqw;
  display: block;
}
.venue-arch-wrap {
  width: 100%;
  max-width: 44cqw;
  height: 22cqw;
  border-radius: 2.5cqw;
  background: rgba(201, 162, 74, 0.12);
  border: 1.5px dashed rgba(201, 162, 74, 0.6);
  display: grid;
  place-items: center;
  margin: .8cqw auto;
}
.venue-arch-icon { font-size: 8cqw; }
.venue-address-text {
  display: flex;
  flex-direction: column;
  gap: .8cqw;
  margin: .8cqw 0;
  width: 100%;
  align-items: center;
}
.venue-name-bold {
  font: 700 4.2cqw/1.2 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .15cqw;
}
.venue-loc-sub {
  font: 600 3.2cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}
.venue-full-addr {
  font: 600 3.3cqw/1.3 'Cormorant Garamond', serif;
  color: #1a1004;
  max-width: 46cqw;
}
.venue-timing {
  font: 600 3.1cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}
.venue-note {
  font: 500 italic 2.8cqw/1.2 'Cormorant Garamond', serif;
  color: #4a2c06;
}
.gold-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.5cqw;
  padding: 2.6cqw 5cqw;
  border-radius: 50px;
  background: linear-gradient(135deg, #b8892b, #e0be6c 50%, #9a6f1c);
  color: #fff;
  font: 700 2.8cqw/1 Cinzel, serif;
  letter-spacing: .25cqw;
  text-decoration: none;
  box-shadow: 0 .8cqw 2.5cqw rgba(90, 58, 8, 0.35);
  border: 1px solid rgba(255, 235, 170, 0.6);
  cursor: pointer;
  transition: transform .2s, box-shadow .2s;
  text-transform: uppercase;
  margin-top: .5cqw;
}
.gold-btn:active { transform: scale(0.97); }
.gold-btn-sm {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.2cqw;
  padding: 2cqw 4cqw;
  border-radius: 50px;
  background: linear-gradient(135deg, #b8892b, #e0be6c 50%, #9a6f1c);
  color: #fff;
  font: 700 2.4cqw/1 Cinzel, serif;
  letter-spacing: .2cqw;
  text-decoration: none;
  box-shadow: 0 .6cqw 2cqw rgba(90, 58, 8, 0.28);
  border: 1px solid rgba(255, 235, 170, 0.6);
  cursor: pointer;
  margin-top: .8cqw;
}
.venue-signature {
  display: flex;
  flex-direction: column;
  gap: .6cqw;
  align-items: center;
  margin-top: 1.5cqw;
  padding-top: 1.5cqw;
  border-top: 1px solid rgba(201, 162, 74, 0.35);
  width: 100%;
}
.sig-prefix {
  font: 500 italic 2.9cqw/1.3 'Cormorant Garamond', serif;
  color: #5a3a08;
  text-align: center;
}
.sig-name {
  font: 700 italic 3.6cqw/1.2 'Cormorant Garamond', serif;
  color: #6b0f1a;
}
.sig-sub {
  font: 500 italic 2.6cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}
.start-again-btn {
  margin-top: .8cqw;
  background: none;
  border: none;
  font: 600 2.4cqw/1 Cinzel, serif;
  letter-spacing: .2cqw;
  color: #b8892b;
  cursor: pointer;
  text-transform: uppercase;
}

/* Page 1 Entrance Envelope Animation */
#intro {
  position: absolute;
  inset: 0;
  z-index: 20;
  perspective: 140cqw;
  opacity: 0;
  transition: opacity .6s ease;
}
#intro.rd { opacity: 1; }
#intro .ly { position: absolute; inset: 0; }
.im { background: var(--envelope) 0 0/100% 100% no-repeat; }
#pocket {
  z-index: 3;
  clip-path: polygon(0 41.8%, 35.92% 55.3%, 41.98% 57.9%, 49.95% 58.9%, 57.92% 57.9%, 64.08% 55.3%, 100% 41.8%, 100% 100%, 0 100%);
  will-change: transform, opacity;
}
#fsh {
  z-index: 3;
  background: rgba(36, 4, 9, .6);
  clip-path: polygon(0 42.4%, 35.92% 56.3%, 41.98% 59%, 49.95% 60.1%, 57.92% 59%, 64.08% 56.3%, 100% 42.4%, 100% 0, 0 0);
  filter: blur(1.3cqw);
  transition: opacity .5s;
  transform: translateY(.8cqw);
}
#flap {
  z-index: 4;
  transform-origin: 50% 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  will-change: transform;
}
#flap .f {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
}
#flap .fr {
  clip-path: polygon(0 0, 100% 0, 100% 42.22%, 64.08% 55.74%, 57.92% 58.31%, 49.95% 59.33%, 41.98% 58.31%, 35.92% 55.74%, 0 42.22%);
  -webkit-mask-image: radial-gradient(circle 14.7cqw at 49.95% 50.84%, transparent 98%, #000 100%);
  mask-image: radial-gradient(circle 14.7cqw at 49.95% 50.84%, transparent 98%, #000 100%);
}
#flap .sk {
  clip-path: circle(14.85cqw at 49.95% 50.84%);
  background: radial-gradient(circle at 50% 50%, #3a050c 0, #5e0b17 58%, #8a1627 76%, #c9a046 86%, #7d1020 91%, #3a050c 100%);
}
#flap .sd {
  background: #000;
  opacity: 0;
  transition: opacity 1.2s ease;
}
#seal {
  z-index: 6;
  clip-path: circle(15.1cqw at 49.95% 50.84%);
  transition: transform .55s cubic-bezier(.3, .1, .3, 1), opacity .55s ease;
}
#seal.go {
  transform: translateY(3.4cqw) scale(1.08);
  opacity: 0;
  transform-origin: 49.95% 50.84%;
}
#halo {
  z-index: 5;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  background: radial-gradient(circle 30cqw at 49.95% 50.84%, rgba(255, 225, 150, .14) 0, rgba(255, 215, 120, .28) 44%, rgba(255, 200, 90, .8) 52%, rgba(255, 180, 70, .25) 72%, transparent 100%);
}
#halo.go { animation: halo 1.1s ease-out forwards; }
@keyframes halo {
  0% { opacity: 0; transform: scale(.7); }
  35% { opacity: 1; }
  100% { opacity: 0; transform: scale(1.35); }
}
#rim {
  position: absolute;
  left: calc(49.95% - 14.9cqw);
  top: calc(50.84% - 14.9cqw);
  width: 29.8cqw;
  height: 29.8cqw;
  border-radius: 50%;
  z-index: 7;
  pointer-events: none;
  box-shadow: 0 0 2cqw .5cqw rgba(255, 206, 110, 0), inset 0 0 1.6cqw rgba(255, 214, 130, 0);
  animation: breathe 2.6s ease-in-out infinite;
  mix-blend-mode: screen;
}
#rim.go { display: none; }
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 1.2cqw .2cqw rgba(255, 196, 90, .15), inset 0 0 1cqw rgba(255, 214, 130, .1); }
  50% { box-shadow: 0 0 3.4cqw 1cqw rgba(255, 206, 110, .7), inset 0 0 2.2cqw rgba(255, 224, 150, .45); }
}
#letter {
  position: absolute;
  z-index: 2;
  inset: 22% 11%;
  border-radius: 4cqw;
  transform: translateY(35%);
  background: linear-gradient(160deg, #fffaf0, #f7e8c6);
  border: .35cqw solid rgba(201, 160, 70, .9);
  box-shadow: inset 0 0 0 1.45cqw rgba(201, 160, 70, .45), 0 3cqw 8cqw rgba(30, 4, 8, .55);
  will-change: transform, opacity;
}
.tw {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  white-space: nowrap;
}
#ft1 {
  top: 15.7%;
  font: 600 3.2cqw/1 Cinzel, serif;
  letter-spacing: .16em;
  color: #5a3a08;
  width: 66cqw;
}
#ft2 {
  top: 23%;
  font: 400 12.5cqw/1.15 'Great Vibes', cursive;
  color: #7a1220;
  width: 70cqw;
  text-shadow: 0 .2cqw .3cqw rgba(255, 240, 200, .6);
}
#ft2 em {
  font-style: normal;
  color: #c79a2e;
  padding: 0 .12em;
}
#pt1 {
  top: 70.2%;
  font: 600 3cqw/1 Cinzel, serif;
  letter-spacing: .22em;
  color: #5a3a08;
  width: 50cqw;
}
#pt2 {
  top: 74%;
  font: 700 6.4cqw/1.1 'Cormorant Garamond', serif;
  color: #2b1204;
  width: 60cqw;
}
#pt3 {
  top: 77.6%;
  font: 700 4.6cqw/1 'Cormorant Garamond', serif;
  color: #4a1a0a;
  width: 60cqw;
}
.hit {
  position: absolute;
  z-index: 8;
  cursor: pointer;
  pointer-events: auto;
  touch-action: manipulation;
}
#hs {
  left: calc(49.95% - 15cqw);
  top: calc(50.84% - 15cqw);
  width: 30cqw;
  height: 30cqw;
  border-radius: 50%;
}
#hp {
  left: 23.4%;
  top: 82.6%;
  width: 53.4%;
  height: 6.6%;
  border-radius: 5cqw;
}
#spark {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 30;
  pointer-events: none;
  mix-blend-mode: screen;
  transition: opacity 1.2s;
}
</style>

<div class="t8 t01-wrapper" data-music="${musicUrl}">
  <main class="stage" id="stage">
    <!-- Scrollable Snapping Pages -->
    <div class="scroller" id="scroller">
      <!-- Page 2: Two Hearts · One Destiny -->
      <section class="pg" id="p2">
        <canvas class="p2bg" id="p2bg"></canvas>
        <div class="card" id="card">
          <div class="p2-header rv" style="--i:0">
            <div class="kick">TWO HEARTS · ONE DESTINY</div>
            <div class="sub-kick">Together with their Families</div>
            <div class="journey-tag">The Journey of Love &amp; Togetherness</div>
            <div class="orn"><i></i><b></b><i></i></div>
          </div>
          <div class="pair rv" style="--i:1">
            ${brideFirst ? `
            <!-- Bride Column -->
            <div class="col" style="--i:0">
              <div class="ph">
                <div>
                  <img src="${bridePhoto}" alt="${esc(brideName)}" onerror="this.style.display='none';this.parentElement.textContent='${brideInit}';" />
                </div>
              </div>
              <div class="role-lbl">BRIDE</div>
              <div class="nm">${esc(brideName)}</div>
              ${brideParents ? `<div class="rel">d/o</div><div class="fa">${esc(brideParents)}</div>` : ''}
              ${brideAddress ? `<div class="ad">📍 ${esc(brideAddress)}</div>` : ''}
            </div>
            <div class="amp">&amp;</div>
            <!-- Groom Column -->
            <div class="col" style="--i:1">
              <div class="ph">
                <div>
                  <img src="${groomPhoto}" alt="${esc(groomName)}" onerror="this.style.display='none';this.parentElement.textContent='${groomInit}';" />
                </div>
              </div>
              <div class="role-lbl">GROOM</div>
              <div class="nm">${esc(groomName)}</div>
              ${groomParents ? `<div class="rel">s/o</div><div class="fa">${esc(groomParents)}</div>` : ''}
              ${groomAddress ? `<div class="ad">📍 ${esc(groomAddress)}</div>` : ''}
            </div>
            ` : `
            <!-- Groom Column -->
            <div class="col" style="--i:0">
              <div class="ph">
                <div>
                  <img src="${groomPhoto}" alt="${esc(groomName)}" onerror="this.style.display='none';this.parentElement.textContent='${groomInit}';" />
                </div>
              </div>
              <div class="role-lbl">GROOM</div>
              <div class="nm">${esc(groomName)}</div>
              ${groomParents ? `<div class="rel">s/o</div><div class="fa">${esc(groomParents)}</div>` : ''}
              ${groomAddress ? `<div class="ad">📍 ${esc(groomAddress)}</div>` : ''}
            </div>
            <div class="amp">&amp;</div>
            <!-- Bride Column -->
            <div class="col" style="--i:1">
              <div class="ph">
                <div>
                  <img src="${bridePhoto}" alt="${esc(brideName)}" onerror="this.style.display='none';this.parentElement.textContent='${brideInit}';" />
                </div>
              </div>
              <div class="role-lbl">BRIDE</div>
              <div class="nm">${esc(brideName)}</div>
              ${brideParents ? `<div class="rel">d/o</div><div class="fa">${esc(brideParents)}</div>` : ''}
              ${brideAddress ? `<div class="ad">📍 ${esc(brideAddress)}</div>` : ''}
            </div>
            `}
          </div>
          <div class="p2-quote rv" style="--i:2">
            <div class="p2-ornament">❖</div>
            <p class="p2-quote-text">Two hearts, two families,<br>one beautiful beginning.</p>
          </div>
        </div>
      </section>

      <!-- Page 3: Auspicious Wedding Muhurat & Scratch Card Date Reveal -->
      <section class="pg bl" id="p3">
        <i class="bd l"></i>
        <i class="bd r"></i>
        <div class="card-paper" id="date-card">
          <div class="kick">AUSPICIOUS WEDDING MUHURAT</div>
          <div class="sub-kick">The Sacred Wedding Date</div>
          <p class="t01-scratch-tagline">Scratch below to reveal our sacred wedding date, followed by live countdown &amp; calendar</p>
          <div class="orn"><i></i><b></b><i></i></div>

          <!-- Interactive Scratch Card -->
          <div class="t01-scratch-wrap">
            <div class="t01-scratch-box" id="t01-scratch-box">
              <div class="t01-scratch-unveiled">
                <span class="t01-scratch-icon">💍</span>
                <div class="t01-scratch-date">${esc(dateLong)}</div>
                <div class="t01-scratch-time">⏰ Auspicious Muhurat: ${esc(timeStr)}</div>
                <div class="t01-scratch-badge">✦ Shubh Vivah · Sacred Union ✦</div>
              </div>
              <canvas id="t01-scratch-canvas" class="t01-scratch-canvas" aria-label="Scratch to reveal the wedding date"></canvas>
            </div>
            <button type="button" class="t01-scratch-btn" id="t01-scratch-btn">
              <span>✨</span> Scratch or Tap to Reveal
            </button>
          </div>

          <!-- Live Countdown Timer -->
          <div class="cd-section-title">COUNT DOWN DATE</div>
          <div class="countdown-grid" id="t01-countdown" data-when="${countdownTimestamp || ''}" data-target="${countdownTarget}">
            <div class="cd-box"><span class="cd-val" data-cd="days" data-u="d">00</span><span class="cd-lbl">Days</span></div>
            <div class="cd-box"><span class="cd-val" data-cd="hours" data-u="h">00</span><span class="cd-lbl">Hours</span></div>
            <div class="cd-box"><span class="cd-val" data-cd="minutes" data-u="m">00</span><span class="cd-lbl">Mins</span></div>
            <div class="cd-box"><span class="cd-val" data-cd="seconds" data-u="s">00</span><span class="cd-lbl">Secs</span></div>
          </div>

          ${gcalUrl ? `
          <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="gold-btn-sm" id="t01-calendar">
            📅 Save Date
          </a>` : ''}
        </div>
      </section>

      <!-- Page 4: Wedding Programme with Ceremony Photos -->
      <section class="pg bl" id="p4">
        <i class="bd l"></i>
        <i class="bd r"></i>
        <div class="card-paper" id="prog-card">
          <div class="kick">WEDDING PROGRAMME</div>
          <div class="sub-kick">Sacred Ceremonies &amp; Celebrations</div>
          <div class="orn"><i></i><b></b><i></i></div>
          <div class="prog-list">
            ${eventList.map((e, idx) => {
              const eName = clean(e.event_name) || clean(e.name) || clean(e.title) || `Ceremony ${idx + 1}`;
              const eDateStr = formatEventDate(e.event_date || rawDate);
              const eTimeStr = formatTime(e.event_time || rawTime);
              const eVenue = clean(e.venue) || clean(e.venue_title) || primaryVenueTitle;
              const eNote = clean(e.note) || clean(e.comment) || clean(e.description) || venueComment;
              const evImg = getEventPhoto(e, idx);
              return `
              <div class="prog-item">
                <div class="prog-img-wrap">
                  <img src="${esc(evImg)}" alt="${esc(eName)}" loading="lazy" onerror="this.src='./assets/template-06-shubho-bibaho.webp';" />
                  <span class="prog-badge">CEREMONY ${idx + 1}</span>
                </div>
                <div class="prog-info">
                  <div class="prog-item-title">${esc(eName)}</div>
                  ${(eDateStr || eTimeStr) ? `<div class="prog-item-time">🗓️ ${esc(eDateStr)}${eTimeStr ? ' • ⏰ ' + esc(eTimeStr) : ''}</div>` : ''}
                  ${eVenue ? `<div class="prog-item-venue">📍 ${esc(eVenue)}</div>` : ''}
                  ${eNote ? `<div class="prog-item-note">“${esc(eNote)}”</div>` : ''}
                  ${gcalUrl ? `
                  <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="add-cal-link">
                    📅 Add To Calendar
                  </a>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- Page 5: Celebration Venue & Directions -->
      <section class="pg bl" id="p5">
        <i class="bd l"></i>
        <i class="bd r"></i>
        <div class="card-paper" id="venue-card">
          <div class="kick">CELEBRATION VENUE</div>
          <div class="sub-kick">${esc(primaryVenueTitle)}</div>
          ${secondaryAddress ? `<div class="venue-loc-sub">${esc(secondaryAddress)}</div>` : ''}
          <div class="orn"><i></i><b></b><i></i></div>
          ${venuePhoto ? `
          <div class="venue-photo-wrap">
            <img src="${esc(venuePhoto)}" alt="${esc(primaryVenueTitle)}" class="venue-img" />
          </div>` : `
          <div class="venue-arch-wrap">
            <div class="venue-arch-icon">🏛️</div>
          </div>`}
          <div class="venue-address-text">
            <p class="venue-name-bold">${esc(primaryVenueTitle)}</p>
            ${secondaryAddress ? `<p class="venue-full-addr">📍 ${esc(secondaryAddress)}</p>` : ''}
            ${timeStr ? `<p class="venue-timing">⏰ ${esc(timeStr)}</p>` : ''}
            ${venueComment ? `<p class="venue-note"><em>“${esc(venueComment)}”</em></p>` : ''}
          </div>
          <div class="venue-actions">
            <a href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer" class="gold-btn" id="t01-maps">
              📍 Get Directions • Google Maps
            </a>
          </div>

          <div class="venue-signature">
            <div class="sig-prefix">With love, affection, and best wishes,</div>
            <div class="sig-name">${esc(familySignature)}</div>
            <div class="sig-sub">We eagerly look forward to celebrating with you!</div>
            <button type="button" class="start-again-btn" data-restart>Start Again ↻</button>
          </div>
        </div>
      </section>
    </div>

    <!-- Entrance Wax-Seal Envelope Intro Animation -->
    <div id="intro">
      <div id="letter"></div>
      <div class="ly im" id="pocket">
        <div class="tw" id="pt1">CORDIALLY INVITED</div>
        <div class="tw" id="pt2">${esc(guestDisplayName)}</div>
        <div class="tw" id="pt3">${esc(tPText)}</div>
      </div>
      <div class="ly" id="fsh"></div>
      <div class="ly" id="flap">
        <div class="ly f sk"></div>
        <div class="ly f im fr">
          <div class="tw" id="ft1">A SPECIAL INVITATION AWAITS</div>
          <div class="tw" id="ft2">${esc(groomName)} <em>&amp;</em> ${esc(brideName)}</div>
        </div>
        <div class="ly f sd fr"></div>
      </div>
      <div class="ly" id="halo"></div>
      <div class="ly im" id="seal"></div>
      <div id="rim"></div>
      <div class="hit" id="hs" role="button" aria-label="Open invitation" data-open></div>
      <div class="hit" id="hp" role="button" aria-label="Tap the seal to open" data-open></div>
    </div>
    <canvas id="spark"></canvas>
  </main>
</div>
`;
}

export function mount(root, { guest, wedding, events } = {}) {
  if (!root) return () => {};

  const st = (typeof root.querySelector === 'function' ? root.querySelector('#stage') : null) || root;
  const sc = typeof root.querySelector === 'function' ? root.querySelector('#scroller') : null;
  const intro = typeof root.querySelector === 'function' ? root.querySelector('#intro') : null;
  const seal = typeof root.querySelector === 'function' ? root.querySelector('#seal') : null;
  const halo = typeof root.querySelector === 'function' ? root.querySelector('#halo') : null;
  const rim = typeof root.querySelector === 'function' ? root.querySelector('#rim') : null;
  const flap = typeof root.querySelector === 'function' ? root.querySelector('#flap') : null;
  const fsh = typeof root.querySelector === 'function' ? root.querySelector('#fsh') : null;
  const letter = typeof root.querySelector === 'function' ? root.querySelector('#letter') : null;
  const pocket = typeof root.querySelector === 'function' ? root.querySelector('#pocket') : null;
  const hs = typeof root.querySelector === 'function' ? root.querySelector('#hs') : null;
  const hp = typeof root.querySelector === 'function' ? root.querySelector('#hp') : null;
  const p2bg = typeof root.querySelector === 'function' ? root.querySelector('#p2bg') : null;

  let countdownTimer = null;
  const cleanups = [];
  const timers = [];
  const after = (ms, fn) => {
    const tid = setTimeout(fn, ms);
    timers.push(tid);
    return tid;
  };

  // 1. Text Fitting with safe padding & bounds
  const fit = (el, max, min = 1.8) => {
    if (!el || !el.textContent || !st) return;
    const w = st.clientWidth || 360;
    const lim = max * w / 100;
    el.style.fontSize = '';
    let cs = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
      ? parseFloat(window.getComputedStyle(el).fontSize || '16')
      : 16;
    let n = 0;
    while (el.scrollWidth > lim + .5 && cs > min * w / 100 && n++ < 60) {
      cs *= .95;
      el.style.fontSize = cs + 'px';
    }
  };

  const fitAll = () => {
    if (typeof root.querySelector !== 'function') return;
    fit(root.querySelector('#ft1'), 66, 1.8);
    fit(root.querySelector('#ft2'), 70, 5);
    fit(root.querySelector('#pt1'), 50, 1.8);
    fit(root.querySelector('#pt2'), 60, 3);
    fit(root.querySelector('#pt3'), 60, 2.6);

    if (typeof root.querySelectorAll === 'function') {
      root.querySelectorAll('.nm').forEach(el => {
        const col = el.parentNode;
        const lim = (col && col.clientWidth ? col.clientWidth : 34 * (st.clientWidth || 360) / 100) / (st.clientWidth || 360) * 100;
        fit(el, lim, 4);
      });
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', fitAll);
    cleanups.push(() => window.removeEventListener('resize', fitAll));
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitAll).catch(() => {});
    }
  }
  setTimeout(fitAll, 50);

  // 2. Procedural Background Generation on #p2bg from envelope graphic
  const envURL = './assets/template-01-envelope.webp';
  const envImg = typeof Image !== 'undefined' ? new Image() : null;
  if (envImg && p2bg && typeof p2bg.getContext === 'function') {
    const buildBg = (im) => {
      try {
        const W = im.naturalWidth || 600, H = im.naturalHeight || 900;
        p2bg.width = W; p2bg.height = H;
        const x = p2bg.getContext('2d');
        if (!x) return;
        x.drawImage(im, 0, 0);
        let r = 243, gg = 227, bb = 192;
        try {
          const sm = x.getImageData(W * .3 | 0, H * .7 | 0, W * .4 | 0, H * .07 | 0).data;
          let tr = 0, tg = 0, tb = 0, cn = sm.length / 4;
          for (let q = 0; q < sm.length; q += 4) { tr += sm[q]; tg += sm[q + 1]; tb += sm[q + 2]; }
          if (cn > 0) { r = tr / cn; gg = tg / cn; bb = tb / cn; }
        } catch (_) {}

        const tone = k => `rgb(${Math.min(255, r * k | 0)},${Math.min(255, gg * k | 0)},${Math.min(255, bb * k | 0)})`;
        const g = x.createRadialGradient(W * .5, H * .5, W * .05, W * .5, H * .5, H * .75);
        g.addColorStop(0, tone(1.03));
        g.addColorStop(.6, tone(1));
        g.addColorStop(1, tone(.97));
        x.fillStyle = g;
        x.fillRect(0, 0, W, H);

        let s = 7;
        const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
        for (let i = 0; i < 26; i++) {
          const px = rnd() * W, py = rnd() * H, rad = W * (.12 + rnd() * .28);
          const a = x.createRadialGradient(px, py, 0, px, py, rad);
          const l = rnd() < .5;
          a.addColorStop(0, l ? 'rgba(255,246,222,.14)' : 'rgba(190,150,90,.09)');
          a.addColorStop(1, 'rgba(255,255,255,0)');
          x.fillStyle = a;
          x.fillRect(px - rad, py - rad, rad * 2, rad * 2);
        }

        const patch = (fx, fy, fw, fh, fl, fr, ft, fb) => {
          const sx = fx * W, sy = fy * H, sw = fw * W, sh = fh * H;
          if (typeof document === 'undefined' || !document.createElement) return;
          const t = document.createElement('canvas');
          t.width = Math.ceil(sw); t.height = Math.ceil(sh);
          const c = t.getContext('2d');
          if (!c) return;
          c.drawImage(im, sx, sy, sw, sh, 0, 0, t.width, t.height);
          c.globalCompositeOperation = 'destination-in';
          const m = (h, a0, a1) => {
            const q = c.createLinearGradient(0, 0, h ? t.width : 0, h ? 0 : t.height);
            if (a0) { q.addColorStop(0, 'rgba(0,0,0,0)'); q.addColorStop(a0, '#000'); } else q.addColorStop(0, '#000');
            if (a1) { q.addColorStop(1 - a1, '#000'); q.addColorStop(1, 'rgba(0,0,0,0)'); } else q.addColorStop(1, '#000');
            c.fillStyle = q;
            c.fillRect(0, 0, t.width, t.height);
          };
          if (fl || fr) m(true, fl, fr);
          if (ft || fb) m(false, ft, fb);
          x.drawImage(t, sx, sy);
        };

        patch(0, 0, .4, .105, 0, .3, 0, .3);
        patch(.6, 0, .4, .105, .3, 0, 0, .3);
        patch(0, 0, .27, .245, 0, .22, 0, .22);
        patch(.73, 0, .27, .245, .22, 0, 0, .22);
        patch(0, .725, .2, .18, 0, .4, .2, .1);
        patch(.8, .725, .2, .18, .4, 0, .2, .1);
        patch(0, .9, .32, .1, 0, .4, .4, 0);
        patch(.68, .9, .32, .1, .4, 0, .4, 0);
        patch(0, .5, .22, .25, 0, .35, .25, .25);
        patch(.78, .5, .22, .25, .35, 0, .25, .25);
        patch(.3, .965, .4, .035, .3, .3, 0, 0);

        const ln = x.createLinearGradient(0, H * .24, 0, H * .99);
        ln.addColorStop(0, 'rgba(201,160,70,0)');
        ln.addColorStop(.12, 'rgba(201,160,70,.9)');
        ln.addColorStop(.86, 'rgba(201,160,70,.9)');
        ln.addColorStop(1, 'rgba(201,160,70,0)');
        x.fillStyle = ln;
        x.fillRect(W * .0165, H * .24, W * .0032, H * .75);
        x.fillRect(W * .9803, H * .24, W * .0032, H * .75);
      } catch (_) {}
    };

    envImg.onload = () => buildBg(envImg);
    envImg.src = envURL;
  }

  // 3. Sparkles Canvas Particle System
  const sparkCv = root.querySelector('#spark');
  let sparkRaf = 0;
  function runSparkles() {
    if (!sparkCv || typeof sparkCv.getContext !== 'function' || !st) return;
    const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    const w = st.clientWidth || 360, h = st.clientHeight || 540;
    sparkCv.width = w * dpr; sparkCv.height = h * dpr;
    const c = sparkCv.getContext('2d');
    if (c.scale) c.scale(dpr, dpr);

    const ps = [];
    const t0 = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    let last = t0, run = true, acc = 0;

    function spawn() {
      const k = Math.random(), y = h * (.35 + Math.random() * .65);
      ps.push({
        k: k < .42 ? 0 : (k < .84 ? 1 : 2),
        x: Math.random() * w, y,
        vy: -w * (.05 + Math.random() * .15),
        vx: (Math.random() - .5) * w * .04,
        r: w * (k < .42 ? .012 + Math.random() * .03 : .006 + Math.random() * .008),
        life: 2.6 + Math.random() * 2.2,
        age: 0,
        ph: Math.random() * 6.28
      });
    }

    function frame(now) {
      if (!run) return;
      const dt = Math.min((now - last) / 1000, .05);
      last = now;
      const el = now - t0;
      if (el < 4800) {
        acc += dt * (el < 2500 ? 26 : 14);
        while (acc > 1 && ps.length < 110) { spawn(); acc--; }
      }
      c.clearRect(0, 0, w, h);
      c.globalCompositeOperation = 'lighter';
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.age += dt;
        if (p.age > p.life) { ps.splice(i, 1); continue; }
        p.y += p.vy * dt;
        p.x += p.vx * dt + Math.sin(p.age * 1.6 + p.ph) * w * .01 * dt;
        const u = p.age / p.life, a = Math.sin(Math.PI * u);
        if (p.k === 0) {
          const g = c.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
          g.addColorStop(0, `rgba(255,224,150,${.5 * a})`);
          g.addColorStop(.6, `rgba(255,190,90,${.18 * a})`);
          g.addColorStop(1, 'rgba(255,170,60,0)');
          c.fillStyle = g; c.beginPath(); c.arc(p.x, p.y, p.r, 0, 6.3); c.fill();
        } else if (p.k === 1) {
          const tw = .55 + .45 * Math.sin(p.age * 9 + p.ph), L = p.r * (2.2 + tw * 2);
          c.strokeStyle = `rgba(255,236,170,${.9 * a * tw})`;
          c.lineWidth = Math.max(.6, p.r * .14);
          c.beginPath();
          c.moveTo(p.x - L, p.y); c.lineTo(p.x + L, p.y);
          c.moveTo(p.x, p.y - L); c.lineTo(p.x, p.y + L);
          c.stroke();
          c.fillStyle = `rgba(255,246,210,${a})`;
          c.beginPath(); c.arc(p.x, p.y, p.r * .3, 0, 6.3); c.fill();
        } else {
          const L2 = w * (.09 + .05 * Math.sin(p.ph));
          const q = c.createLinearGradient(p.x, p.y, p.x, p.y + L2);
          q.addColorStop(0, `rgba(255,214,130,${.3 * a})`);
          q.addColorStop(1, 'rgba(255,214,130,0)');
          c.fillStyle = q;
          c.fillRect(p.x - .3, p.y, .6 + p.r * .2, L2);
        }
      }
      if (now - t0 < 6500) {
        sparkRaf = requestAnimationFrame(frame);
      } else {
        run = false;
        if (sparkCv) {
          sparkCv.style.opacity = '0';
          setTimeout(() => { if (sparkCv) sparkCv.remove(); }, 1300);
        }
      }
    }
    sparkRaf = requestAnimationFrame(frame);
  }

  // 4. Open Sequence Controller
  let opened = false;
  let t01Audio = null;

  function triggerOpen() {
    if (opened) return;
    opened = true;

    if (intro) intro.classList.add('go');

    // Synchronously trigger background soundtrack
    if (typeof window !== 'undefined') {
      if (typeof window.__startWeddingMusic === 'function') {
        try { window.__startWeddingMusic(true); } catch (_) {}
      }
      try { window.dispatchEvent(new CustomEvent('invitation-unveiled')); } catch (_) {}
    }

    // Direct audio unlock and self-contained playback fallback
    try {
      const isMuted = typeof sessionStorage !== 'undefined' && sessionStorage.getItem('guest_music_muted') === 'true';
      const hostEl = (typeof root.querySelector === 'function' ? root.querySelector('.t01-wrapper') : null) || root;
      const targetMusic = (hostEl && hostEl.dataset ? hostEl.dataset.music : '') || musicUrl || './music/din-shagna-da.mp3';
      if (!isMuted && targetMusic && targetMusic !== 'none') {
        setTimeout(() => {
          const isGlobalPlaying = typeof window !== 'undefined' && typeof window.__isWeddingMusicPlaying === 'function' && window.__isWeddingMusicPlaying();
          if (!isGlobalPlaying && !t01Audio) {
            try {
              t01Audio = new Audio(targetMusic);
              t01Audio.loop = true;
              t01Audio.preload = 'auto';
              t01Audio.volume = 0.35;
              t01Audio.setAttribute('playsinline', '');
              t01Audio.setAttribute('webkit-playsinline', '');
              t01Audio.play().catch(() => {});
            } catch (_) {}
          }
        }, 300);
      }
    } catch (_) {}

    if (seal) seal.classList.add('go');
    if (halo) halo.classList.add('go');
    if (rim) rim.classList.add('go');
    if (hs) hs.style.pointerEvents = 'none';
    if (hp) hp.style.pointerEvents = 'none';

    after(500, () => {
      if (flap) {
        flap.style.transition = 'transform 1.3s cubic-bezier(.4,0,.2,1)';
        flap.style.transform = 'rotateX(-175deg)';
        const sd = flap.querySelector('.sd');
        if (sd) sd.style.opacity = '.55';
      }
      if (fsh) fsh.style.opacity = '0';
      after(600, () => { if (flap) flap.style.zIndex = '1'; });
    });

    after(1100, () => {
      if (letter) {
        letter.style.transition = 'transform 1.8s cubic-bezier(.22,1,.36,1)';
        letter.style.transform = 'translateY(0)';
      }
      if (pocket) {
        pocket.style.transition = 'transform 1.6s cubic-bezier(.4,0,.2,1),opacity 1.4s ease .2s';
        pocket.style.transform = 'translateY(110%)';
        pocket.style.opacity = '0';
      }
      if (st) st.classList.add('bgset');
    });

    after(1200, runSparkles);

    after(2800, () => {
      if (st) st.classList.add('go');
      if (letter) {
        letter.style.transition = 'opacity 1s ease';
        letter.style.opacity = '0';
      }
    });

    after(4500, () => {
      if (intro) intro.remove();
      if (sc) sc.style.overflowY = 'auto';
      fitAll();
    });
  }

  // Audio visibility management
  const onVisibilityChange = () => {
    if (typeof document === 'undefined') return;
    if (document.hidden) {
      if (t01Audio && !t01Audio.paused) {
        t01Audio.pause();
        t01Audio._wasPlaying = true;
      }
    } else if (t01Audio && t01Audio._wasPlaying) {
      t01Audio._wasPlaying = false;
      t01Audio.play().catch(() => {});
    }
  };
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', onVisibilityChange);
    cleanups.push(() => document.removeEventListener('visibilitychange', onVisibilityChange));
  }
  cleanups.push(() => {
    if (t01Audio) {
      try { t01Audio.pause(); } catch (_) {}
      t01Audio = null;
    }
  });

  [hs, hp].forEach(btn => {
    if (btn) {
      btn.addEventListener('click', triggerOpen);
      btn.addEventListener('touchend', triggerOpen, { passive: true });
    }
  });

  if (typeof root.querySelectorAll === 'function') {
    root.querySelectorAll('[data-open]').forEach(el => {
      if (el !== hs && el !== hp) el.addEventListener('click', triggerOpen);
    });
  }

  // Preload and show intro
  if (intro) {
    let shown = false;
    const showIntro = () => {
      if (!shown) {
        shown = true;
        intro.classList.add('rd');
        fitAll();
      }
    };
    const im = new Image();
    im.onload = im.onerror = showIntro;
    im.src = envURL;
    setTimeout(showIntro, 1200);
  }

  // 5. Interactive Scratch Card Controller
  const scratchCanvas = root.querySelector('#t01-scratch-canvas');
  const scratchBtn = root.querySelector('#t01-scratch-btn');
  if (scratchCanvas && typeof scratchCanvas.getContext === 'function') {
    const sCtx = scratchCanvas.getContext('2d');
    let scratchDone = false;
    let isScratching = false;

    function paintScratch() {
      if (!scratchCanvas || !sCtx || scratchDone) return;
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const r = scratchCanvas.getBoundingClientRect();
      const rw = r.width || scratchCanvas.offsetWidth || 280;
      const rh = r.height || scratchCanvas.offsetHeight || 100;
      if (rw <= 0 || rh <= 0) return;
      scratchCanvas.width = Math.max(1, Math.floor(rw * dpr));
      scratchCanvas.height = Math.max(1, Math.floor(rh * dpr));
      if (sCtx.scale) sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      // Rich royal gold & crimson foil gradient
      const grad = sCtx.createLinearGradient(0, 0, rw, rh);
      grad.addColorStop(0, '#8c1426');
      grad.addColorStop(0.3, '#d4af37');
      grad.addColorStop(0.5, '#f7e08a');
      grad.addColorStop(0.7, '#d4af37');
      grad.addColorStop(1, '#5a0a14');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, rw, rh);

      // Gold border
      sCtx.lineWidth = 2;
      sCtx.strokeStyle = '#ffe082';
      sCtx.strokeRect(2, 2, rw - 4, rh - 4);

      // Scratch prompt text
      sCtx.font = "bold 13px 'Cinzel', Georgia, serif";
      sCtx.fillStyle = '#ffffff';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      sCtx.shadowBlur = 6;
      sCtx.fillText('✦ SCRATCH TO REVEAL ✦', rw / 2, rh / 2);
    }

    function revealScratch() {
      if (scratchDone) return;
      scratchDone = true;
      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        const r = scratchCanvas.getBoundingClientRect();
        window.RoyalScratchCracker.triggerFirecrackerCelebration(r.left + r.width / 2, r.top + r.height / 2);
      }
      if (scratchCanvas) {
        scratchCanvas.style.transition = 'opacity 0.6s ease';
        scratchCanvas.style.opacity = '0';
        scratchCanvas.style.pointerEvents = 'none';
        setTimeout(() => { if (scratchCanvas) scratchCanvas.style.display = 'none'; }, 600);
      }
      if (scratchBtn) scratchBtn.style.display = 'none';
    }

    let scratchedCount = 0;
    function scratchAt(clientX, clientY) {
      if (scratchDone || !scratchCanvas || !sCtx) return;
      if (scratchCanvas.width <= 1) paintScratch();
      const rect = scratchCanvas.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      sCtx.save();
      sCtx.globalCompositeOperation = 'destination-out';
      sCtx.beginPath();
      sCtx.arc(x, y, 22, 0, Math.PI * 2);
      sCtx.fill();
      sCtx.restore();

      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        window.RoyalScratchCracker.emitPhuljhariSparks(clientX, clientY, 8);
      }

      scratchedCount++;
      if (scratchedCount > 20) {
        revealScratch();
      }
    }

    setTimeout(paintScratch, 100);
    setTimeout(paintScratch, 500);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', paintScratch, { passive: true });
      cleanups.push(() => window.removeEventListener('resize', paintScratch));
    }

    if (sc) {
      const onScrollCheck = () => {
        if (!scratchDone && scratchCanvas.width <= 1) paintScratch();
      };
      sc.addEventListener('scroll', onScrollCheck, { passive: true });
      cleanups.push(() => sc.removeEventListener('scroll', onScrollCheck));
    }

    scratchCanvas.addEventListener('mousedown', e => { isScratching = true; scratchAt(e.clientX, e.clientY); });
    scratchCanvas.addEventListener('mousemove', e => { if (isScratching) scratchAt(e.clientX, e.clientY); });
    scratchCanvas.addEventListener('mouseup', () => { isScratching = false; });
    scratchCanvas.addEventListener('mouseleave', () => { isScratching = false; });

    scratchCanvas.addEventListener('touchstart', e => {
      isScratching = true;
      if (e.touches && e.touches[0]) scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    scratchCanvas.addEventListener('touchmove', e => {
      if (isScratching && e.touches && e.touches[0]) {
        try { e.preventDefault(); } catch (_) {}
        scratchAt(e.touches[0].clientX, e.touches[0].clientY);
      }
    }, { passive: false });
    scratchCanvas.addEventListener('touchend', () => { isScratching = false; });

    if (scratchBtn) {
      scratchBtn.addEventListener('click', revealScratch);
    }
  }

  // 6. Live Countdown Timer
  const cdEl = root.querySelector('#t01-countdown');
  if (cdEl && cdEl.dataset.target) {
    const targetMs = new Date(cdEl.dataset.target).getTime();
    if (!isNaN(targetMs)) {
      const daysEl = cdEl.querySelector('[data-cd="days"]');
      const hoursEl = cdEl.querySelector('[data-cd="hours"]');
      const minsEl = cdEl.querySelector('[data-cd="minutes"]');
      const secsEl = cdEl.querySelector('[data-cd="seconds"]');

      const updateCountdown = () => {
        const diff = targetMs - Date.now();
        if (diff <= 0) {
          if (daysEl) daysEl.textContent = '00';
          if (hoursEl) hoursEl.textContent = '00';
          if (minsEl) minsEl.textContent = '00';
          if (secsEl) secsEl.textContent = '00';
          return;
        }
        const d = Math.floor(diff / 86400000);
        const h = Math.floor((diff % 86400000) / 3600000);
        const m = Math.floor((diff % 3600000) / 60000);
        const s = Math.floor((diff % 60000) / 1000);

        if (daysEl) daysEl.textContent = pad(d);
        if (hoursEl) hoursEl.textContent = pad(h);
        if (minsEl) minsEl.textContent = pad(m);
        if (secsEl) secsEl.textContent = pad(s);
      };
      updateCountdown();
      countdownTimer = setInterval(updateCountdown, 1000);
      cleanups.push(() => clearInterval(countdownTimer));
    }
  }

  // 7. Start Again Button
  const restartBtn = root.querySelector('[data-restart]');
  if (restartBtn && sc) {
    restartBtn.addEventListener('click', () => {
      sc.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return () => {
    if (sparkRaf) cancelAnimationFrame(sparkRaf);
    if (countdownTimer) clearInterval(countdownTimer);
    timers.forEach(t => clearTimeout(t));
    cleanups.forEach(fn => { try { fn(); } catch (_) {} });
  };
}
