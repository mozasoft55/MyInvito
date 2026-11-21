/* ==========================================================================
   PURUSHOTTAM & SANJUKTA / PARI & PARAM (Template 12)
   Master-Level Royal Indian 3D Gate Wedding Invitation Suite:
   - Act I (1st Image - Intro Gate):
     - Starry night palace arch with 6 unlit bronze lanterns and royal gates.
     - 3D swinging palace gate leaves (swL / swR with perspective: 115cqw, transform-origin: 22.1% & 78.2%).
     - Sequential 6-lamp lighting ignition with radiant flickering glow halos.
     - Live HTML5 canvas sparkler / phuljhari cracker pyrotechnics with multi-color firework bursts.
     - Synthesized Web Audio API sparkler crackle & palace chime.
     - Center royal welcome board: "A CELEBRATION OF LOVE", couple names in calligraphy,
       "CORDIALLY INVITED", guest name, party count badge, pulsating golden "OPEN" button,
       and tap hotspot on red carpet.
     - Skip Intro button neatly nested on the board.
     - Bottom navigation dock strictly hidden on intro.
   - Act II (2nd Image - Screen 1): The Royal Couple & Lineage:
     - Backdrop: Royal courtyard palace with rose gardens and red carpet.
     - "॥ শ্রী শ্রী প্রজাপতয়ে নমঃ ॥", "Two Hearts · One Destiny", "Together with their Families"
     - "The Journey of Love & Togetherness"
     - Left: Bride medallion photo, "Bride", Pari, d/o, Kalam, Address
     - Right: Groom medallion photo, "Groom", Param, s/o, Abdul, Address
     - "❖ Two hearts, two families, one beautiful beginning."
     - "✦ SCROLL FOR SACRED MUHURAT ✦"
     - Distributed with flexbox (no empty gap or overlap with arch).
     - Floating bottom navigation dock visible from this screen onward.
   - Act III (3rd Image - Screen 2): Auspicious Wedding Muhurat:
     - Ornate floral pillar side borders (template-12-border.webp).
     - "Auspicious Wedding Muhurat · The Sacred Wedding Date"
     - Interactive Scratch & Reveal Wedding Date card with gold foil canvas.
     - Live 4-box Countdown Timer (Days, Hours, Minutes, Seconds).
     - Save Date button with Google Calendar integration link.
   - Act IV (4th Image - Screen 3): Wedding Programme:
     - "Auspicious Ceremonies · Wedding Programme"
     - Ceremony cards with photos, date & time ribbons, venue names, and RSVP links.
   - Act V (5th Image - Screen 4): Banquet & Venue:
     - "Celebration Details · Banquet & Venue"
     - Banquet Name, Location Address, banquet hero photo (or palace fallback),
       and Google Maps directions button.
   - Act VI (Screen 5): Closing Blessing & Royal RSVP Suite:
     - Family Invitation Board / Respected Guest badge.
     - "✉️ OPEN ROYAL RSVP MODAL" trigger button.
     - Closing blessing: "With love, affection, and best wishes, / The Pari & Para Families".
     - "✨ REPLAY LIGHTS & PHULJHARI" button.
   ========================================================================== */

/* ---------- Helpers & Sanitizers ---------- */
const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ESC[c]);
const clean = v => String(v ?? '').trim();
const safeUrl = u => (/^https?:\/\//i.test(clean(u)) ? esc(clean(u)) : '');
const safeImg = u => {
  const s = clean(u);
  if (!s) return '';
  if (/^https?:\/\//i.test(s)) return s;
  if (/^blob:/i.test(s)) return s;
  if (s.startsWith('data:image/')) return s;
  if (/^\.?\/?assets\//i.test(s)) return s;
  if (/^[a-z0-9_\-\/.]+\.(jpg|jpeg|png|webp|svg|gif|avif)$/i.test(s)) {
    return s.startsWith('.') || s.startsWith('/') ? s : `./assets/${s}`;
  }
  return s;
};

const getStoredPhoto = (...keys) => {
  try {
    for (const k of keys) {
      if (!k) continue;
      if (typeof localStorage !== 'undefined' && typeof localStorage.getItem === 'function') {
        const v = localStorage.getItem(k);
        if (v && v.trim()) return v.trim();
      }
      if (typeof sessionStorage !== 'undefined' && typeof sessionStorage.getItem === 'function') {
        const v = sessionStorage.getItem(k);
        if (v && v.trim()) return v.trim();
      }
    }
  } catch { return ''; }
  return '';
};

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function formatWeddingDate(raw) {
  if (!raw) return 'Friday, 28 November 2026';
  const m = String(raw).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (m) {
    const y = parseInt(m[1], 10), mo = parseInt(m[2], 10) - 1, d = parseInt(m[3], 10);
    const dt = new Date(Date.UTC(y, mo, d));
    const dayName = DAYS[dt.getUTCDay()];
    const monthName = MONTHS[mo] || 'November';
    return `${dayName}, ${d} ${monthName} ${y}`;
  }
  return String(raw);
}

function formatRibbonDate(dateStr, timeStr) {
  let datePart = '20 - 28 NOVEMBER 2026';
  if (dateStr) {
    const m = String(dateStr).match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (m) {
      const mo = parseInt(m[2], 10) - 1, d = parseInt(m[3], 10), y = m[1];
      const monthName = (MONTHS[mo] || 'NOV').toUpperCase();
      datePart = `${d} ${monthName} ${y}`;
    } else {
      datePart = String(dateStr).toUpperCase();
    }
  }
  const timePart = timeStr ? String(timeStr).toUpperCase() : '7:00 PM ONWARDS';
  return `${datePart} · ${timePart}`;
}

function formatAddress(addr) {
  const s = clean(addr);
  if (!s) return '';
  if (s.includes(',')) {
    const parts = s.split(',').map(p => p.trim()).filter(Boolean);
    if (parts.length >= 2) {
      return `${esc(parts[0])},<br>${esc(parts.slice(1).join(', '))}`;
    }
  }
  return esc(s);
}

function getFatherOnly(str, fallback) {
  const s = clean(str);
  if (!s) return fallback || 'Mr. Father Name';
  const mrMrsMatch = s.match(/^Mr\.?\s*(?:&|and)\s*Mrs\.?\s*(.+)$/i);
  if (mrMrsMatch) {
    return `Mr. ${mrMrsMatch[1].trim()}`;
  }
  let res = s.replace(/\s*(?:&|and)\s*(?:Late\s*)?(?:Mrs\.?|Smt\.?|Mother)[^,;]*/gi, '');
  if (res.includes('&')) {
    res = res.split('&')[0].trim();
  }
  if (res.toLowerCase().includes(' and ')) {
    res = res.split(/\s+and\s+/i)[0].trim();
  }
  return res.trim() || fallback || 'Mr. Father Name';
}

const CEREMONY_IMAGES = [
  { re: /gaye\s*holud|holud|haldi/i, img: './assets/template-06-gaye-holud.webp' },
  { re: /mehndi|mehendi/i, img: './assets/template-06-sangeet.webp' },
  { re: /sangeet|musical/i, img: './assets/template-06-sangeet.webp' },
  { re: /biye|bibaho|shubho|nikah|vivah|wedding|ceremony/i, img: './assets/template-06-shubho-bibaho.webp' },
  { re: /bou\s*bhat|boubhat|walima/i, img: './assets/template-06-boubhat.webp' },
  { re: /reception/i, img: './assets/template-06-reception.webp' }
];

function getEventPhoto(ev) {
  if (ev.photo_url) return safeImg(ev.photo_url);
  const name = String(ev.event_name || '');
  for (const item of CEREMONY_IMAGES) {
    if (item.re.test(name)) return item.img;
  }
  return './assets/template-06-shubho-bibaho.webp';
}

function makeCalendarLink({ title, description, location, startDate, startTime }) {
  let sDate = '20261128';
  let sTime = '190000';
  if (startDate) {
    const m = String(startDate).match(/^(\d{4})-?(\d{2})-?(\d{2})$/);
    if (m) sDate = `${m[1]}${m[2]}${m[3]}`;
  }
  if (startTime) {
    const tm = String(startTime).match(/(\d{1,2}):?(\d{2})/);
    if (tm) {
      let hh = parseInt(tm[1], 10);
      const mm = tm[2];
      if (/pm/i.test(startTime) && hh < 12) hh += 12;
      if (/am/i.test(startTime) && hh === 12) hh = 0;
      sTime = `${String(hh).padStart(2, '0')}${mm}00`;
    }
  }
  const startIso = `${sDate}T${sTime}`;
  const endIso = `${sDate}T235900`;
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title || 'Sacred Wedding Ceremony',
    dates: `${startIso}/${endIso}`,
    details: description || 'Cordially invited to grace the auspicious wedding celebration.',
    location: location || 'Royal Palace Banquet'
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ==========================================================================
   DEFAULT EXPORT: RENDER HTML
   ========================================================================== */
export default function renderTemplate12({ guest = {}, wedding = {}, events = [] } = {}) {
  const rawGuestName = clean(guest.name || guest.guest_name || guest.family_name) || 'Respected Guest';
  const rawPersons = guest.persons ?? guest.guest_count ?? guest.family_members ?? guest.party_size ?? guest.passes;
  const isExplicitPerson = guest.with_family === false || String(guest.category || '').toLowerCase() === 'person';
  const isExplicitFamily = guest.with_family === true || String(guest.category || '').toLowerCase() === 'family' || Boolean(guest.is_family) || Boolean(guest.family_name && !guest.name) || /family/i.test(rawGuestName);

  const partySize = Math.max(1, parseInt(rawPersons ?? (isExplicitFamily ? 2 : 1), 10) || (isExplicitFamily ? 2 : 1));
  const isFamily = !isExplicitPerson && (isExplicitFamily || (partySize > 1 && guest.with_family !== false));

  const hasFamilyInName = /family/i.test(rawGuestName);
  const guestDisplayName = isFamily && !hasFamilyInName ? `${rawGuestName} & Family` : rawGuestName;

  const partyBadge = isFamily
    ? 'Family'
    : (partySize > 1 ? `Personal Invitation · ${partySize} Persons` : 'Personal Invitation · 1 Person');

  const brideName = clean(wedding.bride_name) || 'Pari';
  const groomName = clean(wedding.groom_name) || 'Param';
  const orderRef = clean(wedding.order_reference) || clean(wedding.ref) || '';
  const isT12Match = !wedding.template_id || wedding.template_id === 'template-12' || wedding.template_id === '12';

  const bridePhoto = safeImg(wedding.bride_photo)
    || safeImg(wedding.bride_photo_url)
    || safeImg(wedding.bride_image)
    || safeImg(wedding.bridePhoto)
    || safeImg(wedding.photo_bride)
    || safeImg(wedding.bride_img)
    || safeImg(wedding.image2)
    || (orderRef ? getStoredPhoto(`wedding_bride_photo_${orderRef}`) : '')
    || safeImg(wedding.couple_photo)
    || './assets/template-06-bride.webp';

  const groomPhoto = safeImg(wedding.groom_photo)
    || safeImg(wedding.groom_photo_url)
    || safeImg(wedding.groom_image)
    || safeImg(wedding.groomPhoto)
    || safeImg(wedding.photo_groom)
    || safeImg(wedding.groom_img)
    || safeImg(wedding.image1)
    || (orderRef ? getStoredPhoto(`wedding_groom_photo_${orderRef}`) : '')
    || safeImg(wedding.couple_photo)
    || './assets/template-06-groom.webp';

  const brideAddr = clean(wedding.bride_address) || clean(wedding.bride_city) || '';
  const groomAddr = clean(wedding.groom_address) || clean(wedding.groom_city) || '';
  const isGroomFirst = (clean(wedding.name_order) || clean(wedding.couple_order)) === 'groom_first';

  const brideParents = clean(wedding.bride_parents) || clean(wedding.bride_father) || '';
  const groomParents = clean(wedding.groom_parents) || clean(wedding.groom_father) || '';

  const weddingDateStr = formatWeddingDate(wedding.date || wedding.event_date);
  const venueName = clean(wedding.venue)
    || clean(wedding.venue_name)
    || clean(wedding.banquet_name)
    || clean(wedding.banquet)
    || clean(wedding.venue_title)
    || clean(wedding.hall)
    || clean(wedding.hall_name)
    || 'Royal Palace Banquet';

  const venueAddr = clean(wedding.address)
    || clean(wedding.venue_address)
    || clean(wedding.location)
    || clean(wedding.city_address)
    || clean(wedding.city)
    || '';

  const banquetPhoto = safeImg(wedding.venue_photo)
    || safeImg(wedding.venue_photo_url)
    || safeImg(wedding.banquet_photo)
    || safeImg(wedding.venue_image)
    || safeImg(wedding.banquet_image)
    || safeImg(wedding.photo_venue)
    || safeImg(wedding.image4)
    || (orderRef ? getStoredPhoto(`wedding_venue_photo_${orderRef}`) : '')
    || './assets/template-06-shubho-bibaho.webp';

  const mapLink = safeUrl(wedding.map_url)
    || (venueName || venueAddr ? `https://maps.google.com/?q=${encodeURIComponent([venueName, venueAddr].filter(Boolean).join(', '))}` : '');
  const calLink = makeCalendarLink({
    title: `Wedding of ${groomName} & ${brideName}`,
    description: `You are cordially invited to celebrate the auspicious wedding of ${groomName} and ${brideName}.`,
    location: `${venueName}, ${venueAddr}`,
    startDate: wedding.date,
    startTime: wedding.time
  });

  const rawEvents = Array.isArray(events) && events.length ? events : [
    { event_name: 'Ceremony 1 · Gaye Holud', event_date: '2026-11-20', event_time: '10:00 AM', venue: venueName },
    { event_name: 'Ceremony 2 · Sangeet & Mehendi', event_date: '2026-11-24', event_time: '6:30 PM', venue: venueName },
    { event_name: 'Ceremony 3 · Shubho Bibaho', event_date: wedding.date || '2026-11-28', event_time: wedding.time || '7:00 PM', venue: venueName },
    { event_name: 'Ceremony 4 · Grand Reception', event_date: '2026-11-30', event_time: '7:30 PM', venue: venueName }
  ];

  const IW = 937, IH = 1678;
  const pct = (v, t) => `${(v / t * 100).toFixed(2)}%`;
  const LAMPS = [
    [113, 773, 90, 208],
    [824, 773, 90, 208],
    [220, 918, 60, 116],
    [717, 918, 60, 116],
    [175, 1263, 68, 188],
    [762, 1263, 68, 188]
  ];

  return `
<style>
/* ==========================================================================
   TEMPLATE 12 STYLES (Royal 3D Gate & Floral Pillars Suite)
   ========================================================================== */
:root {
  --t12-landing: url('./assets/template-12-cover.webp');
  --t12-page: url('./assets/template-12-page.webp');
  --t12-border: url('./assets/template-12-border.webp');
  --t12-navy: #050a1c;
  --t12-gold-start: #fffbe8;
  --t12-gold-mid: #ffe9a6;
  --t12-gold-end: #f0c35c;
  --t12-crimson: #7a1426;
  --t12-dark-wine: #320912;
}

#t12-stage * {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

#t12-stage {
  position: relative;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  height: 100dvh;
  min-height: 100dvh;
  background: var(--t12-navy);
  overflow-x: hidden;
  overflow-y: hidden;
  container-type: size;
  font-family: 'Cormorant Garamond', Georgia, serif;
}

#t12-stage.t12-unlocked {
  overflow-y: auto;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
#t12-stage::-webkit-scrollbar { display: none; }



/* ==========================================================================
   ACT I: 3D GATE INTRO (Screen 0)
   ========================================================================== */
.t12-intro {
  position: absolute;
  inset: 0;
  z-index: 50;
  opacity: 0;
  transition: opacity 0.7s ease;
  touch-action: none;
}
.t12-intro.ready {
  opacity: 1;
}
.t12-scene {
  position: absolute;
  inset: 0;
}
.t12-layer {
  position: absolute;
  inset: 0;
  background: var(--t12-landing) center/100% 100% no-repeat;
}
.t12-frame-wrap {
  position: absolute;
  inset: 0;
}
.t12-go.t12-frame-out .t12-frame-wrap {
  opacity: 0;
  transition: opacity 3.6s ease-in-out;
}
.t12-gate {
  position: absolute;
  inset: 0;
  perspective: 115cqw;
  perspective-origin: 50% 55%;
}
.t12-leaf {
  will-change: transform;
}
.t12-leaf-l {
  transform-origin: 22.1% 50%;
}
.t12-leaf-r {
  transform-origin: 78.2% 50%;
}
.t12-go.t12-open .t12-leaf-l {
  animation: t12SwL 7s cubic-bezier(0.42, 0.05, 0.4, 1) forwards;
}
.t12-go.t12-open .t12-leaf-r {
  animation: t12SwR 7s cubic-bezier(0.42, 0.05, 0.4, 1) forwards;
}
@keyframes t12SwL {
  from { transform: rotateY(0); filter: brightness(1); }
  to { transform: rotateY(98deg); filter: brightness(0.5); }
}
@keyframes t12SwR {
  from { transform: rotateY(0); filter: brightness(1); }
  to { transform: rotateY(-98deg); filter: brightness(0.5); }
}
.t12-go.t12-leaf-out .t12-leaf {
  opacity: 0;
  transition: opacity 1.2s ease;
}

/* Glowing sequential lamps */
.t12-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  background: radial-gradient(circle, rgba(255, 244, 196, 1) 0%, rgba(255, 206, 96, 0.78) 20%, rgba(255, 160, 50, 0.36) 46%, rgba(255, 130, 30, 0) 70%);
  transition: opacity 1.3s ease;
}
.t12-glow.on {
  opacity: 1;
  animation: t12Flick 2.3s ease-in-out infinite alternate;
}
@keyframes t12Flick {
  0% { opacity: 0.82; transform: translate(-50%, -50%) scale(0.97); }
  45% { opacity: 1; transform: translate(-50%, -50%) scale(1.03); }
  100% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
}

/* Text Overlay and Welcome Board */
.t12-txt {
  position: absolute;
  inset: 0;
  transition: opacity 0.7s ease;
  pointer-events: none;
}
.t12-go.t12-t-out .t12-txt {
  opacity: 0;
}
.t12-board {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 2.2cqw 3cqw;
  border-radius: 2.4cqw;
  background: radial-gradient(130% 95% at 50% 22%, #7a1426 0%, #58101f 48%, #320912 100%);
  box-shadow: inset 0 0 0 0.45cqw #e9c46a, inset 0 0 0 1cqw #3a0a13, inset 0 0 0 1.35cqw #c79a3a, 0 1.6cqw 4.5cqw rgba(0, 0, 0, 0.55), 0 0 3cqw rgba(255, 200, 90, 0.25);
}
.t12-board > * {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  margin: 0.3cqw 0;
}
.t12-gold-txt {
  color: #fff4d1;
  text-shadow: 0 0.3cqw 0.8cqw rgba(255, 230, 150, 0.65), 0 0.5cqw 1.2cqw rgba(0, 0, 0, 0.9);
}
.t12-b-cele {
  font: 700 2.55cqw 'Cinzel', serif;
  letter-spacing: 0.14em;
  padding-left: 0.14em;
}
.t12-b-orn {
  height: 0.45cqw;
  width: 60% !important;
  margin: 0.6cqw auto !important;
  background: linear-gradient(90deg, transparent, #e9c46a 30%, #fff1b8 50%, #e9c46a 70%, transparent);
  border-radius: 1cqw;
}
.t12-b-nm {
  font: 400 8cqw 'Great Vibes', cursive;
  line-height: 1.05;
  padding: 0 0.8cqw;
}
.t12-b-cord {
  font: 700 2.4cqw 'Cinzel', serif;
  letter-spacing: 0.12em;
  padding-left: 0.12em;
}
.t12-b-gst {
  font: 700 6.4cqw 'Cormorant Garamond', serif;
  line-height: 1.05;
  margin-top: 0.5cqw;
}
.t12-b-prs {
  font: 700 4.4cqw 'Cormorant Garamond', serif;
  line-height: 1.05;
}
.t12-obtn {
  pointer-events: auto;
  cursor: pointer;
  border: 0;
  outline: none;
  margin-top: 1.2cqw;
  width: auto !important;
  padding: 1.1cqw 6cqw;
  border-radius: 5cqw;
  font: 700 3.4cqw 'Cinzel', serif;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  color: #3a0a13;
  background: linear-gradient(180deg, #fff3c4 0%, #f4cf6a 50%, #c99530 100%);
  box-shadow: 0 0.5cqw 1cqw rgba(0, 0, 0, 0.5), inset 0 0.2cqw 0.3cqw rgba(255, 255, 255, 0.7);
  animation: t12Pulse 1.9s ease-in-out infinite;
}
.t12-skip-btn {
  pointer-events: auto;
  cursor: pointer;
  margin-top: 0.8cqw;
  background: transparent;
  border: none;
  font: 700 2.1cqw 'Cinzel', serif;
  letter-spacing: 0.2em;
  color: #f7e2a8;
  text-decoration: underline;
  text-shadow: 0 0.2cqw 0.6cqw rgba(0,0,0,0.9);
  transition: opacity 0.2s;
  width: auto !important;
}
.t12-skip-btn:hover { opacity: 0.8; }

/* Invisible clickable tap hotspot over the carpet plaque */
.t12-hit {
  pointer-events: auto;
  position: absolute;
  border: 0;
  background: transparent;
  cursor: pointer;
  border-radius: 3cqw;
  outline: none;
}
@keyframes t12Pulse {
  0%, 100% { box-shadow: 0 0.5cqw 1cqw rgba(0, 0, 0, 0.5), 0 0 1.4cqw 0.2cqw rgba(255, 214, 110, 0.55); }
  50% { box-shadow: 0 0.5cqw 1cqw rgba(0, 0, 0, 0.5), 0 0 4.6cqw 1.3cqw rgba(255, 226, 140, 0.95); }
}
.t12-hit.tap {
  animation: t12Pulse2 2.6s ease-in-out infinite;
}
@keyframes t12Pulse2 {
  0%, 100% { box-shadow: 0 0 1.2cqw rgba(255, 214, 110, 0.25); }
  50% { box-shadow: 0 0 3.6cqw 0.6cqw rgba(255, 226, 140, 0.7); }
}
.t12-go .t12-hit, .t12-go .t12-obtn, .t12-go .t12-skip-btn {
  pointer-events: none;
  animation: none;
}
.t12-go .t12-hit {
  opacity: 0;
  transition: opacity 0.4s;
}

/* Canvas Sparkler / Phuljhari Crackers */
.t12-spark {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 80;
  pointer-events: none;
  mix-blend-mode: screen;
}

/* ==========================================================================
   PAGES CONTAINER & SCREENS
   ========================================================================== */
.t12-pages {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  overflow-y: hidden;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.t12-pages::-webkit-scrollbar { display: none; }
.t12-stage.t12-unlocked .t12-pages {
  overflow-y: auto;
}
.t12-page {
  position: relative;
  width: 100%;
  min-height: 100dvh;
  height: 100dvh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
}

/* ==========================================================================
   SCREEN 1 (2nd Image): ROYAL COUPLE & LINEAGE (Palace Backdrop)
   ========================================================================== */
.t12-page-couple {
  background: var(--t12-page) center/100% 100% no-repeat;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding-top: calc(40px + 6cqw);
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 16px));
  padding-left: 14cqw;
  padding-right: 14cqw;
  text-align: center;
}

/* Soft veil to ensure optimal readability */
.t12-veil {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: radial-gradient(64% 45% at 50% 48%, rgba(254, 246, 238, 0.78) 0%, rgba(252, 240, 230, 0.65) 55%, rgba(248, 232, 232, 0) 100%);
  -webkit-backdrop-filter: blur(2px);
  backdrop-filter: blur(2px);
  z-index: 1;
}

.t12-p1-content {
  position: relative;
  z-index: 2;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  min-height: 100%;
}

.t12-shloka {
  font-family: 'Cinzel', serif;
  font-size: 2.8cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #801428;
  margin-bottom: 0.8cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t12-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 3.2cqw;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #4a3006;
  padding-left: 0.32em;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.9);
}
.t12-kicker {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.4cqw;
  font-style: italic;
  font-weight: 600;
  color: #63430c;
  margin-top: 0.4cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.9);
}
.t12-hero-title {
  font-family: 'Cinzel', serif;
  font-size: 3.6cqw;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #801428;
  margin-top: 0.6cqw;
  padding-left: 0.22em;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.95);
}
.t12-gold-divider {
  width: 44cqw;
  height: 0.5cqw;
  margin: 1.6cqw auto 2cqw;
  background: linear-gradient(90deg, transparent, #a47a1c 30%, #e8c25a 50%, #a47a1c 70%, transparent);
  border-radius: 1cqw;
}

/* Couple Columns Grid (Left Bride, Right Groom) */
.t12-couple-row {
  display: grid;
  grid-template-columns: 1fr 6cqw 1fr;
  align-items: start;
  width: 100%;
  margin: 1cqw 0 2cqw;
}
.t12-couple-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 0 0.5cqw;
}
.t12-couple-amp {
  align-self: center;
  margin-top: 8cqw;
  font: 400 9cqw 'Great Vibes', cursive;
  color: #801428;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.95);
  line-height: 1;
}

/* Photo Medallion */
.t12-photo-ring {
  position: relative;
  width: 25.5cqw;
  height: 25.5cqw;
  border-radius: 50%;
  padding: 0.85cqw;
  background: conic-gradient(from 210deg, #7a5410, #f4d982, #b88a22, #fff1bd, #9a6f14, #f0cf70, #7a5410);
  box-shadow: 0 1.2cqw 3cqw rgba(60, 30, 10, 0.35), 0 0 0 0.35cqw rgba(255, 244, 214, 0.75);
}
.t12-photo-ring::after {
  content: "";
  position: absolute;
  inset: 0.85cqw;
  border-radius: 50%;
  box-shadow: inset 0 0 2cqw rgba(0, 0, 0, 0.28);
  pointer-events: none;
}
.t12-photo-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 35% 30%, #fff7e0, #e9d5a2);
  display: grid;
  place-items: center;
  position: relative;
}
.t12-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.t12-photo-ltr {
  font: 400 14cqw 'Great Vibes', cursive;
  color: #0b1740;
  line-height: 1;
}

.t12-role-badge {
  margin-top: 1.8cqw;
  font: 700 2.5cqw 'Cinzel', serif;
  letter-spacing: 0.22em;
  color: #801428;
  padding-left: 0.22em;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
  text-transform: uppercase;
}
.t12-person-name {
  margin-top: 1cqw;
  max-width: 100%;
  white-space: nowrap;
  font: 700 7.8cqw 'Great Vibes', cursive;
  color: #1a0b02;
  line-height: 1.12;
  text-shadow: 0 0 1.4cqw rgba(255, 248, 236, 0.95);
}
.t12-rel-label {
  margin-top: 1.2cqw;
  font: 700 2.4cqw 'Cinzel', serif;
  letter-spacing: 0.22em;
  color: #5c3b08;
  padding-left: 0.22em;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
  text-transform: lowercase;
}
.t12-father-name {
  margin-top: 0.6cqw;
  max-width: 100%;
  font: 700 4.2cqw 'Cormorant Garamond', serif;
  color: #1a1004;
  line-height: 1.15;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t12-address {
  margin-top: 1.2cqw;
  max-width: 27cqw;
  font: 700 3.2cqw 'Cormorant Garamond', serif;
  color: #38240f;
  line-height: 1.22;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
  text-wrap: balance;
}

/* Footer Tagline on Screen 1 */
.t12-p1-footer {
  margin-top: 1.5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t12-ornament-icon {
  font-size: 3.5cqw;
  color: #801428;
  margin-bottom: 0.6cqw;
}
.t12-tagline {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.5cqw;
  font-style: italic;
  font-weight: 600;
  color: #4a3006;
  line-height: 1.35;
  margin: 0;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t12-scroll-cue {
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: #801428;
  margin-top: 2cqw;
  animation: t12Float 2s ease-in-out infinite;
}
@keyframes t12Float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

/* ==========================================================================
   FRAMED SCREENS: 2, 3, 4, 5 (template-12-border.webp)
   ========================================================================== */
.t12-page-framed {
  background: radial-gradient(120% 90% at 50% 45%, #f8efd9 0%, #f3e7cb 55%, #e6d3a8 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  padding-top: 5cqw;
  padding-bottom: calc(76px + env(safe-area-inset-bottom, 16px));
  padding-left: 14cqw;
  padding-right: 14cqw;
  text-align: center;
}
.t12-page-framed::after {
  content: "";
  position: absolute;
  inset: 0;
  background: var(--t12-border) center/100% 100% no-repeat;
  pointer-events: none;
  z-index: 2;
}
.t12-framed-content {
  position: relative;
  z-index: 3;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.t12-sec-kicker {
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #801428;
  text-transform: uppercase;
}
.t12-sec-title {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #3b2203;
  margin: 0.6cqw 0 0.4cqw;
  text-transform: uppercase;
}
.t12-sec-sub {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.2cqw;
  font-style: italic;
  font-weight: 600;
  color: #5c3b08;
  max-width: 60cqw;
  margin-bottom: 2.5cqw;
  line-height: 1.3;
}

/* ==========================================================================
   SCREEN 2: AUSPICIOUS WEDDING MUHURAT (Scratch Card & Countdown)
   ========================================================================== */
.t12-scratch-wrap {
  width: 100%;
  max-width: 62cqw;
  margin-bottom: 2.5cqw;
}
.t12-scratch-box {
  position: relative;
  width: 100%;
  height: 32cqw;
  border-radius: 2.4cqw;
  overflow: hidden;
  box-shadow: 0 1.2cqw 3.5cqw rgba(60, 30, 10, 0.25), inset 0 0 0 0.35cqw #e9c46a;
  background: radial-gradient(130% 95% at 50% 22%, #fffdf5 0%, #faecd4 60%, #eed5aa 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5cqw;
}
.t12-scratch-unveiled {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #3b2203;
}
.t12-scratch-icon {
  font-size: 5cqw;
  margin-bottom: 0.5cqw;
}
.t12-scratch-date {
  font-family: 'Cinzel', serif;
  font-size: 3.6cqw;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #801428;
}
.t12-scratch-time {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.2cqw;
  font-weight: 700;
  color: #4a3006;
  margin-top: 0.4cqw;
}
.t12-scratch-badge {
  font-family: 'Cinzel', serif;
  font-size: 2.1cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #a0711c;
  margin-top: 0.8cqw;
}
.t12-scratch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  cursor: crosshair;
  transition: opacity 0.6s ease;
  z-index: 5;
}
.t12-btn-scratch {
  margin-top: 1cqw;
  background: rgba(128, 20, 40, 0.08);
  border: 1px dashed rgba(128, 20, 40, 0.4);
  color: #801428;
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  letter-spacing: 0.14em;
  padding: 0.6cqw 2.5cqw;
  border-radius: 2cqw;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.6cqw;
  transition: all 0.2s ease;
}
.t12-btn-scratch:hover {
  background: rgba(128, 20, 40, 0.15);
}

/* 4-Box Countdown Timer */
.t12-cd-card {
  width: 100%;
  max-width: 62cqw;
  background: rgba(255, 255, 255, 0.65);
  border: 1px solid rgba(220, 180, 100, 0.5);
  border-radius: 2cqw;
  padding: 1.8cqw 1.5cqw;
  box-shadow: 0 1cqw 2.5cqw rgba(80, 40, 10, 0.08);
  margin-bottom: 2.5cqw;
}
.t12-cd-lbl-top {
  font-family: 'Cinzel', serif;
  font-size: 2.3cqw;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #801428;
  margin-bottom: 1.2cqw;
}
.t12-cd-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.2cqw;
}
.t12-cd-box {
  background: radial-gradient(130% 95% at 50% 22%, #7a1426 0%, #4a0d17 100%);
  border: 1px solid #e9c46a;
  border-radius: 1.6cqw;
  padding: 1cqw 0.5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0.8cqw 2cqw rgba(0, 0, 0, 0.3);
}
.t12-cd-num {
  font-family: 'Cinzel', serif;
  font-size: 4.8cqw;
  font-weight: 700;
  color: #fff4d1;
  line-height: 1;
  text-shadow: 0 0 0.8cqw rgba(255, 230, 150, 0.6);
}
.t12-cd-unit {
  font-family: 'Cinzel', serif;
  font-size: 1.7cqw;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #f7dda6;
  margin-top: 0.4cqw;
}

/* Save Date Button */
.t12-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1.2cqw;
  padding: 1.4cqw 4cqw;
  border-radius: 5cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.7cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-decoration: none;
  cursor: pointer;
  border: 0;
  color: #fff4d1;
  background: linear-gradient(180deg, #8a172c 0%, #681121 50%, #4a0b17 100%);
  box-shadow: 0 0.8cqw 2.2cqw rgba(80, 10, 25, 0.4), inset 0 0.2cqw 0.4cqw rgba(255, 220, 140, 0.5);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.t12-btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 1.2cqw 3cqw rgba(80, 10, 25, 0.55), inset 0 0.2cqw 0.4cqw rgba(255, 220, 140, 0.7);
}

/* ==========================================================================
   SCREEN 3: WEDDING PROGRAMME
   ========================================================================== */
.t12-events-list {
  width: 100%;
  max-width: 64cqw;
  display: flex;
  flex-direction: column;
  gap: 1.8cqw;
}
.t12-event-card {
  background: rgba(255, 255, 255, 0.78);
  border: 1px solid rgba(220, 180, 100, 0.55);
  border-radius: 2cqw;
  overflow: hidden;
  box-shadow: 0 0.8cqw 2.5cqw rgba(80, 40, 10, 0.08);
  display: flex;
  flex-direction: column;
  text-align: left;
}
.t12-ev-img-wrap {
  width: 100%;
  height: 18cqw;
  overflow: hidden;
  position: relative;
}
.t12-ev-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.t12-ev-body {
  padding: 1.4cqw 2cqw;
}
.t12-ev-ribbon {
  font-family: 'Cinzel', serif;
  font-size: 2.1cqw;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #801428;
  margin-bottom: 0.4cqw;
}
.t12-ev-name {
  font-family: 'Cinzel', serif;
  font-size: 3.5cqw;
  font-weight: 700;
  color: #2b1402;
  margin-bottom: 0.4cqw;
}
.t12-ev-venue {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3cqw;
  color: #55350b;
}
.t12-ev-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 1cqw;
  padding-top: 0.8cqw;
  border-top: 1px dashed rgba(200, 160, 90, 0.4);
}
.t12-ev-bless {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.8cqw;
  font-style: italic;
  color: #7a5015;
}
.t12-ev-rsvp-link {
  background: transparent;
  border: 0;
  color: #801428;
  font-family: 'Cinzel', serif;
  font-size: 2.3cqw;
  font-weight: 700;
  letter-spacing: 0.1em;
  cursor: pointer;
  padding: 0;
}

/* ==========================================================================
   SCREEN 4: BANQUET & VENUE
   ========================================================================== */
.t12-venue-card {
  width: 100%;
  max-width: 64cqw;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(220, 180, 100, 0.6);
  border-radius: 2.4cqw;
  overflow: hidden;
  box-shadow: 0 1.2cqw 3.5cqw rgba(80, 40, 10, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 2.5cqw;
}
.t12-venue-hero {
  width: 100%;
  height: 28cqw;
  overflow: hidden;
  background: #2b1402;
  position: relative;
}
.t12-venue-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.t12-venue-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: radial-gradient(circle at 50% 40%, #58101f, #28060d);
  color: #e9c46a;
}
.t12-venue-fallback svg {
  width: 10cqw;
  height: 10cqw;
  fill: #e9c46a;
}
.t12-venue-name {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  font-weight: 700;
  color: #2b1402;
  margin: 1.8cqw 1cqw 0.6cqw;
}
.t12-venue-addr {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.4cqw;
  color: #55350b;
  max-width: 55cqw;
  margin-bottom: 2.5cqw;
  line-height: 1.35;
}

/* ==========================================================================
   SCREEN 5: CLOSING BLESSING & RSVP SUITE
   ========================================================================== */
.t12-rsvp-card {
  width: 100%;
  max-width: 64cqw;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid rgba(220, 180, 100, 0.6);
  border-radius: 2.4cqw;
  padding: 2.5cqw 2cqw;
  box-shadow: 0 1.2cqw 3.5cqw rgba(80, 40, 10, 0.12);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t12-rsvp-badge {
  font-family: 'Cinzel', serif;
  font-size: 2.3cqw;
  font-weight: 700;
  letter-spacing: 0.18em;
  color: #801428;
  margin-bottom: 0.6cqw;
}
.t12-rsvp-guest {
  font-family: 'Cinzel', serif;
  font-size: 4.8cqw;
  font-weight: 700;
  color: #2b1402;
  margin-bottom: 0.4cqw;
}
.t12-rsvp-meta {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.2cqw;
  font-style: italic;
  color: #63430c;
  margin-bottom: 2cqw;
}

.t12-closing-box {
  margin-top: 3cqw;
  padding-top: 2cqw;
  border-top: 1px solid rgba(200, 160, 90, 0.4);
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t12-closing-blessing {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.6cqw;
  font-style: italic;
  color: #55350b;
  margin-bottom: 0.6cqw;
}
.t12-closing-family {
  font-family: 'Cinzel', serif;
  font-size: 3.8cqw;
  font-weight: 700;
  letter-spacing: 0.14em;
  color: #801428;
}

.t12-btn-replay {
  margin-top: 2.5cqw;
  background: transparent;
  border: 1px solid rgba(128, 20, 40, 0.4);
  color: #801428;
  font-family: 'Cinzel', serif;
  font-size: 2.3cqw;
  letter-spacing: 0.14em;
  padding: 0.8cqw 3cqw;
  border-radius: 3cqw;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.6cqw;
  transition: all 0.2s ease;
}
.t12-btn-replay:hover {
  background: rgba(128, 20, 40, 0.08);
}

/* Strictly hide floating bottom dock on intro / unrevealed */
body:not(.invitation-unveiled) .royal-dock-wrap,
#t12-stage:not(.t12-done):not(.t12-open) ~ * .royal-dock-wrap {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}
</style>

<div id="t12-stage" class="t12-stage" data-wedding-date="${esc(wedding.date || '2026-11-28')}">
  <!-- Inner Scrollable Pages -->
  <div class="t12-pages" id="t12-pages">
    <!-- Screen 1 (2nd Image): Royal Couple & Lineage (Palace Stage Backdrop) -->
    <section class="t12-page t12-page-couple" aria-label="Royal Couple &amp; Lineage">
      <div class="t12-veil"></div>
      <div class="t12-p1-content">
        <div class="t12-p1-header">
          <div class="t12-shloka">॥ শ্রী শ্রী প্রজাপতয়ে নমঃ ॥</div>
          <div class="t12-eyebrow">Two Hearts · One Destiny</div>
          <div class="t12-kicker">Together with their Families</div>
          <h1 class="t12-hero-title">The Journey of Love &amp; Togetherness</h1>
          <div class="t12-gold-divider"></div>
        </div>

        <div class="t12-couple-row">
          ${isGroomFirst ? `
          <!-- Groom on Left -->
          <div class="t12-couple-col">
            <div class="t12-photo-ring">
              <div class="t12-photo-inner">
                ${groomPhoto ? `<img src="${esc(groomPhoto)}" alt="" class="t12-photo-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';" />` : ''}
                <span class="t12-photo-ltr" ${groomPhoto ? 'style="display:none;"' : ''}>${esc((groomName.charAt(0) || 'P').toUpperCase())}</span>
              </div>
            </div>
            <div class="t12-role-badge">Groom</div>
            <div class="t12-person-name" data-fit="1">${esc(groomName)}</div>
            ${groomParents ? `
              <div class="t12-rel-label">s/o</div>
              <div class="t12-father-name" data-fit="1">${esc(groomParents)}</div>
            ` : ''}
            ${groomAddr ? `<div class="t12-address">${formatAddress(groomAddr)}</div>` : ''}
          </div>

          <!-- Ampersand -->
          <div class="t12-couple-amp">&amp;</div>

          <!-- Bride on Right -->
          <div class="t12-couple-col">
            <div class="t12-photo-ring">
              <div class="t12-photo-inner">
                ${bridePhoto ? `<img src="${esc(bridePhoto)}" alt="" class="t12-photo-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';" />` : ''}
                <span class="t12-photo-ltr" ${bridePhoto ? 'style="display:none;"' : ''}>${esc((brideName.charAt(0) || 'P').toUpperCase())}</span>
              </div>
            </div>
            <div class="t12-role-badge">Bride</div>
            <div class="t12-person-name" data-fit="1">${esc(brideName)}</div>
            ${brideParents ? `
              <div class="t12-rel-label">d/o</div>
              <div class="t12-father-name" data-fit="1">${esc(brideParents)}</div>
            ` : ''}
            ${brideAddr ? `<div class="t12-address">${formatAddress(brideAddr)}</div>` : ''}
          </div>
          ` : `
          <!-- Bride on Left -->
          <div class="t12-couple-col">
            <div class="t12-photo-ring">
              <div class="t12-photo-inner">
                ${bridePhoto ? `<img src="${esc(bridePhoto)}" alt="" class="t12-photo-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';" />` : ''}
                <span class="t12-photo-ltr" ${bridePhoto ? 'style="display:none;"' : ''}>${esc((brideName.charAt(0) || 'P').toUpperCase())}</span>
              </div>
            </div>
            <div class="t12-role-badge">Bride</div>
            <div class="t12-person-name" data-fit="1">${esc(brideName)}</div>
            ${brideParents ? `
              <div class="t12-rel-label">d/o</div>
              <div class="t12-father-name" data-fit="1">${esc(brideParents)}</div>
            ` : ''}
            ${brideAddr ? `<div class="t12-address">${formatAddress(brideAddr)}</div>` : ''}
          </div>

          <!-- Ampersand -->
          <div class="t12-couple-amp">&amp;</div>

          <!-- Groom on Right -->
          <div class="t12-couple-col">
            <div class="t12-photo-ring">
              <div class="t12-photo-inner">
                ${groomPhoto ? `<img src="${esc(groomPhoto)}" alt="" class="t12-photo-img" onerror="this.style.display='none'; if(this.nextElementSibling) this.nextElementSibling.style.display='block';" />` : ''}
                <span class="t12-photo-ltr" ${groomPhoto ? 'style="display:none;"' : ''}>${esc((groomName.charAt(0) || 'P').toUpperCase())}</span>
              </div>
            </div>
            <div class="t12-role-badge">Groom</div>
            <div class="t12-person-name" data-fit="1">${esc(groomName)}</div>
            ${groomParents ? `
              <div class="t12-rel-label">s/o</div>
              <div class="t12-father-name" data-fit="1">${esc(groomParents)}</div>
            ` : ''}
            ${groomAddr ? `<div class="t12-address">${formatAddress(groomAddr)}</div>` : ''}
          </div>
          `}
        </div>

        <div class="t12-p1-footer">
          <div class="t12-ornament-icon">❖</div>
          <p class="t12-tagline">
            Two hearts, two families,<br>one beautiful beginning.
          </p>
          <div class="t12-scroll-cue">✦ SCROLL FOR SACRED MUHURAT ✦</div>
        </div>
      </div>
    </section>

    <!-- Screen 2 (3rd Image): Auspicious Wedding Muhurat, Scratch, Countdown & Save Date -->
    <section class="t12-page t12-page-framed" id="dates-section" data-screen="2" aria-label="Auspicious Wedding Muhurat">
      <div class="t12-framed-content">
        <div class="t12-sec-kicker">AUSPICIOUS WEDDING MUHURAT</div>
        <h2 class="t12-sec-title">THE SACRED WEDDING DATE</h2>
        <p class="t12-sec-sub">Scratch below to reveal our sacred wedding date, followed by live countdown &amp; calendar</p>

        <!-- 1. Interactive Scratch Card -->
        <div class="t12-scratch-wrap">
          <div class="t12-scratch-box" id="t12-scratch-box">
            <div class="t12-scratch-unveiled">
              <span class="t12-scratch-icon">💍</span>
              <strong class="t12-scratch-date">${esc(weddingDateStr)}</strong>
              <span class="t12-scratch-time">⏰ Auspicious Vivah Muhurat: ${esc(wedding.time || '7:00 PM Onwards')}</span>
              <span class="t12-scratch-badge">✦ Shubh Vivah · Auspicious Union ✦</span>
            </div>
            <canvas id="t12-scratch-canvas" class="t12-scratch-canvas" aria-label="Scratch to reveal the wedding date"></canvas>
          </div>
          <button type="button" class="t12-btn-scratch" id="t12-scratch-btn">
            <span>✨</span> Scratch or Tap to Reveal
          </button>
        </div>

        <!-- 2. Live Countdown Timer -->
        <div class="t12-cd-card">
          <div class="t12-cd-lbl-top">COUNTDOWN TO CELEBRATIONS</div>
          <div class="t12-cd-grid" role="timer" aria-label="Wedding Countdown">
            <div class="t12-cd-box">
              <span class="t12-cd-num" id="t12-cd-days">00</span>
              <span class="t12-cd-unit">DAYS</span>
            </div>
            <div class="t12-cd-box">
              <span class="t12-cd-num" id="t12-cd-hours">00</span>
              <span class="t12-cd-unit">HOURS</span>
            </div>
            <div class="t12-cd-box">
              <span class="t12-cd-num" id="t12-cd-mins">00</span>
              <span class="t12-cd-unit">MINS</span>
            </div>
            <div class="t12-cd-box">
              <span class="t12-cd-num" id="t12-cd-secs">00</span>
              <span class="t12-cd-unit">SECS</span>
            </div>
          </div>
        </div>

        <!-- 3. Save Date Card (Google Calendar) -->
        <a href="${calLink}" target="_blank" rel="noopener noreferrer" class="t12-btn-primary" id="t12-cal-btn">
          <span>📅</span> SAVE THE DATE TO CALENDAR
        </a>
      </div>
    </section>

    <!-- Screen 3 (4th Image): Wedding Programme -->
    <section class="t12-page t12-page-framed" id="events-section" data-screen="3" aria-label="Wedding Programme">
      <div class="t12-framed-content">
        <div class="t12-sec-kicker">AUSPICIOUS CEREMONIES</div>
        <h2 class="t12-sec-title">WEDDING PROGRAMME</h2>
        <p class="t12-sec-sub">Cherished ceremonies uniting our families in love, tradition, and blessings.</p>

        <!-- Events List -->
        <div class="t12-events-list">
          ${rawEvents.map((ev, idx) => {
            const evImg = getEventPhoto(ev);
            return `
            <div class="t12-event-card">
              ${evImg ? `
                <div class="t12-ev-img-wrap">
                  <img src="${esc(evImg)}" alt="${esc(ev.event_name || 'Ceremony')}" class="t12-ev-img" loading="lazy" />
                </div>
              ` : ''}
              <div class="t12-ev-body">
                <div class="t12-ev-ribbon">${formatRibbonDate(ev.event_date, ev.event_time)}</div>
                <div class="t12-ev-name">${esc(ev.event_name || `Ceremony ${idx + 1}`)}</div>
                <div class="t12-ev-venue">📍 ${esc(ev.venue || venueName)}</div>
                ${clean(ev.note || ev.comment || ev.description || ev.event_comment) ? `<div class="t12-ev-note" style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">💬 ${esc(clean(ev.note || ev.comment || ev.description || ev.event_comment))}</div>` : ''}
                <div class="t12-ev-bottom">
                  <span class="t12-ev-bless">Bless with Presence</span>
                  <button type="button" class="t12-ev-rsvp-link" data-trigger-rsvp>RSVP &rarr;</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- Screen 4 (5th Image): Banquet Name & Location -->
    <section class="t12-page t12-page-framed" id="map-section" data-screen="4" aria-label="Banquet Hall Venue">
      <div class="t12-framed-content">
        <div class="t12-sec-kicker">CELEBRATION DETAILS</div>
        <h2 class="t12-sec-title">BANQUET &amp; VENUE</h2>
        <p class="t12-sec-sub">Where our two families gather to celebrate this eternal union</p>

        <div class="t12-venue-card">
          <div class="t12-venue-hero">
            ${banquetPhoto ? `
              <img src="${esc(banquetPhoto)}" alt="${esc(venueName)}" class="t12-venue-img" />
            ` : `
              <div class="t12-venue-fallback">
                <svg viewBox="0 0 24 24"><path d="M12 2L2 9v13h20V9L12 2zm0 4.5l6 4.5v9h-3v-5H9v5H6v-9l6-4.5z"/></svg>
                <span style="font-family:'Cinzel',serif;font-size:2.4cqw;letter-spacing:0.2em;margin-top:1cqw;">ROYAL PALACE BANQUET</span>
              </div>
            `}
          </div>
          <h3 class="t12-venue-name">${esc(venueName)}</h3>
          <p class="t12-venue-addr">${esc(venueAddr)}</p>

          <a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="t12-btn-primary" id="t12-map-btn">
            <span>📍</span> GET DIRECTIONS ON GOOGLE MAPS
          </a>
        </div>
      </div>
    </section>

    <!-- Screen 5: Closing Blessing & RSVP Suite -->
    <section class="t12-page t12-page-framed" id="rsvp-section" data-screen="5" aria-label="RSVP Suite">
      <div class="t12-framed-content">
        <div class="t12-sec-kicker">YOUR PRESENCE IS OUR PRESENT</div>
        <h2 class="t12-sec-title">Kindly RSVP</h2>
        <p class="t12-sec-sub">Your presence is our present — Kindly RSVP to celebrate with us.</p>

        <div class="t12-rsvp-card">
          <div class="t12-rsvp-badge">${isFamily ? 'FAMILY INVITATION BOARD' : 'PERSONAL INVITATION BOARD'}</div>
          <div class="t12-rsvp-guest">${esc(guestDisplayName)}</div>
          <div class="t12-rsvp-meta">Cordially inviting you ${isFamily ? 'and your family' : ''} (${esc(partyBadge)})</div>

          <div style="display:flex;justify-content:center;width:100%;margin:1.4cqw 0 0.8cqw">
            <button type="button" class="royal-rsvp-launch-btn" id="open-rsvp-modal-btn" data-trigger-rsvp="true" aria-label="Respond to Invitation RSVP">
              <span class="royal-rsvp-icon">💌</span>
              <span class="royal-rsvp-content">
                <span class="royal-rsvp-title">Respond to Invitation · RSVP</span>
                <span class="royal-rsvp-hint">${esc(guestDisplayName)} · Click to RSVP &amp; choose ceremonies</span>
              </span>
              <span class="royal-rsvp-arrow">➔</span>
            </button>
          </div>

          <div class="t12-closing-box">
            <div class="t12-closing-blessing">With love, affection, and best wishes,</div>
            <div class="t12-closing-family">The ${esc(brideName)} &amp; ${esc(groomName)} Families</div>
          </div>

          <button type="button" class="t12-btn-replay" id="t12-replay-bottom-btn">
            <span>✨</span> REPLAY LIGHTS &amp; PHULJHARI
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- Screen 0 (1st Image): Royal Palace Gate Intro -->
  <div class="t12-intro" id="t12-intro">
    <div class="t12-scene" id="t12-scene">
      <div class="t12-frame-wrap" id="t12-frame-wrap">
        <div class="t12-layer" id="t12-frame"></div>
        <!-- 6 Sequential Glow Lamps -->
        ${LAMPS.map((L, idx) => {
          const cx = L[0], cy = L[1], w = L[2], h = L[3];
          const gs = Math.max(w, h) * 3.1;
          return `<div class="t12-glow" id="t12-glow-${idx}" style="left:${pct(cx, IW)};top:${pct(cy - h * 0.05, IH)};width:${pct(gs, IW)};height:${pct(gs, IH)};transform:translate(-50%, -50%);animation-delay:${-(idx * 0.61)}s;animation-duration:${2 + idx * 0.27}s;"></div>`;
        }).join('')}
      </div>
      <div class="t12-gate" id="t12-gate">
        <div class="t12-layer t12-leaf t12-leaf-l" id="t12-leaf-l"></div>
        <div class="t12-layer t12-leaf t12-leaf-r" id="t12-leaf-r"></div>
      </div>
      <div class="t12-txt" id="t12-txt">
        <div class="t12-board" id="t12-board">
          <div class="t12-b-cele t12-gold-txt" id="t12-cele">A CELEBRATION OF LOVE</div>
          <div class="t12-b-orn"></div>
          <div class="t12-b-nm t12-gold-txt" id="t12-groom">${esc(groomName)}</div>
          <div class="t12-b-nm t12-gold-txt" id="t12-bride">&amp; ${esc(brideName)}</div>
          <div class="t12-b-cord t12-gold-txt" id="t12-cord">Cordially Invited</div>
          <div class="t12-b-gst t12-gold-txt" id="t12-guest">${esc(guestDisplayName)}</div>
          <div class="t12-b-prs t12-gold-txt" id="t12-persons">${esc(partyBadge)}</div>
          <button type="button" class="t12-obtn" id="t12-open-btn" aria-label="Open invitation">OPEN</button>
          <button type="button" class="t12-skip-btn" id="t12-skip-btn" aria-label="Skip Intro">SKIP INTRO</button>
        </div>
        <!-- Tap hotspot on carpet plaque -->
        <button type="button" class="t12-hit tap" id="t12-hit-tap" aria-label="Tap to open the invitation"></button>
      </div>
    </div>
  </div>

  <!-- Sparkler / Firecracker Canvas -->
  <canvas class="t12-spark" id="t12-spark"></canvas>
</div>
`;
}

/* ==========================================================================
   MOUNT: INTERACTIVE LIFECYCLE & 3D ANIMATION TIMELINE
   ========================================================================== */
export function mount(root, { guest = {}, wedding = {}, events = [] } = {}) {
  const stage = (root && root.querySelector) ? (root.querySelector('#t12-stage') || root) : null;
  if (!stage) return () => {};

  let timers = [];
  let animId = null;
  let audioCtx = null;
  let isDone = false;
  let busy = false;
  let sRun = false;

  const intro = stage.querySelector('#t12-intro');
  const frame = stage.querySelector('#t12-frame');
  const leafL = stage.querySelector('#t12-leaf-l');
  const leafR = stage.querySelector('#t12-leaf-r');
  const board = stage.querySelector('#t12-board');
  const hitTap = stage.querySelector('#t12-hit-tap');
  const openBtn = stage.querySelector('#t12-open-btn');
  const skipBtn = stage.querySelector('#t12-skip-btn');
  const sparkCanvas = stage.querySelector('#t12-spark');
  const pagesEl = stage.querySelector('#t12-pages');
  const suiteReplayBtn = stage.querySelector('#t12-suite-replay-btn');
  const bottomReplayBtn = stage.querySelector('#t12-replay-bottom-btn');
  const glows = Array.from(stage.querySelectorAll('.t12-glow') || []);

  /* 1. Geometry Setup (937x1678 Artwork) */
  const IW = 937, IH = 1678;
  const CURTAIN_POLY = [
    [207, 1342], [207, 985], [256, 985], [256, 862], [207, 862],
    [207, 632], [220, 602], [255, 586], [330, 569], [395, 569],
    [438, 586], [458, 560], [466, 520], [466, 1342]
  ];
  const MIRROR_X = 937;
  const BOARD = [252, 688, 685, 1214];
  const BOX_TAP = [222, 1436, 716, 1544];

  const pct = (v, t) => `${(v / t * 100).toFixed(2)}%`;
  const polyStr = pts => pts.map(p => `${pct(p[0], IW)} ${pct(p[1], IH)}`).join(',');
  const shrink = (pts, k) => {
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p[0]; cy += p[1]; });
    cx /= pts.length;
    cy /= pts.length;
    return pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
  };

  const left = CURTAIN_POLY;
  const right = CURTAIN_POLY.map(p => [MIRROR_X - p[0], p[1]]).reverse();
  const hl = shrink(left, 0.992);
  const hr = shrink(right, 0.992);

  if (leafL && leafL.style) leafL.style.clipPath = `polygon(${polyStr(left)})`;
  if (leafR && leafR.style) leafR.style.clipPath = `polygon(${polyStr(right)})`;
  if (frame && frame.style) {
    frame.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${polyStr(hl)}, ${polyStr([hl[0]])}, 0 0, ${polyStr(hr)}, ${polyStr([hr[0]])}, 0 0)`;
  }

  function place(e, b) {
    if (!e || !e.style) return;
    e.style.left = pct(b[0], IW);
    e.style.top = pct(b[1], IH);
    e.style.width = pct(b[2] - b[0], IW);
    e.style.height = pct(b[3] - b[1], IH);
  }
  place(board, BOARD);
  place(hitTap, BOX_TAP);

  function lightLamp(i) {
    if (glows[i] && glows[i].classList) glows[i].classList.add('on');
  }

  /* 2. Web Audio Synthesis for Sparklers & Crackers */
  function playSparklerAudio() {
    try {
      const win = typeof window !== 'undefined' ? window : null;
      if (!win) return;
      const AudioContextClass = win.AudioContext || win.webkitAudioContext;
      if (!AudioContextClass) return;
      if (!audioCtx) audioCtx = new AudioContextClass();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      // Soft crackle burst
      const bufferSize = audioCtx.sampleRate * 2.2;
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const output = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (Math.random() < 0.08 ? white * 0.45 : white * 0.04);
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 3200;
      filter.Q.value = 1.2;

      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.01, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.35, audioCtx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();
    } catch { /* AudioContext autoplay or unsupported */ }
  }

  /* 3. Canvas Sparkler / Firecracker Pyrotechnics */
  function startSparkler() {
    if (!sparkCanvas || typeof sparkCanvas.getContext !== 'function') return;
    const sctx = sparkCanvas.getContext('2d');
    if (!sctx) return;

    const st = stage;
    const win = typeof window !== 'undefined' ? window : null;
    const dpr = Math.min((win && win.devicePixelRatio) || 1, 2);
    const W = st.clientWidth || 400, H = st.clientHeight || 700;
    sparkCanvas.width = Math.round(W * dpr);
    sparkCanvas.height = Math.round(H * dpr);
    const CW = sparkCanvas.width, CH = sparkCanvas.height;
    const u = W / 100 * dpr;

    const parts = [];
    const shells = [];
    const pts = [0.20, 0.35, 0.50, 0.65, 0.80];
    const pal = ['255,246,214', '255,226,140', '255,196,84', '255,160,50', '255,255,255'];
    const bursts = [
      [255, 214, 110], [255, 96, 96], [255, 150, 210],
      [150, 214, 255], [255, 255, 255], [190, 255, 170], [255, 170, 70]
    ];

    const t0 = (win && win.performance && typeof win.performance.now === 'function') ? win.performance.now() : Date.now();
    let last = t0;
    const DUR = 9800, SPK_END = 8600, CRK_END = 8200;
    let nextShell = 0;
    sRun = true;

    function emit(dt, k) {
      pts.forEach(px => {
        const n = Math.round((260 * dt) * k + Math.random());
        for (let i = 0; i < n; i++) {
          const a = -Math.PI / 2 + (Math.random() - 0.5) * 1.25;
          const sp = (26 + Math.random() * 44) * u;
          parts.push({
            x: px * CW + (Math.random() - 0.5) * u * 0.8,
            y: 0.88 * CH,
            vx: Math.cos(a) * sp,
            vy: Math.sin(a) * sp,
            g: 60 * u,
            d: 0.992,
            l: 0,
            L: 0.45 + Math.random() * 0.85,
            c: pal[(Math.random() * pal.length) | 0],
            w: (0.28 + Math.random() * 0.5) * u * 0.55
          });
        }
      });
    }

    function launch() {
      const x = CW * (0.14 + Math.random() * 0.72);
      const ty = CH * (0.10 + Math.random() * 0.32);
      const dur = 0.85 + Math.random() * 0.45;
      shells.push({
        x: x,
        y: CH * 0.9,
        vx: (Math.random() - 0.5) * u * 5,
        vy: -(CH * 0.9 - ty) / dur,
        ty: ty,
        c: bursts[(Math.random() * bursts.length) | 0]
      });
    }

    function burst(s) {
      const n = 70 + ((Math.random() * 50) | 0);
      const c = s.c;
      const sp0 = (15 + Math.random() * 13) * u;
      const two = Math.random() < 0.4;
      const c2 = bursts[(Math.random() * bursts.length) | 0];

      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * 0.55 + 0.45;
        const sp = sp0 * r;
        const cc = (two && i % 2) ? c2 : c;
        parts.push({
          x: s.x,
          y: s.y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          g: 15 * u,
          d: 0.975,
          l: 0,
          L: 1.1 + Math.random() * 0.9,
          c: cc.join(','),
          w: (0.35 + Math.random() * 0.4) * u * 0.5,
          tw: Math.random() < 0.35
        });
      }
      parts.push({ flash: 1, x: s.x, y: s.y, l: 0, L: 0.35, c: c.join(','), r: u * 14 });
    }

    function frameLoop(now) {
      if (!sRun) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const e = now - t0;

      if (e > DUR) {
        sRun = false;
        if (sctx.clearRect) sctx.clearRect(0, 0, CW, CH);
        return;
      }

      sctx.globalCompositeOperation = 'destination-out';
      sctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
      if (sctx.fillRect) sctx.fillRect(0, 0, CW, CH);
      sctx.globalCompositeOperation = 'lighter';
      sctx.lineCap = 'round';

      const k = e < SPK_END - 1300 ? 1 : Math.max(0, 1 - (e - (SPK_END - 1300)) / 1300);
      if (k > 0) emit(dt, k);
      if (e < CRK_END && e >= nextShell) {
        launch();
        nextShell = e + 420 + Math.random() * 520;
      }

      for (let i = shells.length - 1; i >= 0; i--) {
        const p = shells[i];
        const px = p.x, py = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        sctx.strokeStyle = 'rgba(255, 236, 180, 0.9)';
        sctx.lineWidth = u * 0.5;
        if (sctx.beginPath) {
          sctx.beginPath();
          sctx.moveTo(px, py);
          sctx.lineTo(p.x, p.y);
          sctx.stroke();
        }
        if (p.y <= p.ty) {
          burst(p);
          shells.splice(i, 1);
        }
      }

      for (let i = parts.length - 1; i >= 0; i--) {
        const p = parts[i];
        p.l += dt;
        if (p.l > p.L) {
          parts.splice(i, 1);
          continue;
        }
        const f = 1 - p.l / p.L;
        if (p.flash) {
          if (sctx.createRadialGradient) {
            const gr = sctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * (1 + p.l * 3));
            gr.addColorStop(0, `rgba(255, 255, 255, ${(f * 0.8).toFixed(3)})`);
            gr.addColorStop(1, `rgba(${p.c}, 0)`);
            sctx.fillStyle = gr;
            sctx.beginPath();
            sctx.arc(p.x, p.y, p.r * (1 + p.l * 3), 0, Math.PI * 2);
            sctx.fill();
          }
          continue;
        }
        const ox = p.x, oy = p.y;
        p.vy += p.g * dt;
        p.vx *= p.d;
        p.vy *= (p.g > 20 * u ? 1 : p.d);
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        let al = f * 0.95;
        if (p.tw) al *= 0.55 + 0.45 * Math.sin(p.l * 38 + i);
        sctx.strokeStyle = `rgba(${p.c}, ${al.toFixed(3)})`;
        sctx.lineWidth = p.w * (0.5 + f);
        if (sctx.beginPath) {
          sctx.beginPath();
          sctx.moveTo(ox, oy);
          sctx.lineTo(p.x, p.y);
          sctx.stroke();
        }
      }

      if (parts.length > 2200) parts.splice(0, parts.length - 2200);
      if (typeof requestAnimationFrame === 'function') {
        animId = requestAnimationFrame(frameLoop);
      }
    }

    if (typeof requestAnimationFrame === 'function') {
      animId = requestAnimationFrame(frameLoop);
    }
  }

  function stopSparkler() {
    sRun = false;
    if (animId && typeof cancelAnimationFrame === 'function') cancelAnimationFrame(animId);
    if (sparkCanvas && typeof sparkCanvas.getContext === 'function') {
      const sctx = sparkCanvas.getContext('2d');
      if (sctx && sctx.clearRect) sctx.clearRect(0, 0, sparkCanvas.width, sparkCanvas.height);
    }
  }

  /* 4. Timeline Sequence */
  function startIntro() {
    if (busy || isDone) return;
    busy = true;
    if (intro && intro.classList) intro.classList.add('t12-go');

    const win = typeof window !== 'undefined' ? window : null;
    if (win && typeof win.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
      try {
        win.dispatchEvent(new CustomEvent('invitation-unveiled'));
      } catch {}
    }

    const T = (fn, ms) => {
      const t = setTimeout(fn, ms);
      timers.push(t);
      return t;
    };

    // Sequential lamp ignition (0 to 1.7s)
    glows.forEach((_, i) => {
      T(() => lightLamp(i), i * 280);
    });

    // 2.2s: Gates swing in 3D, text fades out, sparkler & audio trigger
    T(() => {
      if (intro && intro.classList) intro.classList.add('t12-open', 't12-t-out');
      playSparklerAudio();
      startSparkler();
    }, 2200);

    // 4.2s: Frame fades out
    T(() => {
      if (intro && intro.classList) intro.classList.add('t12-frame-out');
    }, 4200);

    // 7.2s: Leaves fade out
    T(() => {
      if (intro && intro.classList) intro.classList.add('t12-leaf-out');
    }, 7200);

    // 8.5s: Unveil suite and dock
    T(() => {
      unveilSuite();
    }, 8500);
  }

  function unveilSuite() {
    isDone = true;
    busy = false;
    if (intro) {
      if (intro.style) intro.style.display = 'none';
      if (intro.classList) intro.classList.add('t12-done');
    }
    if (stage && stage.classList) {
      stage.classList.add('t12-done', 't12-unlocked');
    }
    const doc = typeof document !== 'undefined' ? document : null;
    const win = typeof window !== 'undefined' ? window : null;
    if (doc && doc.body && doc.body.classList) {
      doc.body.classList.add('invitation-unveiled');
    }
    if (win) {
      win._invitationUnveiled = true;
      if (typeof win.__updateRoyalDockVisibility === 'function') {
        win.__updateRoyalDockVisibility();
      }
      if (typeof win.dispatchEvent === 'function' && typeof CustomEvent !== 'undefined') {
        win.dispatchEvent(new CustomEvent('invitation-unveiled'));
      }
    }
  }

  function skipIntro() {
    timers.forEach(clearTimeout);
    timers = [];
    stopSparkler();
    glows.forEach(g => { if (g && g.classList) g.classList.add('on'); });
    unveilSuite();
  }

  function replayIntro() {
    timers.forEach(clearTimeout);
    timers = [];
    stopSparkler();
    isDone = false;
    busy = false;

    if (intro) {
      if (intro.style) intro.style.display = '';
      intro.className = 't12-intro ready';
    }
    glows.forEach(g => { if (g && g.classList) g.classList.remove('on'); });
    if (stage && stage.classList) stage.classList.remove('t12-done');
    if (pagesEl) pagesEl.scrollTop = 0;

    startIntro();
  }

  if (openBtn) openBtn.addEventListener('click', startIntro);
  if (hitTap) hitTap.addEventListener('click', startIntro);
  if (skipBtn) skipBtn.addEventListener('click', skipIntro);
  if (suiteReplayBtn) suiteReplayBtn.addEventListener('click', replayIntro);
  if (bottomReplayBtn) bottomReplayBtn.addEventListener('click', replayIntro);

  // Reveal intro on boot
  if (intro && intro.classList) {
    setTimeout(() => {
      intro.classList.add('ready');
    }, 100);
  }

  /* 5. Scratch & Reveal Wedding Date Card */
  const scratchBox = stage.querySelector('#t12-scratch-box');
  const scratchCanvas = stage.querySelector('#t12-scratch-canvas');
  const scratchBtn = stage.querySelector('#t12-scratch-btn');
  let scratchScratched = false;

  function initScratchCard() {
    if (!scratchCanvas || !scratchBox || typeof scratchCanvas.getContext !== 'function') return;
    const ctx = scratchCanvas.getContext('2d');
    if (!ctx) return;

    const w = scratchBox.clientWidth || 280;
    const h = scratchBox.clientHeight || 140;
    const win = typeof window !== 'undefined' ? window : null;
    const dpr = (win && win.devicePixelRatio) || 1;
    scratchCanvas.width = Math.round(w * dpr);
    scratchCanvas.height = Math.round(h * dpr);
    if (ctx.scale) ctx.scale(dpr, dpr);

    // Draw gold shimmer foil cover
    if (ctx.createLinearGradient) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#f2d888');
      grad.addColorStop(0.25, '#c59a35');
      grad.addColorStop(0.5, '#fff0aa');
      grad.addColorStop(0.75, '#b08422');
      grad.addColorStop(1, '#e3c267');
      ctx.fillStyle = grad;
      if (ctx.fillRect) ctx.fillRect(0, 0, w, h);
    }

    // Scratch instruction text
    if (ctx.fillText) {
      ctx.font = "bold 13px 'Cinzel', serif";
      ctx.fillStyle = '#4a2505';
      ctx.textAlign = 'center';
      ctx.fillText('✦ SCRATCH TO REVEAL DATE ✦', w / 2, h / 2 - 4);
      ctx.font = "italic 11px 'Cormorant Garamond', Georgia, serif";
      ctx.fillStyle = '#6e3c0c';
      ctx.fillText('Swipe or tap to uncover sacred wedding date', w / 2, h / 2 + 15);
    }

    let isDrawing = false;
    let scratchedPixels = 0;

    function scratchAt(x, y) {
      ctx.globalCompositeOperation = 'destination-out';
      if (ctx.beginPath) {
        ctx.beginPath();
        ctx.arc(x, y, 22, 0, Math.PI * 2);
        ctx.fill();
      }
      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        const rect = (scratchCanvas.getBoundingClientRect && scratchCanvas.getBoundingClientRect()) || { left: 0, top: 0 };
        window.RoyalScratchCracker.emitPhuljhariSparks(rect.left + x, rect.top + y, 8);
      }

      scratchedPixels += 1;
      if (scratchedPixels > 24 && !scratchScratched) {
        checkScratchPercentage();
      }
    }

    function checkScratchPercentage() {
      try {
        if (!ctx.getImageData) return;
        const imgData = ctx.getImageData(0, 0, scratchCanvas.width, scratchCanvas.height);
        const data = imgData.data;
        let clear = 0;
        const total = data.length / 4;
        for (let i = 3; i < data.length; i += 16) {
          if (data[i] === 0) clear++;
        }
        if (clear / (total / 4) > 0.38) {
          revealScratchCard();
        }
      } catch {
        revealScratchCard();
      }
    }

    function getCoords(e) {
      const rect = (scratchCanvas.getBoundingClientRect && scratchCanvas.getBoundingClientRect()) || { left: 0, top: 0 };
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      return [clientX - rect.left, clientY - rect.top];
    }

    function onDown(e) {
      isDrawing = true;
      const [x, y] = getCoords(e);
      scratchAt(x, y);
    }
    function onMove(e) {
      if (!isDrawing) return;
      const [x, y] = getCoords(e);
      scratchAt(x, y);
    }
    function onUp() { isDrawing = false; }

    scratchCanvas.addEventListener('mousedown', onDown);
    scratchCanvas.addEventListener('mousemove', onMove);
    if (win) win.addEventListener('mouseup', onUp);
    scratchCanvas.addEventListener('touchstart', onDown, { passive: true });
    scratchCanvas.addEventListener('touchmove', onMove, { passive: true });
    if (win) win.addEventListener('touchend', onUp);

    function revealScratchCard() {
      scratchScratched = true;
      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        const rect = (scratchCanvas.getBoundingClientRect && scratchCanvas.getBoundingClientRect()) || null;
        const cx = rect ? rect.left + rect.width / 2 : null;
        const cy = rect ? rect.top + rect.height / 2 : null;
        window.RoyalScratchCracker.triggerFirecrackerCelebration(cx, cy);
      }
      if (scratchCanvas.style) {
        scratchCanvas.style.opacity = '0';
        setTimeout(() => {
          scratchCanvas.style.display = 'none';
        }, 600);
      }
      if (scratchBtn && scratchBtn.style) scratchBtn.style.display = 'none';
    }

    if (scratchBtn) scratchBtn.addEventListener('click', revealScratchCard);
  }
  initScratchCard();

  /* 6. Live Countdown Timer */
  const cdDays = stage.querySelector('#t12-cd-days');
  const cdHours = stage.querySelector('#t12-cd-hours');
  const cdMins = stage.querySelector('#t12-cd-mins');
  const cdSecs = stage.querySelector('#t12-cd-secs');

  let targetTime = 0;
  const rawDate = (stage.getAttribute && stage.getAttribute('data-wedding-date')) || wedding.date || '2026-11-28';
  if (rawDate) {
    const parsed = new Date(rawDate);
    if (!isNaN(parsed.getTime())) {
      targetTime = parsed.getTime();
    }
  }

  function updateCountdown() {
    if (!targetTime || !cdDays) return;
    const now = Date.now();
    const diff = targetTime - now;
    if (diff <= 0) {
      cdDays.textContent = '00';
      cdHours.textContent = '00';
      cdMins.textContent = '00';
      cdSecs.textContent = '00';
      return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    cdDays.textContent = String(d).padStart(2, '0');
    cdHours.textContent = String(h).padStart(2, '0');
    cdMins.textContent = String(m).padStart(2, '0');
    cdSecs.textContent = String(s).padStart(2, '0');
  }
  updateCountdown();
  const cdInterval = setInterval(updateCountdown, 1000);

  /* 7. Auto-shrink long names to prevent clipping */
  function fitAll() {
    const win = typeof window !== 'undefined' ? window : null;
    if (!win || typeof win.getComputedStyle !== 'function') return;
    const list = stage.querySelectorAll('[data-fit]');
    list.forEach(e => {
      if (!e.style) return;
      e.style.fontSize = '';
      const parent = e.parentNode;
      if (!parent) return;
      const max = parent.clientWidth - 2;
      let size = parseFloat(win.getComputedStyle(e).fontSize);
      let guard = 60;
      while (e.scrollWidth > max && size > 8 && guard-- > 0) {
        size -= 0.6;
        e.style.fontSize = `${size}px`;
      }
    });
  }
  fitAll();
  const win = typeof window !== 'undefined' ? window : null;
  if (win) win.addEventListener('resize', fitAll);

  /* 8. Global RSVP Trigger Buttons Wiring */
  const rsvpTriggers = stage.querySelectorAll('[data-trigger-rsvp]');
  rsvpTriggers.forEach(btn => {
    btn.addEventListener('click', () => {
      const doc = typeof document !== 'undefined' ? document : null;
      if (!doc) return;
      const modal = doc.getElementById('royalRsvpModal');
      if (modal && modal.classList) modal.classList.remove('hidden');
      const dockRsvp = doc.getElementById('royalDockRsvp');
      if (dockRsvp && dockRsvp.classList) dockRsvp.classList.add('active');
    });
  });

  /* 9. Clean Teardown on Template Swap */
  return () => {
    timers.forEach(clearTimeout);
    timers = [];
    clearInterval(cdInterval);
    stopSparkler();
    if (win) win.removeEventListener('resize', fitAll);
    if (audioCtx && audioCtx.state !== 'closed') {
      try { audioCtx.close(); } catch { /* ignore */ }
    }
  };
}
