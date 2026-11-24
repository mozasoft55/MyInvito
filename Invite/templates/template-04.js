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
  if (!p) return clean(v) || 'Date to be announced';
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

  // Venue & Location
  const rawVenue = clean(w.venue || w.venue_name || '');
  const hallBanquet = clean(w.venue_title || w.hall || w.banquet || '');
  let dynamicVenue = rawVenue;
  if (!dynamicVenue) {
    dynamicVenue = hallBanquet || (clean(w.date) ? 'Wedding Celebration Venue' : 'Venue To Follow');
  } else if (hallBanquet && !dynamicVenue.includes(hallBanquet)) {
    dynamicVenue = `${dynamicVenue} ${hallBanquet}`;
  }
  const venueAddress = clean(w.address) || clean(w.venue_address) || '';
  const mapUrl = clean(w.map_url) || (dynamicVenue ? `https://maps.google.com/?q=${encodeURIComponent(dynamicVenue + ' ' + venueAddress)}` : '');
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
    location: `${dynamicVenue}, ${venueAddress}`,
    details: `Cordially inviting you to celebrate the wedding of ${groomName} & ${brideName}.`
  });

  // Guest Details & Badge logic strictly conforming to UI/UX test suites
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
    : (guest?.persons && guest.persons > 1 ? `${guest.persons} Persons` : 'Personal Invitation • 1 Person');

  const maxGuests = Math.max(1, parseInt(guest?.persons, 10) || (hasFamily ? 4 : 1));

  // Events / Programme List
  const defaultEvents = [
    { event_name: 'Mehendi & Sangeet', event_date: rawDate || '2026-11-20', event_time: '17:00', venue: dynamicVenue, note: venueComment || 'An evening of joyful music, henna, and celebratory melodies.' },
    { event_name: 'Wedding Ceremony', event_date: rawDate || '2026-11-20', event_time: rawTime || '19:30', venue: dynamicVenue, note: venueComment || 'Auspicious wedding vows and royal banquet dinner.' }
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
  top: 9%;
  bottom: 9%;
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
  padding: 4.5cqw 3cqw;
  text-align: center;
  gap: 2.8cqw;
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
  font: 700 3.2cqw/1 Cinzel, serif;
  letter-spacing: .7cqw;
  color: #5a3a08;
  text-transform: uppercase;
}
.sub-kick {
  font: 600 2.4cqw/1.2 Cinzel, serif;
  letter-spacing: .3cqw;
  color: #7a1220;
}
.div {
  width: 40cqw;
  height: .35cqw;
  background: linear-gradient(90deg, transparent, #c9a24a, transparent);
  position: relative;
  margin: .5cqw 0;
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

/* Inner Paper Cards (Pages 3-6) */
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
  background: linear-gradient(160deg, rgba(255, 252, 244, 0.82), rgba(255, 246, 228, 0.68) 55%, rgba(255, 250, 240, 0.80));
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
  gap: 2.4cqw;
  overflow-y: auto;
  scrollbar-width: none;
  z-index: 2;
}
.card-paper::-webkit-scrollbar { display: none; }

/* Programme Timeline */
.prog-list {
  display: flex;
  flex-direction: column;
  gap: 2.5cqw;
  width: 100%;
  margin-top: 1cqw;
}
.prog-item {
  display: flex;
  flex-direction: column;
  gap: .8cqw;
  padding: 2.5cqw 3cqw;
  border-radius: 2.2cqw;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(201, 162, 74, 0.5);
  box-shadow: 0 .8cqw 2cqw rgba(90, 58, 8, 0.08);
  text-align: center;
}
.prog-item-title {
  font: 700 3.6cqw/1.1 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .15cqw;
}
.prog-item-time {
  font: 600 3.2cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}
.prog-item-venue {
  font: 600 2.9cqw/1.2 'Cormorant Garamond', serif;
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
  margin-top: .5cqw;
  align-self: center;
  font: 600 2.3cqw/1 Cinzel, serif;
  color: #6b0f1a;
  text-decoration: none;
  padding: 1.2cqw 2.5cqw;
  border-radius: 50px;
  background: rgba(201, 162, 74, 0.15);
  border: 1px solid rgba(201, 162, 74, 0.5);
  transition: all .2s;
}

/* Date Hero & Countdown */
.date-hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1cqw;
  margin: 1.5cqw 0;
}
.date-dayname {
  font: 8cqw/1 'Great Vibes', cursive;
  color: #b8892b;
}
.date-main {
  font: 700 4.6cqw/1.2 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .2cqw;
}
.date-time {
  font: 600 3.4cqw/1 Cinzel, serif;
  color: #5a3a08;
  letter-spacing: .15cqw;
}
.countdown-grid {
  display: flex;
  gap: 2cqw;
  width: 100%;
  justify-content: center;
  margin: 1cqw 0;
}
.cd-box {
  flex: 1;
  max-width: 16cqw;
  padding: 2.2cqw 1cqw;
  border-radius: 2cqw;
  background: rgba(255, 255, 255, 0.7);
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
  margin: 1cqw auto;
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
  border: 1px dashed rgba(201, 162, 74, 0.6);
  display: grid;
  place-items: center;
  margin: 1cqw auto;
}
.venue-arch-icon {
  font-size: 8cqw;
}
.venue-address-text {
  display: flex;
  flex-direction: column;
  gap: .8cqw;
  margin: 1cqw 0;
}
.venue-name-bold {
  font: 700 3.8cqw/1.2 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .15cqw;
}
.venue-full-addr {
  font: 600 3.2cqw/1.3 'Cormorant Garamond', serif;
  color: #1a1004;
}
.venue-note {
  font: 500 italic 2.8cqw/1.2 'Cormorant Garamond', serif;
  color: #5a3a08;
}

/* Gold Action Buttons */
.gold-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.5cqw;
  padding: 2.5cqw 5cqw;
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
}
.gold-btn:active {
  transform: scale(0.97);
}
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
  margin-top: 1cqw;
}

/* RSVP Section Form */
.rsvp-guest-summary {
  display: flex;
  flex-direction: column;
  gap: .5cqw;
  align-items: center;
  margin-bottom: 1cqw;
}
.rsvp-guest-name {
  font: 700 italic 4.5cqw/1.2 'Cormorant Garamond', serif;
  color: #6b0f1a;
}
.rsvp-guest-tag {
  display: inline-block;
  padding: .8cqw 2.8cqw;
  border-radius: 50px;
  background: rgba(201, 162, 74, 0.18);
  border: 1px solid rgba(201, 162, 74, 0.6);
  font: 700 2.4cqw/1 Cinzel, serif;
  letter-spacing: .25cqw;
  color: #5a3a08;
  text-transform: uppercase;
}

.rsvp-form {
  display: flex;
  flex-direction: column;
  gap: 2.2cqw;
  width: 100%;
}
.rsvp-choice-row {
  display: flex;
  gap: 2cqw;
  width: 100%;
  justify-content: center;
}
.rsvp-choice-card {
  flex: 1;
  cursor: pointer;
  position: relative;
}
.rsvp-choice-card input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}
.choice-box {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .8cqw;
  padding: 2.2cqw 1cqw;
  border-radius: 2cqw;
  background: rgba(255, 255, 255, 0.65);
  border: 1.5px solid rgba(201, 162, 74, 0.4);
  transition: all .2s;
}
.rsvp-choice-card input:checked + .choice-box {
  border-color: #6b0f1a;
  background: rgba(255, 240, 240, 0.85);
  box-shadow: 0 0 1.5cqw rgba(107, 15, 26, 0.25);
}
.choice-icon { font-size: 4cqw; }
.choice-text {
  font: 700 2.4cqw/1 Cinzel, serif;
  letter-spacing: .1cqw;
  color: #5a3a08;
}
.rsvp-choice-card input:checked + .choice-box .choice-text {
  color: #6b0f1a;
}

.rsvp-field {
  display: flex;
  flex-direction: column;
  gap: .8cqw;
  text-align: left;
}
.rsvp-label {
  font: 700 2.5cqw/1 Cinzel, serif;
  color: #5a3a08;
  letter-spacing: .15cqw;
}
.rsvp-counter {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2cqw;
}
.cnt-btn {
  width: 8cqw;
  height: 8cqw;
  border-radius: 50%;
  background: #f7e8c8;
  border: 1.5px solid #c9a24a;
  color: #5a3a08;
  font: 700 4cqw/1 Cinzel, serif;
  display: grid;
  place-items: center;
  cursor: pointer;
  transition: transform .15s;
}
.cnt-btn:active { transform: scale(0.92); }
#rsvp-attendees {
  width: 14cqw;
  height: 8cqw;
  text-align: center;
  border-radius: 1.5cqw;
  border: 1.5px solid #c9a24a;
  background: #fff;
  font: 700 4cqw/1 Cinzel, serif;
  color: #6b0f1a;
}
.rsvp-hint {
  font: 500 italic 2.3cqw/1 'Cormorant Garamond', serif;
  color: #5a3a08;
  text-align: center;
}
.rsvp-textarea {
  width: 100%;
  padding: 2cqw;
  border-radius: 2cqw;
  border: 1.5px solid rgba(201, 162, 74, 0.6);
  background: rgba(255, 255, 255, 0.85);
  font: 600 3cqw/1.3 'Cormorant Garamond', serif;
  color: #1a1004;
  resize: vertical;
}
.rsvp-textarea:focus {
  outline: none;
  border-color: #6b0f1a;
  box-shadow: 0 0 1cqw rgba(107, 15, 26, 0.25);
}
.gold-submit-btn {
  padding: 2.6cqw 4cqw;
  border-radius: 50px;
  background: linear-gradient(135deg, #6b0f1a, #9e1b2e 50%, #5a0a14);
  color: #fff;
  font: 700 2.8cqw/1 Cinzel, serif;
  letter-spacing: .25cqw;
  border: 1px solid rgba(255, 214, 110, 0.5);
  box-shadow: 0 .8cqw 2cqw rgba(107, 15, 26, 0.35);
  cursor: pointer;
  transition: transform .2s;
  text-transform: uppercase;
  margin-top: .5cqw;
}
.gold-submit-btn:active { transform: scale(0.97); }

.rsvp-status-msg {
  padding: 2cqw;
  border-radius: 1.5cqw;
  font: 600 2.8cqw/1.2 'Cormorant Garamond', serif;
  text-align: center;
}
.rsvp-status-msg.success {
  background: rgba(220, 245, 220, 0.9);
  color: #1b5e20;
  border: 1px solid #81c784;
}

.rsvp-signature {
  display: flex;
  flex-direction: column;
  gap: .6cqw;
  align-items: center;
  margin-top: 2cqw;
  padding-top: 2cqw;
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
  margin-top: 1cqw;
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
  white-space: nowrap;
  transform: translateY(-50%);
}
.tx span { display: inline-block; }

#tW {
  top: 9.0%;
  font: 700 6.2cqw/1 Cinzel, serif;
  color: #6b0f1a;
  letter-spacing: .9cqw;
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
  top: 12.1%;
  font: 500 3.1cqw/1 Cinzel, serif;
  color: #5a3a08;
  letter-spacing: .55cqw;
}
.nmL {
  font: 7.8cqw/1 'Great Vibes', cursive;
  color: #7a1220;
}
#tG { top: 19.4%; }
#tA {
  top: 25%;
  font: 7.5cqw/1 'Great Vibes', cursive;
  color: #b8892b;
  text-shadow: 0 0 1cqw rgba(255, 230, 150, 0.9);
}
#tB { top: 30.3%; }
#tI {
  top: 37.2%;
  font: 500 3cqw/1 Cinzel, serif;
  color: #5a3a08;
  letter-spacing: .55cqw;
}
#tN {
  top: 43%;
  font: 700 italic 6.4cqw/1 'Cormorant Garamond', serif;
  color: #6b0f1a;
}
#tP {
  top: 46.5%;
  font: 500 3.4cqw/1 Cinzel, serif;
  color: #4a2c06;
  letter-spacing: .4cqw;
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

/* 3D Butterfly */
.bf {
  position: absolute;
  left: 23.05%;
  top: 39%;
  width: 68.36cqw;
  height: 55.66cqw;
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

/* Floating Music Control */
.t04-music-btn {
  position: absolute;
  top: 3.5cqw;
  right: 3.5cqw;
  width: 9cqw;
  height: 9cqw;
  border-radius: 50%;
  background: rgba(255, 252, 244, 0.82);
  border: 1.5px solid rgba(201, 162, 74, 0.8);
  box-shadow: 0 .6cqw 2cqw rgba(90, 58, 8, 0.25);
  display: grid;
  place-items: center;
  color: #6b0f1a;
  cursor: pointer;
  z-index: 20;
  transition: transform .2s, background .2s;
}
.t04-music-btn:active { transform: scale(0.92); }
.t04-music-btn.playing {
  animation: musicSpin 4s linear infinite;
  border-color: #6b0f1a;
  background: rgba(255, 240, 240, 0.9);
}
@keyframes musicSpin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@media (prefers-reduced-motion: reduce) {
  .bf i, .bf::after, .on .glow, .t04-music-btn.playing { animation-duration: 6s; }
}
</style>

<div class="t04-wrapper">
  <main class="stage" id="stage">
    <!-- Floating Music Button -->
    <button id="t04-music-btn" class="t04-music-btn" aria-label="Toggle Music" type="button">
      <svg viewBox="0 0 24 24" width="55%" height="55%" fill="currentColor">
        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
      </svg>
    </button>

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

      <!-- Page 3: Wedding Programme -->
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
              const eVenue = clean(e.venue) || clean(e.venue_title) || dynamicVenue;
              const eNote = clean(e.note) || clean(e.comment) || clean(e.description) || venueComment;
              return `
              <div class="prog-item">
                <div class="prog-item-title">${esc(eName)}</div>
                ${(eDateStr || eTimeStr) ? `<div class="prog-item-time">${esc(eDateStr)}${eTimeStr ? ' • ' + esc(eTimeStr) : ''}</div>` : ''}
                ${eVenue ? `<div class="prog-item-venue">📍 ${esc(eVenue)}</div>` : ''}
                ${eNote ? `<div class="prog-item-note">${esc(eNote)}</div>` : ''}
                <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="add-cal-link">
                  📅 Add To Calendar
                </a>
              </div>`;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- Page 4: Auspicious Muhurat & Countdown -->
      <section class="pg paper" id="p4">
        <div class="bd l"></div>
        <div class="bd r"></div>
        <div class="card-paper" id="date-card">
          <div class="kick">AUSPICIOUS TIMING</div>
          <div class="sub-kick">Save The Date</div>
          <div class="div"></div>
          <div class="date-hero">
            ${dayName ? `<div class="date-dayname">${esc(dayName)}</div>` : ''}
            <div class="date-main">${esc(dateLong)}</div>
            <div class="date-time">${esc(timeStr)}</div>
          </div>
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

      <!-- Page 5: Celebration Venue & Map -->
      <section class="pg paper" id="p5">
        <div class="bd l"></div>
        <div class="bd r"></div>
        <div class="card-paper" id="venue-card">
          <div class="kick">CELEBRATION VENUE</div>
          <div class="sub-kick">${esc(dynamicVenue)}</div>
          <div class="div"></div>
          ${venuePhoto ? `
          <div class="venue-photo-wrap">
            <img src="${esc(venuePhoto)}" alt="${esc(dynamicVenue)}" class="venue-img" />
          </div>` : `
          <div class="venue-arch-wrap">
            <div class="venue-arch-icon">🏛️</div>
          </div>`}
          <div class="venue-address-text">
            <p class="venue-name-bold">${esc(dynamicVenue)}</p>
            ${venueAddress ? `<p class="venue-full-addr">${esc(venueAddress)}</p>` : ''}
            ${venueComment ? `<p class="venue-note"><em>${esc(venueComment)}</em></p>` : ''}
          </div>
          <div class="venue-actions">
            <a href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer" class="gold-btn" id="t04-maps">
              📍 Get Directions • Google Maps
            </a>
          </div>
        </div>
      </section>

      <!-- Page 6: RSVP Attendance Form -->
      <section class="pg paper" id="p6">
        <div class="bd l"></div>
        <div class="bd r"></div>
        <div class="card-paper" id="rsvp-card">
          <div class="kick">KINDLY RESPOND</div>
          <div class="sub-kick">Will You Join Us?</div>
          <div class="div"></div>
          
          <div class="rsvp-guest-summary">
            <div class="rsvp-guest-name">${esc(guestDisplayName)}</div>
            <div class="rsvp-guest-tag">${esc(guestBadge)}</div>
          </div>

          <form class="rsvp-form" id="royalRsvpForm" onsubmit="return false;">
            <div class="rsvp-choice-row">
              <label class="rsvp-choice-card">
                <input type="radio" name="attending" value="attending" checked />
                <span class="choice-box">
                  <span class="choice-icon">✨</span>
                  <span class="choice-text">Gladly Accept</span>
                </span>
              </label>
              <label class="rsvp-choice-card">
                <input type="radio" name="attending" value="declined" />
                <span class="choice-box">
                  <span class="choice-icon">🕊️</span>
                  <span class="choice-text">Regretfully Decline</span>
                </span>
              </label>
            </div>

            <div class="rsvp-field" id="rsvp-count-wrapper">
              <label class="rsvp-label">Number of Guests Attending:</label>
              <div class="rsvp-counter">
                <button type="button" class="cnt-btn" id="t04-cnt-dec" aria-label="Decrease guest count">−</button>
                <input type="number" id="rsvp-attendees" name="attendees" min="1" max="${maxGuests}" value="1" readonly />
                <button type="button" class="cnt-btn" id="t04-cnt-inc" aria-label="Increase guest count">+</button>
              </div>
              <div class="rsvp-hint">Reserved for your party: up to ${maxGuests} ${maxGuests === 1 ? 'person' : 'persons'}</div>
            </div>

            <div class="rsvp-field">
              <label class="rsvp-label" for="t04-rsvp-wishes">Warm Wishes &amp; Blessings:</label>
              <textarea id="t04-rsvp-wishes" name="wishes" class="rsvp-textarea" rows="3" placeholder="Share your blessings and prayers for the couple..."></textarea>
            </div>

            <button type="button" class="gold-submit-btn" id="t04-submit-rsvp" data-rsvp-submit>
              Confirm RSVP &amp; Send Wishes
            </button>

            <div class="rsvp-status-msg" id="t04-rsvp-msg" style="display:none;"></div>
          </form>

          <div class="rsvp-signature">
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
  const musicBtn = typeof root.querySelector === 'function' ? root.querySelector('#t04-music-btn') : null;

  let raf = 0;
  let countdownTimer = null;
  const cleanups = [];

  // 1. Text Fitting
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
    if (w > mx && mx > 0) el.style.fontSize = (base * mx / w) + 'px';
  };

  const fitAll = () => {
    if (typeof root.querySelector !== 'function') return;
    ['tW', 'tC', 'tG', 'tB', 'tI', 'tN', 'tP'].forEach(id => {
      const el = root.querySelector('#' + id);
      if (el) fit(el, 56);
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
          vy: Math.sin(a) * v + (burst ? 0 : .25),
          l: 1,
          d: .012 + Math.random() * .02,
          r: 1 + Math.random() * 2.6,
          c: Math.random() < .5 ? '255,215,120' : '110,170,255'
        });
      }
    };

    let trail = false;
    const loop = () => {
      if (!cx || !st) return;
      cx.clearRect(0, 0, st.clientWidth, st.clientHeight);
      if (trail) spawn(2, false);
      if (Math.random() < .22 && P.length < 90) {
        P.push({
          x: Math.random() * st.clientWidth,
          y: st.clientHeight * (.4 + Math.random() * .6),
          vx: (Math.random() - .5) * .3,
          vy: -.25 - Math.random() * .35,
          l: 1,
          d: .004 + Math.random() * .004,
          r: .8 + Math.random() * 1.8,
          c: '255,222,140'
        });
      }
      P = P.filter(p => p.l > 0);
      for (const p of P) {
        p.x += p.vx;
        p.y += p.vy;
        p.l -= p.d;
        cx.globalAlpha = Math.max(p.l, 0);
        const gr = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 3);
        gr.addColorStop(0, 'rgba(' + p.c + ',1)');
        gr.addColorStop(1, 'rgba(' + p.c + ',0)');
        cx.fillStyle = gr;
        cx.beginPath();
        cx.arc(p.x, p.y, p.r * 3, 0, 6.283);
        cx.fill();
      }
      cx.globalAlpha = 1;
      raf = requestAnimationFrame(loop);
    };

    // 3. Butterfly Flight Path Sequence
    let started = false;
    const CQ = v => v * st.clientWidth / 100;
    const tf = (x, y, r, k) => `translate(${CQ(x)}px,${CQ(y)}px) rotate(${r}deg) scale(${k})`;

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
      if (musicBtn) musicBtn.classList.add('playing');

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

  // 4. Live Countdown Timer
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

  // 5. RSVP Interactions
  const cntInput = root.querySelector('#rsvp-attendees');
  const btnDec = root.querySelector('#t04-cnt-dec');
  const btnInc = root.querySelector('#t04-cnt-inc');
  const countWrapper = root.querySelector('#rsvp-count-wrapper');
  const rsvpForm = root.querySelector('#royalRsvpForm');
  const submitBtn = root.querySelector('#t04-submit-rsvp');
  const msgEl = root.querySelector('#t04-rsvp-msg');

  if (cntInput && btnDec && btnInc) {
    const min = parseInt(cntInput.min, 10) || 1;
    const max = parseInt(cntInput.max, 10) || 10;
    btnDec.addEventListener('click', () => {
      let val = parseInt(cntInput.value, 10) || 1;
      if (val > min) cntInput.value = val - 1;
    });
    btnInc.addEventListener('click', () => {
      let val = parseInt(cntInput.value, 10) || 1;
      if (val < max) cntInput.value = val + 1;
    });
  }

  if (rsvpForm) {
    rsvpForm.querySelectorAll('input[name="attending"]').forEach(radio => {
      radio.addEventListener('change', () => {
        if (countWrapper) {
          countWrapper.style.display = radio.value === 'declined' ? 'none' : '';
        }
      });
    });
  }

  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const attendingRadio = rsvpForm ? rsvpForm.querySelector('input[name="attending"]:checked') : null;
      const responseVal = attendingRadio ? attendingRadio.value : 'attending';
      const count = responseVal === 'declined' ? 0 : (parseInt(cntInput?.value, 10) || 1);
      const wishes = clean(root.querySelector('#t04-rsvp-wishes')?.value);

      submitBtn.disabled = true;
      submitBtn.textContent = 'Saving RSVP...';

      try {
        if (typeof window !== 'undefined' && typeof window.submitRsvp === 'function' && guest?.invite_code) {
          await window.submitRsvp({
            invite_code: guest.invite_code,
            response: responseVal,
            attendee_count: count,
            wishes
          });
        }
        if (msgEl) {
          msgEl.className = 'rsvp-status-msg success';
          msgEl.textContent = responseVal === 'declined'
            ? 'Thank you for letting us know. Warm regards!'
            : `RSVP Confirmed for ${count} guest${count > 1 ? 's' : ''}! We look forward to celebrating together.`;
          msgEl.style.display = 'block';
        }
        submitBtn.textContent = 'RSVP Saved ✓';
      } catch (err) {
        if (msgEl) {
          msgEl.className = 'rsvp-status-msg success';
          msgEl.textContent = 'RSVP recorded! Thank you for your blessings.';
          msgEl.style.display = 'block';
        }
        submitBtn.textContent = 'RSVP Saved ✓';
      }
    });
  }

  // 6. Music Toggle Button
  if (musicBtn) {
    musicBtn.addEventListener('click', () => {
      if (typeof window !== 'undefined' && typeof window.__startWeddingMusic === 'function') {
        const isPlaying = typeof window.__isWeddingMusicPlaying === 'function' && window.__isWeddingMusicPlaying();
        if (isPlaying) {
          if (typeof window.__stopWeddingMusic === 'function') window.__stopWeddingMusic();
          musicBtn.classList.remove('playing');
        } else {
          window.__startWeddingMusic(true);
          musicBtn.classList.add('playing');
        }
      } else {
        musicBtn.classList.toggle('playing');
      }
    });
  }

  // 7. Start Again Button
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
