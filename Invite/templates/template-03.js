/* ==========================================================================
   Template 03 — Royal Crimson & Gold Wax-Seal Invitation Suite
   Inspired by Royal Heritage Double-Door Wax-Seal Envelope, Fairy Dust Sparkles,
   Save the Date Calendar, Wedding Programme & Arched Banquet Venue Showcase.
   Full Dynamic Integration matching Prime eCard Royal Architecture.
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

function generateCalendarGrid(y, mo, targetDay) {
  if (!y || !mo) return '';
  const firstDayOfWeek = new Date(Date.UTC(y, mo - 1, 1)).getUTCDay();
  const daysInMonth = new Date(Date.UTC(y, mo, 0)).getUTCDate();
  
  const cells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    cells.push('<div class="cal-day-cell cal-empty"></div>');
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isTarget = (day === targetDay);
    if (isTarget) {
      cells.push(`
        <div class="cal-day-cell wedding-day">
          <span class="cal-heart">♥</span>
          <span class="cal-day-num active">${day}</span>
        </div>
      `);
    } else {
      cells.push(`
        <div class="cal-day-cell">
          <span class="cal-day-num">${day}</span>
        </div>
      `);
    }
  }
  return cells.join('');
}

export default function renderT03({ guest, wedding, events = [] } = {}) {
  const w = wedding || {};
  const orderRef = clean(w.order_reference) || clean(w.ref) || '';
  const isT03Match = !w.template_id || w.template_id === 'template-03' || w.template_id === '03';

  const storedBride = (isT03Match && orderRef) ? getStoredPhoto(`wedding_bride_photo_${orderRef}`) : '';
  const storedGroom = (isT03Match && orderRef) ? getStoredPhoto(`wedding_groom_photo_${orderRef}`) : '';
  const storedVenue = (isT03Match && orderRef) ? getStoredPhoto(`wedding_venue_photo_${orderRef}`) : '';

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
  if (!secondaryAddress && rawVenue && hallName && rawVenue !== hallName) {
    secondaryAddress = rawVenue;
  }
  const venueComment = clean(w.venue_comment || w.venue_note || w.description || '');

  // Map & Calendar URLs
  const mapUrl = clean(w.map_url) || (primaryVenueTitle ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(primaryVenueTitle + (secondaryAddress ? ', ' + secondaryAddress : ''))}` : 'https://maps.google.com');

  // Dates & Times
  const rawDate = clean(w.date || w.wedding_date);
  const parsedDate = parseDate(rawDate);
  const dateLong = parsedDate ? formatDateLong(rawDate) : 'Date to be announced';
  const rawTime = clean(w.time || w.ceremony_time);
  const timeStr = formatTime(rawTime);

  const dayName = parsedDate ? parsedDate.dayName : 'Auspicious Day';
  const targetDay = parsedDate ? parsedDate.d : 31;
  const monthName = parsedDate ? parsedDate.monthName : 'December';
  const year = parsedDate ? parsedDate.y : 2026;

  // Countdown & Calendar Link
  const countdownTimestamp = parseWhen(rawDate, rawTime, clean(w.timezone_offset) || '+05:30');
  const countdownTarget = countdownTimestamp ? new Date(countdownTimestamp).toISOString() : '';

  let gcalUrl = '';
  if (parsedDate) {
    const sDate = new Date(Date.UTC(parsedDate.y, parsedDate.mo - 1, parsedDate.d, 12, 0, 0));
    const eDate = new Date(Date.UTC(parsedDate.y, parsedDate.mo - 1, parsedDate.d, 18, 0, 0));
    gcalUrl = buildGCalUrl({
      title: `${groomName} & ${brideName}'s Wedding Celebration`,
      start: sDate,
      end: eDate,
      details: `${clean(w.ceremony_title) || 'Shubh Vivah'}\nWith the blessings of our families.\nWe warmly invite you to celebrate with us!`,
      location: primaryVenueTitle + (secondaryAddress ? `, ${secondaryAddress}` : '')
    });
  }

  // Guest details & allowances
  const g = guest || {};
  const guestRawName = clean(g.name);
  const guestDisplayName = guestRawName || 'Family & Friends';
  const pCount = Number(g.persons) || (g.with_family ? 2 : 1);
  const tPText = pCount > 1 ? `${pCount} Persons` : (pCount === 1 ? '1 Person' : '');

  // Complete Events Resolution (Never lose any events added for the customer)
  let rawEventsList = [];
  if (Array.isArray(events) && events.length > 0) {
    rawEventsList = events;
  } else if (Array.isArray(w.events) && w.events.length > 0) {
    rawEventsList = w.events;
  } else if (Array.isArray(w.ceremonies) && w.ceremonies.length > 0) {
    rawEventsList = w.ceremonies;
  }

  // Check localStorage stored orders if events array was not supplied directly
  if (!rawEventsList.length && typeof localStorage !== 'undefined') {
    try {
      if (orderRef) {
        const storedOrder = JSON.parse(localStorage.getItem('primeecard_order_' + orderRef) || 'null');
        if (storedOrder?.events && Array.isArray(storedOrder.events) && storedOrder.events.length) {
          rawEventsList = storedOrder.events;
        }
      }
      if (!rawEventsList.length) {
        const lastOrd = JSON.parse(localStorage.getItem('primeecard_last_order') || 'null');
        if (lastOrd?.events && Array.isArray(lastOrd.events) && lastOrd.events.length) {
          rawEventsList = lastOrd.events;
        }
      }
      if (!rawEventsList.length) {
        const draftOrd = JSON.parse(localStorage.getItem('primeecard_onboard_draft') || 'null');
        if (draftOrd?.events && Array.isArray(draftOrd.events) && draftOrd.events.length) {
          rawEventsList = draftOrd.events;
        }
      }
    } catch (_) {}
  }

  const eventList = rawEventsList.length > 0 ? rawEventsList : [
    { event_name: 'Shubho Bibaho', event_date: rawDate, event_time: rawTime, venue: primaryVenueTitle, note: 'Sacred union ceremonies, phere, and auspicious wedding muhurat' }
  ];

  // Family signature
  const familySignature = clean(w.footer_text) || clean(w.families) || `The ${groomName} & ${brideName} Families`;

  // Music Soundtrack
  const musicUrl = safeAudioUrl(w.music_url || w.audio_url || './music/invitation.mp3');

  // Calendar cells
  const calGridHtml = generateCalendarGrid(parsedDate ? parsedDate.y : 2026, parsedDate ? parsedDate.mo : 12, targetDay);

  // Return full dynamic markup matching the luxury crimson & gold architecture
  return `
<style>
:root {
  --envelope: url('./assets/template-03-envelope.webp');
  --page: url('./assets/template-03-page.webp');
  --gold: #c9a046;
  --gold-light: #f6dfa0;
  --sx: 49.12;
}

.t03-wrapper * {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
  -webkit-tap-highlight-color: transparent;
}

.t03-wrapper {
  position: relative;
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
  background: #14070a;
  overflow: hidden;
  display: grid;
  place-items: center;
}

/* Background Ambient Lighting */
.t03-amb {
  position: fixed;
  inset: -6%;
  background: var(--page) center/cover;
  filter: blur(28px) saturate(1.5) brightness(.42) sepia(.25);
  transform: translateZ(0);
  pointer-events: none;
}

/* Stage Box */
.stage {
  position: relative;
  overflow: hidden;
  container-type: size;
  background: #14070a;
  width: min(66.667vh, 100vw);
  height: min(100vh, 150vw);
  width: min(66.667dvh, 100vw);
  height: min(100dvh, 150vw);
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: #2b1204;
  box-shadow: 0 0 5cqw rgba(0, 0, 0, .8);
}

.scroller {
  position: absolute;
  inset: 0;
  overflow: hidden;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  overscroll-behavior: contain;
}
.scroller::-webkit-scrollbar { display: none; }

.pg {
  position: relative;
  height: 150cqw;
  width: 100%;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;
  background: #14070a;
}

.bgl {
  position: absolute;
  inset: 0;
  background: var(--page) center/100% 100% no-repeat;
  will-change: transform;
}
.bl .bgl {
  transform: scale(1.05);
  transition: transform 1.8s cubic-bezier(.16, 1, .3, 1);
}
.bl.in .bgl {
  transform: none;
}
.bl::after {
  content: "";
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 38%, rgba(255, 240, 190, .45) 50%, transparent 62%);
  transform: translateX(-120%);
  pointer-events: none;
}
.bl.in::after {
  animation: sweep 2.2s .2s ease-out forwards;
}
@keyframes sweep { to { transform: translateX(120%); } }

/* ==========================================================================
   PAGE 2: THE WEDDING OF (Luxury Frosted Card with Conic-Gradient Photos)
   ========================================================================== */
.p2in {
  position: absolute;
  inset: 0;
  transform: scale(1.28);
  transform-origin: 49% 58%;
  will-change: transform;
}
.opening .p2in {
  transform: none;
  transition: transform 3.4s cubic-bezier(.16, 1, .3, 1) .5s;
}

.card {
  position: absolute;
  left: 7%;
  right: 7%;
  top: 9%;
  bottom: 9%;
  border-radius: 4cqw;
  background: rgba(255, 250, 240, 0.90);
  -webkit-backdrop-filter: blur(14px) saturate(1.15);
  backdrop-filter: blur(14px) saturate(1.15);
  border: .35cqw solid rgba(201, 160, 70, 0.88);
  box-shadow: inset 0 0 0 1.1cqw rgba(255, 250, 240, 0.4),
              inset 0 0 0 1.45cqw rgba(201, 160, 70, 0.6),
              0 3cqw 8cqw rgba(50, 8, 14, 0.35),
              0 .6cqw 2cqw rgba(50, 8, 14, 0.2);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3.5cqw 3cqw;
  text-align: center;
  opacity: 0;
  transform: scale(.94);
  color: #2b1204;
}
.go .card {
  animation: cardin 1.3s cubic-bezier(.16, 1, .3, 1) forwards;
}
@keyframes cardin { to { opacity: 1; transform: none; } }

.rv {
  opacity: 0;
  transform: translateY(3cqw);
  filter: blur(4px);
}
.go .rv {
  animation: settle 1s cubic-bezier(.22, 1, .36, 1) forwards;
  animation-delay: calc(.35s + var(--i, 0) * .22s);
}
@keyframes settle { to { opacity: 1; transform: none; filter: none; } }

.wo {
  font: 700 3.2cqw/1 Cinzel, serif;
  letter-spacing: .3em;
  color: #4a0e17;
  padding-left: .3em;
  white-space: nowrap;
}
.go .wo {
  animation: settle 1s cubic-bezier(.22, 1, .36, 1) forwards, track 2.2s cubic-bezier(.16, 1, .3, 1) forwards;
  animation-delay: .35s;
}
@keyframes track { from { letter-spacing: .7em; } to { letter-spacing: .3em; } }

.orn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.4cqw;
  margin: 1.6cqw 0 2cqw;
  width: 46cqw;
}
.orn i {
  flex: 1;
  height: .3cqw;
  background: linear-gradient(90deg, transparent, #8c5d19, #4a0e17);
  transform: scaleX(0);
  transform-origin: 100% 50%;
}
.orn i:last-child {
  transform-origin: 0 50%;
  background: linear-gradient(270deg, transparent, #8c5d19, #4a0e17);
}
.orn b {
  width: 1.8cqw;
  height: 1.8cqw;
  transform: rotate(45deg) scale(0);
  background: linear-gradient(135deg, #d8a038, #5a0e1c);
  box-shadow: 0 0 1.2cqw rgba(140, 93, 25, .6);
}
.go .orn i { animation: draw 1.2s cubic-bezier(.22, 1, .36, 1) .9s forwards; }
.go .orn b { animation: gem 1s cubic-bezier(.3, 1.6, .5, 1) .8s forwards; }
@keyframes draw { to { transform: scaleX(1); } }
@keyframes gem { to { transform: rotate(405deg) scale(1); } }

.pair {
  display: grid;
  grid-template-columns: 1fr 6cqw 1fr;
  align-items: start;
  width: 100%;
}
.col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.amp {
  font: 400 9.5cqw/1 'Great Vibes', cursive;
  color: #8c5d19;
  padding-top: 6.5cqw;
  text-shadow: 0 .3cqw .6cqw rgba(120, 80, 10, .35);
}
.go .amp { animation: amp 1.4s cubic-bezier(.22, 1, .36, 1) 1.0s both; }
@keyframes amp { from { opacity: 0; transform: scale(2.4); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }

.ph {
  position: relative;
  width: 23cqw;
  height: 23cqw;
  border-radius: 50%;
  box-shadow: 0 1.4cqw 3cqw rgba(70, 40, 5, .45);
  opacity: 0;
  transform: scale(.4) rotate(-90deg);
  margin-bottom: 1cqw;
}
.go .ph {
  animation: phin 1.4s cubic-bezier(.22, 1.3, .4, 1) forwards;
  animation-delay: calc(.7s + var(--k, 0) * .25s);
}
@keyframes phin { to { opacity: 1; transform: none; } }
.ph::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background: conic-gradient(from 20deg, #f7de8e, #b8872a, #fff1b8, #9b6a18, #f7de8e);
  animation: spin 14s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.ph div {
  position: absolute;
  inset: .95cqw;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(#fff6df, #ecd6a0);
  display: grid;
  place-items: center;
  border: .4cqw solid #fff7e0;
}
.ph img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.ph span {
  font: 400 12.5cqw/1 'Great Vibes', cursive;
  color: #7a1220;
}

.role-lbl {
  font: 700 2.8cqw/1 Cinzel, serif;
  letter-spacing: .22cqw;
  color: #8c5d19;
  text-transform: uppercase;
  margin-bottom: .2cqw;
}
.nm {
  font: 400 10.5cqw/1.1 'Great Vibes', cursive;
  color: #3d0714;
  white-space: nowrap;
  max-width: 100%;
  filter: drop-shadow(0 .2cqw .25cqw rgba(140, 93, 25, 0.5));
  margin-bottom: .2cqw;
}
.t {
  text-align: center;
  line-height: 1.25;
}
.rel {
  font: 700 2.5cqw/1 Cinzel, serif;
  letter-spacing: .15cqw;
  color: #6b3e14;
  text-transform: lowercase;
  margin-bottom: .2cqw;
}
.fa {
  font: 700 4.2cqw/1.2 'Cormorant Garamond', serif;
  color: #2b1204;
  max-width: 100%;
  overflow-wrap: anywhere;
  margin-bottom: .2cqw;
}
.ad {
  font: 600 3.2cqw/1.2 'Cormorant Garamond', serif;
  color: #4a1c0d;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.p2-quote {
  margin-top: 2cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 90%;
  padding-top: 1.2cqw;
  border-top: 1px solid rgba(140, 93, 25, 0.45);
}
.p2-ornament {
  font-size: 3.2cqw;
  color: #8c5d19;
  line-height: 1;
  margin-bottom: .6cqw;
}
.p2-quote-text {
  font: 600 italic 3.8cqw/1.25 'Cormorant Garamond', serif;
  color: #4a1c0d;
  text-align: center;
}

/* ==========================================================================
   PAGE 3: SAVE THE DATE (Clean Header & Royal Interactive Calendar)
   Circle Medallion Removed as Requested
   ========================================================================== */
.p3-inner {
  position: absolute;
  inset: 0;
  padding: 4cqw 6cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3.5cqw;
  text-align: center;
  z-index: 2;
}

.std-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.std-kicker {
  font: 700 2.8cqw/1 Cinzel, serif;
  letter-spacing: .25em;
  color: #8c5d19;
  text-transform: uppercase;
  margin-bottom: .6cqw;
}
.std-title {
  font: 700 9cqw/1 Cinzel, serif;
  letter-spacing: .12em;
  color: #4a0e17;
  text-shadow: 0 1px 2px rgba(214, 168, 60, 0.4);
}

/* Calendar Card (Screenshot 1) */
.cal-card {
  width: 100%;
  max-width: 88cqw;
  border-radius: 4cqw;
  background: linear-gradient(180deg, #3d0c15 0%, #1f040a 100%);
  border: 1.5px solid rgba(214, 168, 60, 0.65);
  box-shadow: 0 6cqw 14cqw rgba(0, 0, 0, 0.65), inset 0 0 0 1px rgba(255, 220, 140, 0.2);
  padding: 4cqw 4.5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cal-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2cqw;
}
.cal-month-name {
  font: 700 6cqw/1 Cinzel, serif;
  letter-spacing: .16em;
  color: #f7de8e;
}
.cal-year-num {
  font: 600 3.2cqw/1 Cinzel, serif;
  letter-spacing: .24em;
  color: #d4a736;
  margin-top: .4cqw;
}
.cal-weekdays {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  text-align: center;
  font: 700 2.8cqw/1 Cinzel, serif;
  color: #d4a736;
  margin-bottom: 2cqw;
}
.cal-grid {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 1.8cqw .4cqw;
  text-align: center;
  margin-bottom: 2.5cqw;
}
.cal-day-cell {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 6.4cqw;
}
.cal-day-num {
  font: 600 3.4cqw/1 'Cormorant Garamond', serif;
  color: #eeddb2;
}
.cal-day-cell.wedding-day .cal-heart {
  position: absolute;
  top: -1.6cqw;
  font-size: 2.4cqw;
  color: #ff9eaf;
  filter: drop-shadow(0 0 4px #ff5376);
  animation: heartPulse 1.8s ease-in-out infinite;
}
@keyframes heartPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.35); }
}
.cal-day-num.active {
  width: 7cqw;
  height: 7cqw;
  border-radius: 50%;
  background: radial-gradient(circle, #fff3c4, #d4a736 70%, #9a6f1c);
  color: #1a0808;
  font-weight: 700;
  font-size: 3.6cqw;
  display: grid;
  place-items: center;
  box-shadow: 0 0 18px rgba(255, 215, 0, 0.85);
}
.cal-time-note {
  font: 500 italic 4cqw/1.2 'Cormorant Garamond', serif;
  color: #f7de8e;
  margin-bottom: 2.5cqw;
}
.gold-cal-btn {
  background: linear-gradient(135deg, #f0d27a, #b8872a 60%, #875e14);
  color: #fff;
  font: 700 2.8cqw/1 Cinzel, serif;
  letter-spacing: .14em;
  padding: 2.2cqw 6cqw;
  border-radius: 50px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 230, 160, 0.5);
  cursor: pointer;
}

/* ==========================================================================
   PAGE 4: COUNTDOWN ONLY (Duplicate Names, Parents & Venue Removed)
   Dedicated Live Countdown & Guest Honor Badge
   ========================================================================== */
.p4-inner {
  position: absolute;
  inset: 0;
  padding: 4cqw 6cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  z-index: 2;
}

.countdown-sole-card {
  width: 100%;
  max-width: 88cqw;
  border-radius: 4cqw;
  background: linear-gradient(180deg, rgba(60, 10, 20, 0.96), rgba(35, 5, 12, 0.98));
  border: 1.5px solid rgba(214, 168, 60, 0.65);
  box-shadow: 0 6cqw 16cqw rgba(40, 6, 12, 0.55), inset 0 0 0 1px rgba(255, 230, 160, 0.2);
  padding: 6cqw 4.5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.cd-header-kicker {
  font: 700 3cqw/1 Cinzel, serif;
  letter-spacing: .25em;
  color: #d4a736;
  text-transform: uppercase;
  margin-bottom: 1.2cqw;
}
.cd-header-title {
  font: 700 6.5cqw/1.1 Cinzel, serif;
  letter-spacing: .08em;
  color: #f7de8e;
  margin-bottom: 1.4cqw;
}
.cd-target-date {
  font: 600 3.8cqw/1.2 'Cormorant Garamond', serif;
  color: #fff3c4;
  background: rgba(30, 4, 10, 0.6);
  padding: .8cqw 3cqw;
  border-radius: 50px;
  border: 1px solid rgba(214, 168, 60, 0.35);
  margin-bottom: 3.5cqw;
}

/* Countdown Grid */
.cd-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 2.4cqw;
  width: 100%;
  margin-bottom: 3.5cqw;
}
.cd-box {
  background: rgba(30, 4, 10, 0.92);
  border: 1.5px solid rgba(214, 168, 60, 0.6);
  border-radius: 2.8cqw;
  padding: 3cqw 1cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: inset 0 0 14px rgba(0, 0, 0, .7), 0 4px 12px rgba(0, 0, 0, 0.4);
}
.cd-val {
  font: 700 7cqw/1 'Cormorant Garamond', serif;
  color: #ffffff;
  text-shadow: 0 0 12px rgba(255, 215, 120, 0.7);
}
.cd-lbl {
  font: 700 2.4cqw/1 Cinzel, serif;
  letter-spacing: .15em;
  color: #f0c966;
  margin-top: .6cqw;
}
.story-guest-badge {
  display: inline-block;
  padding: 1.6cqw 5.5cqw;
  border-radius: 50px;
  border: 1.5px solid rgba(214, 168, 60, 0.65);
  background: rgba(74, 14, 27, 0.75);
  font: 700 3cqw/1 Cinzel, serif;
  letter-spacing: .15em;
  color: #f7de8e;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.35);
}

/* ==========================================================================
   PAGE 5: WEDDING PROGRAMME (All Events Displayed, Vertical Smooth Scrolling)
   ========================================================================== */
.p5-prog-inner {
  position: absolute;
  inset: 0;
  padding: 3.5cqw 5cqw 4cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  text-align: center;
  z-index: 2;
  overflow: hidden;
}

.prog-page-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2cqw;
  flex-shrink: 0;
}
.prog-kicker {
  font: 700 2.8cqw/1 Cinzel, serif;
  letter-spacing: .25em;
  color: #8c5d19;
  text-transform: uppercase;
  margin-bottom: .4cqw;
}
.prog-title {
  font: 700 7.5cqw/1 Cinzel, serif;
  letter-spacing: .12em;
  color: #4a0e17;
  text-shadow: 0 1px 2px rgba(214, 168, 60, 0.4);
}
.prog-subtitle {
  font: 600 italic 3.4cqw/1.2 'Cormorant Garamond', serif;
  color: #5a2512;
  margin-top: .4cqw;
}

/* Vertical Scrollable Events List (Shows ALL customer events!) */
.prog-cards-list {
  display: flex;
  flex-direction: column;
  gap: 2.8cqw;
  width: 100%;
  max-width: 88cqw;
  max-height: 106cqw;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 1cqw 1cqw 5cqw;
  scrollbar-width: thin;
  scrollbar-color: rgba(214, 168, 60, 0.5) transparent;
}
.prog-cards-list::-webkit-scrollbar {
  width: 4px;
}
.prog-cards-list::-webkit-scrollbar-thumb {
  background: rgba(214, 168, 60, 0.5);
  border-radius: 4px;
}

.prog-card-majestic {
  width: 100%;
  background: linear-gradient(135deg, rgba(65, 12, 22, 0.96) 0%, rgba(35, 5, 12, 0.98) 100%);
  border: 1.5px solid rgba(214, 168, 60, 0.7);
  box-shadow: 0 6px 20px rgba(50, 8, 14, 0.4), inset 0 0 0 1px rgba(255, 230, 160, 0.2);
  border-radius: 3.5cqw;
  padding: 3cqw;
  display: flex;
  flex-direction: row;
  gap: 3.2cqw;
  align-items: center;
  text-align: left;
  flex-shrink: 0;
}
.prog-img-majestic-wrap {
  width: 28cqw;
  height: 28cqw;
  border-radius: 2.5cqw;
  overflow: hidden;
  border: 1.5px solid rgba(214, 168, 60, 0.6);
  flex-shrink: 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
  background: #1f0208;
}
.prog-img-majestic {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.prog-info-majestic {
  display: flex;
  flex-direction: column;
  gap: .8cqw;
  min-width: 0;
  flex: 1;
}
.prog-name-majestic {
  font: 700 4.8cqw/1.1 Cinzel, serif;
  color: #f7de8e;
  letter-spacing: .03em;
}
.prog-datetime-majestic {
  font: 600 3.4cqw/1.2 'Cormorant Garamond', serif;
  color: #fff3c4;
  background: rgba(30, 4, 10, 0.6);
  padding: .5cqw 1.6cqw;
  border-radius: 6px;
  border: 1px solid rgba(214, 168, 60, 0.35);
  width: fit-content;
}
.prog-venue-majestic {
  font: 600 3.2cqw/1.2 'Cormorant Garamond', serif;
  color: #ffd27a;
}
.prog-note-majestic {
  font: 500 italic 3cqw/1.25 'Cormorant Garamond', serif;
  color: #eeddb2;
}
.prog-btn-cal {
  background: linear-gradient(135deg, #f0d27a, #b8872a 60%, #875e14);
  color: #fff;
  font: 700 2.2cqw/1 Cinzel, serif;
  letter-spacing: .12em;
  padding: 1.2cqw 3.2cqw;
  border-radius: 50px;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 230, 160, 0.5);
  width: fit-content;
  margin-top: .3cqw;
}

/* ==========================================================================
   PAGE 6: THE VENUE (Arched Window Showcase & Destination Card)
   ========================================================================== */
.p6-inner {
  position: absolute;
  inset: 0;
  padding: 4cqw 5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  text-align: center;
  z-index: 2;
}

.venue-header {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.venue-kicker {
  font: 700 2.8cqw/1 Cinzel, serif;
  letter-spacing: .25em;
  color: #8c5d19;
  text-transform: uppercase;
  margin-bottom: .4cqw;
}
.venue-title {
  font: 700 8cqw/1 Cinzel, serif;
  letter-spacing: .18em;
  color: #4a0e17;
  text-shadow: 0 1px 2px rgba(214, 168, 60, 0.4);
  margin-bottom: .6cqw;
}
.venue-subtitle {
  font: 600 italic 3.6cqw/1.2 'Cormorant Garamond', serif;
  color: #5a2512;
}

/* Side-by-side or Stacked Layout matching Screenshot 2 */
.venue-showcase-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3cqw;
  width: 100%;
  align-items: center;
}

/* Left Arched Window (Screenshot 2) */
.venue-arch-frame {
  position: relative;
  width: 100%;
  height: 52cqw;
  border-radius: 20cqw 20cqw 2cqw 2cqw;
  border: .4cqw solid rgba(214, 168, 60, 0.75);
  overflow: hidden;
  box-shadow: 0 4cqw 8cqw rgba(0, 0, 0, 0.6);
  background: #2a060d;
}
.venue-arch-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.venue-arch-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  background: radial-gradient(#3a0711, #1a0307);
}
.arch-monogram {
  font-size: 14cqw;
}
.venue-arch-label {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1.5cqw;
  background: linear-gradient(0deg, rgba(20, 3, 8, 0.95), transparent);
  font: 700 3.2cqw/1.2 Cinzel, serif;
  color: #f7de8e;
}

/* Right Destination Card (Screenshot 2) */
.venue-dest-card {
  position: relative;
  width: 100%;
  height: 52cqw;
  border-radius: 3.5cqw;
  background: linear-gradient(135deg, rgba(60, 10, 20, 0.96), rgba(30, 4, 10, 0.98));
  border: 1.5px solid rgba(214, 168, 60, 0.6);
  box-shadow: 0 4cqw 8cqw rgba(0, 0, 0, 0.6), inset 0 0 0 1px rgba(255, 230, 160, 0.2);
  padding: 3cqw 2.5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.dest-kicker {
  font: 700 2.4cqw/1 Cinzel, serif;
  letter-spacing: .2em;
  color: #d4a736;
  margin-bottom: 1cqw;
}
.dest-title {
  font: 700 5.4cqw/1.1 Cinzel, serif;
  color: #f7de8e;
  margin-bottom: 1cqw;
}
.dest-address {
  font: 600 3.4cqw/1.2 'Cormorant Garamond', serif;
  color: #eeddb2;
  margin-bottom: 1.2cqw;
}
.dest-time-ribbon {
  font: 500 italic 3.2cqw/1.2 'Cormorant Garamond', serif;
  color: #f6dfa0;
  margin-bottom: 2cqw;
}
.dest-buttons {
  display: flex;
  gap: 2cqw;
  width: 100%;
  justify-content: center;
}
.gold-pill-btn-sm {
  background: linear-gradient(135deg, #f0d27a, #b8872a 60%, #875e14);
  color: #fff;
  font: 700 2.4cqw/1 Cinzel, serif;
  letter-spacing: .12em;
  padding: 1.8cqw 3.6cqw;
  border-radius: 50px;
  text-decoration: none;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.4);
  border: 1px solid rgba(255, 230, 160, 0.5);
}

/* Family Signature & Audio Controls */
.venue-signature {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: .6cqw;
  border-top: 1px solid rgba(140, 93, 25, 0.45);
  padding-top: 1.5cqw;
  width: 100%;
}
.sig-prefix {
  font: 600 italic 3.4cqw/1.2 'Cormorant Garamond', serif;
  color: #5a2512;
}
.sig-name {
  font: 700 4.8cqw/1.1 Cinzel, serif;
  color: #4a0e17;
}
.sig-sub {
  font: 600 italic 3cqw/1.2 'Cormorant Garamond', serif;
  color: #8c5d19;
}
.venue-bottom-actions {
  display: flex;
  gap: 2.5cqw;
  align-items: center;
  justify-content: center;
  margin-top: 1cqw;
}
.start-again-btn {
  background: rgba(255, 250, 240, 0.85);
  border: 1px solid rgba(140, 93, 25, 0.45);
  border-radius: 50px;
  padding: 1.2cqw 4.5cqw;
  font: 700 2.6cqw/1 Cinzel, serif;
  letter-spacing: .15em;
  color: #4a0e17;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}
.music-toggle-btn {
  background: linear-gradient(135deg, rgba(65, 12, 22, 0.95), rgba(35, 5, 12, 0.98));
  border: 1px solid rgba(214, 168, 60, 0.6);
  border-radius: 50px;
  padding: 1.2cqw 4cqw;
  font: 700 2.4cqw/1 Cinzel, serif;
  letter-spacing: .12em;
  color: #f7de8e;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
}

/* ==========================================================================
   ENTRANCE WAX-SEAL ENVELOPE INTRO (From wedding-invite-v2.html)
   ========================================================================== */
#intro {
  position: absolute;
  inset: 0;
  z-index: 20;
  perspective: 150cqw;
  opacity: 0;
  transition: opacity .7s ease;
}
#intro.rd { opacity: 1; }
#dim {
  position: absolute;
  inset: 0;
  --r: 0;
  background: radial-gradient(circle at 49% 58%, #4a0e1b, #12060a 60%, #080305);
  -webkit-mask-image: radial-gradient(circle at 49.12% 58.3%, transparent calc(var(--r)*1cqw - 16cqw), #000 calc(var(--r)*1cqw));
  mask-image: radial-gradient(circle at 49.12% 58.3%, transparent calc(var(--r)*1cqw - 16cqw), #000 calc(var(--r)*1cqw));
}
#spill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: calc(var(--sx)*1cqw - 14cqw);
  width: 28cqw;
  opacity: 0;
  transform: scaleX(.04);
  transform-origin: 50% 50%;
  mix-blend-mode: screen;
  background: radial-gradient(ellipse 50% 42% at 50% 58%, rgba(255,236,170,1), rgba(255,190,80,.55) 45%, transparent 75%),
              linear-gradient(90deg, transparent, rgba(255,226,150,.95) 50%, transparent);
}
.ajar #spill {
  opacity: 1;
  transform: scaleX(7);
  transition: transform 2.4s cubic-bezier(.5, 0, .2, 1) .12s, opacity .5s .12s;
}
.fin #spill {
  opacity: 0;
  transition: opacity 1.4s;
}
#rays {
  position: absolute;
  left: calc(var(--sx)*1cqw - 130cqw);
  top: calc(58.3cqw*1.5 - 130cqw);
  width: 260cqw;
  height: 260cqw;
  opacity: 0;
  mix-blend-mode: screen;
  pointer-events: none;
  background: repeating-conic-gradient(from 0deg, rgba(255,226,150,0) 0 5deg, rgba(255,226,150,.3) 8deg, rgba(255,226,150,0) 11deg);
  -webkit-mask-image: radial-gradient(circle, #000 5%, transparent 48%);
  mask-image: radial-gradient(circle, #000 5%, transparent 48%);
  animation: spin 24s linear infinite;
}
.rays #rays { opacity: 1; transition: opacity 1.2s; }
.fin #rays { opacity: 0; transition: opacity 1.6s; }

#sway, #tilt {
  position: absolute;
  inset: 0;
  transform-style: preserve-3d;
}
#sway {
  animation: sway 8s ease-in-out infinite alternate;
}
@keyframes sway {
  from { transform: rotateX(.7deg) rotateY(-1deg); }
  to { transform: rotateX(-.7deg) rotateY(1deg); }
}
.opening #sway { animation: none; }
#tilt {
  transform: rotateX(var(--rx, 0deg)) rotateY(var(--ry, 0deg));
  transition: transform .5s ease-out;
}

.dr {
  position: absolute;
  top: 0;
  height: 100%;
  transform-style: preserve-3d;
  will-change: transform;
}
#dL {
  left: 0;
  width: calc(var(--sx)*1cqw);
  transform-origin: 0 50%;
}
#dR {
  left: calc(var(--sx)*1cqw - .1cqw);
  width: calc(100cqw - var(--sx)*1cqw + .1cqw);
  transform-origin: 100% 50%;
}
.fc, .bk {
  position: absolute;
  inset: 0;
  backface-visibility: hidden;
  -webkit-backface-visibility: hidden;
  overflow: hidden;
}
.bk {
  transform: rotateY(180deg);
  background: repeating-linear-gradient(90deg, rgba(0,0,0,.18) 0 .25cqw, transparent .25cqw .9cqw),
              linear-gradient(90deg, #3a0711, #7a1424 45%, #4c0a16);
  box-shadow: inset 0 0 0 1.4cqw #3a0711, inset 0 0 0 1.75cqw #d8b35a, inset 0 0 0 2.1cqw #5a0d1a;
}
.sheet {
  position: absolute;
  top: 0;
  width: 100cqw;
  height: 150cqw;
  background: var(--envelope) 0 0/100% 100% no-repeat;
}
#dL .sheet { left: 0; }
#dR .sheet { left: calc(-1cqw*var(--sx) + .1cqw); }

.shd {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(20,3,8,.2), rgba(20,3,8,.85));
  opacity: 0;
  pointer-events: none;
}
#dR .shd {
  background: linear-gradient(270deg, rgba(20,3,8,.2), rgba(20,3,8,.85));
}
.ajar #dL { transform: rotateY(-122deg); transition: transform 2.1s cubic-bezier(.5, 0, .2, 1) .12s; }
.ajar #dR { transform: rotateY(122deg); transition: transform 2.1s cubic-bezier(.5, 0, .2, 1) .12s; }
.ajar .shd { opacity: 1; transition: opacity 1.6s ease-in .5s; }
.fin #sway { opacity: 0; transition: opacity .6s; }

.tx {
  position: absolute;
  left: 50%;
  transform: translate(-50%, -50%);
  white-space: nowrap;
  text-align: center;
  pointer-events: none;
  width: max-content;
}
.nmI {
  top: 37.4%;
  font: 400 14cqw/1.1 'Great Vibes', cursive;
  padding: 0 1cqw;
  color: transparent;
  background: linear-gradient(100deg, #7a1220 0 42%, #f0c966 50%, #7a1220 58% 100%) 120% 0/260% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  clip-path: inset(0 100% 0 0);
}
.nmI em {
  font-style: normal;
  -webkit-text-fill-color: #c79a2e;
  padding: 0 .1em;
}
.rd .nmI {
  animation: wipe 1.6s cubic-bezier(.65, 0, .2, 1) .4s forwards, foil 6s ease-in-out 2.6s infinite;
}
@keyframes wipe { to { clip-path: inset(0 0 0 0); } }
@keyframes foil { 0%, 100% { background-position: 120% 0; } 50% { background-position: -40% 0; } }
.opening .nmI { animation: none; clip-path: none; background-position: 50% 0; }

.gI, .pI, .lI { opacity: 0; }
.rd .gI, .rd .pI, .rd .lI {
  animation: fup 1s cubic-bezier(.22, 1, .36, 1) forwards;
}
@keyframes fup { from { opacity: 0; margin-top: 2cqw; } to { opacity: 1; margin-top: 0; } }

.lI {
  top: 71.6%;
  font: 600 2.6cqw/1 Cinzel, serif;
  letter-spacing: .26em;
  color: #5a3a08;
  padding-left: .26em;
  animation-delay: 1.3s!important;
}
.gI {
  top: 75.7%;
  font: 700 6.4cqw/1.1 'Cormorant Garamond', serif;
  color: #2b1204;
  animation-delay: 1.5s!important;
}
.pI {
  top: 79.7%;
  font: 700 4.6cqw/1 'Cormorant Garamond', serif;
  color: #4a1a0a;
  animation-delay: 1.7s!important;
}

.pill {
  position: absolute;
  left: 28.6%;
  top: 84.4%;
  width: 42.8%;
  height: 5.4%;
  border-radius: 5cqw;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2cqw;
  overflow: hidden;
  font: 700 3.5cqw/1 'Cormorant Garamond', serif;
  color: #f6dfa0;
  letter-spacing: .02em;
  background: linear-gradient(180deg, #8a1527, #5c0b18);
  box-shadow: 0 0 0 .35cqw #d8b35a, inset 0 0 0 .7cqw #5c0b18, inset 0 0 0 .95cqw rgba(216,179,90,.8), 0 1.4cqw 2.6cqw rgba(70,10,20,.45);
  opacity: 0;
  pointer-events: none;
}
.rd .pill {
  animation: fup 1s cubic-bezier(.22, 1, .36, 1) 1.9s forwards, pillp 2.8s ease-in-out 3s infinite;
}
@keyframes pillp {
  0%, 100% { box-shadow: 0 0 0 .35cqw #d8b35a, inset 0 0 0 .7cqw #5c0b18, inset 0 0 0 .95cqw rgba(216,179,90,.8), 0 1.4cqw 2.6cqw rgba(70,10,20,.45); }
  50% { box-shadow: 0 0 0 .35cqw #f0d27a, inset 0 0 0 .7cqw #5c0b18, inset 0 0 0 .95cqw rgba(240,210,122,.95), 0 0 4cqw 1cqw rgba(255,200,90,.55); }
}
.pill::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 30%;
  left: -40%;
  background: linear-gradient(100deg, transparent, rgba(255,236,170,.55), transparent);
  animation: psw 3.6s ease-in-out 3.4s infinite;
}
@keyframes psw { 0% { left: -40%; } 45%, 100% { left: 130%; } }
.pill svg {
  width: 3.6cqw;
  height: 3.6cqw;
  fill: #f6dfa0;
  flex: none;
}

.hit {
  position: absolute;
  z-index: 8;
  cursor: pointer;
  touch-action: manipulation;
}
#hs {
  left: calc(var(--sx)*1% - 14.5cqw);
  top: calc(58.3% - 14.5cqw);
  width: 29cqw;
  height: 29cqw;
  border-radius: 50%;
}
#hp {
  left: 28.6%;
  top: 84.4%;
  width: 42.8%;
  height: 5.4%;
  border-radius: 5cqw;
}

.ov {
  position: absolute;
  pointer-events: none;
  border-radius: 50%;
  left: calc(var(--sx)*1% - 14cqw);
  top: calc(58.3% - 14cqw);
  width: 28cqw;
  height: 28cqw;
  z-index: 6;
  opacity: 0;
  transform: translateZ(0);
}
.rd .ov { opacity: 1; }
#rim {
  mix-blend-mode: screen;
  animation: breathe 2.8s ease-in-out infinite;
}
@keyframes breathe {
  0%, 100% { box-shadow: 0 0 1.2cqw .2cqw rgba(255,196,90,.15), inset 0 0 1cqw rgba(255,214,130,.08); }
  50% { box-shadow: 0 0 3.6cqw 1cqw rgba(255,206,110,.75), inset 0 0 2.4cqw rgba(255,224,150,.4); }
}
.rip {
  border: .3cqw solid rgba(224, 176, 80, .7);
  animation: rip 3s ease-out 2.4s infinite backwards;
}
.rip.b { animation-delay: 3.9s; }
@keyframes rip {
  0% { transform: scale(.8); opacity: 0; }
  12% { opacity: .8; }
  100% { transform: scale(2.1); opacity: 0; }
}

#glint {
  overflow: hidden;
  clip-path: circle(50%);
  mix-blend-mode: screen;
}
#glint::before {
  content: "";
  position: absolute;
  top: -10%;
  bottom: -10%;
  width: 34%;
  left: -60%;
  background: linear-gradient(100deg, transparent, rgba(255,255,255,.75), transparent);
  transform: skewX(-18deg);
  animation: glint 4.2s ease-in-out 2.8s infinite;
}
@keyframes glint { 0% { left: -60%; } 38%, 100% { left: 130%; } }

#rib {
  position: absolute;
  left: 0;
  right: 0;
  top: 55.1%;
  height: 4.6%;
  overflow: hidden;
  mix-blend-mode: screen;
  pointer-events: none;
  z-index: 5;
  opacity: 0;
}
.rd #rib { opacity: 1; }
#rib::before {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 22%;
  left: -30%;
  background: linear-gradient(100deg, transparent, rgba(255,244,200,.8), transparent);
  transform: skewX(-20deg);
  animation: rib 5s ease-in-out 3.2s infinite;
}
@keyframes rib { 0% { left: -30%; } 40%, 100% { left: 130%; } }

#crack {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 7;
  pointer-events: none;
  opacity: 0;
}
#crack path {
  fill: none;
  stroke: #fff3c4;
  stroke-width: 4;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 420;
  stroke-dashoffset: 420;
  filter: drop-shadow(0 0 6px #ffcc55) drop-shadow(0 0 14px #ff9a30);
}
.opening #crack {
  opacity: 1;
  animation: cfade .9s ease-out .25s forwards;
}
.opening #crack path {
  animation: cdraw .32s ease-out forwards;
}
@keyframes cdraw { to { stroke-dashoffset: 0; } }
@keyframes cfade { 0% { opacity: 1; } 70% { opacity: 1; } 100% { opacity: 0; } }

#halo {
  position: absolute;
  left: calc(var(--sx)*1% - 34cqw);
  top: calc(58.3% - 34cqw);
  width: 68cqw;
  height: 68cqw;
  border-radius: 50%;
  z-index: 6;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: screen;
  background: radial-gradient(circle, rgba(255,236,170,.95) 0, rgba(255,200,90,.65) 22%, rgba(255,170,60,.22) 48%, transparent 70%);
}
.opening #halo { animation: halo 1.5s ease-out forwards; }
@keyframes halo { 0% { opacity: 0; transform: scale(.3); } 30% { opacity: 1; } 100% { opacity: 0; transform: scale(1.5); } }

.opening #tilt { animation: shake .42s ease-in-out; }
@keyframes shake {
  0%, 100% { transform: none; }
  20% { transform: translate(.5cqw, -.2cqw) rotate(.25deg); }
  40% { transform: translate(-.6cqw, .2cqw) rotate(-.3deg); }
  60% { transform: translate(.4cqw, 0) rotate(.2deg); }
  80% { transform: translate(-.25cqw, 0); }
}
.opening .ov, .opening #rib { opacity: 0!important; transition: opacity .25s; }

#flash {
  position: absolute;
  inset: 0;
  z-index: 9;
  pointer-events: none;
  opacity: 0;
  mix-blend-mode: screen;
  background: radial-gradient(circle at 49% 58%, #fff6d0, #ffd27a 40%, transparent 75%);
}
.fl #flash { animation: flash 1.5s ease-out; }
@keyframes flash { 0% { opacity: 0; } 18% { opacity: .35; } 100% { opacity: 0; } }

#fx {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 30;
  pointer-events: none;
}
</style>

<div class="t9 t03-stage t03-wrapper" data-music="${musicUrl}">
  <div class="t03-amb"></div>
  <main class="stage" id="stage">
    <!-- Scrollable Snapping Pages -->
    <div class="scroller" id="scroller">
      <!-- Page 2: The Wedding Of (Couple Details & Photos) -->
      <section class="pg" id="p2">
        <div class="p2in bgl" id="p2in">
          <div class="card" id="card">
            <div class="wo rv" style="--i:0">THE WEDDING OF</div>
            <div class="orn rv" style="--i:1"><i></i><b></b><i></i></div>
            <div class="pair rv" style="--i:2">
              ${brideFirst ? `
              <!-- Bride Column -->
              <div class="col" style="--k:0">
                <div class="ph" style="--k:0">
                  <div>
                    <img src="${bridePhoto}" alt="${esc(brideName)}" onerror="this.style.display='none';this.parentElement.textContent='${brideInit}';" />
                  </div>
                </div>
                <div class="role-lbl">BRIDE</div>
                <div class="nm">${esc(brideName)}</div>
                ${brideParents ? `<div class="rel">d/o</div><div class="fa t">${esc(brideParents)}</div>` : ''}
                ${brideAddress ? `<div class="ad t">📍 ${esc(brideAddress)}</div>` : ''}
              </div>
              <div class="amp">&amp;</div>
              <!-- Groom Column -->
              <div class="col" style="--k:1">
                <div class="ph" style="--k:1">
                  <div>
                    <img src="${groomPhoto}" alt="${esc(groomName)}" onerror="this.style.display='none';this.parentElement.textContent='${groomInit}';" />
                  </div>
                </div>
                <div class="role-lbl">GROOM</div>
                <div class="nm">${esc(groomName)}</div>
                ${groomParents ? `<div class="rel">s/o</div><div class="fa t">${esc(groomParents)}</div>` : ''}
                ${groomAddress ? `<div class="ad t">📍 ${esc(groomAddress)}</div>` : ''}
              </div>
              ` : `
              <!-- Groom Column -->
              <div class="col" style="--k:0">
                <div class="ph" style="--k:0">
                  <div>
                    <img src="${groomPhoto}" alt="${esc(groomName)}" onerror="this.style.display='none';this.parentElement.textContent='${groomInit}';" />
                  </div>
                </div>
                <div class="role-lbl">GROOM</div>
                <div class="nm">${esc(groomName)}</div>
                ${groomParents ? `<div class="rel">s/o</div><div class="fa t">${esc(groomParents)}</div>` : ''}
                ${groomAddress ? `<div class="ad t">📍 ${esc(groomAddress)}</div>` : ''}
              </div>
              <div class="amp">&amp;</div>
              <!-- Bride Column -->
              <div class="col" style="--k:1">
                <div class="ph" style="--k:1">
                  <div>
                    <img src="${bridePhoto}" alt="${esc(brideName)}" onerror="this.style.display='none';this.parentElement.textContent='${brideInit}';" />
                  </div>
                </div>
                <div class="role-lbl">BRIDE</div>
                <div class="nm">${esc(brideName)}</div>
                ${brideParents ? `<div class="rel">d/o</div><div class="fa t">${esc(brideParents)}</div>` : ''}
                ${brideAddress ? `<div class="ad t">📍 ${esc(brideAddress)}</div>` : ''}
              </div>
              `}
            </div>
            <div class="p2-quote rv" style="--i:3">
              <div class="p2-ornament">❖</div>
              <p class="p2-quote-text">Two hearts, two families,<br>one beautiful beginning.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Page 3: Save The Date & Interactive Calendar (Circle Medallion Removed) -->
      <section class="pg bl" id="p3">
        <div class="bgl"></div>
        <div class="p3-inner">
          <div class="std-header">
            <div class="std-kicker">MARK YOUR CALENDAR</div>
            <div class="std-title">SAVE THE DATE</div>
            <div class="orn"><i></i><b></b><i></i></div>
          </div>

          <!-- Calendar Card (Screenshot 1) -->
          <div class="cal-card">
            <div class="cal-header">
              <div class="cal-month-name">${monthName}</div>
              <div class="cal-year-num">${year}</div>
            </div>
            <div class="cal-weekdays">
              <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
            </div>
            <div class="cal-grid">
              ${calGridHtml}
            </div>
            <div class="cal-time-note">
              <em>${dayName}${timeStr ? ', ' + timeStr : ''}</em>
            </div>
            ${gcalUrl ? `
            <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="gold-cal-btn" id="t03-cal-btn">
              ✦ ADD TO CALENDAR
            </a>` : `
            <div class="cal-time-note"><em>${dateLong}</em></div>
            `}
          </div>
        </div>
      </section>

      <!-- Page 4: Pure Countdown Card (Duplicate Names & Venue Removed) -->
      <section class="pg bl" id="p4">
        <div class="bgl"></div>
        <div class="p4-inner">
          <div class="countdown-sole-card">
            <div class="cd-header-kicker">COUNTDOWN TO THE BIG DAY</div>
            <div class="cd-header-title">The Celebration Begins In</div>
            <div class="cd-target-date">🗓️ ${dateLong}${timeStr ? ' · ⏰ ' + timeStr : ''}</div>

            <!-- Live Countdown Timer -->
            <div class="cd-grid" id="t03-countdown" data-when="${countdownTimestamp || ''}" data-target="${countdownTarget}">
              <div class="cd-box"><span class="cd-val" data-cd="days" data-u="d">00</span><span class="cd-lbl">DAYS</span></div>
              <div class="cd-box"><span class="cd-val" data-cd="hours" data-u="h">00</span><span class="cd-lbl">HRS</span></div>
              <div class="cd-box"><span class="cd-val" data-cd="minutes" data-u="m">00</span><span class="cd-lbl">MIN</span></div>
              <div class="cd-box"><span class="cd-val" data-cd="seconds" data-u="s">00</span><span class="cd-lbl">SEC</span></div>
            </div>

            <div class="story-guest-badge">INVITED: ${esc(guestDisplayName)}</div>
          </div>
        </div>
      </section>

      <!-- Page 5: Wedding Programme (ALL Events Displayed in Vertical Scroll) -->
      <section class="pg bl" id="p5">
        <div class="bgl"></div>
        <div class="p5-prog-inner">
          <div class="prog-page-header">
            <div class="prog-kicker">AUSPICIOUS MUHURAT</div>
            <div class="prog-title">WEDDING PROGRAMME</div>
            <div class="prog-subtitle">Sacred rituals, joyous festivities, and cherished celebrations.</div>
            <div class="orn"><i></i><b></b><i></i></div>
          </div>

          <!-- All Customer Events List -->
          <div class="prog-cards-list">
            ${eventList.map((e, idx) => {
              const eName = clean(e.event_name) || clean(e.name) || clean(e.title) || `Ceremony ${idx + 1}`;
              const eDateStr = formatEventDate(e.event_date || e.date || rawDate);
              const eTimeStr = formatTime(e.event_time || e.time || rawTime);
              const eVenue = clean(e.venue) || clean(e.venue_title) || primaryVenueTitle;
              const eNote = clean(e.note) || clean(e.comment) || clean(e.description) || venueComment;
              const evImg = getEventPhoto(e, idx);
              return `
              <div class="prog-card-majestic">
                <div class="prog-img-majestic-wrap">
                  <img src="${esc(evImg)}" alt="${esc(eName)}" class="prog-img-majestic" loading="lazy" onerror="this.src='./assets/template-06-shubho-bibaho.webp';" />
                </div>
                <div class="prog-info-majestic">
                  <div class="prog-name-majestic">${esc(eName)}</div>
                  ${(eDateStr || eTimeStr) ? `<div class="prog-datetime-majestic">🗓️ ${esc(eDateStr)}${eTimeStr ? ' • ⏰ ' + esc(eTimeStr) : ''}</div>` : ''}
                  ${eVenue ? `<div class="prog-venue-majestic">📍 ${esc(eVenue)}</div>` : ''}
                  ${eNote ? `<div class="prog-note-majestic">“${esc(eNote)}”</div>` : ''}
                  ${gcalUrl ? `<a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="prog-btn-cal">✦ ADD TO CALENDAR</a>` : ''}
                </div>
              </div>`;
            }).join('')}
          </div>
        </div>
      </section>

      <!-- Page 6: The Venue Showcase (Screenshot 2) -->
      <section class="pg bl" id="p6">
        <div class="bgl"></div>
        <div class="p6-inner">
          <div class="venue-header">
            <div class="venue-kicker">THE WEDDING DESTINATION</div>
            <div class="venue-title">THE VENUE</div>
            <div class="venue-subtitle">A beautiful setting for a celebration close to our hearts.</div>
            <div class="orn"><i></i><b></b><i></i></div>
          </div>

          <div class="venue-showcase-grid">
            <!-- Left Arched Window (Screenshot 2) -->
            <div class="venue-arch-frame">
              ${venuePhoto ? `
                <img src="${esc(venuePhoto)}" alt="${esc(primaryVenueTitle)}" class="venue-arch-img" />
              ` : `
                <div class="venue-arch-fallback">
                  <span class="arch-monogram">🏛️</span>
                </div>
              `}
              <div class="venue-arch-label">${esc(primaryVenueTitle)}</div>
            </div>

            <!-- Right Destination Card (Screenshot 2) -->
            <div class="venue-dest-card">
              <div class="dest-kicker">THE WEDDING DESTINATION</div>
              <div class="dest-title">${esc(primaryVenueTitle)}</div>
              ${secondaryAddress ? `<div class="dest-address">📍 ${esc(secondaryAddress)}</div>` : ''}
              <div class="dest-time-ribbon">🗓️ ${dayName}, ${targetDay} ${monthName} ${year} · ⏰ ${timeStr}</div>
              <div class="dest-buttons">
                <a href="${esc(mapUrl)}" target="_blank" rel="noopener noreferrer" class="gold-pill-btn-sm" id="t03-maps">
                  ✦ DIRECTIONS
                </a>
                ${gcalUrl ? `
                <a href="${gcalUrl}" target="_blank" rel="noopener noreferrer" class="gold-pill-btn-sm">
                  ✦ CALENDAR
                </a>` : ''}
              </div>
            </div>
          </div>

          <!-- Family Signature & Clean Bottom Actions -->
          <div class="venue-signature">
            <div class="sig-prefix">With love, affection, and best wishes,</div>
            <div class="sig-name">${esc(familySignature)}</div>
            <div class="sig-sub">We eagerly look forward to celebrating with you!</div>
            <div class="venue-bottom-actions">
              <button type="button" class="start-again-btn" data-restart>Start Again ↻</button>
              <button type="button" class="music-toggle-btn" id="t03-music-btn">🎵 Music Toggle</button>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Entrance Wax-Seal Envelope Intro Animation (wedding-invite-v2.html) -->
    <div id="intro">
      <div id="dim"></div><div id="spill"></div><div id="rays"></div>
      <div id="sway">
        <div id="tilt">
          <!-- Left Door -->
          <div class="dr" id="dL">
            <div class="fc">
              <div class="sheet">
                <div class="tx nmI">${esc(groomName)} <em>&amp;</em> ${esc(brideName)}</div>
                <div class="tx lI">CORDIALLY INVITED</div>
                <div class="tx gI">${esc(guestDisplayName)}</div>
                ${tPText ? `<div class="tx pI">${esc(tPText)}</div>` : ''}
                <div class="pill">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 3.2a1.6 1.6 0 0 1 3.2 0v7.1l4-.6a2.6 2.6 0 0 1 2.9 2.6v3.6c0 3.3-2.7 6-6 6h-1.3a5.5 5.5 0 0 1-4.5-2.4l-3-4.4a1.5 1.5 0 0 1 2.4-1.8l1.3 1.3z"/><path d="M5.2 6.1a5 5 0 0 1 2.4-3.4M3.4 5.6a7.4 7.4 0 0 1 3.4-5" fill="none" stroke="#f6dfa0" stroke-width="1.3" stroke-linecap="round"/></svg>
                  Tap the seal to open
                </div>
              </div>
              <i class="shd"></i>
            </div>
            <div class="bk"></div>
          </div>

          <!-- Right Door -->
          <div class="dr" id="dR">
            <div class="fc">
              <div class="sheet">
                <div class="tx nmI">${esc(groomName)} <em>&amp;</em> ${esc(brideName)}</div>
                <div class="tx lI">CORDIALLY INVITED</div>
                <div class="tx gI">${esc(guestDisplayName)}</div>
                ${tPText ? `<div class="tx pI">${esc(tPText)}</div>` : ''}
                <div class="pill">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9.5 3.2a1.6 1.6 0 0 1 3.2 0v7.1l4-.6a2.6 2.6 0 0 1 2.9 2.6v3.6c0 3.3-2.7 6-6 6h-1.3a5.5 5.5 0 0 1-4.5-2.4l-3-4.4a1.5 1.5 0 0 1 2.4-1.8l1.3 1.3z"/><path d="M5.2 6.1a5 5 0 0 1 2.4-3.4M3.4 5.6a7.4 7.4 0 0 1 3.4-5" fill="none" stroke="#f6dfa0" stroke-width="1.3" stroke-linecap="round"/></svg>
                  Tap the seal to open
                </div>
              </div>
              <i class="shd"></i>
            </div>
            <div class="bk"></div>
          </div>
        </div>
      </div>
      <div id="rib"></div>
      <i class="ov rip"></i><i class="ov rip b"></i><i class="ov" id="rim"></i><i class="ov" id="glint"></i>
      <svg id="crack" viewBox="0 0 1024 1536" preserveAspectRatio="none" aria-hidden="true">
        <path d="M505 758 L493 800 L516 838 L489 880 L519 918 L492 960 L513 996 L503 1030"/>
      </svg>
      <div id="halo"></div><div id="flash"></div>
      <div class="hit" id="hs" data-open role="button" aria-label="Open invitation"></div>
      <div class="hit" id="hp" data-open role="button" aria-label="Tap the seal to open"></div>
    </div>

    <!-- Canvas for Fairy Dust, Wax Crumbs & Floating Petals -->
    <canvas id="fx"></canvas>
  </main>
</div>
`;
}

export function mount(root, { guest, wedding, events } = {}) {
  if (!root) return () => {};

  const st = (typeof root.querySelector === 'function' ? root.querySelector('#stage') : null) || root;
  const sc = typeof root.querySelector === 'function' ? root.querySelector('#scroller') : null;
  const intro = typeof root.querySelector === 'function' ? root.querySelector('#intro') : null;
  const tilt = typeof root.querySelector === 'function' ? root.querySelector('#tilt') : null;
  const hs = typeof root.querySelector === 'function' ? root.querySelector('#hs') : null;
  const hp = typeof root.querySelector === 'function' ? root.querySelector('#hp') : null;
  const fxCanvas = typeof root.querySelector === 'function' ? root.querySelector('#fx') : null;
  const musicToggleBtn = typeof root.querySelector === 'function' ? root.querySelector('#t03-music-btn') : null;

  let countdownTimer = null;
  let audioEl = null;
  let isAudioPlaying = false;
  let opened = false;
  const cleanups = [];
  const timers = [];

  const after = (ms, fn) => {
    const tid = setTimeout(fn, ms);
    timers.push(tid);
    return tid;
  };

  // 1. Text Fitting with safe padding & bounds
  const fitTo = (el, lim, min) => {
    if (!el || !el.textContent || !st) return;
    el.style.fontSize = '';
    const limPx = lim * (st.clientWidth || 360) / 100;
    let fs = (typeof window !== 'undefined' && typeof window.getComputedStyle === 'function')
      ? parseFloat(window.getComputedStyle(el).fontSize || '16')
      : 16;
    let n = 0;
    while (el.offsetWidth > limPx + .5 && fs > min && n++ < 60) {
      fs *= .94;
      el.style.fontSize = fs + 'px';
    }
  };

  const fitAll = () => {
    if (typeof root.querySelectorAll !== 'function') return;
    const w = st.clientWidth || 360;
    root.querySelectorAll('.nmI').forEach(el => fitTo(el, 78, w * .05));
    root.querySelectorAll('.gI').forEach(el => fitTo(el, 60, w * .03));
    root.querySelectorAll('.pI').forEach(el => fitTo(el, 60, w * .026));
    root.querySelectorAll('.nm').forEach(el => fitTo(el, 38, w * .04));
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('resize', fitAll);
    cleanups.push(() => window.removeEventListener('resize', fitAll));
    if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
      document.fonts.ready.then(fitAll).catch(() => {});
    }
  }
  setTimeout(fitAll, 50);

  // 2. Audio playback with synchronous tap unlock
  const musicWrapper = typeof root.querySelector === 'function' ? root.querySelector('.t03-wrapper') : null;
  const musicUrl = musicWrapper?.getAttribute('data-music') || '';

  const initAudio = () => {
    if (typeof Audio === 'undefined' || !musicUrl || audioEl) return;
    try {
      audioEl = new Audio();
      audioEl.loop = true;
      audioEl.preload = 'auto';
      audioEl.src = musicUrl;
    } catch (_) {}
  };

  const playAudio = () => {
    initAudio();
    if (!audioEl) return;
    try {
      const p = audioEl.play();
      if (p && typeof p.then === 'function') {
        p.then(() => {
          isAudioPlaying = true;
          if (musicToggleBtn) musicToggleBtn.textContent = '🎵 Music: ON';
        }).catch(() => {
          isAudioPlaying = false;
          if (musicToggleBtn) musicToggleBtn.textContent = '🎵 Music: OFF';
        });
      }
    } catch (_) {}
  };

  const toggleAudio = () => {
    initAudio();
    if (!audioEl) return;
    if (isAudioPlaying) {
      audioEl.pause();
      isAudioPlaying = false;
      if (musicToggleBtn) musicToggleBtn.textContent = '🎵 Music: OFF';
    } else {
      playAudio();
    }
  };

  if (musicToggleBtn) musicToggleBtn.addEventListener('click', toggleAudio);

  // 3. Canvas FX: Fairy dust, red wax crumbs & gold sparks
  let FX = null;
  if (fxCanvas && typeof fxCanvas.getContext === 'function') {
    FX = (function() {
      const cv = fxCanvas;
      const ctx = cv.getContext('2d');
      let w = 0, h = 0, ps = [], on = false, last = 0, rain = 0, mote = 0, acc = 0, macc = 0;

      function size() {
        if (!st) return;
        const d = (typeof window !== 'undefined' && window.devicePixelRatio) ? Math.min(window.devicePixelRatio, 2) : 1;
        w = st.clientWidth || 360;
        h = st.clientHeight || 540;
        cv.width = w * d;
        cv.height = h * d;
        if (ctx) ctx.setTransform(d, 0, 0, d, 0, 0);
      }

      function R(a, b) { return a + Math.random() * (b - a); }
      function add(p) { if (ps.length < 150) { p.age = 0; p.ph = Math.random() * 6.28; ps.push(p); } }

      const PC = [['#fffaf0', '#f3dcc0'], ['#fde9e4', '#f0b9b0'], ['#fff3d8', '#e9c77c'], ['#f6cfd0', '#d98089']];
      function petal(x, y) {
        const s = w * R(.012, .024), col = PC[Math.random() * PC.length | 0];
        add({ k: 'p', x: x == null ? R(-.05, 1.05) * w : x, y: y == null ? -s * 2 : y, vx: R(-.02, .05) * w, vy: R(.045, .1) * w, rot: R(0, 6.28), vr: R(-1.6, 1.6), s, life: R(6, 9), c: col });
      }
      function mote2() {
        add({ k: 'm', x: R(0, w), y: R(.2, 1) * h, vx: R(-.01, .01) * w, vy: -R(.015, .05) * w, s: w * R(.004, .012), life: R(3, 6) });
      }
      function crumbs(x, y, n) {
        for (let i = 0; i < n; i++) {
          const a = R(0, 6.28), v = R(.15, .7) * w;
          add({ k: 'c', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - w * .25, rot: R(0, 6.28), vr: R(-12, 12), s: w * R(.004, .011), life: R(1.2, 2.2), c: Math.random() < .7 ? ['#8a1224', '#5c0b18', '#b3213a'][i % 3] : '#e2b857' });
        }
      }
      function sparks(x, y, n, sp) {
        for (let i = 0; i < n; i++) {
          const a = R(0, 6.28), v = R(.05, sp || .45) * w;
          add({ k: 's', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - w * .05, s: w * R(.008, .022), life: R(1.2, 2.8) });
        }
      }

      function draw(p, dt) {
        p.age += dt;
        if (p.age > p.life) return false;
        const u = p.age / p.life, a = Math.min(1, u * 6) * Math.min(1, (1 - u) * 3);
        if (p.k === 'p') {
          p.vx += Math.sin(p.age * 1.7 + p.ph) * w * .05 * dt;
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          if (p.y > h + p.s * 3) return false;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.scale(.45 + .55 * Math.abs(Math.cos(p.age * 2.3 + p.ph)), 1);
          ctx.globalAlpha = a * .92;
          const g = ctx.createLinearGradient(0, -p.s, 0, p.s);
          g.addColorStop(0, p.c[0]); g.addColorStop(1, p.c[1]);
          ctx.fillStyle = g;
          ctx.beginPath(); ctx.moveTo(0, -p.s);
          ctx.bezierCurveTo(p.s * .95, -p.s * .6, p.s * .8, p.s * .75, 0, p.s);
          ctx.bezierCurveTo(-p.s * .8, p.s * .75, -p.s * .95, -p.s * .6, 0, -p.s);
          ctx.fill();
          ctx.globalAlpha = a * .25; ctx.strokeStyle = '#b88a3a'; ctx.lineWidth = .6; ctx.stroke();
          ctx.restore();
        } else if (p.k === 'c') {
          p.vy += w * 1.5 * dt; p.vx *= 1 - 1.2 * dt;
          p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt;
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot);
          ctx.globalAlpha = Math.min(1, (1 - u) * 2.2);
          ctx.fillStyle = p.c;
          ctx.beginPath(); ctx.moveTo(-p.s, -p.s * .5); ctx.lineTo(p.s, -p.s * .8); ctx.lineTo(p.s * .4, p.s);
          ctx.closePath(); ctx.fill(); ctx.restore();
        } else if (p.k === 's') {
          p.vx *= 1 - 1.6 * dt; p.vy *= 1 - 1.6 * dt; p.vy -= w * .03 * dt;
          p.x += p.vx * dt; p.y += p.vy * dt;
          const tw = .55 + .45 * Math.sin(p.age * 14 + p.ph), L = p.s * (1.4 + tw * 1.4);
          ctx.save(); ctx.globalAlpha = a;
          const g2 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, L * 1.6);
          g2.addColorStop(0, 'rgba(255,226,140,.8)'); g2.addColorStop(1, 'rgba(255,190,70,0)');
          ctx.fillStyle = g2; ctx.beginPath(); ctx.arc(p.x, p.y, L * 1.6, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(255,247,215,.95)'; ctx.lineWidth = Math.max(.7, p.s * .14);
          ctx.beginPath(); ctx.moveTo(p.x - L, p.y); ctx.lineTo(p.x + L, p.y); ctx.moveTo(p.x, p.y - L); ctx.lineTo(p.x, p.y + L); ctx.stroke();
          ctx.restore();
        } else {
          p.x += p.vx * dt; p.y += p.vy * dt;
          ctx.save(); ctx.globalAlpha = a * .85;
          const g3 = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.s * 2.4);
          g3.addColorStop(0, 'rgba(255,222,140,.95)'); g3.addColorStop(.4, 'rgba(236,178,70,.4)'); g3.addColorStop(1, 'rgba(230,160,50,0)');
          ctx.fillStyle = g3; ctx.beginPath(); ctx.arc(p.x, p.y, p.s * 2.4, 0, 6.3); ctx.fill();
          ctx.restore();
        }
        return true;
      }

      function loop(now) {
        if (!on) return;
        const dt = Math.min((now - last) / 1000, .05);
        last = now;
        acc += dt * rain; while (acc >= 1) { petal(); acc--; }
        macc += dt * mote; while (macc >= 1) { mote2(); macc--; }
        ctx.clearRect(0, 0, w, h);
        for (let i = ps.length - 1; i >= 0; i--) {
          if (!draw(ps[i], dt)) ps.splice(i, 1);
        }
        if (!ps.length && !rain && !mote) { on = false; return; }
        if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(loop);
      }

      function go() {
        if (!w) size();
        if (!on) {
          on = true;
          last = (typeof performance !== 'undefined' ? performance.now() : Date.now());
          if (typeof requestAnimationFrame !== 'undefined') requestAnimationFrame(loop);
        }
      }

      return {
        start: go,
        size,
        rain: r => { rain = r; go(); },
        mote: r => { mote = r; go(); },
        crumbs: (x, y, n) => { go(); crumbs(x, y, n); },
        sparks: (x, y, n, s) => { go(); sparks(x, y, n, s); },
        stop: () => { on = false; ps = []; }
      };
    })();
  }

  // 4. Iris circular mask expansion
  function iris() {
    const dim = typeof root.querySelector === 'function' ? root.querySelector('#dim') : null;
    if (!dim) return;
    const t0 = (typeof performance !== 'undefined' ? performance.now() : Date.now());
    const Dn = 2400;
    (function f(n) {
      const u = Math.min(1, (n - t0) / Dn);
      const e = u < .5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2;
      dim.style.setProperty('--r', (e * 124).toFixed(2));
      if (u < 1 && typeof requestAnimationFrame !== 'undefined') {
        requestAnimationFrame(f);
      } else {
        dim.style.display = 'none';
      }
    })(t0);
  }

  // 5. Door Open Sequence
  function openEnvelope() {
    if (opened) return;
    opened = true;
    if (!st || !intro) return;

    playAudio();

    const W = st.clientWidth || 360;
    const seamX = W * .4912, sealY = (st.clientHeight || 540) * .583;
    if (tilt) {
      tilt.style.setProperty('--rx', '0deg');
      tilt.style.setProperty('--ry', '0deg');
    }
    if (hs) hs.style.pointerEvents = 'none';
    if (hp) hp.style.pointerEvents = 'none';
    st.classList.add('opening');

    if (FX) {
      after(260, () => { FX.crumbs(seamX, sealY, 34); FX.sparks(seamX, sealY, 26, .5); });
      after(430, () => { intro.classList.add('ajar'); FX.sparks(seamX, sealY, 18, .7); });
      after(800, () => { intro.classList.add('rays'); FX.mote(14); });
      after(1150, () => { iris(); });
      after(1500, () => { FX.rain(5); });
      after(2100, () => { intro.classList.add('fl'); st.classList.add('go'); });
      after(2500, () => { intro.classList.add('fin'); });
      after(5600, () => { FX.rain(2.2); FX.mote(0); });
      after(8600, () => { FX.rain(0); });
    } else {
      after(430, () => intro.classList.add('ajar'));
      after(1150, () => iris());
      after(2100, () => { intro.classList.add('fl'); st.classList.add('go'); });
      after(2500, () => intro.classList.add('fin'));
    }

    after(4800, () => {
      if (intro && intro.parentNode) intro.remove();
      if (sc) {
        sc.style.overflowY = 'auto';
      }
      fitAll();
    });
  }

  if (hs) hs.addEventListener('click', openEnvelope);
  if (hp) hp.addEventListener('click', openEnvelope);

  // 6. Pointer parallax on closed envelope
  if (st && tilt) {
    const onMove = e => {
      if (opened) return;
      const r = st.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5;
      const y = (e.clientY - r.top) / r.height - .5;
      tilt.style.setProperty('--ry', (x * 5).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', (-y * 4).toFixed(2) + 'deg');
    };
    st.addEventListener('pointermove', onMove);
    cleanups.push(() => st.removeEventListener('pointermove', onMove));
  }

  // 7. Pages IntersectionObserver for gentle reveals
  if (typeof IntersectionObserver !== 'undefined' && sc) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(x => {
        if (x.isIntersecting) x.target.classList.add('in');
      });
    }, { root: sc, threshold: .4 });

    if (typeof root.querySelectorAll === 'function') {
      root.querySelectorAll('.pg.bl').forEach(p => io.observe(p));
    }
    cleanups.push(() => io.disconnect());
  }

  // 8. Start Again Button
  const restartBtn = typeof root.querySelector === 'function' ? root.querySelector('[data-restart]') : null;
  if (restartBtn && sc) {
    restartBtn.addEventListener('click', () => {
      const p2 = root.querySelector('#p2');
      if (p2) p2.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 9. Live Countdown Timer
  const cdContainer = typeof root.querySelector === 'function' ? root.querySelector('#t03-countdown') : null;
  if (cdContainer) {
    const whenAttr = cdContainer.getAttribute('data-when');
    const targetMs = whenAttr ? Number(whenAttr) : null;

    const daysEl = cdContainer.querySelector('[data-cd="days"]');
    const hoursEl = cdContainer.querySelector('[data-cd="hours"]');
    const minsEl = cdContainer.querySelector('[data-cd="minutes"]');
    const secsEl = cdContainer.querySelector('[data-cd="seconds"]');

    if (targetMs && !Number.isNaN(targetMs)) {
      const updateCd = () => {
        const now = Date.now();
        const diff = targetMs - now;
        if (diff <= 0) {
          if (daysEl) daysEl.textContent = '00';
          if (hoursEl) hoursEl.textContent = '00';
          if (minsEl) minsEl.textContent = '00';
          if (secsEl) secsEl.textContent = '00';
          if (countdownTimer) clearInterval(countdownTimer);
          return;
        }
        const totalSecs = Math.floor(diff / 1000);
        const d = Math.floor(totalSecs / 86400);
        const h = Math.floor((totalSecs % 86400) / 3600);
        const m = Math.floor((totalSecs % 3600) / 60);
        const s = totalSecs % 60;

        if (daysEl) daysEl.textContent = pad(d);
        if (hoursEl) hoursEl.textContent = pad(h);
        if (minsEl) minsEl.textContent = pad(m);
        if (secsEl) secsEl.textContent = pad(s);
      };
      updateCd();
      countdownTimer = setInterval(updateCd, 1000);
      cleanups.push(() => clearInterval(countdownTimer));
    }
  }

  // 10. Boot / Envelope Presentation
  const showIntro = () => {
    fitAll();
    if (intro) intro.classList.add('rd');
    if (FX) {
      FX.size();
      FX.mote(2.2);
      FX.rain(.35);
    }
  };

  const envURL = './assets/template-03-envelope.webp';
  if (typeof Image !== 'undefined') {
    const im0 = new Image();
    im0.onload = () => {
      if (im0.decode) im0.decode().then(showIntro, showIntro);
      else showIntro();
    };
    im0.onerror = showIntro;
    im0.src = envURL;
  }
  const fallbackBoot = setTimeout(showIntro, 1200);
  timers.push(fallbackBoot);

  return () => {
    cleanups.forEach(fn => { try { fn(); } catch (_) {} });
    timers.forEach(t => clearTimeout(t));
    if (audioEl) {
      try { audioEl.pause(); } catch (_) {}
    }
    if (FX) FX.stop();
  };
}
