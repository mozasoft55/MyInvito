/* ==========================================================================
   PURUSHOTTAM & SANJUKTA / PARI & PARAM (Template 13)
   Temple Palace 3D Door Wedding Invitation Suite:
   - Act I (1st Image - Intro Palace Door):
     - Starry night entrance with decorative red plate: "WELCOME".
     - 3D swinging palace door leaves (swL / swR with perspective: 120cqw, transform-origin: 21.4% & 79.4%).
     - Sequential 2-lantern lighting ignition with radiant flickering glow halos.
     - Live HTML5 canvas sparkler / phuljhari cracker pyrotechnics with multi-color firework bursts.
     - Synthesized Web Audio API sparkler crackle & palace chime.
     - Center royal welcome board: "A CELEBRATION OF LOVE", couple names in calligraphy,
       "CORDIALLY INVITED", guest name, party count badge, pulsating golden "OPEN" button,
       and tap hotspot on red carpet.
     - Skip Intro button neatly nested on the board.
     - Bottom navigation dock strictly hidden on intro.
   - Act II (2nd Image - Screen 1): The Royal Couple & Lineage:
     - Backdrop: Royal courtyard palace with close-view zoom dolly effect (.bgz scaling to 1.2).
     - Glassmorphic frosted veil with gold borders.
     - "॥ শ্রী শ্রী প্রজাপতয়ে নমঃ ॥", "Two Hearts · One Destiny", "Together with their Families"
     - "The Journey of Love & Togetherness"
     - Left: Bride medallion photo, "Bride", Pari, d/o, Kalam, Address
     - Right: Groom medallion photo, "Groom", Param, s/o, Abdul, Address
     - "❖ Two hearts, two families, one beautiful beginning."
     - "✦ SCROLL FOR SACRED MUHURAT ✦"
     - Floating bottom navigation dock visible from this screen onward.
   - Act III (3rd Image - Screen 2): Auspicious Wedding Muhurat:
     - Ornate floral pillar side borders (template-13-border.webp) mirrored left and right.
     - "Auspicious Wedding Muhurat · The Sacred Wedding Date"
     - Interactive Scratch & Reveal Wedding Date card with gold foil canvas.
     - Live 4-box Countdown Timer (Days, Hours, Minutes, Seconds).
     - "SAVE THE DATE TO CALENDAR" (Google Calendar link).
   - Act IV (4th Image - Screen 3): Wedding Programme:
     - Framed with side pillars.
     - Ceremony cards with event photo thumbnails, date/time ribbons, venue, and "RSVP →" links.
   - Act V (5th Image - Screen 4): Banquet & Venue:
     - Framed with side pillars.
     - Banquet Name, Location/Address, banquet hero photo (or palace fallback), and Google Maps directions.
   - Act VI (Screen 5): Closing Blessing & Royal RSVP Suite:
     - Framed with side pillars.
     - Family Invitation Board / Respected Guest badge.
     - "✉️ OPEN ROYAL RSVP MODAL" button.
     - Closing family blessing: "With love, affection, and best wishes, / The Pari & Para Families".
     - "✨ REPLAY LIGHTS & PHULJHARI" button.
   ========================================================================== */

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
  if (!raw) return 'Saturday, 28 November 2026';
  const m = String(raw).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return clean(raw);
  const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
  if (isNaN(d.getTime())) return clean(raw);
  const dayName = DAYS[d.getDay()];
  const monthName = MONTHS[d.getMonth()];
  return `${dayName}, ${d.getDate()} ${monthName} ${d.getFullYear()}`;
}

function formatRibbonDate(dateStr, timeStr) {
  let datePart = '28 Nov 2026';
  if (dateStr) {
    const m = String(dateStr).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) {
      const d = new Date(parseInt(m[1], 10), parseInt(m[2], 10) - 1, parseInt(m[3], 10));
      if (!isNaN(d.getTime())) {
        const shortMonth = MONTHS[d.getMonth()].slice(0, 3);
        datePart = `${d.getDate()} ${shortMonth} ${d.getFullYear()}`;
      }
    } else {
      datePart = clean(dateStr);
    }
  }
  const timePart = clean(timeStr) || '07:00 PM';
  return `${datePart} · ${timePart}`;
}

function formatAddress(addr) {
  const cleaned = clean(addr);
  if (!cleaned) return '';
  const parts = cleaned.split(/,\s*/);
  if (parts.length <= 1) return esc(cleaned);
  return parts.map(p => esc(p.trim())).filter(Boolean).join('<br>');
}

function getFatherOnly(str, fallback) {
  const c = clean(str);
  if (!c) return fallback;
  const cleaned = c.replace(/^(Mr\.?\s*and\s*Mrs\.?|Mr\.?\s*&amp;\s*Mrs\.?|Mr\.?\s*&\s*Mrs\.?)\s+/i, '');
  const m = cleaned.match(/^([A-Za-z\s]+?)(?:\s+(?:and|&amp;|&)\s+|$)/i);
  if (m && m[1]) return m[1].trim();
  const f = cleaned.split(/\s*,\s*|\s+(?:and|&amp;|&)\s+/i)[0];
  return f ? f.trim() : fallback;
}

const CEREMONY_IMAGES = [
  { re: /gaye\s*holud|haldi/i, img: './assets/template-06-gaye-holud.webp' },
  { re: /mehendi|mehndi|sangeet/i, img: './assets/template-06-mehendi.webp' },
  { re: /bibaho|wedding|biye|shaadi/i, img: './assets/template-06-shubho-bibaho.webp' },
  { re: /reception|bou\s*bhat/i, img: './assets/template-06-reception.webp' }
];

function getEventPhoto(ev) {
  const photo = safeImg(ev.photo || ev.event_photo || ev.image);
  if (photo) return photo;
  const name = clean(ev.event_name || ev.name || '');
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
export default function renderTemplate13({ guest = {}, wedding = {}, events = [] } = {}) {
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
  const isT13Match = !wedding.template_id || wedding.template_id === 'template-13' || wedding.template_id === '13';

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
    || './assets/template-13-page.webp';

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

  // Geometries for 683 x 1024 artwork
  const IW = 683, IH = 1024;
  const pct = (v, t) => `${(v / t * 100).toFixed(2)}%`;
  const LAMPS = [
    [60, 782, 70, 60],
    [626, 782, 70, 60]
  ];

  return `
<style>
/* ==========================================================================
   TEMPLATE 13 STYLES (Temple Palace 3D Door & Floral Pillars Suite)
   ========================================================================== */
:root {
  --t13-landing: url('./assets/template-13-cover.webp');
  --t13-page: url('./assets/template-13-page.webp');
  --t13-border: url('./assets/template-13-border.webp');
  --t13-navy: #050a1c;
  --t13-gold-start: #fffbe8;
  --t13-gold-mid: #ffe9a6;
  --t13-gold-end: #f0c35c;
  --t13-crimson: #7a1426;
  --t13-dark-wine: #320912;
}

#t13-stage * {
  box-sizing: border-box;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
  -webkit-user-select: none;
}

#t13-stage {
  position: relative;
  overflow: hidden;
  container-type: size;
  height: 100dvh;
  width: 100%;
  max-width: 480px;
  margin: 0 auto;
  background: var(--t13-navy);
  font-family: 'Cormorant Garamond', Georgia, serif;
}

/* ==========================================================================
   ACT I: 3D PALACE DOOR INTRO (Screen 0)
   ========================================================================== */
.t13-intro {
  position: absolute;
  inset: 0;
  z-index: 50;
  opacity: 0;
  transition: opacity 0.7s ease;
  touch-action: none;
}
.t13-intro.ready {
  opacity: 1;
}
.t13-scene {
  position: absolute;
  inset: 0;
}
.t13-layer {
  position: absolute;
  inset: 0;
  background: var(--t13-landing) center/100% 100% no-repeat;
}
.t13-frame-wrap {
  position: absolute;
  inset: 0;
}
.t13-go.t13-frame-out .t13-frame-wrap {
  opacity: 0;
  transition: opacity 3.6s ease-in-out;
}
.t13-gate {
  position: absolute;
  inset: 0;
  perspective: 120cqw;
  perspective-origin: 50% 50%;
}
.t13-leaf {
  will-change: transform;
}
.t13-leaf-l {
  transform-origin: 21.4% 50%;
}
.t13-leaf-r {
  transform-origin: 79.4% 50%;
}
.t13-go.t13-open .t13-leaf-l {
  animation: t13SwL 7s cubic-bezier(0.42, 0.05, 0.4, 1) forwards;
}
.t13-go.t13-open .t13-leaf-r {
  animation: t13SwR 7s cubic-bezier(0.42, 0.05, 0.4, 1) forwards;
}
@keyframes t13SwL {
  from { transform: rotateY(0); filter: brightness(1); }
  to { transform: rotateY(100deg); filter: brightness(0.45); }
}
@keyframes t13SwR {
  from { transform: rotateY(0); filter: brightness(1); }
  to { transform: rotateY(-100deg); filter: brightness(0.45); }
}
.t13-go.t13-leaf-out .t13-leaf {
  opacity: 0;
  transition: opacity 1.2s ease;
}

/* Glowing sequential lamps */
.t13-glow {
  position: absolute;
  border-radius: 50%;
  pointer-events: none;
  mix-blend-mode: screen;
  opacity: 0;
  background: radial-gradient(circle, rgba(255, 244, 196, 1) 0%, rgba(255, 206, 96, 0.78) 20%, rgba(255, 160, 50, 0.36) 46%, rgba(255, 130, 30, 0) 70%);
  transition: opacity 1.3s ease;
}
.t13-glow.on {
  opacity: 1;
  animation: t13Flick 2.3s ease-in-out infinite alternate;
}
@keyframes t13Flick {
  0% { opacity: 0.82; transform: translate(-50%, -50%) scale(0.97); }
  45% { opacity: 1; transform: translate(-50%, -50%) scale(1.04); }
  100% { opacity: 0.9; transform: translate(-50%, -50%) scale(1); }
}

/* Text Overlay and Welcome Board */
.t13-txt {
  position: absolute;
  inset: 0;
  transition: opacity 0.8s ease;
  pointer-events: none;
}
.t13-go.t13-t-out .t13-txt {
  opacity: 0;
}
.t13-gold-txt {
  background: linear-gradient(180deg, #fffbe8 0%, #ffe9a6 52%, #f0c35c 100%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0.3cqw 0.3cqw rgba(30, 0, 0, 0.8));
}
.t13-plate {
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
  font: 700 3cqw 'Cinzel', serif;
  letter-spacing: 0.16em;
  text-indent: 0.16em;
}

.t13-board {
  position: absolute;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}
.t13-board > * {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  white-space: nowrap;
}
.t13-l-sm {
  font-family: 'Cinzel', serif;
  font-weight: 700;
  font-size: calc(2.3cqw * var(--k, 1));
  letter-spacing: 0.14em;
  text-indent: 0.14em;
  color: #5a3a08;
}
.t13-l-nm {
  font-family: 'Great Vibes', cursive;
  font-size: calc(7.6cqw * var(--k, 1));
  line-height: 1.02;
  color: #7a1220;
  text-shadow: 0 0.25cqw 0 rgba(255, 238, 196, 0.95);
}
.t13-l-gst {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: calc(6.6cqw * var(--k, 1));
  line-height: 1.05;
  color: #2b1204;
  margin-top: calc(0.8cqw * var(--k, 1));
}
.t13-l-prs {
  font-family: 'Cormorant Garamond', serif;
  font-weight: 700;
  font-size: calc(4.6cqw * var(--k, 1));
  line-height: 1.05;
  color: #4a1a0a;
}
.t13-obtn {
  pointer-events: auto;
  cursor: pointer;
  outline: none;
  margin-top: calc(1.4cqw * var(--k, 1));
  width: auto !important;
  padding: calc(1.2cqw * var(--k, 1)) calc(6.5cqw * var(--k, 1));
  border-radius: 5cqw;
  font: 700 calc(3.4cqw * var(--k, 1)) 'Cinzel', serif;
  letter-spacing: 0.3em;
  text-indent: 0.3em;
  color: #ffe9a6;
  border: 0.3cqw solid #e9c46a;
  background: linear-gradient(180deg, #a02236 0%, #6e0f20 55%, #4d0a16 100%);
  animation: t13Pulse 1.9s ease-in-out infinite;
}
.t13-skip-btn {
  pointer-events: auto;
  cursor: pointer;
  margin-top: calc(0.6cqw * var(--k, 1));
  background: transparent;
  border: none;
  font: 700 calc(2cqw * var(--k, 1)) 'Cinzel', serif;
  letter-spacing: 0.2em;
  color: #7a1220;
  text-decoration: underline;
  text-shadow: 0 0.2cqw 0.4cqw rgba(255, 255, 255, 0.7);
  transition: opacity 0.2s;
  width: auto !important;
}
.t13-skip-btn:hover { opacity: 0.8; }

.t13-tap {
  pointer-events: auto;
  cursor: pointer;
  position: absolute;
  outline: none;
  border-radius: 6cqw;
  border: 0.4cqw solid #e9c46a;
  font: italic 700 3.1cqw 'Cormorant Garamond', serif;
  letter-spacing: 0.03em;
  color: #ffe9a6;
  background: linear-gradient(180deg, #8f1a2c, #4d0a16);
  animation: t13Pulse2 2.6s ease-in-out infinite;
  white-space: nowrap;
  display: flex;
  align-items: center;
  justify-content: center;
}

@keyframes t13Pulse {
  0%, 100% { box-shadow: 0 0.5cqw 1cqw rgba(60, 0, 0, 0.5), 0 0 1.4cqw 0.2cqw rgba(255, 200, 90, 0.45); }
  50% { box-shadow: 0 0.5cqw 1cqw rgba(60, 0, 0, 0.5), 0 0 4.6cqw 1.3cqw rgba(255, 214, 110, 0.95); }
}
@keyframes t13Pulse2 {
  0%, 100% { box-shadow: 0 0 1.2cqw rgba(255, 214, 110, 0.3); }
  50% { box-shadow: 0 0 3.8cqw 0.7cqw rgba(255, 226, 140, 0.8); }
}
.t13-go .t13-tap, .t13-go .t13-obtn, .t13-go .t13-skip-btn {
  pointer-events: none;
  animation: none;
}
.t13-go .t13-tap {
  opacity: 0;
  transition: opacity 0.4s;
}

/* Canvas Sparkler / Phuljhari Crackers */
.t13-spark {
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
.t13-pages {
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
.t13-pages::-webkit-scrollbar { display: none; }
.t13-stage.t13-unlocked .t13-pages {
  overflow-y: auto;
}
.t13-page {
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
.t13-page-couple {
  background: #3a2410;
  position: relative;
  overflow: hidden;
}
.t13-bgz {
  position: absolute;
  inset: 0;
  background: var(--t13-page) center/100% 100% no-repeat;
  transform-origin: 50% 46%;
  transform: scale(1);
  transition: transform 9s cubic-bezier(0.3, 0.1, 0.25, 1);
}
.t13-page-couple.t13-zoom .t13-bgz {
  transform: scale(1.2);
}

/* Frosted glass veil on Screen 1 */
.t13-glass {
  position: absolute;
  left: 6%;
  right: 6%;
  top: 5.5%;
  bottom: 5.5%;
  border-radius: 4cqw;
  opacity: 0;
  transition: opacity 1.6s ease;
  background: linear-gradient(160deg, rgba(255, 250, 238, 0.82), rgba(255, 240, 214, 0.72));
  -webkit-backdrop-filter: blur(13px) saturate(1.1);
  backdrop-filter: blur(13px) saturate(1.1);
  box-shadow: inset 0 0 0 0.3cqw rgba(255, 232, 170, 0.9), inset 0 0 0 1cqw rgba(255, 255, 255, 0.2), 0 2cqw 6cqw rgba(40, 12, 0, 0.4);
  pointer-events: none;
  z-index: 1;
}
.t13-page-couple.t13-p2-in .t13-glass {
  opacity: 1;
}

.t13-p1-content {
  position: relative;
  z-index: 2;
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding-top: calc(16px + 2cqw);
  padding-bottom: calc(72px + env(safe-area-inset-bottom, 16px));
  padding-left: 10cqw;
  padding-right: 10cqw;
  text-align: center;
}

.t13-shloka {
  font-family: 'Cinzel', serif;
  font-size: 2.8cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #801428;
  margin-bottom: 0.5cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t13-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 3.2cqw;
  font-weight: 700;
  letter-spacing: 0.32em;
  text-transform: uppercase;
  color: #4a3006;
  padding-left: 0.32em;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.9);
}
.t13-kicker {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.4cqw;
  font-style: italic;
  font-weight: 600;
  color: #63430c;
  margin-top: 0.3cqw;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.9);
}
.t13-hero-title {
  font-family: 'Cinzel', serif;
  font-size: 3.5cqw;
  font-weight: 700;
  letter-spacing: 0.22em;
  text-transform: uppercase;
  color: #801428;
  margin-top: 0.5cqw;
  padding-left: 0.22em;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.95);
}
.t13-gold-divider {
  width: 44cqw;
  height: 0.5cqw;
  margin: 1.2cqw auto 1.6cqw;
  background: linear-gradient(90deg, transparent, #a47a1c 30%, #e8c25a 50%, #a47a1c 70%, transparent);
  border-radius: 1cqw;
}

/* Couple Columns Grid (Left Bride, Right Groom) */
.t13-couple-row {
  display: grid;
  grid-template-columns: 1fr 6cqw 1fr;
  align-items: start;
  width: 100%;
  margin: 0.8cqw 0 1.2cqw;
}
.t13-couple-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  padding: 0 0.5cqw;
}
.t13-couple-amp {
  align-self: center;
  margin-top: 8cqw;
  font: 400 9cqw 'Great Vibes', cursive;
  color: #801428;
  text-shadow: 0 0 1.5cqw rgba(255, 248, 236, 0.95);
  line-height: 1;
}

/* Photo Medallion */
.t13-photo-ring {
  position: relative;
  width: 25.5cqw;
  height: 25.5cqw;
  border-radius: 50%;
  padding: 0.85cqw;
  background: conic-gradient(from 210deg, #7a5410, #f4d982, #b88a22, #fff1bd, #9a6f14, #f0cf70, #7a5410);
  box-shadow: 0 1.2cqw 3cqw rgba(60, 30, 10, 0.35), 0 0 0 0.35cqw rgba(255, 244, 214, 0.75);
}
.t13-photo-ring::after {
  content: "";
  position: absolute;
  inset: 0.85cqw;
  border-radius: 50%;
  box-shadow: inset 0 0 2cqw rgba(0, 0, 0, 0.28);
  pointer-events: none;
}
.t13-photo-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  overflow: hidden;
  background: radial-gradient(circle at 35% 30%, #fff7e0, #e9d5a2);
  display: grid;
  place-items: center;
  position: relative;
}
.t13-photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.t13-photo-ltr {
  font: 400 14cqw 'Great Vibes', cursive;
  color: #0b1740;
  line-height: 1;
}

.t13-role-badge {
  margin-top: 1.6cqw;
  font: 700 2.5cqw 'Cinzel', serif;
  letter-spacing: 0.22em;
  color: #801428;
  padding-left: 0.22em;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
  text-transform: uppercase;
}
.t13-person-name {
  margin-top: 0.8cqw;
  max-width: 100%;
  white-space: nowrap;
  font: 700 7.8cqw 'Great Vibes', cursive;
  color: #1a0b02;
  line-height: 1.12;
  text-shadow: 0 0 1.4cqw rgba(255, 248, 236, 0.95);
}
.t13-rel-label {
  margin-top: 1cqw;
  font: 700 2.4cqw 'Cinzel', serif;
  letter-spacing: 0.22em;
  color: #5c3b08;
  padding-left: 0.22em;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
  text-transform: lowercase;
}
.t13-father-name {
  margin-top: 0.5cqw;
  max-width: 100%;
  font: 700 4.2cqw 'Cormorant Garamond', serif;
  color: #1a1004;
  line-height: 1.15;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t13-address {
  margin-top: 1cqw;
  max-width: 27cqw;
  font: 700 3.2cqw 'Cormorant Garamond', serif;
  color: #38240f;
  line-height: 1.22;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
  text-wrap: balance;
}

/* Footer Tagline on Screen 1 */
.t13-p1-footer {
  margin-top: 1cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t13-ornament-icon {
  font-size: 3.5cqw;
  color: #801428;
  margin-bottom: 0.5cqw;
}
.t13-tagline {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.5cqw;
  font-style: italic;
  font-weight: 600;
  color: #4a3006;
  line-height: 1.35;
  margin: 0;
  text-shadow: 0 0 1.2cqw rgba(255, 248, 236, 0.95);
}
.t13-scroll-cue {
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 700;
  letter-spacing: 0.24em;
  color: #801428;
  margin-top: 1.6cqw;
  animation: t13Float 2s ease-in-out infinite;
}
@keyframes t13Float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(3px); }
}

/* ==========================================================================
   FRAMED SCREENS: 2, 3, 4, 5 (template-13-border.webp)
   ========================================================================== */
.t13-page-framed {
  background: radial-gradient(120% 90% at 50% 42%, #fff7e4 0%, #f8e9c8 55%, #ecd39c 100%);
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding-top: calc(20px + 2cqw);
  padding-bottom: calc(76px + env(safe-area-inset-bottom, 16px));
  padding-left: 17cqw;
  padding-right: 17cqw;
  text-align: center;
  overflow-x: hidden;
}

/* Mirrored side pillar borders */
.t13-page-framed i {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 16.1cqw;
  background: var(--t13-border) 0 0/100% 100% no-repeat;
  pointer-events: none;
  z-index: 2;
}
.t13-page-framed .t13-border-l,
.t13-page-framed i:nth-of-type(1) {
  left: 0 !important;
  right: auto !important;
}
.t13-page-framed .t13-border-r,
.t13-page-framed i:nth-of-type(2) {
  right: 0 !important;
  left: auto !important;
  transform: scaleX(-1);
  transform-origin: center center;
}

.t13-framed-content {
  position: relative;
  z-index: 3;
  width: 100%;
  height: 100%;
  min-height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
}

.t13-sec-kicker {
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #801428;
  text-transform: uppercase;
}
.t13-sec-title {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  color: #1a0b02;
  margin-top: 0.5cqw;
  text-transform: uppercase;
}
.t13-sec-subtitle {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.2cqw;
  font-style: italic;
  font-weight: 600;
  color: #553508;
  margin-top: 0.6cqw;
  line-height: 1.3;
}

/* ==========================================================================
   SCREEN 2: AUSPICIOUS WEDDING MUHURAT (Scratch & Reveal + Countdown)
   ========================================================================== */
.t13-scratch-card {
  position: relative;
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto 0.4cqw;
  border-radius: 2.5cqw;
  padding: 0.6cqw;
  background: conic-gradient(from 180deg, #b8860b, #ffe082, #d4af37, #fff3c4, #aa7c11, #ffd54f, #b8860b);
  box-shadow: 0 1.2cqw 3cqw rgba(80, 40, 10, 0.25);
}
.t13-scratch-box {
  position: relative;
  border-radius: 2.1cqw;
  background: #fffdf7;
  overflow: hidden;
  min-height: 18cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.2cqw 2cqw;
}
.t13-scratch-underlay {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
}
.t13-revealed-badge {
  font-family: 'Cinzel', serif;
  font-size: 2.1cqw;
  font-weight: 700;
  letter-spacing: 0.2em;
  color: #801428;
  margin-bottom: 0.6cqw;
}
.t13-revealed-date {
  font-family: 'Cinzel', serif;
  font-size: 3.6cqw;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #1a0b02;
  line-height: 1.2;
}
.t13-revealed-time {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.3cqw;
  font-weight: 700;
  font-style: italic;
  color: #553508;
  margin-top: 0.6cqw;
}
.t13-scratch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  cursor: grab;
  touch-action: none;
}
.t13-scratch-fallback-btn {
  margin-top: 0.6cqw;
  background: transparent;
  border: 1px dashed #801428;
  color: #801428;
  border-radius: 12px;
  padding: 0.4cqw 2.5cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.1cqw;
  cursor: pointer;
}

/* 4-Box Countdown Timer */
.t13-countdown-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1.8cqw;
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto;
}
.t13-countdown-box {
  background: linear-gradient(180deg, #ffffff 0%, #fff6df 100%);
  border: 1px solid rgba(212, 175, 55, 0.7);
  box-shadow: 0 0.8cqw 2cqw rgba(80, 40, 10, 0.12);
  border-radius: 1.8cqw;
  padding: 1.4cqw 0.8cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.t13-countdown-num {
  font-family: 'Cinzel', serif;
  font-size: 5.2cqw;
  font-weight: 700;
  color: #801428;
  line-height: 1;
}
.t13-countdown-lbl {
  font-family: 'Cinzel', serif;
  font-size: 1.8cqw;
  letter-spacing: 0.16em;
  color: #553508;
  margin-top: 0.5cqw;
  text-transform: uppercase;
}

/* Action Button */
.t13-action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.8cqw;
  padding: 1.4cqw 4cqw;
  border-radius: 5cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  font-weight: 700;
  letter-spacing: 0.16em;
  text-transform: uppercase;
  color: #ffffff;
  background: linear-gradient(180deg, #9a1932 0%, #6e0f20 60%, #4a0815 100%);
  border: 1px solid rgba(255, 230, 150, 0.6);
  box-shadow: 0 1cqw 2.5cqw rgba(80, 10, 20, 0.35);
  text-decoration: none;
  cursor: pointer;
  margin-top: 0.6cqw;
  transition: transform 0.2s, box-shadow 0.2s;
}
.t13-action-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 1.4cqw 3.2cqw rgba(80, 10, 20, 0.5);
}

/* ==========================================================================
   SCREEN 3: WEDDING PROGRAMME (Ceremonies with Images)
   ========================================================================== */
.t13-events-list {
  display: flex;
  flex-direction: column;
  gap: 1.4cqw;
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto 0;
}
.t13-event-card {
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(255, 247, 230, 0.9));
  border: 1px solid rgba(212, 175, 55, 0.6);
  border-radius: 2.2cqw;
  box-shadow: 0 0.8cqw 2.2cqw rgba(70, 30, 10, 0.12);
  padding: 1cqw 1.2cqw;
  display: flex;
  align-items: center;
  gap: 1.8cqw;
  text-align: left;
}
.t13-event-thumb {
  width: 13.5cqw;
  height: 13.5cqw;
  border-radius: 1.8cqw;
  border: 1px solid rgba(212, 175, 55, 0.7);
  overflow: hidden;
  flex-shrink: 0;
  background: #fdf5e6;
}
.t13-event-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.t13-event-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}
.t13-event-ribbon {
  display: inline-block;
  font-family: 'Cinzel', serif;
  font-size: 1.7cqw;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #801428;
  margin-bottom: 0.3cqw;
}
.t13-event-name {
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  font-weight: 700;
  color: #1a0b02;
  line-height: 1.15;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.t13-event-venue {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.4cqw;
  font-weight: 600;
  font-style: italic;
  color: #553508;
  margin-top: 0.2cqw;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.t13-event-rsvp {
  font-family: 'Cinzel', serif;
  font-size: 1.7cqw;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #801428;
  margin-top: 0.4cqw;
  cursor: pointer;
  background: transparent;
  border: none;
  padding: 0;
  text-align: left;
  text-decoration: underline;
}

/* ==========================================================================
   SCREEN 4: BANQUET & VENUE (With Image)
   ========================================================================== */
.t13-venue-card {
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto 0;
  background: linear-gradient(160deg, rgba(255, 255, 255, 0.95), rgba(255, 246, 226, 0.9));
  border: 1px solid rgba(212, 175, 55, 0.7);
  border-radius: 2.5cqw;
  box-shadow: 0 1.2cqw 3cqw rgba(70, 30, 10, 0.15);
  padding: 2cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}
.t13-venue-img-wrap {
  width: 100%;
  height: 28cqw;
  border-radius: 2cqw;
  overflow: hidden;
  border: 1px solid rgba(212, 175, 55, 0.6);
  box-shadow: inset 0 0 1.5cqw rgba(0, 0, 0, 0.2);
  margin-bottom: 1.4cqw;
  background: #fbf1d8;
}
.t13-venue-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.t13-venue-name {
  font-family: 'Cinzel', serif;
  font-size: 3.8cqw;
  font-weight: 700;
  letter-spacing: 0.1em;
  color: #801428;
  line-height: 1.2;
}
.t13-venue-address {
  font-family: 'Cormorant Garamond', serif;
  font-size: 3.2cqw;
  font-weight: 600;
  color: #38240f;
  margin-top: 0.6cqw;
  line-height: 1.3;
}

/* ==========================================================================
   SCREEN 5: CLOSING BLESSINGS & ROYAL RSVP SUITE
   ========================================================================== */
.t13-guest-badge {
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto 0;
  background: linear-gradient(160deg, #ffffff, #fff7e4);
  border: 1px solid rgba(212, 175, 55, 0.7);
  border-radius: 2.2cqw;
  padding: 1.6cqw 2cqw;
  box-shadow: 0 0.8cqw 2cqw rgba(70, 30, 10, 0.1);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t13-board-lbl {
  font-family: 'Cinzel', serif;
  font-size: 2cqw;
  font-weight: 700;
  letter-spacing: 0.22em;
  color: #801428;
}
.t13-board-guest {
  font-family: 'Cinzel', serif;
  font-size: 3.6cqw;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: #1a0b02;
  margin-top: 0.4cqw;
}
.t13-board-party {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.8cqw;
  font-style: italic;
  font-weight: 600;
  color: #553508;
  margin-top: 0.3cqw;
}

.t13-closing-box {
  width: 100%;
  max-width: 62cqw;
  margin: 0.8cqw auto 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t13-closing-msg {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 3.8cqw;
  font-style: italic;
  font-weight: 600;
  color: #4a3006;
  line-height: 1.35;
  margin-top: 0.6cqw;
}
.t13-closing-family {
  font-family: 'Cinzel', serif;
  font-size: 3.2cqw;
  font-weight: 700;
  letter-spacing: 0.12em;
  color: #801428;
  margin-top: 0.8cqw;
}

.t13-replay-btn {
  margin-top: 1cqw;
  background: rgba(212, 175, 55, 0.15);
  border: 1px solid rgba(128, 20, 40, 0.5);
  color: #801428;
  border-radius: 5cqw;
  padding: 1cqw 3.5cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 700;
  letter-spacing: 0.12em;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.6cqw;
  transition: all 0.2s ease;
}
.t13-replay-btn:hover {
  background: rgba(212, 175, 55, 0.3);
}

[hidden] {
  display: none !important;
}
</style>

<div id="t13-stage" class="t13-stage">
  <!-- Screens Container -->
  <div class="t13-pages" id="t13-pages">
    <!-- Screen 1 (2nd Image): Royal Couple & Lineage -->
    <section class="t13-page t13-page-couple" id="t13-screen-1" aria-label="The Royal Couple">
      <div class="t13-bgz"></div>
      <div class="t13-glass"></div>
      <div class="t13-p1-content">
        <div>
          <div class="t13-shloka">॥ শ্রী শ্রী প্রজাপতয়ে নমঃ ॥</div>
          <div class="t13-eyebrow">Two Hearts · One Destiny</div>
          <div class="t13-kicker">Together with their Families</div>
          <div class="t13-hero-title">The Journey of Love &amp; Togetherness</div>
          <div class="t13-gold-divider"></div>
        </div>

        <div class="t13-couple-row">
          ${isGroomFirst ? `
          <!-- Left Column: Groom -->
          <div class="t13-couple-col">
            <div class="t13-photo-ring">
              <div class="t13-photo-inner">
                <img class="t13-photo-img" src="${groomPhoto}" alt="Groom ${esc(groomName)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                <span class="t13-photo-ltr" style="display:none;">${esc(groomName.charAt(0) || 'G')}</span>
              </div>
            </div>
            <div class="t13-role-badge">Groom</div>
            <div class="t13-person-name" data-fit="1">${esc(groomName)}</div>
            ${groomParents ? `
              <div class="t13-rel-label">s/o</div>
              <div class="t13-father-name" data-fit="1">${esc(groomParents)}</div>
            ` : ''}
            ${groomAddr ? `<div class="t13-address">${formatAddress(groomAddr)}</div>` : ''}
          </div>

          <!-- Center: Calligraphic & -->
          <div class="t13-couple-amp">&amp;</div>

          <!-- Right Column: Bride -->
          <div class="t13-couple-col">
            <div class="t13-photo-ring">
              <div class="t13-photo-inner">
                <img class="t13-photo-img" src="${bridePhoto}" alt="Bride ${esc(brideName)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                <span class="t13-photo-ltr" style="display:none;">${esc(brideName.charAt(0) || 'B')}</span>
              </div>
            </div>
            <div class="t13-role-badge">Bride</div>
            <div class="t13-person-name" data-fit="1">${esc(brideName)}</div>
            ${brideParents ? `
              <div class="t13-rel-label">d/o</div>
              <div class="t13-father-name" data-fit="1">${esc(brideParents)}</div>
            ` : ''}
            ${brideAddr ? `<div class="t13-address">${formatAddress(brideAddr)}</div>` : ''}
          </div>
          ` : `
          <!-- Left Column: Bride -->
          <div class="t13-couple-col">
            <div class="t13-photo-ring">
              <div class="t13-photo-inner">
                <img class="t13-photo-img" src="${bridePhoto}" alt="Bride ${esc(brideName)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                <span class="t13-photo-ltr" style="display:none;">${esc(brideName.charAt(0) || 'B')}</span>
              </div>
            </div>
            <div class="t13-role-badge">Bride</div>
            <div class="t13-person-name" data-fit="1">${esc(brideName)}</div>
            ${brideParents ? `
              <div class="t13-rel-label">d/o</div>
              <div class="t13-father-name" data-fit="1">${esc(brideParents)}</div>
            ` : ''}
            ${brideAddr ? `<div class="t13-address">${formatAddress(brideAddr)}</div>` : ''}
          </div>

          <!-- Center: Calligraphic & -->
          <div class="t13-couple-amp">&amp;</div>

          <!-- Right Column: Groom -->
          <div class="t13-couple-col">
            <div class="t13-photo-ring">
              <div class="t13-photo-inner">
                <img class="t13-photo-img" src="${groomPhoto}" alt="Groom ${esc(groomName)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block';" />
                <span class="t13-photo-ltr" style="display:none;">${esc(groomName.charAt(0) || 'G')}</span>
              </div>
            </div>
            <div class="t13-role-badge">Groom</div>
            <div class="t13-person-name" data-fit="1">${esc(groomName)}</div>
            ${groomParents ? `
              <div class="t13-rel-label">s/o</div>
              <div class="t13-father-name" data-fit="1">${esc(groomParents)}</div>
            ` : ''}
            ${groomAddr ? `<div class="t13-address">${formatAddress(groomAddr)}</div>` : ''}
          </div>
          `}
        </div>

        <div class="t13-p1-footer">
          <div class="t13-ornament-icon">❖</div>
          <p class="t13-tagline">Two hearts, two families,<br>one beautiful beginning.</p>
          <div class="t13-scroll-cue">✦ SCROLL FOR SACRED MUHURAT ✦</div>
        </div>
      </div>
    </section>

    <!-- Screen 2 (3rd Image): Auspicious Wedding Muhurat -->
    <section class="t13-page t13-page-framed" id="dates-section" data-screen="2" aria-label="Wedding Muhurat">
      <i class="t13-border-l"></i><i class="t13-border-r"></i>
      <div class="t13-framed-content">
        <div>
          <div class="t13-sec-kicker">Auspicious Wedding Muhurat</div>
          <div class="t13-sec-title">The Sacred Wedding Date</div>
          <div class="t13-sec-subtitle">Scratch below to reveal our sacred wedding date, followed by live countdown &amp; calendar</div>
          <div class="t13-gold-divider"></div>
        </div>

        <!-- Interactive Scratch Card -->
        <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
          <div class="t13-scratch-card">
            <div class="t13-scratch-box" id="t13-scratch-box">
              <div class="t13-scratch-underlay">
                <div class="t13-revealed-badge">✦ AUSPICIOUS VIVAH LAGNA ✦</div>
                <div class="t13-revealed-date">${esc(weddingDateStr)}</div>
                <div class="t13-revealed-time">Ceremony commences at ${esc(clean(wedding.time) || '07:00 PM')} onwards</div>
              </div>
              <canvas class="t13-scratch-canvas" id="t13-scratch-canvas" width="280" height="120"></canvas>
            </div>
          </div>
          <button class="t13-scratch-fallback-btn" id="t13-scratch-btn">✦ Reveal Date ✦</button>
        </div>

        <!-- Live 4-Box Countdown Timer -->
        <div class="t13-countdown-grid" id="t13-countdown" data-date="${esc(wedding.date || '2026-11-28')}">
          <div class="t13-countdown-box">
            <span class="t13-countdown-num" id="t13-cd-days">00</span>
            <span class="t13-countdown-lbl">Days</span>
          </div>
          <div class="t13-countdown-box">
            <span class="t13-countdown-num" id="t13-cd-hours">00</span>
            <span class="t13-countdown-lbl">Hours</span>
          </div>
          <div class="t13-countdown-box">
            <span class="t13-countdown-num" id="t13-cd-mins">00</span>
            <span class="t13-countdown-lbl">Mins</span>
          </div>
          <div class="t13-countdown-box">
            <span class="t13-countdown-num" id="t13-cd-secs">00</span>
            <span class="t13-countdown-lbl">Secs</span>
          </div>
        </div>

        <div style="width: 100%; display: flex; flex-direction: column; align-items: center;">
          <a class="t13-action-btn" href="${calLink}" target="_blank" rel="noopener noreferrer">
            📅 Save Date to Calendar
          </a>
          <div class="t13-scroll-cue" style="margin-top: 1.4cqw;">✦ SCROLL FOR WEDDING PROGRAMME ✦</div>
        </div>
      </div>
    </section>

    <!-- Screen 3 (4th Image): Wedding Programme -->
    <section class="t13-page t13-page-framed" id="events-section" data-screen="3" aria-label="Wedding Programme">
      <i class="t13-border-l"></i><i class="t13-border-r"></i>
      <div class="t13-framed-content">
        <div>
          <div class="t13-sec-kicker">Auspicious Ceremonies</div>
          <div class="t13-sec-title">Wedding Programme</div>
          <div class="t13-sec-subtitle">Grace each sacred moment with your presence and blessings</div>
          <div class="t13-gold-divider"></div>
        </div>

        <div class="t13-events-list">
          ${rawEvents.map((ev, i) => `
            <div class="t13-event-card">
              <div class="t13-event-thumb">
                <img src="${getEventPhoto(ev)}" alt="${esc(ev.event_name || 'Ceremony')}" onerror="this.src='./assets/template-06-shubho-bibaho.webp';" />
              </div>
              <div class="t13-event-info">
                <span class="t13-event-ribbon">${formatRibbonDate(ev.event_date, ev.event_time)}</span>
                <span class="t13-event-name">${esc(ev.event_name || `Ceremony ${i + 1}`)}</span>
                <span class="t13-event-venue">📍 ${esc(ev.venue || venueName)}</span>
                <button class="t13-event-rsvp" data-trigger-rsvp="true" onclick="window.__openRoyalRsvpModal &amp;&amp; window.__openRoyalRsvpModal();">RSVP for Ceremony &rarr;</button>
              </div>
            </div>
          `).join('')}
        </div>

        <div class="t13-scroll-cue" style="margin-top: 1.6cqw;">✦ SCROLL FOR BANQUET VENUE ✦</div>
      </div>
    </section>

    <!-- Screen 4 (5th Image): Banquet & Venue -->
    <section class="t13-page t13-page-framed" id="map-section" data-screen="4" aria-label="Banquet and Venue">
      <i class="t13-border-l"></i><i class="t13-border-r"></i>
      <div class="t13-framed-content">
        <div>
          <div class="t13-sec-kicker">Celebration Details</div>
          <div class="t13-sec-title">Banquet &amp; Venue</div>
          <div class="t13-sec-subtitle">We eagerly await to welcome you to our celebration hall</div>
          <div class="t13-gold-divider"></div>
        </div>

        <div class="t13-venue-card">
          <div class="t13-venue-img-wrap">
            <img src="${banquetPhoto}" alt="${esc(venueName)}" onerror="this.src='./assets/template-13-page.webp';" />
          </div>
          <div class="t13-venue-name">${esc(venueName)}</div>
          <div class="t13-venue-address">📍 ${esc(venueAddr)}</div>
          <a class="t13-action-btn" href="${mapLink}" target="_blank" rel="noopener noreferrer" style="margin-top: 1.6cqw;">
            🗺️ Open in Google Maps
          </a>
        </div>

        <div class="t13-scroll-cue" style="margin-top: 1.6cqw;">✦ SCROLL FOR BLESSINGS &amp; RSVP ✦</div>
      </div>
    </section>

    <!-- Screen 5: Closing Blessing & Royal RSVP Suite -->
    <section class="t13-page t13-page-framed" id="rsvp-section" data-screen="5" aria-label="Closing Blessings">
      <i class="t13-border-l"></i><i class="t13-border-r"></i>
      <div class="t13-framed-content">
        <div>
          <div class="t13-sec-kicker">YOUR PRESENCE IS OUR PRESENT</div>
          <div class="t13-sec-title">Kindly RSVP</div>
          <p class="t13-sec-sub" style="font-family:'Cormorant Garamond',serif;font-style:italic;font-size:3cqw;color:#5D3A40;margin:0.5cqw 0 1.2cqw;text-align:center">Your presence is our present — Kindly RSVP to celebrate with us.</p>
          <div class="t13-gold-divider"></div>
        </div>

        <!-- Family / Personal Invitation Board -->
        <div class="t13-guest-badge">
          <span class="t13-board-lbl">${isFamily ? 'FAMILY INVITATION BOARD' : 'PERSONAL INVITATION BOARD'}</span>
          <span class="t13-board-guest">${esc(guestDisplayName)}</span>
          <span class="t13-board-party">${esc(partyBadge)}</span>
        </div>

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

        <div class="t13-closing-box">
          <div class="t13-ornament-icon">❖</div>
          <p class="t13-closing-msg">With love, affection, and best wishes,</p>
          <div class="t13-closing-family">The ${esc(brideName)} &amp; ${esc(groomName)} Families</div>
        </div>

        <button class="t13-replay-btn" id="t13-replay-bottom-btn">
          ✨ Replay Lights &amp; Phuljhari
        </button>
      </div>
    </section>
  </div>

  <!-- Act I (1st Image): 3D Palace Door Intro -->
  <div class="t13-intro" id="t13-intro">
    <div class="t13-scene">
      <div class="t13-frame-wrap" id="t13-frame-wrap">
        <div class="t13-layer t13-frame" id="t13-frame"></div>
        ${LAMPS.map((l, i) => {
          const gs = Math.max(l[2], l[3]) * 3.4;
          return `<div class="t13-glow" id="t13-glow-${i}" style="left:${pct(l[0], IW)};top:${pct(l[1], IH)};width:${pct(gs, IW)};height:${pct(gs, IH)};transform:translate(-50%,-50%);animation-delay:${(-(i * 0.61)).toFixed(2)}s;animation-duration:${(2 + i * 0.27).toFixed(2)}s;"></div>`;
        }).join('')}
      </div>
      <div class="t13-gate" id="t13-gate">
        <div class="t13-layer t13-leaf t13-leaf-l" id="t13-leaf-l"></div>
        <div class="t13-layer t13-leaf t13-leaf-r" id="t13-leaf-r"></div>
      </div>
      <div class="t13-txt" id="t13-txt">
        <!-- Gold WELCOME Plate above the door -->
        <div class="t13-plate t13-gold-txt" id="t13-plate" style="left: 38.95%; top: 23.24%; width: 21.67%; height: 2.93%;">WELCOME</div>
        <!-- Welcome Board inside cream panel -->
        <div class="t13-board" id="t13-board" style="left: 25.18%; top: 40.43%; width: 50.07%; height: 30.08%;">
          <div class="t13-l-sm" id="t13-cele">A CELEBRATION OF LOVE</div>
          <div class="t13-l-nm" id="t13-groom">${esc(groomName)}</div>
          <div class="t13-l-nm" id="t13-bride">&amp; ${esc(brideName)}</div>
          <div class="t13-l-sm" id="t13-cord">CORDIALLY INVITED</div>
          <div class="t13-l-gst" id="t13-guest">${esc(guestDisplayName)}</div>
          <div class="t13-l-prs" id="t13-persons">${esc(partyBadge)}</div>
          <button class="t13-obtn" id="t13-hit-open" aria-label="Open invitation">OPEN</button>
          <button class="t13-skip-btn" id="t13-skip-btn" aria-label="Skip Intro">SKIP INTRO</button>
        </div>
        <!-- Tap hotspot on carpet plaque -->
        <button class="t13-tap" id="t13-hit-tap" style="left: 27.82%; top: 93.75%; width: 44.51%; height: 4.10%;" aria-label="Tap to open the invitation">✦ Tap to open the invitation ✦</button>
      </div>
    </div>
  </div>

  <!-- Canvas Phuljhari / Sparkler Pyrotechnics -->
  <canvas class="t13-spark" id="t13-spark"></canvas>
</div>
`;
}

/* ==========================================================================
   INTERACTIVE INITIALIZER & LOGIC CONTROLLER
   ========================================================================== */
export function initTemplate13(container) {
  if (!container) return;
  const stage = container.querySelector('#t13-stage') || container;
  const intro = stage.querySelector('#t13-intro');
  const leafL = stage.querySelector('#t13-leaf-l');
  const leafR = stage.querySelector('#t13-leaf-r');
  const frame = stage.querySelector('#t13-frame');
  const board = stage.querySelector('#t13-board');
  const tPlate = stage.querySelector('#t13-plate');
  const hitTap = stage.querySelector('#t13-hit-tap');
  const openBtn = stage.querySelector('#t13-hit-open');
  const skipBtn = stage.querySelector('#t13-skip-btn');
  const sparkCanvas = stage.querySelector('#t13-spark');
  const pagesEl = stage.querySelector('#t13-pages');
  const pCouple = stage.querySelector('#t13-screen-1');
  const bottomReplayBtn = stage.querySelector('#t13-replay-bottom-btn');
  const glows = Array.from(stage.querySelectorAll('.t13-glow') || []);

  /* 1. Geometry Setup (683 x 1024 Artwork) */
  const IW = 683, IH = 1024;
  const DOOR_POLY = [[344, 282], [290, 284], [225, 295], [180, 315], [152, 345], [146, 380], [146, 942], [344, 942]];
  const MIRROR_X = 688;
  const BOARD = [172, 414, 514, 722];
  const PLATE = [266, 238, 414, 268];
  const BOX_TAP = [190, 960, 494, 1002];

  const pct = (v, t) => `${(v / t * 100).toFixed(2)}%`;
  const polyStr = pts => pts.map(p => `${pct(p[0], IW)} ${pct(p[1], IH)}`).join(',');
  const shrink = (pts, k) => {
    let cx = 0, cy = 0;
    pts.forEach(p => { cx += p[0]; cy += p[1]; });
    cx /= pts.length;
    cy /= pts.length;
    return pts.map(p => [cx + (p[0] - cx) * k, cy + (p[1] - cy) * k]);
  };

  const left = DOOR_POLY;
  const right = DOOR_POLY.map(p => [MIRROR_X - p[0], p[1]]).reverse();
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
  place(tPlate, PLATE);
  place(hitTap, BOX_TAP);

  function lightLamp(i) {
    if (glows[i] && glows[i].classList) glows[i].classList.add('on');
  }

  /* 2. Web Audio Synthesis for Sparklers & Crackers */
  let audioCtx = null;
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
      gain.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.4);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 2.1);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();

      // Golden chime
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, audioCtx.currentTime); // E5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.9); // A5
      oscGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      oscGain.gain.linearRampToValueAtTime(0.15, audioCtx.currentTime + 0.1);
      oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 1.8);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 1.9);
    } catch (_) {}
  }

  /* 3. Phuljhari / Sparkler Live Canvas Animation */
  let sRun = false;
  let animId = null;
  let timers = [];
  let busy = false;
  let isDone = false;

  function startSparkler() {
    if (!sparkCanvas || typeof sparkCanvas.getContext !== 'function') return;
    const sctx = sparkCanvas.getContext('2d');
    if (!sctx) return;

    const win = typeof window !== 'undefined' ? window : null;
    const dpr = Math.min((win && win.devicePixelRatio) || 1, 2);
    const st = stage;
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
      parts.push({
        flash: 1,
        x: s.x,
        y: s.y,
        l: 0,
        L: 0.35,
        c: c.join(','),
        r: u * 7
      });
    }

    function frameLoop(now) {
      if (!sRun) return;
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      const elapsed = now - t0;
      if (elapsed > DUR) {
        sRun = false;
        if (sctx.clearRect) sctx.clearRect(0, 0, CW, CH);
        return;
      }

      sctx.globalCompositeOperation = 'destination-out';
      sctx.fillStyle = 'rgba(0,0,0,0.2)';
      if (sctx.fillRect) sctx.fillRect(0, 0, CW, CH);
      sctx.globalCompositeOperation = 'lighter';
      sctx.lineCap = 'round';

      const k = elapsed < SPK_END - 1300 ? 1 : Math.max(0, 1 - (elapsed - (SPK_END - 1300)) / 1300);
      if (k > 0) emit(dt, k);
      if (elapsed < CRK_END && elapsed >= nextShell) {
        launch();
        nextShell = elapsed + 420 + Math.random() * 520;
      }

      for (let i = shells.length - 1; i >= 0; i--) {
        const p = shells[i];
        const px = p.x, py = p.y;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        sctx.strokeStyle = 'rgba(255,236,180,0.9)';
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
            gr.addColorStop(0, `rgba(255,255,255,${(f * 0.45).toFixed(3)})`);
            gr.addColorStop(1, `rgba(${p.c},0)`);
            sctx.fillStyle = gr;
            sctx.beginPath();
            sctx.arc(p.x, p.y, p.r * (1 + p.l * 3), 0, 6.3);
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
    if (intro && intro.classList) intro.classList.add('t13-go');

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

    // Sequential lamp ignition (2 lanterns at 0ms and 420ms)
    glows.forEach((_, i) => {
      T(() => lightLamp(i), i * 420);
    });

    // 3.2s: Doors swing in 3D, text fades out, couple screen zooms, sparkler & audio trigger
    T(() => {
      if (intro && intro.classList) intro.classList.add('t13-open', 't13-t-out');
      if (pCouple && pCouple.classList) pCouple.classList.add('t13-zoom');
      playSparklerAudio();
      startSparkler();
    }, 3200);

    // 4.6s: Frame fades out
    T(() => {
      if (intro && intro.classList) intro.classList.add('t13-frame-out');
    }, 4600);

    // 8.4s: Leaves fade out
    T(() => {
      if (intro && intro.classList) intro.classList.add('t13-leaf-out');
    }, 8400);

    // 9.0s: Blur board / glass veil appears on screen 1
    T(() => {
      if (pCouple && pCouple.classList) pCouple.classList.add('t13-p2-in');
    }, 9000);

    // 10.5s: Unveil suite and dock
    T(() => {
      unveilSuite();
    }, 10500);
  }

  function unveilSuite() {
    isDone = true;
    busy = false;
    if (intro) {
      if (intro.style) intro.style.display = 'none';
      if (intro.classList) intro.classList.add('t13-done');
    }
    if (pCouple && pCouple.classList) {
      pCouple.classList.add('t13-zoom', 't13-p2-in');
    }
    if (stage && stage.classList) {
      stage.classList.add('t13-done', 't13-unlocked');
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
      intro.className = 't13-intro ready';
    }
    glows.forEach(g => { if (g && g.classList) g.classList.remove('on'); });
    if (pCouple && pCouple.classList) pCouple.classList.remove('t13-zoom', 't13-p2-in');
    if (stage && stage.classList) stage.classList.remove('t13-done');
    if (pagesEl) pagesEl.scrollTop = 0;

    startIntro();
  }

  if (openBtn) openBtn.addEventListener('click', startIntro);
  if (hitTap) hitTap.addEventListener('click', startIntro);
  if (skipBtn) skipBtn.addEventListener('click', skipIntro);
  if (bottomReplayBtn) bottomReplayBtn.addEventListener('click', replayIntro);

  // Reveal intro on boot
  if (intro && intro.classList) {
    setTimeout(() => {
      intro.classList.add('ready');
    }, 100);
  }

  /* 5. Scratch & Reveal Wedding Date Card */
  const scratchBox = stage.querySelector('#t13-scratch-box');
  const scratchCanvas = stage.querySelector('#t13-scratch-canvas');
  const scratchBtn = stage.querySelector('#t13-scratch-btn');
  let scratchScratched = false;

  function initScratchCard() {
    if (!scratchCanvas || typeof scratchCanvas.getContext !== 'function') return;
    const ctx = scratchCanvas.getContext('2d');
    if (!ctx) return;

    const w = scratchCanvas.width = scratchCanvas.offsetWidth || 280;
    const h = scratchCanvas.height = scratchCanvas.offsetHeight || 120;

    // Golden foil fill
    if (ctx.createLinearGradient) {
      const grad = ctx.createLinearGradient(0, 0, w, h);
      grad.addColorStop(0, '#caa24c');
      grad.addColorStop(0.3, '#fbe495');
      grad.addColorStop(0.6, '#b88a22');
      grad.addColorStop(1, '#ffd56b');
      ctx.fillStyle = grad;
      if (ctx.fillRect) ctx.fillRect(0, 0, w, h);

      // Gold shimmer border
      ctx.strokeStyle = '#fff2bf';
      ctx.lineWidth = 4;
      if (ctx.strokeRect) ctx.strokeRect(2, 2, w - 4, h - 4);

      // Scratch prompt text
      ctx.font = 'bold 15px "Cinzel", Georgia, serif';
      ctx.fillStyle = '#422806';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      if (ctx.fillText) {
        ctx.fillText('✦ SCRATCH TO REVEAL ✦', w / 2, h / 2 - 8);
        ctx.font = 'italic 12px "Cormorant Garamond", serif';
        ctx.fillStyle = '#6a4310';
        ctx.fillText('Our Sacred Wedding Muhurat', w / 2, h / 2 + 14);
      }
    }

    let isDrawing = false;
    let scratchedPixels = 0;
    const totalPixels = w * h;

    function scratch(e) {
      if (!isDrawing) return;
      const rect = scratchCanvas.getBoundingClientRect();
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(x, y, 22, 0, Math.PI * 2);
      ctx.fill();
      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        window.RoyalScratchCracker.emitPhuljhariSparks(clientX, clientY, 8);
      }

      scratchedPixels += 1;
      if (scratchedPixels > 35 && !scratchScratched) {
        checkScratchPercent();
      }
    }

    function checkScratchPercent() {
      try {
        const imgData = ctx.getImageData(0, 0, w, h);
        let transparent = 0;
        const data = imgData.data;
        for (let i = 3; i < data.length; i += 16) {
          if (data[i] === 0) transparent++;
        }
        if (transparent / (data.length / 16) > 0.4) {
          revealScratch();
        }
      } catch (_) {
        revealScratch();
      }
    }

    function revealScratch() {
      if (scratchScratched) return;
      scratchScratched = true;
      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        const rect = scratchCanvas ? scratchCanvas.getBoundingClientRect() : null;
        const cx = rect ? rect.left + rect.width / 2 : null;
        const cy = rect ? rect.top + rect.height / 2 : null;
        window.RoyalScratchCracker.triggerFirecrackerCelebration(cx, cy);
      }
      if (scratchCanvas) {
        scratchCanvas.style.transition = 'opacity 0.6s ease';
        scratchCanvas.style.opacity = '0';
        setTimeout(() => {
          if (scratchCanvas.style) scratchCanvas.style.display = 'none';
        }, 600);
      }
      if (scratchBtn) {
        scratchBtn.style.display = 'none';
      }
    }

    scratchCanvas.addEventListener('mousedown', e => { isDrawing = true; scratch(e); });
    scratchCanvas.addEventListener('mousemove', scratch);
    const win = typeof window !== 'undefined' ? window : null;
    if (win) {
      win.addEventListener('mouseup', () => { isDrawing = false; });
    }
    scratchCanvas.addEventListener('touchstart', e => { isDrawing = true; scratch(e); }, { passive: true });
    scratchCanvas.addEventListener('touchmove', scratch, { passive: true });
    scratchCanvas.addEventListener('touchend', () => { isDrawing = false; });

    if (scratchBtn) {
      scratchBtn.addEventListener('click', revealScratch);
    }
  }
  initScratchCard();

  /* 6. Live Countdown Timer */
  const countdownEl = stage.querySelector('#t13-countdown');
  if (countdownEl) {
    const rawDate = countdownEl.getAttribute('data-date') || '2026-11-28';
    const target = new Date(`${rawDate}T19:00:00`).getTime();
    const dEl = stage.querySelector('#t13-cd-days');
    const hEl = stage.querySelector('#t13-cd-hours');
    const mEl = stage.querySelector('#t13-cd-mins');
    const sEl = stage.querySelector('#t13-cd-secs');

    function updateCd() {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
      const mins = Math.floor((diff / (1000 * 60)) % 60);
      const secs = Math.floor((diff / 1000) % 60);

      if (dEl) dEl.textContent = String(days).padStart(2, '0');
      if (hEl) hEl.textContent = String(hours).padStart(2, '0');
      if (mEl) mEl.textContent = String(mins).padStart(2, '0');
      if (sEl) sEl.textContent = String(secs).padStart(2, '0');
    }
    updateCd();
    const cdInterval = setInterval(updateCd, 1000);
    timers.push(cdInterval);
  }

  /* 7. Text Auto-Fitting for Board & Person Details */
  function fitAll() {
    if (typeof document === 'undefined') return;
    const list = stage.querySelectorAll('[data-fit]');
    list.forEach(e => {
      if (!e || !e.parentNode) return;
      e.style.fontSize = '';
      const max = e.parentNode.clientWidth - 4;
      let size = parseFloat(window.getComputedStyle(e).fontSize);
      let guard = 60;
      while (e.scrollWidth > max && size > 7 && guard-- > 0) {
        size -= 0.75;
        e.style.fontSize = `${size}px`;
      }
    });
  }

  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    document.fonts.ready.then(fitAll);
  }
  const win = typeof window !== 'undefined' ? window : null;
  if (win) {
    win.addEventListener('resize', fitAll);
  }
  fitAll();

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
    stopSparkler();
    if (win) win.removeEventListener('resize', fitAll);
    if (audioCtx && audioCtx.state !== 'closed') {
      try { audioCtx.close(); } catch { /* ignore */ }
    }
  };
}

export function mount(root, options = {}) {
  return initTemplate13(root, options);
}
