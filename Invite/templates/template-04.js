/* ==========================================================================
   Template 04 — Royal Butterfly Garden Invitation Suite
   Inspired by Royal Palace Butterfly Wings, Fairy Dust Canvas & Glassmorphism
   Full Dynamic Integration matching Template 06 Architecture
   ========================================================================== */

const ESC_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = v => String(v ?? '').replace(/[&<>"']/g, ch => ESC_MAP[ch]);
const clean = v => String(v ?? '').trim();

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

const safeUrl = v => (/^https?:\/\//i.test(clean(v)) ? esc(clean(v)) : '');

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
  if (!p) return clean(v) || 'Date To Follow';
  return `${p.dayName}, ${p.d} ${p.monthName} ${p.y}`;
}

function formatEventDate(v) {
  const p = parseDate(v);
  if (!p) return clean(v) || '';
  return `${p.d} ${p.monthShort} ${p.y} (${p.dayShort})`;
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

export default function renderT04({ guest, wedding, events = [] } = {}) {
  const w = wedding || {};
  const orderRef = clean(w.order_reference) || clean(w.ref) || '';
  const isT04Match = !w.template_id || w.template_id === 'template-04' || w.template_id === '04';

  const storedBride = (isT04Match && orderRef) ? getStoredPhoto(`wedding_bride_photo_${orderRef}`) : '';
  const storedGroom = (isT04Match && orderRef) ? getStoredPhoto(`wedding_groom_photo_${orderRef}`) : '';
  const storedVenue = (isT04Match && orderRef) ? getStoredPhoto(`wedding_venue_photo_${orderRef}`) : '';

  // Bride & Groom Names
  const brideName = clean(w.bride_name) || 'Bride';
  const groomName = clean(w.groom_name) || 'Groom';
  const brideInit = brideName.charAt(0).toUpperCase() || 'B';
  const groomInit = groomName.charAt(0).toUpperCase() || 'G';
  const brideFirst = clean(w.name_order) === 'bride_first';

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

  const dynamicVenue = primaryVenueTitle;
  const mapUrl = clean(w.map_url) || (primaryVenueTitle ? `https://maps.google.com/?q=${encodeURIComponent(primaryVenueTitle + ' ' + secondaryAddress)}` : '');
  const venueComment = clean(w.comment) || clean(w.venue_comment) || clean(w.note) || '';

  // Date & Auspicious Timing
  const rawDate = clean(w.date);
  const rawTime = clean(w.time);
  const dateObj = parseDate(rawDate);
  const dateLong = rawDate ? formatDateLong(rawDate) : 'Date To Follow';
  const dayName = dateObj ? dateObj.dayName : '';
  const timeFormatted = formatTime(rawTime);
  const timeStr = timeFormatted ? `${timeFormatted} Onwards` : (rawDate ? 'Auspicious Muhurat' : 'Time To Follow');

  // Target timestamp for Countdown
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

  // Google Calendar link
  let gcalDateStart = null;
  if (dateObj) {
    gcalDateStart = new Date(dateObj.y, dateObj.mo - 1, dateObj.d, 19, 0, 0);
  }
  const gcalUrl = buildGCalUrl({
    title: `${groomName} & ${brideName}'s Wedding`,
    start: gcalDateStart,
    location: `${primaryVenueTitle}, ${secondaryAddress}`,
    details: `Cordially inviting you to celebrate the wedding of ${groomName} & ${brideName}.`
  });

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

  // Page 1 tP Badge text
  const tPText = hasFamily
    ? 'Family'
    : (guest?.persons && guest.persons > 1 ? `${guest.persons} Persons` : 'Personal Invitation');

  // Events / Programme List
  const defaultEvents = [
    { event_name: 'Mehendi & Sangeet', event_date: rawDate || '2026-11-20', event_time: '17:00', venue: primaryVenueTitle, note: 'An evening of joyful music, henna, and celebratory melodies.' },
    { event_name: 'Wedding Ceremony', event_date: rawDate || '2026-11-20', event_time: rawTime || '19:30', venue: primaryVenueTitle, note: 'Auspicious wedding vows and royal banquet dinner.' }
  ];
  const eventList = (Array.isArray(events) && events.length) ? events : defaultEvents;

  // Signature
  const signature = clean(w.footer_text) || clean(w.families) || `With Best Compliments from Near & Dear Ones`;

  return `
<!-- Template 04: Royal Butterfly Garden Invitation Suite -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,600;0,700;1,600;1,700&family=Great+Vibes&display=swap" rel="stylesheet">

<style id="t04-styles">
:root {
  --landing: url("./assets/template-04-landing.webp");
  --page: url("./assets/template-04-page.webp");
  --border: url("./assets/template-04-border.webp");
  --bfly: url("./assets/template-04-butterfly.webp");
}
.t04-wrapper {
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
  background: #070d1f;
  overflow: hidden;
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
}
.t04-wrapper * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}
.stage {
  position: relative;
  width: 100%;
  max-width: 480px;
  height: 100%;
  height: 100dvh;
  min-height: 100dvh;
  margin: 0 auto;
  container-type: size;
  overflow: hidden;
  background: #fff9ec;
  font-family: 'Cormorant Garamond', serif;
  box-shadow: 0 0 50px rgba(0, 0, 0, 0.7);
  image-rendering: -webkit-optimize-contrast;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
@media (max-width: 600px) {
  .stage {
    max-width: 100% !important;
    width: 100vw !important;
    height: 100dvh !important;
    min-height: 100dvh !important;
    border-radius: 0 !important;
    box-shadow: none !important;
  }
}
.scroller {
  position: absolute;
  inset: 0;
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  overscroll-behavior: contain;
  padding-bottom: 80px;
}
.scroller::-webkit-scrollbar { display: none; }
.scroller.lock { overflow: hidden; }

.pg {
  position: relative;
  height: 100cqh;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;
}
#p2 {
  background: var(--page) center/100% 100% no-repeat;
}
.glow {
  position: absolute;
  width: 30cqw;
  height: 30cqw;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(255, 200, 90, 0.85), rgba(255, 170, 60, 0.3) 40%, transparent 70%);
  mix-blend-mode: screen;
  transform: translate(-50%, -50%);
  opacity: 0;
  will-change: opacity, transform;
}
.on .glow { animation: pulse 3s ease-in-out infinite; }
@keyframes pulse {
  0%, 100% { opacity: .5; transform: translate(-50%, -50%) scale(.9); }
  50% { opacity: 1; transform: translate(-50%, -50%) scale(1.12); }
}

.card {
  position: absolute;
  left: 7%;
  right: 7%;
  top: 8%;
  bottom: 8%;
  border-radius: 3.5cqw;
  background: linear-gradient(160deg, rgba(255, 252, 244, 0.75), rgba(255, 244, 222, 0.55) 55%, rgba(255, 250, 240, 0.70));
  backdrop-filter: blur(7px) saturate(1.15);
  -webkit-backdrop-filter: blur(7px) saturate(1.15);
  box-shadow: inset 0 0 0 0.25cqw rgba(201, 162, 74, 0.85),
              inset 0 0 0 1cqw rgba(255, 248, 230, 0.5),
              inset 0 0 0 1.25cqw rgba(201, 162, 74, 0.45),
              0 2cqw 6cqw rgba(90, 58, 8, 0.28);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: safe center;
  padding: 4cqw 3cqw;
  text-align: center;
  gap: 2.6cqw;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 2;
}
.card::-webkit-scrollbar { display: none; }

#p2::before {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(60, 35, 5, 0.22));
  pointer-events: none;
}
#p2::after {
  content: '';
  position: absolute;
  inset: -20%;
  background: linear-gradient(105deg, transparent 42%, rgba(255, 240, 190, 0.28) 50%, transparent 58%);
  mix-blend-mode: screen;
  pointer-events: none;
  animation: ray 9s ease-in-out infinite;
}
@keyframes ray {
  0% { transform: translateX(-40%); }
  60%, 100% { transform: translateX(40%); }
}

.rv {
  opacity: 0;
  transform: translateY(2cqw);
  transition: opacity .8s ease, transform .8s ease;
  transition-delay: calc(var(--i, 0) * .22s);
}
.show .rv { opacity: 1; transform: none; }

.kick {
  font: 700 3.4cqw/1 Cinzel, serif;
  letter-spacing: .5cqw;
  color: #5a3a08;
  text-transform: uppercase;
}
.sub-kick {
  font: 600 2.6cqw/1.2 Cinzel, serif;
  letter-spacing: .25cqw;
  color: #7a1220;
}
.div {
  width: 38cqw;
  height: .35cqw;
  background: linear-gradient(90deg, transparent, #c9a24a, transparent);
  position: relative;
  margin: .4cqw 0;
}
.div::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1.6cqw;
  height: 1.6cqw;
  background: #c9a24a;
  transform: translate(-50%, -50%) rotate(45deg);
  box-shadow: 0 0 1.5cqw rgba(255, 214, 110, 0.9);
}

.pair {
  display: flex;
  gap: 2cqw;
  width: 100%;
  justify-content: center;
  align-items: flex-start;
}
.col {
  width: 32cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .9cqw;
}
.amp {
  font: 9cqw/1 'Great Vibes', cursive;
  color: #b8892b;
  align-self: center;
  margin-top: -15cqw;
}
.ph {
  width: 25cqw;
  height: 25cqw;
  border-radius: 50%;
  padding: .9cqw;
  background: conic-gradient(#f7e08a, #b8892b, #fff3b8, #9a6f1c, #f7e08a);
  box-shadow: 0 .6cqw 2cqw rgba(90, 58, 8, 0.4), 0 0 3cqw rgba(255, 205, 100, 0.55);
}
.ph > div {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: #f4e6c4;
  display: grid;
  place-items: center;
  font: 12cqw/1 'Great Vibes', cursive;
  color: #0b1740;
}
.ph img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.nm {
  font: 7.2cqw/1.15 'Great Vibes', cursive;
  color: #0b1740;
  white-space: nowrap;
  filter: drop-shadow(0 .2cqw .2cqw rgba(201, 162, 74, 0.6));
}
.rel {
  font: 600 2.3cqw/1 Cinzel, serif;
  letter-spacing: .3cqw;
  color: #5a3a08;
}
.fa {
  font: 700 3cqw/1.1 'Cormorant Garamond', serif;
  color: #1a1004;
}
.ad {
  font: 600 2.7cqw/1.3 'Cormorant Garamond', serif;
  color: #1a1004;
  max-width: 30cqw;
  overflow-wrap: anywhere;
}

/* Inner Paper Cards */
.pg.paper {
  background: radial-gradient(#fff9ec, #f7e8c8 70%, #ebd29d);
}
.bd {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 8.5cqw;
  height: 100%;
  background: var(--border) 0 0/auto 100% no-repeat;
  -webkit-mask: linear-gradient(90deg, #000 70%, transparent);
  mask: linear-gradient(90deg, #000 70%, transparent);
  z-index: 1;
}
.bd.l { left: 0; }
.bd.r { right: 0; transform: scaleX(-1); }

.card-paper {
  position: absolute;
  left: 6%;
  right: 6%;
  top: 4.5%;
  bottom: 4.5%;
  border-radius: 3.5cqw;
  background: linear-gradient(160deg, rgba(255, 252, 244, 0.85), rgba(255, 246, 228, 0.72) 55%, rgba(255, 250, 240, 0.82));
  backdrop-filter: blur(8px) saturate(1.15);
  -webkit-backdrop-filter: blur(8px) saturate(1.15);
  box-shadow: inset 0 0 0 0.2cqw rgba(201, 162, 74, 0.85),
              inset 0 0 0 0.8cqw rgba(255, 248, 230, 0.5),
              inset 0 0 0 1.0cqw rgba(201, 162, 74, 0.4),
              0 2cqw 5cqw rgba(90, 58, 8, 0.22);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 4.5cqw 3.5cqw;
  text-align: center;
  gap: 2.2cqw;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 2;
}
.card-paper::-webkit-scrollbar { display: none; }

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
  background: rgba(255, 255, 255, 0.75);
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

/* Interactive Royal Scratch Card for Date & Muhurat */
.t04-scratch-wrap {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.5cqw;
  margin: 1cqw 0;
}
.t04-scratch-box {
  position: relative;
  width: 100%;
  max-width: 44cqw;
  height: 22cqw;
  border-radius: 2.5cqw;
  overflow: hidden;
  box-shadow: 0 1cqw 3cqw rgba(90, 58, 8, 0.25);
  border: 1.5px solid #c9a24a;
  background: #fff;
}
.t04-scratch-unveiled {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5cqw;
  gap: .6cqw;
  background: linear-gradient(135deg, #fffdf8, #fdf4df);
  text-align: center;
}
.t04-scratch-icon { font-size: 5cqw; line-height: 1; }
.t04-scratch-date {
  font: 700 3.6cqw/1.15 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .1cqw;
}
.t04-scratch-time {
  font: 600 2.8cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}
.t04-scratch-badge {
  font: 700 2.1cqw/1 Cinzel, serif;
  letter-spacing: .15cqw;
  color: #b8892b;
  text-transform: uppercase;
}
.t04-scratch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
  z-index: 2;
}
.t04-scratch-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.2cqw;
  padding: 1.8cqw 3.8cqw;
  border-radius: 50px;
  background: linear-gradient(135deg, #b8892b, #e0be6c 50%, #9a6f1c);
  color: #fff;
  font: 700 2.3cqw/1 Cinzel, serif;
  letter-spacing: .2cqw;
  border: 1px solid rgba(255, 235, 170, 0.6);
  box-shadow: 0 .6cqw 2cqw rgba(90, 58, 8, 0.25);
  cursor: pointer;
  text-transform: uppercase;
  transition: transform .15s;
}
.t04-scratch-btn:active { transform: scale(0.96); }

/* Date Hero & Countdown */
.countdown-grid {
  display: flex;
  gap: 2cqw;
  width: 100%;
  justify-content: center;
  margin: 1.5cqw 0;
}
.cd-box {
  flex: 1;
  max-width: 16cqw;
  padding: 2.2cqw 1cqw;
  border-radius: 2cqw;
  background: rgba(255, 255, 255, 0.75);
  border: 1px solid rgba(201, 162, 74, 0.6);
  box-shadow: 0 .6cqw 1.8cqw rgba(90, 58, 8, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .5cqw;
}
.cd-val {
  font: 700 5.5cqw/1 Cinzel, serif;
  color: #6b0f1a;
}
.cd-lbl {
  font: 600 2.2cqw/1 Cinzel, serif;
  letter-spacing: .15cqw;
  color: #5a3a08;
  text-transform: uppercase;
}

/* Venue Showcase */
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
.venue-arch-icon {
  font-size: 8cqw;
}
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

/* Gold Action Buttons */
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

/* Page 1 Intro / Landing Screen */
#intro {
  position: absolute;
  inset: 0;
  z-index: 5;
  background: var(--landing) center/100% 100% no-repeat;
  opacity: 0;
  transition: opacity .5s, transform 1.2s ease;
  will-change: opacity, transform;
}
#intro.ready { opacity: 1; }
#intro.out {
  opacity: 0;
  transform: scale(1.06);
  transition: opacity 1.6s ease, transform 1.6s ease;
  pointer-events: none;
}
.tx {
  position: absolute;
  left: 0;
  right: 0;
  text-align: center;
  pointer-events: none;
  transform: translateY(-50%);
  max-width: 88cqw;
  margin: 0 auto;
  white-space: nowrap;
}
.tx span { display: inline-block; }

#tW {
  top: 8.2%;
  font: 700 5.4cqw/1 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .7cqw;
}
#tW span, .nmL span, #tN span {
  background: linear-gradient(100deg, #5a0a14 0%, #8c1426 38%, #e3b04a 50%, #8c1426 62%, #5a0a14 100%) 0 0/260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  -webkit-text-fill-color: transparent;
  animation: sheen 6s ease-in-out infinite;
  padding: 0 .4cqw;
}
@keyframes sheen {
  0%, 35% { background-position: 100% 0; }
  80%, 100% { background-position: 0 0; }
}
#tW, .nmL, #tN {
  filter: drop-shadow(0 .25cqw .35cqw rgba(214, 170, 70, 0.55));
}
#tC {
  top: 12.0%;
  font: 600 2.8cqw/1 Cinzel, serif;
  color: #5a3a08;
  letter-spacing: .45cqw;
}
.nmL {
  font: 7.2cqw/1 'Great Vibes', cursive;
  color: #7a1220;
}
#tG { top: 17.8%; }
#tA {
  top: 23.2%;
  font: 6.8cqw/1 'Great Vibes', cursive;
  color: #b8892b;
  text-shadow: 0 0 1cqw rgba(255, 230, 150, 0.9);
}
#tB { top: 28.2%; }
#tI {
  top: 35.0%;
  font: 600 2.7cqw/1 Cinzel, serif;
  color: #5a3a08;
  letter-spacing: .45cqw;
}
#tN {
  top: 40.2%;
  font: 700 italic 5.8cqw/1.1 'Cormorant Garamond', serif;
  color: #6b0f1a;
  overflow: hidden;
  text-overflow: ellipsis;
}
#tP {
  top: 45.0%;
  font: 600 2.8cqw/1 Cinzel, serif;
  color: #4a2c06;
  letter-spacing: .35cqw;
}
#pill {
  position: absolute;
  left: 30.2%;
  width: 39.6%;
  top: 79%;
  height: 8.5%;
  border: 0;
  background: none;
  cursor: pointer;
  z-index: 6;
}
#fx {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 9;
  mix-blend-mode: screen;
}

/* 3D Butterfly positioned centered in the lower arch */
.bf {
  position: absolute;
  left: 21%;
  top: 53%;
  width: 58cqw;
  height: 47cqw;
  z-index: 8;
  perspective: 100cqw;
  cursor: pointer;
  will-change: transform, opacity;
  transform-origin: 50% 50%;
  --a: 24deg;
}
.bf.fast {
  --fl: .22s;
  --a: 58deg;
}
.bf.dead { pointer-events: none; }
.bf i {
  position: absolute;
  top: 0;
  height: 100%;
  background: var(--bfly) 0 0/auto 100% no-repeat;
  will-change: transform;
  backface-visibility: visible;
}
.bf .l {
  left: 0;
  width: 60%;
  background-size: 166.67% 100%;
  background-position: 0 0;
  transform-origin: 100% 50%;
  animation: wl var(--fl, 3.2s) ease-in-out infinite;
}
.bf .r {
  left: 60%;
  width: 40%;
  background-size: 250% 100%;
  background-position: 100% 0;
  transform-origin: 0 50%;
  animation: wr var(--fl, 3.2s) ease-in-out infinite;
}
.bf .b {
  left: 55.6%;
  width: 12.8%;
  background-size: 781.25% 100%;
  background-position: 63.8% 0;
  z-index: 2;
}
@keyframes wl {
  0%, 100% { transform: rotateY(0); }
  50% { transform: rotateY(var(--a, 24deg)); }
}
@keyframes wr {
  0%, 100% { transform: rotateY(0); }
  50% { transform: rotateY(calc(var(--a, 24deg) * -1)); }
}
.bf::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(115deg, transparent 40%, rgba(255, 255, 255, 0.55) 50%, transparent 60%) -150% 0/250% 100%;
  mix-blend-mode: overlay;
  -webkit-mask: var(--bfly) 0 0/100% 100% no-repeat;
  mask: var(--bfly) 0 0/100% 100% no-repeat;
  animation: glint 3.6s ease-in-out infinite;
  pointer-events: none;
}
@keyframes glint {
  0%, 60% { background-position: -150% 0; }
  100% { background-position: 150% 0; }
}

@media (prefers-reduced-motion: reduce) {
  .bf i, .bf::after, .on .glow { animation-duration: 6s; }
}
</style>

<div class="t04-wrapper">
  <main class="stage" id="stage">
    <!-- Scrollable Snapping Pages -->
    <div class="scroller lock" id="sc">
      <!-- Page 2: The Wedding Of -->
      <section class="pg" id="p2">
        <div class="glow" style="left:8.8%;top:72.3%"></div>
        <div class="glow" style="left:91.5%;top:72%"></div>
        <div class="card" id="card">
          <div class="kick rv" style="--i:0">THE WEDDING OF</div>
          <div class="div rv" style="--i:1"></div>
          <div class="pair rv" style="--i:2">
            ${brideFirst ? `
            <!-- Bride Column -->
            <div class="col" style="--i:0">
              <div class="ph">
                <div>
                  <img src="${bridePhoto}" alt="${esc(brideName)}" onerror="this.style.display='none';this.parentElement.textContent='${brideInit}';" />
                </div>
              </div>
              <div class="nm">${esc(brideName)}</div>
              <div class="rel">DAUGHTER OF</div>
              ${brideParents ? `<div class="fa">${esc(brideParents)}</div>` : ''}
              ${brideAddress ? `<div class="ad">${esc(brideAddress)}</div>` : ''}
            </div>
            <div class="amp">&amp;</div>
            <!-- Groom Column -->
            <div class="col" style="--i:1">
              <div class="ph">
                <div>
                  <img src="${groomPhoto}" alt="${esc(groomName)}" onerror="this.style.display='none';this.parentElement.textContent='${groomInit}';" />
                </div>
              </div>
              <div class="nm">${esc(groomName)}</div>
              <div class="rel">SON OF</div>
              ${groomParents ? `<div class="fa">${esc(groomParents)}</div>` : ''}
              ${groomAddress ? `<div class="ad">${esc(groomAddress)}</div>` : ''}
            </div>
            ` : `
            <!-- Groom Column -->
            <div class="col" style="--i:0">
              <div class="ph">
                <div>
                  <img src="${groomPhoto}" alt="${esc(groomName)}" onerror="this.style.display='none';this.parentElement.textContent='${groomInit}';" />
                </div>
              </div>
              <div class="nm">${esc(groomName)}</div>
              <div class="rel">SON OF</div>
              ${groomParents ? `<div class="fa">${esc(groomParents)}</div>` : ''}
              ${groomAddress ? `<div class="ad">${esc(groomAddress)}</div>` : ''}
            </div>
            <div class="amp">&amp;</div>
            <!-- Bride Column -->
            <div class="col" style="--i:1">
              <div class="ph">
                <div>
                  <img src="${bridePhoto}" alt="${esc(brideName)}" onerror="this.style.display='none';this.parentElement.textContent='${brideInit}';" />
                </div>
              </div>
              <div class="nm">${esc(brideName)}</div>
              <div class="rel">DAUGHTER OF</div>
              ${brideParents ? `<div class="fa">${esc(brideParents)}</div>` : ''}
              ${brideAddress ? `<div class="ad">${esc(brideAddress)}</div>` : ''}
            </div>
            `}
          </div>
        </div>
      </section>

      <!-- Page 3: Wedding Programme with Ceremony Photos -->
      <section class="pg paper" id="p3">
        <div class="bd l"></div>
        <div class="bd r"></div>
        <div class="card-paper" id="prog-card">
          <div class="kick">WEDDING PROGRAMME</div>
          <div class="sub-kick">Sacred Ceremonies &amp; Celebrations</div>
          <div class="div"></div>
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
                  <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="add-cal-link">
                    📅 Add To Calendar
                  </a>
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- Page 4: Auspicious Timing & Scratch Card Date Reveal -->
      <section class="pg paper" id="p4">
        <div class="bd l"></div>
        <div class="bd r"></div>
        <div class="card-paper" id="date-card">
          <div class="kick">AUSPICIOUS TIMING</div>
          <div class="sub-kick">Scratch To Reveal Wedding Date</div>
          <div class="div"></div>

          <!-- Interactive Scratch Card -->
          <div class="t04-scratch-wrap">
            <div class="t04-scratch-box" id="t04-scratch-box">
              <div class="t04-scratch-unveiled">
                <span class="t04-scratch-icon">💍</span>
                <div class="t04-scratch-date">${esc(dateLong)}</div>
                <div class="t04-scratch-time">⏰ Auspicious Muhurat: ${esc(timeStr)}</div>
                <div class="t04-scratch-badge">✦ Shubh Vivah · Sacred Union ✦</div>
              </div>
              <canvas id="t04-scratch-canvas" class="t04-scratch-canvas" aria-label="Scratch to reveal the wedding date"></canvas>
            </div>
            <button type="button" class="t04-scratch-btn" id="t04-scratch-btn">
              <span>✨</span> Scratch or Tap to Reveal
            </button>
          </div>

          <!-- Live Countdown Timer -->
          <div class="countdown-grid" id="t04-countdown" data-target="${countdownTarget}">
            <div class="cd-box"><span class="cd-val" data-cd="days">00</span><span class="cd-lbl">Days</span></div>
            <div class="cd-box"><span class="cd-val" data-cd="hours">00</span><span class="cd-lbl">Hours</span></div>
            <div class="cd-box"><span class="cd-val" data-cd="minutes">00</span><span class="cd-lbl">Mins</span></div>
            <div class="cd-box"><span class="cd-val" data-cd="seconds">00</span><span class="cd-lbl">Secs</span></div>
          </div>

          <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="gold-btn-sm" id="t04-calendar">
            📅 Add to Google Calendar
          </a>
        </div>
      </section>

      <!-- Page 5: Celebration Venue & Directions -->
      <section class="pg paper" id="p5">
        <div class="bd l"></div>
        <div class="bd r"></div>
        <div class="card-paper" id="venue-card">
          <div class="kick">CELEBRATION VENUE</div>
          <div class="sub-kick">${esc(primaryVenueTitle)}</div>
          <div class="div"></div>
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
            <a href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer" class="gold-btn" id="t04-maps">
              📍 Get Directions • Google Maps
            </a>
          </div>

          <div class="venue-signature">
            <div class="sig-name">${esc(signature)}</div>
            <div class="sig-sub">We eagerly look forward to celebrating with you!</div>
            <button type="button" class="start-again-btn" data-restart>Start Again ↻</button>
          </div>
        </div>
      </section>
    </div>

    <!-- Entrance Landing Screen with Exact Butterfly Animations -->
    <div id="intro">
      <div class="tx" id="tW"><span>WELCOME</span></div>
      <div class="tx" id="tC"><span>A CELEBRATION OF LOVE</span></div>
      <div class="tx nmL" id="tG"><span>${esc(groomName)}</span></div>
      <div class="tx" id="tA"><span>&amp;</span></div>
      <div class="tx nmL" id="tB"><span>${esc(brideName)}</span></div>
      <div class="tx" id="tI"><span>CORDIALLY INVITED</span></div>
      <div class="tx" id="tN"><span>${esc(guestDisplayName)}</span></div>
      <div class="tx" id="tP"><span>${esc(tPText)}</span></div>
      <button id="pill" aria-label="Open"></button>
    </div>

    <canvas id="fx"></canvas>
    <div class="bf" id="bf" role="button" aria-label="Open invitation"><i class="l"></i><i class="r"></i><i class="b"></i></div>
  </main>
</div>
`;
}

export function mount(root, { guest, wedding, events } = {}) {
  if (!root) return () => {};

  const st = (typeof root.querySelector === 'function' ? root.querySelector('#stage') : null) || root;
  const bf = typeof root.querySelector === 'function' ? root.querySelector('#bf') : null;
  const pill = typeof root.querySelector === 'function' ? root.querySelector('#pill') : null;
  const intro = typeof root.querySelector === 'function' ? root.querySelector('#intro') : null;
  const cv = typeof root.querySelector === 'function' ? root.querySelector('#fx') : null;
  const sc = typeof root.querySelector === 'function' ? root.querySelector('#sc') : null;
  const p2 = typeof root.querySelector === 'function' ? root.querySelector('#p2') : null;

  let raf = 0;
  let countdownTimer = null;
  const cleanups = [];

  // 1. Text Fitting with safe padding & bounds
  const fit = (el, maxCq) => {
    if (!el || !st) return;
    const s = el.firstElementChild || el;
    if (!s) return;
    el.style.fontSize = '';
    const base = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
      ? parseFloat(window.getComputedStyle(el).fontSize || '16')
      : 16;
    const clientW = st.clientWidth || 360;
    const mx = maxCq * clientW / 100;
    el.style.fontSize = base + 'px';
    const w = typeof s.getBoundingClientRect === 'function' ? s.getBoundingClientRect().width : 0;
    if (w > mx && mx > 0) el.style.fontSize = Math.max(11, base * mx / w) + 'px';
  };

  const fitAll = () => {
    if (typeof root.querySelector !== 'function') return;
    ['tW', 'tC', 'tG', 'tB', 'tI', 'tN', 'tP'].forEach(id => {
      const el = root.querySelector('#' + id);
      if (el) fit(el, 82);
    });
    if (typeof root.querySelectorAll === 'function') {
      root.querySelectorAll('.nm').forEach(el => {
        el.style.fontSize = '';
        const base = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
          ? parseFloat(window.getComputedStyle(el).fontSize || '16')
          : 16;
        const clientW = st.clientWidth || 360;
        const mx = 27 * clientW / 100;
        const w = typeof el.getBoundingClientRect === 'function' ? el.getBoundingClientRect().width : 0;
        if (w > mx && mx > 0) el.style.fontSize = (base * mx / w) + 'px';
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

  // 2. Canvas Fairy Dust Particle Engine
  let P = [];
  if (cv && st && typeof cv.getContext === 'function') {
    const cx = cv.getContext('2d');
    const rs = () => {
      if (!cv || !st || !cx) return;
      const d = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      cv.width = (st.clientWidth || 360) * d;
      cv.height = (st.clientHeight || 540) * d;
      if (typeof cx.setTransform === 'function') cx.setTransform(d, 0, 0, d, 0, 0);
    };
    rs();
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', rs);
      cleanups.push(() => window.removeEventListener('resize', rs));
    }

    const spawn = (k, burst) => {
      if (!bf || !st) return;
      const s = st.getBoundingClientRect(), r = bf.getBoundingClientRect();
      const x = r.left - s.left + r.width / 2 + (Math.random() - .5) * r.width * .5;
      const y = r.top - s.top + r.height / 2 + (Math.random() - .5) * r.height * .4;
      for (let i = 0; i < k; i++) {
        const a = Math.random() * 6.283;
        const v = burst ? 1 + Math.random() * 3 : Math.random() * .6;
        P.push({
          x, y,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v - (burst ? 1 : .3),
          life: 0,
          max: 40 + Math.random() * 50,
          sz: 1 + Math.random() * 2.6,
          hue: 42 + Math.random() * 12
        });
      }
    };

    let trail = false;
    let tLast = 0;
    const loop = (t) => {
      if (!cv || !cx || !st) return;
      cx.clearRect(0, 0, st.clientWidth || 360, st.clientHeight || 540);
      if (trail && t - tLast > 45) {
        spawn(3, false);
        tLast = t;
      }
      for (let i = P.length - 1; i >= 0; i--) {
        const p = P[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += .015;
        p.life++;
        const prog = p.life / p.max;
        if (prog >= 1) { P.splice(i, 1); continue; }
        const op = Math.sin(prog * Math.PI);
        cx.save();
        cx.beginPath();
        cx.arc(p.x, p.y, p.sz * (1 - prog * .4), 0, 6.283);
        cx.fillStyle = `hsla(${p.hue}, 100%, 75%, ${op * .9})`;
        cx.shadowColor = `hsl(${p.hue}, 100%, 65%)`;
        cx.shadowBlur = 8;
        cx.fill();
        cx.restore();
      }
      raf = requestAnimationFrame(loop);
    };

    // 3. Butterfly Flight & Unveiling Sequence
    const tf = (x, y, r, s) => `translate(${x}cqw, ${y}cqh) rotate(${r}deg) scale(${s})`;
    let started = false;

    const start = () => {
      if (started) return;
      started = true;

      // Synchronously trigger background soundtrack
      if (typeof window !== 'undefined') {
        if (typeof window.__startWeddingMusic === 'function') {
          try { window.__startWeddingMusic(true); } catch (_) {}
        }
        try { window.dispatchEvent(new CustomEvent('invitation-unveiled')); } catch (_) {}
      }

      if (!bf || !intro) return;
      bf.classList.add('fast');
      spawn(40, true);

      setTimeout(() => {
        trail = true;
        if (typeof bf.animate === 'function') {
          bf.animate([
            { transform: 'none', opacity: 1, offset: 0 },
            { transform: tf(-3, -14, -5, 1.02), opacity: 1, offset: .2 },
            { transform: tf(-20, -30, -16, .95), opacity: 1, offset: .45 },
            { transform: tf(-34, -42, -26, .86), opacity: 1, offset: .68 },
            { transform: tf(-52, -62, -30, .78), opacity: .9, offset: .88 },
            { transform: tf(-65, -75, -28, .72), opacity: 0, offset: 1 }
          ], { duration: 3400, easing: 'cubic-bezier(.42,.08,.36,1)', fill: 'forwards' });
        }
      }, 250);

      setTimeout(() => intro.classList.add('out'), 2700);

      setTimeout(() => {
        if (typeof bf.getAnimations === 'function') {
          bf.getAnimations().forEach(a => a.cancel());
        }
        bf.classList.add('dead');
        if (typeof bf.animate === 'function') {
          bf.animate([
            { transform: tf(-65, -75, -28, .72), opacity: 0, offset: 0 },
            { transform: tf(-55, -60, -26, .6), opacity: 1, offset: .12 },
            { transform: tf(-44, -48, -14, .46), opacity: 1, offset: .45 },
            { transform: tf(-38, -60, -6, .36), opacity: 1, offset: .78 },
            { transform: tf(-35, -67, -12, .28), opacity: 1, offset: 1 }
          ], { duration: 3000, easing: 'cubic-bezier(.3,.1,.25,1)', fill: 'forwards' });
        }
      }, 3650);

      setTimeout(() => {
        trail = false;
        bf.classList.remove('fast');
      }, 6300);

      setTimeout(() => {
        if (p2) p2.classList.add('show', 'on');
      }, 5000);

      setTimeout(() => {
        if (intro) intro.remove();
        if (sc) sc.classList.remove('lock');
        bf.style.zIndex = '4';
        if (p2) p2.appendChild(bf);
        fitAll();
      }, 7000);
    };

    const onStart = () => { start(); };
    if (bf) {
      bf.addEventListener('click', onStart);
      bf.addEventListener('touchend', onStart, { passive: true });
    }
    if (pill) {
      pill.addEventListener('click', onStart);
      pill.addEventListener('touchend', onStart, { passive: true });
    }

    raf = requestAnimationFrame(loop);
  }

  // Preload and show intro
  if (intro) {
    let shown = false;
    const showIntro = () => {
      if (!shown) {
        shown = true;
        intro.classList.add('ready');
        fitAll();
      }
    };
    const im = new Image();
    im.onload = im.onerror = showIntro;
    im.src = './assets/template-04-landing.webp';
    setTimeout(showIntro, 1200);
  }

  // 4. Interactive Scratch Card Controller
  const scratchCanvas = root.querySelector('#t04-scratch-canvas');
  const scratchBtn = root.querySelector('#t04-scratch-btn');
  if (scratchCanvas && typeof scratchCanvas.getContext === 'function') {
    const sCtx = scratchCanvas.getContext('2d');
    let scratchDone = false;
    let isScratching = false;

    function paintScratch() {
      if (!scratchCanvas || !sCtx || scratchDone) return;
      const dpr = typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1;
      const r = scratchCanvas.getBoundingClientRect();
      const w = Math.max(1, Math.floor((r.width || 280) * dpr));
      const h = Math.max(1, Math.floor((r.height || 120) * dpr));
      scratchCanvas.width = w;
      scratchCanvas.height = h;
      if (sCtx.scale) sCtx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const rw = r.width || 280;
      const rh = r.height || 120;

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
      sCtx.lineWidth = 3;
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
      if (scratchedCount > 28) {
        revealScratch();
      }
    }

    setTimeout(paintScratch, 100);
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', paintScratch, { passive: true });
      cleanups.push(() => window.removeEventListener('resize', paintScratch));
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
      if (isScratching && e.touches && e.touches[0]) scratchAt(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    scratchCanvas.addEventListener('touchend', () => { isScratching = false; });

    if (scratchBtn) {
      scratchBtn.addEventListener('click', revealScratch);
    }
  }

  // 5. Live Countdown Timer
  const cdEl = root.querySelector('#t04-countdown');
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

  // 6. Start Again Button
  const restartBtn = root.querySelector('[data-restart]');
  if (restartBtn && sc) {
    restartBtn.addEventListener('click', () => {
      sc.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  return () => {
    if (raf) cancelAnimationFrame(raf);
    cleanups.forEach(fn => { try { fn(); } catch (_) {} });
  };
}
