/* ==========================================================================
   PURUSHOTTAM & SANJUKTA / PARI & PARAM (Template 11)
   Master-Level Royal Indian Wedding Invitation Suite:
   - Act I: Ornate Nocturnal Palace Gate (Lights Off):
     - Starry night palace arch with 6 unlit bronze lanterns and royal gates.
     - Center invitation overlay: "WELCOME", "A CELEBRATION OF LOVE",
       couple names in Great Vibes calligraphy, "CORDIALLY INVITED",
       guest name, party count, pulsating golden "OPEN" button, and "✦ Tap to open ✦".
     - Skip Intro button for instant unveiling.
   - Act II: Lights Turn On & Phuljhari Crackers Pyrotechnics:
     - On tap, the 6 lanterns sequentially ignite with glowing radiant halos.
     - Synthesized sparkler crackle & chime via Web Audio API.
     - Live HTML5 canvas sparkler / phuljhari cracker fireworks burst upward.
     - Double palace gates unfold gently ("dhire dhire" via scaleX(.09) over 3.8s).
     - Arch fades out to reveal the inner Taj Mahal palace parchment stage.
   - Act III (2nd Image): Screen 1 — Two Hearts · One Destiny:
     - "Two Hearts · One Destiny", "Together with their Families"
     - "The Journey of Love & Togetherness"
     - Bride on Left (Photo, Bride, Pari, d/o, Kalam, Address)
     - Groom on Right (Photo, Groom, Param, s/o, Abdul, Address)
     - "❖ Two hearts, two families, one beautiful beginning."
   - Act IV (3rd Image): Screen 2 — Auspicious Wedding Muhurat:
     - "Auspicious Wedding Muhurat · The Sacred Wedding Date"
     - "Scratch below to reveal our sacred wedding date, followed by live countdown & calendar"
     - Interactive Scratch & Reveal Wedding Date card with canvas
     - 4-box Live Countdown Timer (Days, Hours, Minutes, Seconds)
     - Save Date (Google Calendar Integration)
   - Act V (4th Image): Screen 3 — Wedding Programme:
     - "Wedding Programme" with ceremony photo banners, dates, timings & RSVP link
   - Act VI (5th Image): Screen 4 — Banquet & Venue:
     - Banquet Name, Location Name with banquet hero image & Google Maps button
   - Act VII: Screen 5 — Warmest Wishes & Royal RSVP Suite:
     - Guest badge, Royal RSVP modal button,
     - "With love, affection, and best wishes, The Pari & Para Families"
     - Replay Lights & Phuljhari
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

function formatRoyalDate(dStr) {
  if (!dStr) return '28 November 2026';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return esc(dStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function formatRibbonDate(dStr, tStr) {
  if (!dStr) return '20 - 28 NOVEMBER 2026 · 7:00 PM ONWARDS';
  const d = new Date(dStr);
  if (isNaN(d.getTime())) return `${esc(dStr)} ${tStr ? '· ' + esc(tStr) : ''}`;
  const day = d.getDate();
  const month = MONTHS[d.getMonth()].toUpperCase();
  const yr = d.getFullYear();
  const time = tStr ? `· ${esc(tStr)}` : '· 7:00 PM ONWARDS';
  return `${day} ${month} ${yr} ${time}`;
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
  { re: /reception/i, img: './assets/template-06-reception.webp' },
  { re: /bou\s*bhat|boubhat|walima/i, img: './assets/template-06-boubhat.webp' },
  { re: /biye|bibaho|shubho|nikah|vivah|wedding|ceremony/i, img: './assets/template-11-cover.webp' }
];

function getEventPhoto(ev) {
  const custom = safeImg(ev.image || ev.photo || ev.pic || ev.event_photo || ev.photo_url || ev.image_url);
  if (custom) return custom;
  const name = clean(ev.event_name || ev.name || ev.title || '');
  const found = CEREMONY_IMAGES.find(c => c.re.test(name));
  return found ? found.img : './assets/template-11-cover.webp';
}

function buildGoogleCalendarUrl({ wedding = {}, guest = {} } = {}) {
  const bride = clean(wedding.bride_name) || 'Pari';
  const groom = clean(wedding.groom_name) || 'Param';
  const venue = clean(wedding.venue) || 'Royal Palace Banquet';
  const addr = clean(wedding.address) || '';
  const loc = [venue, addr].filter(Boolean).join(', ');

  let startMs = Date.parse(wedding.date || '2026-11-28');
  if (isNaN(startMs)) startMs = Date.now() + 7 * 86400000;

  const fmt = ms => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const endMs = startMs + 4 * 3600 * 1000;

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `Wedding Celebration of ${bride} & ${groom}`,
    dates: `${fmt(startMs)}/${fmt(endMs)}`,
    ctz: 'Asia/Kolkata',
    location: loc,
    details: `We eagerly look forward to celebrating with ${guest.name || 'you and your family'}.`
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/* ---------- Default Export: Render Template HTML ---------- */
export default function render({ guest = {}, wedding = {}, events = [] }) {
  const rawGuestName = clean(guest.name || guest.guest_name || guest.family_name) || 'Respected Guest';
  const rawPersons = guest.persons ?? guest.guest_count ?? guest.family_members ?? guest.party_size ?? guest.passes;
  const isExplicitPerson = guest.with_family === false || String(guest.category || '').toLowerCase() === 'person';
  const isExplicitFamily = guest.with_family === true || String(guest.category || '').toLowerCase() === 'family' || Boolean(guest.is_family) || Boolean(guest.family_name && !guest.name) || /family/i.test(rawGuestName);

  const partySize = Math.max(1, parseInt(rawPersons ?? (isExplicitFamily ? 2 : 1), 10) || (isExplicitFamily ? 2 : 1));
  const isFamily = !isExplicitPerson && (isExplicitFamily || (partySize > 1 && guest.with_family !== false));

  const hasFamilyInName = /family/i.test(rawGuestName);
  const guestDisplayName = isFamily && !hasFamilyInName ? `${rawGuestName} & Family` : rawGuestName;

  const guestBadge = isFamily
    ? 'Family'
    : (partySize > 1 ? `Personal Invitation · ${partySize} Persons` : 'Personal Invitation · 1 Person');

  const brideName = clean(wedding.bride_name) || 'Pari';
  const groomName = clean(wedding.groom_name) || 'Param';

  const brideParents = clean(wedding.bride_parents) || clean(wedding.bride_father) || '';
  const groomParents = clean(wedding.groom_parents) || clean(wedding.groom_father) || '';

  const brideAddr = clean(wedding.bride_address) || clean(wedding.bride_city) || '';
  const groomAddr = clean(wedding.groom_address) || clean(wedding.groom_city) || '';
  const isGroomFirst = (clean(wedding.name_order) || clean(wedding.couple_order)) === 'groom_first';

  const weddingDateStr = formatRoyalDate(wedding.date || wedding.event_date);

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
    || 'Grand Imperial Ballroom, Heritage Boulevard';

  const mapLink = safeUrl(wedding.map_url)
    || (venueName || venueAddr ? `https://maps.google.com/?q=${encodeURIComponent([venueName, venueAddr].filter(Boolean).join(', '))}` : '');
  const calLink = buildGoogleCalendarUrl({ wedding, guest });

  const orderRef = clean(wedding.order_reference) || clean(wedding.ref) || '';
  const isT11Match = !wedding.template_id || wedding.template_id === 'template-11' || wedding.template_id === '11';

  // Photos
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

  const banquetPhoto = safeImg(wedding.venue_photo)
    || safeImg(wedding.venue_photo_url)
    || safeImg(wedding.banquet_photo)
    || safeImg(wedding.venue_image)
    || safeImg(wedding.banquet_image)
    || safeImg(wedding.photo_venue)
    || safeImg(wedding.image4)
    || (orderRef ? getStoredPhoto(`wedding_venue_photo_${orderRef}`) : '')
    || './assets/template-11-cover.webp';

  // Normalized Events
  const rawEvents = Array.isArray(events) && events.length ? events : [
    { event_name: 'Wedding Ceremony', event_date: wedding.date || '2026-11-28', event_time: wedding.time || '7:00 PM', venue: venueName },
    { event_name: 'Royal Reception', event_date: wedding.date || '2026-11-29', event_time: '7:30 PM', venue: venueName }
  ];

  return `
<style>
/* ==================== TEMPLATE 11 ROYAL STYLES ==================== */
:root {
  --t11-img1: url('./assets/template-11-cover.webp');
  --t11-img2: url('./assets/template-11-inner.webp');
  --t11-border: url('./assets/template-11-border.png');
  --t11-gold: #f3d58a;
  --t11-gold2: #d9a94a;
  --t11-gold-dark: #8a6420;
  --t11-ink: #3b2a12;
  --t11-crimson: #66101f;
  --t11-crimson-dark: #440913;
}

#t11-stage {
  position: relative;
  container-type: size;
  width: 100%;
  max-width: 480px;
  height: 100dvh;
  min-height: 100dvh;
  margin: 0 auto;
  overflow: hidden;
  background: #070b1a;
  font-family: 'Cormorant Garamond', Georgia, serif;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.8);
  user-select: none;
}

/* ----- Inner Pages Container ----- */
#t11-pages {
  position: absolute;
  inset: 0;
  overflow: hidden;
  scroll-snap-type: y mandatory;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
#t11-pages::-webkit-scrollbar { display: none; }
.t11-done #t11-pages { overflow-y: scroll; }

.t11-page {
  position: relative;
  width: 100cqw;
  height: 100cqh;
  min-height: 100cqh;
  max-height: 100cqh;
  scroll-snap-align: start;
  scroll-snap-stop: always;
  overflow: hidden;
}

/* Page 1 (2nd Image): Hero Page (Palace Parchment Stage) */
.t11-page-hero {
  background: var(--t11-img2) center/100% 100% no-repeat;
}
.t11-inner {
  position: absolute;
  left: 14cqw;
  right: 14cqw;
  top: 31cqh;
  bottom: 8.5cqh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  text-align: center;
  color: #140b02;
  opacity: 0;
  transition: opacity 1.4s ease;
  box-sizing: border-box;
  padding: 0;
}
.t11-hero-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}
.t11-done .t11-inner { opacity: 1; }
.t11-done .t11-inner > * { animation: t11Up 1.2s cubic-bezier(0.16, 1, 0.3, 1) both; }
.t11-done .t11-inner > :nth-child(2) { animation-delay: 0.25s; }
.t11-done .t11-inner > :nth-child(3) { animation-delay: 0.5s; }

@keyframes t11Up {
  from { opacity: 0; transform: translateY(2.8cqw); }
  to { opacity: 1; transform: translateY(0); }
}

.t11-eyebrow {
  font-family: 'Cinzel', serif;
  font-size: 2.5cqw;
  font-weight: 800;
  letter-spacing: 0.26em;
  color: #6d0716;
  margin-bottom: 0.6cqw;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95);
}
.t11-kicker {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  font-size: 2.1cqw;
  letter-spacing: 0.28em;
  color: #1a0f03;
  margin-bottom: 0.4cqw;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95);
}
.t11-hero-title {
  font-family: 'Cinzel', Georgia, serif;
  font-size: 3.4cqw;
  font-weight: 800;
  letter-spacing: 0.08em;
  color: #7a0918;
  line-height: 1.25;
  margin: 0.4cqw 0 1.2cqw;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.95);
}
.t11-couple {
  display: flex;
  gap: 3.5cqw;
  width: 100%;
  justify-content: center;
  align-items: flex-start;
  margin: 0;
}
.t11-side {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
}
.t11-photo {
  width: 18cqw;
  height: 18cqw;
  border-radius: 50%;
  border: 0.7cqw solid #cfa344;
  box-shadow: 0 0 0 0.45cqw #fff9ea, 0 1cqw 2.5cqw rgba(30, 15, 0, 0.4);
  background: #efe0b8 center/cover no-repeat;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: 'Cinzel', serif;
  font-size: 7cqw;
  font-weight: 800;
  color: #8a6015;
}
.t11-role-badge {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  font-size: 2.2cqw;
  letter-spacing: 0.25em;
  color: #6d0716;
  margin-top: 1cqw;
  text-transform: uppercase;
}
.t11-name {
  font-family: 'Great Vibes', cursive;
  font-size: 6.8cqw;
  font-weight: 700;
  color: #140b02;
  margin-top: 0.4cqw;
  line-height: 1.1;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.9);
}
.t11-rel {
  font-family: 'Cinzel', serif;
  font-weight: 800;
  font-size: 2.1cqw;
  letter-spacing: 0.22em;
  color: #7a0918;
  margin-top: 0.6cqw;
  text-transform: lowercase;
}
.t11-par {
  font-size: 2.7cqw;
  font-weight: 700;
  line-height: 1.3;
  margin-top: 0.4cqw;
  color: #140b02;
}
.t11-addr {
  font-size: 2.0cqw;
  font-weight: 600;
  line-height: 1.3;
  margin-top: 0.3cqw;
  color: #2b1704;
  max-width: 27cqw;
  text-wrap: balance;
  word-break: normal;
  overflow-wrap: break-word;
}

.t11-hero-footer {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8cqw;
  width: 100%;
}
.t11-ornament {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1.5cqw;
  width: 46cqw;
  opacity: 0.85;
}
.t11-ornament-line {
  flex: 1;
  height: 0.18cqw;
  background: linear-gradient(90deg, transparent, #cfa344, transparent);
}
.t11-ornament-icon {
  font-size: 2.2cqw;
  color: #8a6015;
  line-height: 1;
}
.t11-tagline {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2.6cqw;
  font-weight: 600;
  font-style: italic;
  color: #3d2307;
  line-height: 1.4;
  margin: 0;
}
.t11-scroll-cue {
  font-family: 'Cinzel', serif;
  font-size: 1.9cqw;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: #573307;
  text-shadow: 0 0.1cqw 0.2cqw rgba(255, 255, 255, 0.8);
  animation: t11PulseCue 2s infinite ease-in-out;
  padding: 0.4cqw 1cqw;
}
@keyframes t11PulseCue {
  0%, 100% { opacity: 0.6; transform: translateY(0); }
  50% { opacity: 1; transform: translateY(0.4cqw); }
}

/* Framed Pages Border Overlay (Half pillar visible on edges) */
.t11-page-framed {
  background: radial-gradient(circle at 50% 25%, #ffffff 0%, #faf4e6 55%, #f2e5c8 100%);
  position: relative;
}
.t11-frame-border {
  position: absolute;
  top: 0;
  bottom: 0;
  left: -8cqw;
  right: -8cqw;
  pointer-events: none;
  background: var(--t11-border) center/100% 100% no-repeat;
  z-index: 2;
}
.t11-framed-content {
  position: absolute;
  left: 12cqw;
  right: 12cqw;
  top: 6cqh;
  bottom: calc(96px + env(safe-area-inset-bottom, 16px));
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-evenly;
  overflow-y: auto;
  scrollbar-width: none;
  text-align: center;
  color: #140b02;
  box-sizing: border-box;
  padding: 0 0 2cqw;
}
.t11-framed-content::-webkit-scrollbar { display: none; }

.t11-sec-arch {
  display: none !important;
}
.t11-sec-kicker {
  font-family: 'Cinzel', serif;
  font-size: 2.3cqw;
  letter-spacing: 0.3em;
  color: #7a0918;
  font-weight: 800;
  margin-bottom: 0.2cqw;
}
.t11-sec-title {
  font-family: 'Cinzel', serif;
  font-size: 3.8cqw;
  color: #140b02;
  letter-spacing: 0.06em;
  font-weight: 800;
  margin: 0.2cqw 0 0.3cqw;
  line-height: 1.2;
  word-break: break-word;
}
.t11-sec-sub {
  font-size: 2.5cqw;
  font-weight: 600;
  color: #2e1a05;
  max-width: 74cqw;
  line-height: 1.25;
  margin-bottom: 1.2cqw;
}

/* Page 2 (3rd Image): Scratch & Reveal Card */
.t11-scratch-card-wrap {
  width: 100%;
  max-width: 76cqw;
  background: rgba(255, 255, 255, 0.98);
  border: 0.25cqw solid #cfa344;
  border-radius: 2.5cqw;
  padding: 2.2cqw 2.5cqw;
  box-shadow: 0 1cqw 3cqw rgba(50, 25, 0, 0.15);
  margin-bottom: 2.5cqw;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t11-scratch-head {
  text-align: center;
  margin-bottom: 1.5cqw;
}
.t11-scratch-icon {
  font-size: 4.5cqw;
  display: block;
  margin-bottom: 0.5cqw;
}
.t11-scratch-title {
  font-family: 'Cinzel', serif;
  font-size: 3.4cqw;
  font-weight: 800;
  color: #140b02;
  margin: 0 0 0.4cqw;
}
.t11-scratch-desc {
  font-size: 2.3cqw;
  color: #3d2307;
  font-weight: 600;
  margin: 0;
}
.t11-scratch-box {
  position: relative;
  width: 100%;
  height: 24cqw;
  border-radius: 2cqw;
  border: 0.22cqw solid #cfa344;
  overflow: hidden;
  box-shadow: inset 0 0.5cqw 1.5cqw rgba(0, 0, 0, 0.1);
  background: linear-gradient(135deg, #fffcf5, #f5e8cd);
}
.t11-scratch-unveiled {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5cqw;
  text-align: center;
}
.t11-scratch-ring {
  font-size: 4cqw;
  line-height: 1;
  margin-bottom: 0.4cqw;
}
.t11-scratch-date {
  font-family: 'Cinzel', serif;
  font-size: 4.6cqw;
  font-weight: 800;
  color: #7a0918;
  letter-spacing: 0.05em;
  margin-bottom: 0.4cqw;
}
.t11-scratch-muhurat {
  font-size: 2.3cqw;
  font-weight: 700;
  color: #2b1704;
  margin-bottom: 0.3cqw;
}
.t11-scratch-badge {
  font-family: 'Cinzel', serif;
  font-size: 1.8cqw;
  font-weight: 800;
  letter-spacing: 0.18em;
  color: #8a6015;
}
.t11-scratch-canvas {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  cursor: grab;
  touch-action: none;
}
.t11-btn-scratch {
  margin-top: 1.6cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 800;
  letter-spacing: 0.2em;
  padding: 1.1cqw 3.2cqw;
  color: #7a0918;
  background: linear-gradient(180deg, #fffdf2, #f3d790);
  border: 0.22cqw solid #cfa344;
  border-radius: 6cqw;
  cursor: pointer;
  box-shadow: 0 0.8cqw 2cqw rgba(50, 25, 0, 0.12);
  transition: transform 0.2s, box-shadow 0.2s;
}
.t11-btn-scratch:active { transform: scale(0.97); }

/* Live Countdown Card */
.t11-cd-card {
  width: 100%;
  max-width: 76cqw;
  margin-bottom: 2.5cqw;
}
.t11-cd-label {
  font-family: 'Cinzel', serif;
  font-size: 2.1cqw;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: #6d0716;
  margin-bottom: 1.2cqw;
}
.t11-cd-grid {
  display: flex;
  gap: 2.2cqw;
  justify-content: center;
  width: 100%;
}
.t11-cd-box {
  flex: 1;
  height: 13.5cqw;
  background: linear-gradient(145deg, #ffffff, #f7ecd5);
  border: 0.25cqw solid #cfa344;
  border-radius: 2cqw;
  box-shadow: 0 1cqw 2.5cqw rgba(50, 25, 0, 0.18);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}
.t11-cd-num {
  font-family: 'Cinzel', serif;
  font-size: 5.6cqw;
  font-weight: 800;
  color: #7a0918;
  line-height: 1;
}
.t11-cd-lbl {
  font-family: 'Cinzel', serif;
  font-size: 1.8cqw;
  font-weight: 800;
  letter-spacing: 0.22em;
  color: #422606;
  margin-top: 0.4cqw;
}

/* Save Date Card (Google Calendar) */
.t11-cal-card {
  width: 100%;
  max-width: 76cqw;
  background: rgba(255, 255, 255, 0.98);
  border: 0.25cqw solid #cfa344;
  border-radius: 2.5cqw;
  padding: 2.2cqw 3cqw;
  box-shadow: 0 1cqw 3cqw rgba(50, 25, 0, 0.15);
  margin-bottom: 1cqw;
}
.t11-cal-title {
  font-family: 'Cinzel', serif;
  font-size: 3.4cqw;
  font-weight: 800;
  color: #140b02;
  margin-bottom: 0.4cqw;
}
.t11-cal-desc {
  font-size: 2.3cqw;
  color: #3d2307;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 1.5cqw;
}
.t11-btn-cal {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.4cqw;
  font-weight: 800;
  letter-spacing: 0.18em;
  padding: 1.4cqw 3.6cqw;
  color: #1a0f02;
  background: linear-gradient(180deg, #fff3c4 0%, #e2b457 55%, #c58f2c 100%);
  border: 0.22cqw solid #fff7d6;
  border-radius: 8cqw;
  cursor: pointer;
  box-shadow: 0 1cqw 2.5cqw rgba(212, 175, 55, 0.45);
  text-decoration: none;
  transition: transform 0.2s;
}
.t11-btn-cal:active { transform: scale(0.97); }

/* Page 3 (4th Image): Wedding Programme */
.t11-events-grid {
  display: flex;
  flex-direction: column;
  gap: 2.2cqw;
  width: 100%;
  max-width: 78cqw;
}
.t11-ev-card {
  background: rgba(255, 255, 255, 0.98);
  border: 0.25cqw solid #cfa344;
  border-radius: 2.4cqw;
  overflow: hidden;
  box-shadow: 0 1cqw 2.8cqw rgba(50, 25, 0, 0.14);
  text-align: left;
}
.t11-ev-img-wrap {
  width: 100%;
  height: 20cqw;
  overflow: hidden;
  position: relative;
  background: #ecd9b5;
}
.t11-ev-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.t11-ev-body {
  padding: 1.8cqw 2.5cqw;
}
.t11-ev-ribbon {
  display: inline-block;
  background: linear-gradient(135deg, #7a0918, #941326);
  color: #fff9e6;
  font-family: 'Cinzel', serif;
  font-size: 1.9cqw;
  font-weight: 800;
  letter-spacing: 0.16em;
  padding: 0.4cqw 1.6cqw;
  border-radius: 2cqw;
  margin-bottom: 0.6cqw;
}
.t11-ev-name {
  font-family: 'Cinzel', serif;
  font-size: 3.6cqw;
  font-weight: 800;
  color: #140b02;
  margin: 0.4cqw 0 0.3cqw;
}
.t11-ev-venue {
  font-size: 2.5cqw;
  color: #2e1a05;
  font-weight: 600;
  margin-bottom: 0.8cqw;
}
.t11-ev-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 0.12cqw solid #ebd9b8;
  padding-top: 0.8cqw;
}
.t11-ev-bless {
  font-size: 2.3cqw;
  font-weight: 700;
  color: #4a2c06;
}
.t11-ev-rsvp-link {
  font-family: 'Cinzel', serif;
  font-size: 2.3cqw;
  font-weight: 800;
  color: #7a0918;
  cursor: pointer;
  background: none;
  border: none;
  padding: 0;
  letter-spacing: 0.12em;
}
.t11-ev-rsvp-link:hover { text-decoration: underline; }

/* Page 4 (5th Image): Banquet Hall Venue */
.t11-venue-card {
  width: 100%;
  max-width: 78cqw;
  background: rgba(255, 255, 255, 0.98);
  border: 0.25cqw solid #cfa344;
  border-radius: 2.6cqw;
  padding: 2.5cqw 3cqw;
  box-shadow: 0 1.2cqw 3.5cqw rgba(50, 25, 0, 0.16);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t11-venue-photo-wrap {
  width: 100%;
  height: 26cqw;
  border-radius: 2cqw;
  border: 0.25cqw solid #cfa344;
  overflow: hidden;
  margin-bottom: 1.8cqw;
  background: #f0e6ce;
  display: flex;
  align-items: center;
  justify-content: center;
}
.t11-venue-photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.t11-venue-arch-fallback {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1b264f, #274060);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #f3d58a;
}
.t11-venue-arch-fallback svg {
  width: 9cqw;
  height: 9cqw;
  stroke: #f3d58a;
  stroke-width: 1.5;
  fill: none;
}
.t11-vh-title {
  font-family: 'Cinzel', serif;
  font-size: 4.2cqw;
  font-weight: 800;
  color: #140b02;
  margin-bottom: 0.6cqw;
}
.t11-vh-addr {
  font-size: 2.7cqw;
  color: #2e1a05;
  font-weight: 600;
  line-height: 1.35;
  margin-bottom: 2cqw;
  max-width: 68cqw;
}
.t11-btn-primary {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 1cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  font-weight: 800;
  letter-spacing: 0.18em;
  padding: 1.6cqw 4.2cqw;
  color: #1a0f02;
  background: linear-gradient(180deg, #fff3c4 0%, #e2b457 55%, #c58f2c 100%);
  border: 0.25cqw solid #fff7d6;
  border-radius: 8cqw;
  cursor: pointer;
  box-shadow: 0 1cqw 2.8cqw rgba(212, 175, 55, 0.5);
  text-decoration: none;
  transition: transform 0.2s, box-shadow 0.2s;
}
.t11-btn-primary:active { transform: scale(0.97); }

/* Page 5: RSVP & Warmest Wishes */
.t11-rsvp-card {
  width: 100%;
  max-width: 78cqw;
  background: rgba(255, 255, 255, 0.98);
  border: 0.25cqw solid #cfa344;
  border-radius: 2.6cqw;
  padding: 2.5cqw 3cqw;
  box-shadow: 0 1.2cqw 3.5cqw rgba(50, 25, 0, 0.16);
  display: flex;
  flex-direction: column;
  align-items: center;
}
.t11-rsvp-badge {
  display: inline-block;
  background: linear-gradient(135deg, #7a0918, #941326);
  color: #fff9e6;
  font-family: 'Cinzel', serif;
  font-size: 2.1cqw;
  font-weight: 800;
  letter-spacing: 0.2em;
  padding: 0.5cqw 2cqw;
  border-radius: 3cqw;
  margin-bottom: 1.2cqw;
}
.t11-rsvp-guest {
  font-family: 'Great Vibes', cursive;
  font-size: 7.2cqw;
  font-weight: 700;
  color: #140b02;
  line-height: 1.1;
  margin-bottom: 0.4cqw;
}
.t11-rsvp-meta {
  font-size: 2.6cqw;
  color: #2e1a05;
  font-weight: 600;
  margin-bottom: 2cqw;
}
.t11-footer-closing {
  margin-top: 2cqw;
  text-align: center;
}
.t11-footer-blessing {
  font-family: 'Cormorant Garamond', Georgia, serif;
  font-size: 2.8cqw;
  font-style: italic;
  font-weight: 600;
  color: #3d2307;
  margin-bottom: 0.4cqw;
}
.t11-footer-family {
  font-family: 'Cinzel', serif;
  font-size: 3.2cqw;
  font-weight: 800;
  letter-spacing: 0.16em;
  color: #140b02;
}
.t11-btn-replay {
  margin-top: 2.2cqw;
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  font-weight: 800;
  letter-spacing: 0.22em;
  padding: 1.2cqw 3cqw;
  color: #7a0918;
  background: rgba(255, 255, 255, 0.95);
  border: 0.22cqw solid #cfa344;
  border-radius: 6cqw;
  cursor: pointer;
}

/* ==================== ACT I INTRO GATE & SCENE ==================== */
#t11-intro {
  position: absolute;
  inset: 0;
  z-index: 5;
  touch-action: manipulation;
}
#t11-scene {
  position: absolute;
  inset: 0;
  filter: brightness(0.66) saturate(0.85);
  transition: filter 2.2s ease;
}
.t11-lit #t11-scene { filter: none; }

.t11-layer {
  position: absolute;
  inset: 0;
  background: var(--t11-img1) center/100% 100% no-repeat;
}
#t11-fr, #t11-lamps { transition: opacity 2.6s ease; }
.t11-fadeF #t11-fr, .t11-fadeF #t11-lamps { opacity: 0; }

.t11-PL, .t11-PR {
  transition: transform 3.8s cubic-bezier(0.5, 0.05, 0.3, 1), opacity 2s ease;
}
.t11-PL { transform-origin: 19.14% 0; }
.t11-PR { transform-origin: 80.86% 0; }
.t11-open .t11-PL, .t11-open .t11-PR { transform: scaleX(0.09); }
.t11-fadeP .t11-PL, .t11-fadeP .t11-PR { opacity: 0; }

.t11-lp {
  position: absolute;
  transform: translate(-50%, -50%);
}
.t11-of {
  position: absolute;
  background-size: 100% 100%;
  opacity: 1;
  transition: opacity 1.1s ease var(--d);
}
.t11-lit .t11-of { opacity: 0; }
.t11-gl {
  background: radial-gradient(ellipse, rgba(255, 220, 130, 0.95) 0%, rgba(255, 190, 80, 0.5) 30%, transparent 68%);
  mix-blend-mode: screen;
  opacity: 0;
  transition: opacity 1.1s ease var(--d);
}
.t11-lit .t11-gl {
  opacity: 1;
  animation: t11Flicker 2.6s ease-in-out infinite calc(var(--d) + 1.3s);
}
@keyframes t11Flicker { 50% { opacity: 0.72; } }

/* Intro Message Card (Luminous Gold Suite) */
#t11-msg {
  position: absolute;
  left: 10%;
  right: 10%;
  top: 23%;
  bottom: 11%;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  transition: opacity 0.9s ease;
  cursor: pointer;
  animation: t11MsgIn 1.8s ease backwards;
}
#t11-msg::before {
  content: "";
  position: absolute;
  inset: -12% -18%;
  z-index: -1;
  background: radial-gradient(ellipse at center, rgba(3, 7, 24, 0.78) 0%, rgba(3, 7, 24, 0.45) 55%, transparent 78%);
  border-radius: 50%;
  pointer-events: none;
}
@keyframes t11MsgIn { from { opacity: 0; } }
.t11-open #t11-msg { opacity: 0; pointer-events: none; }

#t11-msg > div {
  color: #fff4d1;
  font-weight: 700;
  text-shadow: 0 0.2cqw 0.8cqw rgba(0, 0, 0, 0.95), 0 0 2cqw rgba(255, 215, 120, 0.45);
}
.t11-wel {
  font-family: 'Cinzel', serif;
  font-size: 4cqw;
  letter-spacing: 0.52em;
  padding-left: 0.52em;
  color: #fce7ba;
}
.t11-cel {
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  letter-spacing: 0.2em;
  margin: 1.4cqw 0 0.8cqw;
  color: #ebd19c;
}
.t11-names {
  font-family: 'Great Vibes', cursive;
  font-size: 11.5cqw;
  font-weight: 700;
  line-height: 1.1;
  color: #ffe6a3;
  text-shadow: 0 0.4cqw 1cqw rgba(0, 0, 0, 0.98), 0 0 2.5cqw rgba(255, 215, 0, 0.7);
}
.t11-ci {
  font-family: 'Cinzel', serif;
  font-size: 2.6cqw;
  letter-spacing: 0.26em;
  margin-top: 2.6cqw;
  color: #ebd19c;
}
.t11-gst {
  font-family: 'Great Vibes', cursive;
  font-size: 8.2cqw;
  margin-top: 0.4cqw;
  line-height: 1.1;
  color: #fff3c8;
  text-shadow: 0 0.3cqw 0.8cqw rgba(0, 0, 0, 0.95), 0 0 2cqw rgba(255, 215, 0, 0.6);
}
.t11-per {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(10.5px, 2.6cqw, 12px);
  font-weight: 600;
  letter-spacing: 0.12em;
  margin: 0.4cqw auto 0;
  color: #f2e2be;
  max-width: 82%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
#t11-open-btn {
  margin-top: 2.8cqw;
  font-family: 'Cinzel', serif;
  font-size: 3.4cqw;
  font-weight: 800;
  letter-spacing: 0.35em;
  padding: 1.6cqw 6cqw 1.6cqw 6.35cqw;
  color: #2a1603;
  background: linear-gradient(180deg, #fff2c6 0%, #e8bc5c 52%, #c9932d 100%);
  border: 0.25cqw solid #fff8d6;
  border-radius: 10cqw;
  cursor: pointer;
  box-shadow: 0 0 3.5cqw rgba(255, 215, 120, 0.85), 0 0.8cqw 2cqw rgba(0, 0, 0, 0.6);
  animation: t11BtnPulse 2s infinite ease-in-out;
}
.t11-lit #t11-open-btn { animation: none; }
.t11-tap {
  font-family: 'Cormorant Garamond', serif;
  font-size: 2.8cqw;
  margin-top: 2cqw;
  letter-spacing: 0.1em;
  color: #f0dfb6;
}
@keyframes t11BtnPulse {
  50% { box-shadow: 0 0 6cqw rgba(255, 215, 120, 1), 0 0 2cqw rgba(255, 255, 255, 0.8); transform: scale(1.02); }
}

.t11-skip-btn {
  margin-top: 2.2cqw;
  background: none;
  border: none;
  color: rgba(255, 240, 200, 0.85);
  font-family: 'Cinzel', serif;
  font-size: 2.2cqw;
  letter-spacing: 0.25em;
  text-decoration: underline;
  cursor: pointer;
  transition: color 0.2s;
}
.t11-skip-btn:hover { color: #fff; }

/* Strictly hide floating bottom dock on intro / unrevealed */
body:not(.invitation-unveiled) .royal-dock-wrap,
#t11-stage:not(.t11-done):not(.t11-open) ~ * .royal-dock-wrap {
  display: none !important;
  opacity: 0 !important;
  pointer-events: none !important;
}

#t11-fx {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 8;
  pointer-events: none;
}
</style>

<div id="t11-stage" class="t11-stage" data-wedding-date="${esc(wedding.date || '2026-11-28')}">
  <!-- Inner Pages -->
  <div id="t11-pages">
    <!-- Screen 1 (2nd Image): The Royal Couple & Lineage (Palace Stage Backdrop) -->
    <section class="t11-page t11-page-hero" aria-label="Royal Couple &amp; Lineage">
      <div class="t11-inner" id="t11-p1">
        <div class="t11-hero-header">
          <div class="t11-eyebrow">Two Hearts · One Destiny</div>
          <div class="t11-kicker">Together with their Families</div>
          <h1 class="t11-hero-title">The Journey of Love &amp; Togetherness</h1>
        </div>
        <div class="t11-couple">
          ${isGroomFirst ? `
          <!-- Groom on Left -->
          <div class="t11-side">
            <div class="t11-photo" ${groomPhoto ? `style="background-image:url('${esc(groomPhoto)}')"` : ''}>
              ${groomPhoto ? '' : esc(groomName.charAt(0) || 'G')}
            </div>
            <div class="t11-role-badge">Groom</div>
            <div class="t11-name">${esc(groomName)}</div>
            ${groomParents ? `
              <div class="t11-rel">s/o</div>
              <div class="t11-par">${esc(groomParents)}</div>
            ` : ''}
            ${groomAddr ? `<div class="t11-addr">${formatAddress(groomAddr)}</div>` : ''}
          </div>
          <!-- Bride on Right -->
          <div class="t11-side">
            <div class="t11-photo" ${bridePhoto ? `style="background-image:url('${esc(bridePhoto)}')"` : ''}>
              ${bridePhoto ? '' : esc(brideName.charAt(0) || 'B')}
            </div>
            <div class="t11-role-badge">Bride</div>
            <div class="t11-name">${esc(brideName)}</div>
            ${brideParents ? `
              <div class="t11-rel">d/o</div>
              <div class="t11-par">${esc(brideParents)}</div>
            ` : ''}
            ${brideAddr ? `<div class="t11-addr">${formatAddress(brideAddr)}</div>` : ''}
          </div>
          ` : `
          <!-- Bride on Left -->
          <div class="t11-side">
            <div class="t11-photo" ${bridePhoto ? `style="background-image:url('${esc(bridePhoto)}')"` : ''}>
              ${bridePhoto ? '' : esc(brideName.charAt(0) || 'B')}
            </div>
            <div class="t11-role-badge">Bride</div>
            <div class="t11-name">${esc(brideName)}</div>
            ${brideParents ? `
              <div class="t11-rel">d/o</div>
              <div class="t11-par">${esc(brideParents)}</div>
            ` : ''}
            ${brideAddr ? `<div class="t11-addr">${formatAddress(brideAddr)}</div>` : ''}
          </div>
          <!-- Groom on Right -->
          <div class="t11-side">
            <div class="t11-photo" ${groomPhoto ? `style="background-image:url('${esc(groomPhoto)}')"` : ''}>
              ${groomPhoto ? '' : esc(groomName.charAt(0) || 'G')}
            </div>
            <div class="t11-role-badge">Groom</div>
            <div class="t11-name">${esc(groomName)}</div>
            ${groomParents ? `
              <div class="t11-rel">s/o</div>
              <div class="t11-par">${esc(groomParents)}</div>
            ` : ''}
            ${groomAddr ? `<div class="t11-addr">${formatAddress(groomAddr)}</div>` : ''}
          </div>
          `}
        </div>
        <div class="t11-hero-footer">
          <div class="t11-ornament" aria-hidden="true">
            <span class="t11-ornament-line"></span>
            <span class="t11-ornament-icon">❖</span>
            <span class="t11-ornament-line"></span>
          </div>
          <p class="t11-tagline">
            Two hearts, two families,<br>one beautiful beginning.
          </p>
          <div class="t11-scroll-cue">✦ SCROLL FOR SACRED MUHURAT ✦</div>
        </div>
      </div>
    </section>

    <!-- Screen 2 (3rd Image): Auspicious Wedding Muhurat, Scratch, Countdown & Save Date -->
    <section class="t11-page t11-page-framed" id="dates-section" data-sec="date" aria-label="Auspicious Wedding Muhurat">
      <div class="t11-frame-border" aria-hidden="true"></div>
      <div class="t11-framed-content">
        <div class="t11-sec-arch" aria-hidden="true"></div>
        <div class="t11-sec-kicker">AUSPICIOUS WEDDING MUHURAT</div>
        <h2 class="t11-sec-title">THE SACRED WEDDING DATE</h2>
        <p class="t11-sec-sub">Reveal our sacred wedding date, followed by live countdown &amp; calendar</p>

        <!-- 1. Interactive Scratch Card -->
        <div class="t11-scratch-card-wrap">
          <div class="t11-scratch-head">
            <span class="t11-scratch-icon">✨</span>
            <h3 class="t11-scratch-title">Wedding Date &amp; Muhurat</h3>
            <p class="t11-scratch-desc">Gently swipe to reveal the auspicious date &amp; muhurat</p>
          </div>
          <div class="t11-scratch-box" id="t11-scratch-box">
            <div class="t11-scratch-unveiled">
              <span class="t11-scratch-ring">💍</span>
              <strong class="t11-scratch-date">${esc(weddingDateStr)}</strong>
              <span class="t11-scratch-muhurat">⏰ Auspicious Vivah Muhurat: ${esc(wedding.time || '7:00 PM Onwards')}</span>
              <span class="t11-scratch-badge">✦ Shubh Vivah · Auspicious Union ✦</span>
            </div>
            <canvas id="t11-scratch-canvas" class="t11-scratch-canvas" aria-label="Scratch to reveal the wedding date"></canvas>
          </div>
          <button type="button" class="t11-btn-scratch" id="t11-scratch-btn">
            <span>✨</span> Scratch or Tap to Reveal
          </button>
        </div>

        <!-- 2. Live Countdown Timer -->
        <div class="t11-cd-card">
          <div class="t11-cd-label">COUNTDOWN TO CELEBRATIONS</div>
          <div class="t11-cd-grid" role="timer" aria-label="Wedding Countdown">
            <div class="t11-cd-box">
              <span class="t11-cd-num" id="t11-cd-days">00</span>
              <span class="t11-cd-lbl">DAYS</span>
            </div>
            <div class="t11-cd-box">
              <span class="t11-cd-num" id="t11-cd-hours">00</span>
              <span class="t11-cd-lbl">HOURS</span>
            </div>
            <div class="t11-cd-box">
              <span class="t11-cd-num" id="t11-cd-mins">00</span>
              <span class="t11-cd-lbl">MINS</span>
            </div>
            <div class="t11-cd-box">
              <span class="t11-cd-num" id="t11-cd-secs">00</span>
              <span class="t11-cd-lbl">SECS</span>
            </div>
          </div>
        </div>

        <!-- 3. Save Date Card (Google Calendar) -->
        <div class="t11-cal-card">
          <div class="t11-cal-title">Save the Date</div>
          <p class="t11-cal-desc">Add our sacred wedding ceremony directly to your Google Calendar so you never miss it.</p>
          <a href="${calLink}" target="_blank" rel="noopener noreferrer" class="t11-btn-cal" id="t11-cal-btn">
            <span>📅</span> Add to Google Calendar
          </a>
        </div>
      </div>
    </section>

    <!-- Screen 3 (4th Image): Wedding Programme (Framed) -->
    <section class="t11-page t11-page-framed" id="events-section" data-sec="events" aria-label="Wedding Programme">
      <div class="t11-frame-border" aria-hidden="true"></div>
      <div class="t11-framed-content">
        <div class="t11-sec-arch" aria-hidden="true"></div>
        <div class="t11-sec-kicker">AUSPICIOUS CEREMONIES</div>
        <h2 class="t11-sec-title">WEDDING PROGRAMME</h2>
        <p class="t11-sec-sub">Join us in celebrating each sacred ritual with joyous celebrations</p>

        <!-- Dynamic Events Grid with images -->
        <div class="t11-events-grid">
          ${rawEvents.map(ev => {
            const evImg = getEventPhoto(ev);
            return `
            <div class="t11-ev-card">
              ${evImg ? `
                <div class="t11-ev-img-wrap">
                  <img src="${esc(evImg)}" alt="${esc(ev.event_name || 'Ceremony')}" class="t11-ev-img" loading="lazy" />
                </div>
              ` : ''}
              <div class="t11-ev-body">
                <div class="t11-ev-ribbon">${formatRibbonDate(ev.event_date, ev.event_time)}</div>
                <div class="t11-ev-name">${esc(ev.event_name || 'Wedding Ceremony')}</div>
                <div class="t11-ev-venue">📍 ${esc(ev.venue || venueName)}</div>
                ${clean(ev.note || ev.comment || ev.description || ev.event_comment) ? `<div class="t11-ev-note" style="font-size:12px;color:rgba(255,255,255,0.7);margin-top:4px;">💬 ${esc(clean(ev.note || ev.comment || ev.description || ev.event_comment))}</div>` : ''}
                <div class="t11-ev-bottom">
                  <span class="t11-ev-bless">Bless with Presence</span>
                  <button type="button" class="t11-ev-rsvp-link" data-trigger-rsvp>RSVP &rarr;</button>
                </div>
              </div>
            </div>`;
          }).join('')}
        </div>
      </div>
    </section>

    <!-- Screen 4 (5th Image): Banquet Name & Location Name with Image (Framed) -->
    <section class="t11-page t11-page-framed" id="map-section" data-sec="venue" aria-label="Banquet Hall Venue">
      <div class="t11-frame-border" aria-hidden="true"></div>
      <div class="t11-framed-content">
        <div class="t11-sec-arch" aria-hidden="true"></div>
        <div class="t11-sec-kicker">CELEBRATION DETAILS</div>
        <h2 class="t11-sec-title">BANQUET &amp; VENUE</h2>
        <p class="t11-sec-sub">We eagerly look forward to welcoming you to grace this auspicious occasion.</p>

        <div class="t11-venue-card">
          <div class="t11-venue-photo-wrap">
            ${banquetPhoto ? `
              <img src="${esc(banquetPhoto)}" alt="${esc(venueName)}" class="t11-venue-photo" />
            ` : `
              <div class="t11-venue-arch-fallback">
                <svg viewBox="0 0 24 24"><path d="M12 2L2 9v13h20V9L12 2zm0 4.5l6 4.5v9h-3v-5H9v5H6v-9l6-4.5z"/></svg>
                <span style="font-family:'Cinzel',serif;font-size:2cqw;letter-spacing:0.2em;margin-top:1cqw;">ROYAL BANQUET</span>
              </div>
            `}
          </div>
          <h3 class="t11-vh-title">${esc(venueName)}</h3>
          <p class="t11-vh-addr">${esc(venueAddr)}</p>

          <a href="${mapLink}" target="_blank" rel="noopener noreferrer" class="t11-btn-primary" id="t11-map-btn">
            <span>📍</span> GET DIRECTIONS ON GOOGLE MAPS
          </a>
        </div>
      </div>
    </section>

    <!-- Screen 5: Closing Blessing & RSVP Suite (Framed) -->
    <section class="t11-page t11-page-framed" id="rsvp-section" data-sec="rsvp" aria-label="RSVP Suite">
      <div class="t11-frame-border" aria-hidden="true"></div>
      <div class="t11-framed-content">
        <div class="t11-sec-arch" aria-hidden="true"></div>
        <div class="t11-sec-kicker">YOUR PRESENCE IS OUR PRESENT</div>
        <h2 class="t11-sec-title">Kindly RSVP</h2>

        <div class="t11-rsvp-card">
          <div class="t11-rsvp-badge">${esc(guestBadge)}</div>
          <div class="t11-rsvp-guest">${esc(guestDisplayName)}</div>
          <div class="t11-rsvp-meta">Cordially invited to grace the celebrations</div>

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

          <div class="t11-footer-closing">
            <div class="t11-footer-blessing">With love, affection, and best wishes,</div>
            <div class="t11-footer-family">The ${esc(brideName)} &amp; ${esc(groomName)} Families</div>
          </div>

          <button type="button" class="t11-btn-replay" id="t11-replay-btn">
            <span>✨</span> REPLAY LIGHTS &amp; PHULJHARI
          </button>
        </div>
      </div>
    </section>
  </div>

  <!-- Canvas for phuljhari / sparkler crackers fireworks -->
  <canvas id="t11-fx"></canvas>

  <!-- Act I: Ornate Nocturnal Palace Gate (Lights Off) -->
  <div id="t11-intro" data-open-gate>
    <div id="t11-scene">
      <div class="t11-layer" id="t11-fr"></div>
      <div class="t11-layer t11-PL" id="t11-pl"></div>
      <div class="t11-layer t11-PR" id="t11-pr"></div>
      <div id="t11-lamps"></div>
    </div>

    <!-- Center Invitation Overlay -->
    <div id="t11-msg" data-open="true">
      <div class="t11-wel">WELCOME</div>
      <div class="t11-cel">A CELEBRATION OF LOVE</div>
      <div class="t11-names">${esc(brideName)} &amp;<br>${esc(groomName)}</div>
      <div class="t11-ci">CORDIALLY INVITED</div>
      <div class="t11-gst">${esc(guestDisplayName)}</div>
      <div class="t11-per">${esc(guestBadge)}</div>
      <button type="button" id="t11-open-btn" data-open="true">OPEN</button>
      <div class="t11-tap">✦ Tap to open the invitation ✦</div>
      <button type="button" class="t11-skip-btn" id="t11-skip-btn">SKIP INTRO</button>
    </div>
  </div>
</div>
  `.trim();
}

/* ---------- Export Mount: Interactive Controller & Lifecycle ---------- */
export function mount(root, { guest = {}, wedding = {}, events = [] } = {}) {
  const stage = (root && root.querySelector) ? (root.querySelector('#t11-stage') || root) : null;
  if (!stage) return () => {};

  let timers = [];
  let animId = null;
  let audioCtx = null;
  let isDone = false;
  let busy = false;

  const intro = stage.querySelector('#t11-intro');
  const fr = stage.querySelector('#t11-fr');
  const pl = stage.querySelector('#t11-pl');
  const pr = stage.querySelector('#t11-pr');
  const lamps = stage.querySelector('#t11-lamps');
  const canvas = stage.querySelector('#t11-fx');
  const openBtn = stage.querySelector('#t11-open-btn');
  const skipBtn = stage.querySelector('#t11-skip-btn');
  const replayBtn = stage.querySelector('#t11-replay-btn');

  // 1. Setup Curtain Door Geometry & Clip Paths (1024x1536 artwork)
  const W = 1024, H = 1536;
  const PT = [[513, 238], [430, 270], [350, 325], [285, 385], [235, 440], [205, 490], [196, 540], [196, 1340]];
  const pc = arr => arr.map(p => `${(p[0] / W * 100).toFixed(2)}% ${(p[1] / H * 100).toFixed(2)}%`).join(',');
  const mir = PT.slice(1).map(p => [W - p[0], p[1]]);
  const hole = PT.concat(mir.slice().reverse());
  const left = PT.concat([[513, 1340]]);
  const right = [[513, 238]].concat(mir).concat([[513, 1340]]);

  if (fr) fr.style.clipPath = `polygon(evenodd, 0 0, 100% 0, 100% 100%, 0 100%, 0 0, ${pc(hole)}, ${pc([PT[0]])})`;
  if (pl) pl.style.clipPath = `polygon(${pc(left)})`;
  if (pr) pr.style.clipPath = `polygon(${pc(right)})`;

  // 2. Setup Lamps (Unlit overlays that fade + glowing halos)
  const LA = [
    [192, 1320, 130, 290],
    [835, 1320, 130, 290],
    [62,  700,  110, 230],
    [962, 700,  110, 230],
    [118, 535,  120, 230],
    [908, 535,  120, 230]
  ];
  const OFF = [
    [93,  1141, 291,  1499, './assets/template-11-lamp-0.webp'],
    [736, 1141, 934,  1499, './assets/template-11-lamp-1.webp'],
    [0,   551,  151,  849,  './assets/template-11-lamp-2.webp'],
    [873, 551,  1024, 849,  './assets/template-11-lamp-3.webp'],
    [24,  386,  212,  684,  './assets/template-11-lamp-4.webp'],
    [814, 386,  1002, 684,  './assets/template-11-lamp-5.webp']
  ];

  function lp(c, i, cls, k) {
    return `<div class="t11-lp ${cls}" style="--d:${(i * 0.28).toFixed(2)}s;left:${(c[0]/W*100).toFixed(2)}%;top:${(c[1]/H*100).toFixed(2)}%;width:${(c[2]*k/W*100).toFixed(2)}%;height:${(c[3]*k/H*100).toFixed(2)}%"></div>`;
  }

  if (lamps) {
    let lampsHtml = '';
    LA.forEach((c, i) => {
      const o = OFF[i];
      lampsHtml += `<div class="t11-of" style="--d:${(i * 0.28).toFixed(2)}s;left:${(o[0]/W*100).toFixed(2)}%;top:${(o[1]/H*100).toFixed(2)}%;width:${((o[2]-o[0])/W*100).toFixed(2)}%;height:${((o[3]-o[1])/H*100).toFixed(2)}%;background-image:url(${o[4]})"></div>` + lp(c, i, 't11-gl', 2.1);
    });
    lampsHtml += lp([500, 85, 190, 190], 6, 't11-gl', 1);
    lamps.innerHTML = lampsHtml;
  }

  // 3. Web Audio API Sparkler Sizzle & Royal Chime
  function playCrackleSound() {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtx) audioCtx = new AudioCtx();
      if (audioCtx.state === 'suspended') audioCtx.resume();

      // Soft sparkler sizzle
      const bufferSize = Math.floor(audioCtx.sampleRate * 0.4);
      const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
      const out = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        out[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.25));
      }
      const noise = audioCtx.createBufferSource();
      noise.buffer = buffer;
      const filter = audioCtx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(2800, audioCtx.currentTime);
      const gain = audioCtx.createGain();
      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.38);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(audioCtx.destination);
      noise.start();

      // Gentle royal chime (pentatonic warm overtone)
      const osc = audioCtx.createOscillator();
      const oscGain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.35);
      oscGain.gain.setValueAtTime(0.05, audioCtx.currentTime);
      oscGain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.8);
      osc.connect(oscGain);
      oscGain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.85);
    } catch {}
  }

  // 4. Live HTML5 Canvas Sparkler / Phuljhari Crackers Pyrotechnics
  function sparkle(ms) {
    if (!canvas || !stage) return;
    const r = stage.getBoundingClientRect();
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = r.width * dpr;
    canvas.height = r.height * dpr;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    const w = r.width, h = r.height;
    let P = [];
    const t0 = performance.now();
    let last = t0;
    const src = [[0.2, 0.87], [0.8, 0.87], [0.5, 0.9], [0.35, 0.9], [0.65, 0.9]];

    function emit(n) {
      for (let i = 0; i < n; i++) {
        const s = src[(Math.random() * src.length) | 0];
        const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.6;
        const v = (0.25 + Math.random() * 0.75) * w * 0.0125;
        P.push({
          x: s[0] * w,
          y: s[1] * h,
          vx: Math.cos(a) * v,
          vy: Math.sin(a) * v * 1.25,
          l: 0,
          m: 30 + Math.random() * 34,
          c: Math.random() < 0.55 ? '255,214,110' : Math.random() < 0.5 ? '255,244,205' : '255,160,60'
        });
      }
    }

    emit(160);
    playCrackleSound();

    function f(now) {
      const e = now - t0;
      const dt = Math.min(2, (now - last) / 16.7);
      last = now;
      ctx.globalCompositeOperation = 'source-over';
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      if (e < ms) {
        emit(Math.round(9 * Math.min(1, e / 500) * (e > ms - 900 ? (ms - e) / 900 : 1)));
      }
      P = P.filter(p => p.l < p.m);
      P.forEach(p => {
        const px = p.x, py = p.y;
        p.vy += 0.045 * dt;
        p.vx *= 0.985;
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.l += dt;
        const k = 1 - p.l / p.m;
        ctx.strokeStyle = `rgba(${p.c},${k.toFixed(2)})`;
        ctx.lineWidth = w * 0.0035 * k + 0.6;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        if (Math.random() < 0.04) {
          ctx.fillStyle = `rgba(255,255,255,${k})`;
          ctx.fillRect(p.x - 1, p.y - 1, 2.4, 2.4);
        }
      });
      if (e < ms + 2500 || P.length) {
        animId = requestAnimationFrame(f);
      } else {
        ctx.clearRect(0, 0, w, h);
      }
    }
    animId = requestAnimationFrame(f);
  }

  // 5. Sequence Controller: Lights On -> Gate Unfolds -> Inner Reveal -> Done
  function go() {
    if (busy || isDone) return;
    busy = true;

    try {
      window.dispatchEvent(new CustomEvent('invitation-unveiled'));
    } catch {}

    stage.classList.add('t11-lit');
    playCrackleSound();

    timers.push(setTimeout(() => {
      stage.classList.add('t11-open');
      sparkle(6500);
      try {
        window.dispatchEvent(new CustomEvent('invitation-unveiled'));
      } catch {}
    }, 3200));

    timers.push(setTimeout(() => {
      stage.classList.add('t11-fadeF');
    }, 4300));

    timers.push(setTimeout(() => {
      stage.classList.add('t11-fadeP');
    }, 6200));

    timers.push(setTimeout(() => {
      stage.classList.add('t11-done');
      isDone = true;
      try {
        window.dispatchEvent(new CustomEvent('invitation-unveiled'));
        if (typeof window.__updateRoyalDockVisibility === 'function') {
          window.__updateRoyalDockVisibility();
        }
      } catch {}
    }, 7400));

    timers.push(setTimeout(() => {
      if (intro) intro.style.display = 'none';
      try {
        window.dispatchEvent(new CustomEvent('invitation-unveiled'));
      } catch {}
    }, 9200));
  }

  function skipIntro() {
    document.body.classList.add('invitation-unveiled');
    window._invitationUnveiled = true;
    try {
      if (typeof window.__updateRoyalDockVisibility === 'function') {
        window.__updateRoyalDockVisibility();
      }
    } catch {}
    timers.forEach(t => clearTimeout(t));
    timers = [];
    if (animId) cancelAnimationFrame(animId);
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    stage.classList.add('t11-lit', 't11-open', 't11-fadeF', 't11-fadeP', 't11-done');
    if (intro) intro.style.display = 'none';
    isDone = true;
    busy = false;
    try {
      window.dispatchEvent(new CustomEvent('invitation-unveiled'));
      if (typeof window.__updateRoyalDockVisibility === 'function') {
        window.__updateRoyalDockVisibility();
      }
    } catch {}
  }

  function replay() {
    timers.forEach(t => clearTimeout(t));
    timers = [];
    if (animId) cancelAnimationFrame(animId);
    stage.classList.remove('t11-lit', 't11-open', 't11-fadeF', 't11-fadeP', 't11-done');
    if (intro) {
      intro.style.display = '';
      intro.style.opacity = '1';
    }
    isDone = false;
    busy = false;
    const pages = stage.querySelector('#t11-pages');
    if (pages) pages.scrollTop = 0;
  }

  if (intro) intro.addEventListener('click', go);
  if (openBtn) openBtn.addEventListener('click', e => { e.stopPropagation(); go(); });
  if (skipBtn) skipBtn.addEventListener('click', e => { e.stopPropagation(); skipIntro(); });
  if (replayBtn) replayBtn.addEventListener('click', e => { e.stopPropagation(); replay(); });

  // 6. Connect RSVP buttons to Global Royal RSVP Modal
  root.querySelectorAll('[data-trigger-rsvp]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      const dockRsvp = document.getElementById('royalDockRsvp');
      if (dockRsvp) dockRsvp.click();
    });
  });

  // 7. Interactive Scratch Card Controller
  const scratchCanvas = stage.querySelector('#t11-scratch-canvas');
  const scratchBtn = stage.querySelector('#t11-scratch-btn');
  if (scratchCanvas && typeof scratchCanvas.getContext === 'function') {
    const sCtx = scratchCanvas.getContext('2d');
    let scratchDone = false;
    let isScratching = false;

    function paintScratch() {
      const r = scratchCanvas.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      scratchCanvas.width = Math.max(1, Math.floor(r.width * dpr));
      scratchCanvas.height = Math.max(1, Math.floor(r.height * dpr));
      sCtx.scale(dpr, dpr);

      if (scratchDone) return;
      const grad = sCtx.createLinearGradient(0, 0, r.width, r.height);
      grad.addColorStop(0, '#cda23e');
      grad.addColorStop(0.3, '#fff4b8');
      grad.addColorStop(0.65, '#9d6d1b');
      grad.addColorStop(1, '#dfbc5e');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, r.width, r.height);

      sCtx.fillStyle = '#2b1704';
      sCtx.font = '700 12.5px "Cinzel", Georgia, serif';
      sCtx.textAlign = 'center';
      sCtx.textBaseline = 'middle';
      sCtx.fillText('✨ SCRATCH OR TAP TO REVEAL ✨', r.width / 2, r.height / 2);
    }

    function revealScratch() {
      if (scratchDone) return;
      scratchDone = true;
      const r = scratchCanvas.getBoundingClientRect();
      sCtx.clearRect(0, 0, r.width, r.height);
      scratchCanvas.style.pointerEvents = 'none';
      if (scratchBtn) scratchBtn.style.display = 'none';
      playCrackleSound();
      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        window.RoyalScratchCracker.triggerFirecrackerCelebration(r.left + r.width / 2, r.top + r.height / 2);
      }
    }

    function scratchAtPos(x, y) {
      if (scratchDone) return;
      sCtx.globalCompositeOperation = 'destination-out';
      sCtx.beginPath();
      sCtx.arc(x, y, 24, 0, Math.PI * 2);
      sCtx.fill();
      sCtx.globalCompositeOperation = 'source-over';
      if (typeof window !== 'undefined' && window.RoyalScratchCracker) {
        const r = scratchCanvas.getBoundingClientRect();
        window.RoyalScratchCracker.emitPhuljhariSparks(r.left + x, r.top + y, 8);
      }
    }

    function getScratchPos(e) {
      const r = scratchCanvas.getBoundingClientRect();
      const t = e.touches ? e.touches[0] : e;
      return { x: t.clientX - r.left, y: t.clientY - r.top };
    }

    scratchCanvas.addEventListener('mousedown', e => { isScratching = true; const p = getScratchPos(e); scratchAtPos(p.x, p.y); });
    window.addEventListener('mousemove', e => { if (isScratching) { const p = getScratchPos(e); scratchAtPos(p.x, p.y); } });
    window.addEventListener('mouseup', () => { isScratching = false; });
    scratchCanvas.addEventListener('touchstart', e => { isScratching = true; const p = getScratchPos(e); scratchAtPos(p.x, p.y); }, { passive: true });
    scratchCanvas.addEventListener('touchmove', e => { if (isScratching) { const p = getScratchPos(e); scratchAtPos(p.x, p.y); } }, { passive: true });
    window.addEventListener('touchend', () => { isScratching = false; });
    scratchCanvas.addEventListener('click', revealScratch);
    if (scratchBtn) scratchBtn.addEventListener('click', revealScratch);

    paintScratch();
  }

  // 8. Live 4-box Countdown Timer
  const daysEl = stage.querySelector('#t11-cd-days');
  const hoursEl = stage.querySelector('#t11-cd-hours');
  const minsEl = stage.querySelector('#t11-cd-mins');
  const secsEl = stage.querySelector('#t11-cd-secs');

  function updateCountdown() {
    if (!daysEl || !hoursEl || !minsEl || !secsEl) return;
    const targetDateStr = stage.getAttribute('data-wedding-date') || wedding.date || '2026-11-28';
    const target = new Date(targetDateStr).getTime();
    const now = Date.now();
    const diff = target - now;

    if (isNaN(target) || diff <= 0) {
      daysEl.textContent = '00';
      hoursEl.textContent = '00';
      minsEl.textContent = '00';
      secsEl.textContent = '00';
      return;
    }

    const d = Math.floor(diff / (1000 * 60 * 60 * 24));
    const h = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const m = Math.floor((diff / (1000 * 60)) % 60);
    const s = Math.floor((diff / 1000) % 60);

    daysEl.textContent = String(d).padStart(2, '0');
    hoursEl.textContent = String(h).padStart(2, '0');
    minsEl.textContent = String(m).padStart(2, '0');
    secsEl.textContent = String(s).padStart(2, '0');
  }

  updateCountdown();
  const cdInterval = setInterval(updateCountdown, 1000);

  // Return Cleanup Function
  return () => {
    timers.forEach(t => clearTimeout(t));
    clearInterval(cdInterval);
    if (animId) cancelAnimationFrame(animId);
    if (audioCtx) {
      try { audioCtx.close(); } catch {}
    }
  };
}
