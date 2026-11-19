/* ==========================================================================
   TEMPLATE 15 — CUSTOMER CUSTOM BACKGROUND WEDDING INVITATION
   Premium, cinematic, mobile-first digital wedding invitation suite.
   Uses customer's 2 custom-uploaded background images:
   - Image 1 (IMG_LANDING): Front cover background (--t15-landing)
   - Image 2 (IMG_PAGE): Couple details background (--t15-page)
   - Default Ornamental Border: Thin mirrored side flourish (--t15-border)
   - Circular Bride & Groom photos from existing onboarding photo uploads.
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

export default function renderTemplate15(invitation = {}) {
  const wedding = invitation.wedding || {};
  const guest = invitation.guest || {};
  const events = invitation.events || wedding.events || [];
  const orderRef = wedding.order_reference || wedding.ref || '';

  // Couple names & order
  const groomName = clean(wedding.groom_name) || 'Groom';
  const brideName = clean(wedding.bride_name) || 'Bride';
  const isBrideFirst = wedding.name_order === 'bride_first';
  const primaryName = isBrideFirst ? brideName : groomName;
  const secondaryName = isBrideFirst ? groomName : brideName;

  // Guest & Party count
  const isFamily = Boolean(guest.with_family || (guest.persons && guest.persons > 1) || String(guest.category || '').toLowerCase() === 'family');
  const guestName = clean(guest.name || guest.guest_name) || (isFamily ? 'Respected Family' : 'Respected Guest');
  const personCount = Number(guest.persons || guest.family_members || 1);
  const personLabel = isFamily ? 'Family Invitation' : `${personCount} ${personCount === 1 ? 'Person' : 'Persons'}`;

  // Bride & Groom Photos (strictly from existing onboarding fields)
  const bridePhoto = safeImg(wedding.bride_photo
    || wedding.bride_photo_url
    || wedding.bride_image
    || wedding.photo_bride
    || wedding.image2
    || (orderRef ? getStoredPhoto(`wedding_bride_photo_${orderRef}`) : '')
    || (orderRef ? getStoredPhoto(`template_photo_template-15_bride`) : ''));

  const groomPhoto = safeImg(wedding.groom_photo
    || wedding.groom_photo_url
    || wedding.groom_image
    || wedding.photo_groom
    || wedding.image1
    || (orderRef ? getStoredPhoto(`wedding_groom_photo_${orderRef}`) : '')
    || (orderRef ? getStoredPhoto(`template_photo_template-15_groom`) : ''));

  // Background Images (Customer Uploaded Images 1 & 2)
  const landingBg = safeImg(wedding.landing_background
    || wedding.landingBackground
    || (orderRef ? getStoredPhoto(`wedding_landing_background_${orderRef}`) : '')
    || getStoredPhoto('template_photo_template-15_landing')
    || './assets/template-15-cover.webp');

  const pageBg = safeImg(wedding.page_background
    || wedding.pageBackground
    || (orderRef ? getStoredPhoto(`wedding_page_background_${orderRef}`) : '')
    || getStoredPhoto('template_photo_template-15_page')
    || './assets/template-15-page.webp');

  const borderAsset = './assets/template-15-border.svg';

  // Parents (Father only under D/O and S/O)
  const brideFather = clean(wedding.bride_father || wedding.bride_parents || '');
  const groomFather = clean(wedding.groom_father || wedding.groom_parents || '');

  // Addresses
  const brideAddress = clean(wedding.bride_address || '');
  const groomAddress = clean(wedding.groom_address || '');

  // Date, Time, Muhurat, Title
  const ceremonyTitle = clean(wedding.ceremony_title || wedding.title || 'THE WEDDING INVITATION');
  const weddingDateStr = formatWeddingDate(wedding.date || wedding.event_date);
  const rawDateIso = clean(wedding.date || wedding.event_date || '2026-11-28');
  const rawTimeStr = clean(wedding.time || wedding.ceremony_time || '19:00');

  // Venue & Map
  const venueName = clean(wedding.venue_name || wedding.venue || wedding.venue_title || wedding.banquet_name || 'Wedding Celebration Venue');
  const venueLocation = clean(wedding.venue_title || 'Banquet & Lawn');
  const venueAddress = clean(wedding.venue_address || wedding.address || wedding.city || '');
  const venueImage = safeImg(wedding.venue_photo || wedding.venue_image || wedding.banquet_photo || wedding.image4 || '');
  const mapLink = safeUrl(wedding.map_url)
    || (venueName || venueAddress ? `https://maps.google.com/?q=${encodeURIComponent([venueName, venueAddress].filter(Boolean).join(', '))}` : '');

  // Programme events normalization
  const eventList = (Array.isArray(events) && events.length ? events : [
    { event_name: 'Shubho Bibaho', event_date: rawDateIso, event_time: '7:00 PM', venue: venueName },
    { event_name: 'Royal Reception', event_date: rawDateIso, event_time: '7:30 PM', venue: venueName }
  ]);

  return `
<!-- TEMPLATE 15: CUSTOMER CUSTOM BACKGROUND SUITE -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;600;700&family=Cormorant+Garamond:ital,wght@0,500;0,700;1,700&family=Great+Vibes&display=swap" rel="stylesheet">

<style>
:root {
  --t15-maroon: #5a1020;
  --t15-maroon-dark: #3a0a14;
  --t15-gold: #c9a45c;
  --t15-gold-light: #f3d9a0;
  --t15-gold-gradient: linear-gradient(135deg, #c9a45c 0%, #fae6b8 50%, #9e7932 100%);
  --t15-ivory: #fbf5eb;
  --t15-landing: url('${landingBg}');
  --t15-page: url('${pageBg}');
  --t15-border: url('${borderAsset}');
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body {
  height: 100%;
  background: #070b17;
  overflow: hidden;
  font-family: 'Cormorant Garamond', Georgia, serif;
  color: var(--t15-maroon);
}

.t15-stage {
  height: min(100dvh, 150vw);
  width: min(66.667dvh, 100vw);
  container-type: size;
  overflow-y: auto;
  overflow-x: hidden;
  scroll-snap-type: y mandatory;
  position: relative;
  scrollbar-width: none;
  padding: env(safe-area-inset-top) 0 env(safe-area-inset-bottom);
  margin: 0 auto;
  box-shadow: 0 0 60px rgba(0, 0, 0, 0.85);
  background: #000;
}
.t15-stage::-webkit-scrollbar { display: none; }

.t15-section {
  height: 100cqh;
  scroll-snap-align: start;
  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  perspective: 140cqw;
}

.t15-paper {
  background: #f6ecd9 radial-gradient(circle at 50% 30%, #fffaf0, #efe0c4);
}
.t15-paper::before, .t15-paper::after {
  content: "";
  position: absolute;
  top: 0;
  bottom: 0;
  width: 17cqw;
  background: var(--t15-border) center/100% 100% no-repeat;
  pointer-events: none;
  opacity: 0.95;
  z-index: 2;
}
.t15-paper::before { left: 0; }
.t15-paper::after { right: 0; transform: scaleX(-1); }

.t15-bg {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: var(--fx, 50%) var(--fy, 50%);
  background-repeat: no-repeat;
  transition: transform 1.2s ease;
}

.t15-cinzel {
  font-family: 'Cinzel', Georgia, serif;
  letter-spacing: 0.18em;
  text-transform: uppercase;
}
.t15-script {
  font-family: 'Great Vibes', cursive;
}
.t15-ab {
  position: absolute;
  transform: translate(-50%, -50%);
  text-align: center;
  white-space: nowrap;
}

h2.t15-h2 {
  font: 600 4.6cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.15em;
  position: relative;
  z-index: 3;
  color: #50101e;
  text-shadow: 0 1px 2px rgba(255, 255, 255, 0.6);
}
.t15-sub {
  font-style: italic;
  font-weight: 700;
  font-size: 3.5cqw;
  margin: 1cqw 8cqw;
  position: relative;
  z-index: 3;
  color: #7a1a2e;
}

/* PAGE 1: FRONT COVER */
.t15-stage.locked, .stage.locked {
  overflow: hidden !important;
  scroll-snap-type: none !important;
  touch-action: none !important;
}
#t15-p1 {
  background: #110408;
}
#t15-glow, #glow {
  position: absolute;
  inset: 0;
  pointer-events: none;
  opacity: 0;
  transition: opacity 1.8s ease;
  z-index: 2;
}
#t15-fx, #fx {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 7;
}

/* 3D Cinematic Curtains */
.t15-curt, .curt {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 50.4%;
  z-index: 4;
  opacity: var(--co, 1);
  transition: transform 3.4s cubic-bezier(.55, .05, .25, 1);
  background: repeating-linear-gradient(90deg, #3a0a16 0, #7a1a2e 4cqw, #4a1020 8cqw, #8a2238 11cqw, #3a0a16 14cqw);
  box-shadow: inset 0 0 8cqw #000a, 0 0 6cqw #000a;
}
.t15-curt::before, .curt::before {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  height: 6cqh;
  background: linear-gradient(#e8c77a, #8a6a2a);
  box-shadow: 0 1cqw 2cqw #0008;
}
.t15-curt::after, .curt::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(180deg, rgba(0,0,0,.35), transparent 25%, transparent 70%, rgba(0,0,0,.5));
}
.t15-cl, .cl {
  left: 0;
  transform-origin: left center;
  border-right: .8cqw solid #c9a45c;
}
.t15-cr, .cr {
  right: 0;
  transform-origin: right center;
  border-left: .8cqw solid #c9a45c;
}
.t15-opened .t15-cl, .opened .cl {
  transform: translateX(-3%) scaleX(.14) rotateY(25deg);
}
.t15-opened .t15-cr, .opened .cr {
  transform: translateX(3%) scaleX(.14) rotateY(-25deg);
}

#t15-dark, #dark {
  position: absolute;
  inset: 0;
  z-index: 5;
  pointer-events: none;
  background: radial-gradient(circle at 50% 45%, rgba(0, 0, 0, .2), rgba(0, 0, 0, .6));
  transition: opacity 1.8s ease;
}
.t15-lit #t15-dark, .lit #dark {
  opacity: 0;
}

#t15-flash, #flash {
  position: absolute;
  inset: 0;
  z-index: 8;
  background: #fff7e0;
  opacity: 0;
  pointer-events: none;
}

/* Classic Ivory-Parchment Card with Double Gold Frame */
#t15-gb, #gb, .t15-gb {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  width: 84cqw;
  padding: 9cqw 6cqw 8cqw;
  z-index: 6;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.4cqw;
  border-radius: 1.6cqw;
  background: radial-gradient(ellipse at 50% 0, rgba(255, 252, 243, .97), rgba(247, 236, 212, .95) 70%);
  -webkit-backdrop-filter: blur(8px);
  backdrop-filter: blur(8px);
  border: .5cqw solid #b8923f;
  box-shadow: 0 3cqw 9cqw rgba(0, 0, 0, .65), 0 0 0 1cqw rgba(201, 164, 92, .25), inset 0 0 0 1.1cqw #fffaf0, inset 0 0 0 1.5cqw #c9a45c, inset 0 0 6cqw rgba(184, 146, 63, .18);
  transition: opacity .8s ease, transform .8s ease;
}
#t15-gb::before, #t15-gb::after, #gb::before, #gb::after, .t15-gb::before, .t15-gb::after {
  content: "❖";
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  width: 9cqw;
  height: 9cqw;
  border-radius: 50%;
  display: grid;
  place-items: center;
  font-size: 5cqw;
  color: #b8923f;
  background: #fbf3e0;
  border: .4cqw solid #b8923f;
  box-shadow: 0 .6cqw 1.6cqw #0007;
}
#t15-gb::before, #gb::before, .t15-gb::before {
  top: -4.5cqw;
}
#t15-gb::after, #gb::after, .t15-gb::after {
  bottom: -4.5cqw;
}
#t15-gb.out, #gb.out, .t15-gb.out {
  opacity: 0;
  transform: translate(-50%, -56%) scale(.92);
  pointer-events: none;
}
#t15-gb .t15-ab, #gb .ab, .t15-gb .t15-ab, #t15-gb .ab, #gb .t15-ab {
  position: static;
  transform: none;
  max-width: 100%;
  text-shadow: none;
}
#t15-gb #t15-t-title, #t15-gb #t-title, #gb #t-title, #gb #t15-t-title,
#t15-gb #t15-t-inv, #t15-gb #t-inv, #gb #t-inv, #gb #t15-t-inv,
#t15-gb #t15-t-pers, #t15-gb #t-pers, #gb #t-pers, #gb #t15-t-pers {
  color: #8a6a2a !important;
  font-weight: 600;
}
#t15-gb #t15-t-title, #t15-gb #t-title, #gb #t-title, #gb #t15-t-title {
  font-size: 3.3cqw;
  line-height: 1.7;
  letter-spacing: .22em;
}
#t15-gb #t15-t-groom, #t15-gb #t-groom, #gb #t-groom, #gb #t15-t-groom,
#t15-gb #t15-t-bride, #t15-gb #t-bride, #gb #t-bride, #gb #t15-t-bride {
  color: #5a1020 !important;
  text-shadow: 0 .2cqw 0 #fff8e8, 0 .5cqw 1cqw rgba(90, 16, 32, .18);
}
#t15-gb #t15-t-amp, #t15-gb #t-amp, #gb #t-amp, #gb #t15-t-amp {
  color: #b8923f !important;
  font-size: 7cqw;
}
#t15-gb #t15-t-guest, #t15-gb #t-guest, #gb #t-guest, #gb #t15-t-guest {
  color: #4a1020 !important;
  font: 700 7cqw 'Cormorant Garamond', Georgia, serif;
  letter-spacing: .04em;
  margin: .5cqw 0;
}
#t15-gb .t15-rule, #t15-gb .rule, #gb .rule, #gb .t15-rule {
  width: 62%;
  height: .35cqw;
  margin: 1.4cqw 0;
  border: 0;
  background: linear-gradient(90deg, transparent, #b8923f 25%, #e8c77a 50%, #b8923f 75%, transparent);
  position: relative;
  display: block;
}
#t15-gb .t15-rule::after, #t15-gb .rule::after, #gb .rule::after, #gb .t15-rule::after {
  content: "";
  position: absolute;
  left: 50%;
  top: 50%;
  width: 1.6cqw;
  height: 1.6cqw;
  background: #b8923f;
  transform: translate(-50%, -50%) rotate(45deg);
}
.t15-open-btn, #open, #t15-open {
  font: 600 3.6cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.28em;
  padding: 2.2cqw 7.5cqw;
  border: 0.4cqw solid var(--t15-gold);
  background: linear-gradient(135deg, #7a1a2e 0%, var(--t15-maroon) 100%);
  color: #f3d9a0;
  border-radius: 99cqw;
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.6), inset 0 0 1cqw rgba(243, 217, 160, 0.3);
  cursor: pointer;
  z-index: 6;
  margin-top: 2cqw;
  animation: t15Pulse 2.4s infinite ease-in-out;
}
@keyframes t15Pulse {
  0%, 100% { box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.6), 0 0 0 0 rgba(201, 164, 92, 0.5); }
  50% { box-shadow: 0 1.5cqw 4.5cqw rgba(0, 0, 0, 0.75), 0 0 0 1.5cqw rgba(201, 164, 92, 0); }
}
#t15-gb #t15-open, #t15-gb .t15-open-btn, #t15-gb #open, #gb #open, #gb #t15-open {
  margin-top: 3cqw;
  background: linear-gradient(180deg, #8a1c34, #4e0d1c);
  color: #f6dfa4;
  border: .4cqw solid #c9a45c;
  box-shadow: 0 1cqw 2.4cqw rgba(0, 0, 0, .45), inset 0 .2cqw 0 rgba(255, 255, 255, .25);
}
#t-title, #t15-t-title {
  white-space: pre-line;
}

/* PAGE 2: COUPLE DETAILS */
#t15-p2 {
  background: #19050d;
}
.t15-board {
  position: relative;
  z-index: 3;
  background: rgba(255, 250, 240, 0.82);
  backdrop-filter: blur(5px);
  -webkit-backdrop-filter: blur(5px);
  border: 0.35cqw solid var(--t15-gold);
  border-radius: 3.5cqw;
  padding: 4.5cqw 3.5cqw;
  width: 88cqw;
  margin-top: 1cqw;
  box-shadow: 0 2cqw 6cqw rgba(0, 0, 0, 0.5), inset 0 0 2cqw rgba(255, 255, 255, 0.5);
}
.t15-cols {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3cqw;
  margin-top: 3.5cqw;
}
.t15-col {
  min-width: 0;
  font-size: 3.2cqw;
}
.t15-col .t15-role {
  font: 600 2.8cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.22em;
  color: #7a1a2e;
}
.t15-ring {
  width: 26cqw;
  height: 26cqw;
  margin: 1.8cqw auto;
  border-radius: 50%;
  padding: 0.9cqw;
  background: conic-gradient(#8a6a2a, #f3d9a0, #8a6a2a, #e8c77a, #8a6a2a);
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.4), inset 0 0 1cqw rgba(255, 255, 255, 0.5);
}
.t15-ring-inner {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: #e9dcc3 center/cover no-repeat;
  display: grid;
  place-items: center;
  font: 600 10cqw 'Cinzel', Georgia, serif;
  color: var(--t15-maroon);
  overflow: hidden;
}
.t15-nm {
  font-size: 7cqw;
  line-height: 1.25;
  white-space: nowrap;
  color: #50101e;
}
.t15-col small {
  display: block;
  opacity: 0.88;
  line-height: 1.3;
}
.t15-col .t15-kin-label {
  font-weight: 700;
  color: #8c6a22;
  margin-top: 1cqw;
}

/* PAGE 3: WEDDING DATE REVEAL */
.t15-reveal-box {
  position: relative;
  width: 78cqw;
  height: 34cqw;
  margin: 3.5cqw 0 2cqw;
  z-index: 3;
  border-radius: 2.5cqw;
  overflow: hidden;
  background: #fffaf0;
  border: 0.35cqw solid var(--t15-gold);
  display: grid;
  place-items: center;
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.12);
}
#t15-sc {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  touch-action: none;
  transition: opacity 1s ease;
  z-index: 4;
}
#t15-cd {
  display: flex;
  gap: 3.2cqw;
  z-index: 3;
  margin: 2cqw 0;
}
#t15-cd b {
  display: block;
  font: 600 7cqw 'Cinzel', Georgia, serif;
  color: #5a1020;
}
#t15-cd span {
  font: 2.6cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.15em;
  color: #8c6a22;
}
.t15-btn {
  font: 600 3cqw 'Cinzel', Georgia, serif;
  letter-spacing: 0.16em;
  padding: 2.2cqw 5.5cqw;
  border-radius: 99cqw;
  border: 0.3cqw solid var(--t15-gold);
  background: var(--t15-maroon);
  color: #f3d9a0;
  cursor: pointer;
  z-index: 3;
  text-decoration: none;
  display: inline-block;
  margin: 1.5cqw;
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.25);
  transition: transform 0.2s, background 0.2s;
}
.t15-btn:active {
  transform: scale(0.96);
}

/* PAGE 4: WEDDING PROGRAMME */
#t15-ev {
  display: flex;
  flex-direction: column;
  gap: 2.8cqw;
  width: 70cqw;
  max-height: 75cqh;
  overflow-y: auto;
  z-index: 3;
  padding: 1cqw;
  scrollbar-width: none;
}
#t15-ev::-webkit-scrollbar { display: none; }
.t15-card {
  display: flex;
  gap: 3cqw;
  align-items: center;
  text-align: left;
  background: #fffaf0;
  border: 0.3cqw solid var(--t15-gold);
  border-radius: 2.5cqw;
  padding: 2.5cqw;
  box-shadow: 0 1.5cqw 4cqw rgba(0, 0, 0, 0.12);
  opacity: 0;
  transform: rotateX(45deg) translateZ(-10cqw);
  transform-origin: top;
  transition: all 0.85s cubic-bezier(0.2, 0.9, 0.3, 1.2);
}
.t15-card.in {
  opacity: 1;
  transform: none;
}
.t15-card .t15-im {
  flex: 0 0 17cqw;
  height: 17cqw;
  border-radius: 2cqw;
  background: linear-gradient(135deg, #7a1a2e, #c9a45c) center/cover;
  display: grid;
  place-items: center;
  color: #f3d9a0;
  font: 7cqw 'Great Vibes';
  overflow: hidden;
}
.t15-card .t15-t {
  font: 600 3.8cqw 'Cinzel', Georgia, serif;
  color: #50101e;
}
.t15-card p {
  font-size: 3.2cqw;
  line-height: 1.25;
  color: #664a50;
}

/* PAGE 5: BANQUET & CLOSING */
.t15-venue {
  z-index: 3;
  width: 72cqw;
  font-size: 3.6cqw;
}
.t15-venue .t15-vi {
  height: 30cqw;
  border-radius: 2cqw;
  margin: 2.5cqw 0;
  background: linear-gradient(135deg, #7a1a2e, #c9a45c) center/cover no-repeat;
  border: 0.3cqw solid var(--t15-gold);
  box-shadow: 0 1cqw 3cqw rgba(0, 0, 0, 0.15);
}
#t15-pet {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 4;
}

@media (prefers-reduced-motion: reduce) {
  * { transition-duration: 0.01s !important; animation: none !important; }
}
</style>

<main class="t15-stage stage locked" id="t15-stage">
  <!-- PAGE 1: FRONT COVER BACKGROUND -->
  <section class="t15-section" id="t15-p1">
    <div class="t15-bg bg" id="t15-b1" style="background-image: var(--t15-landing);"></div>
    <div id="t15-glow" class="glow"></div>
    <div class="t15-curt curt t15-cl cl"></div>
    <div class="t15-curt curt t15-cr cr"></div>
    <div id="t15-dark" class="dark"></div>
    <div id="t15-gb" class="t15-gb gb">
      <div class="t15-ab ab t15-cinzel cinzel" id="t15-t-title">${esc(ceremonyTitle)}</div>
      <div class="t15-ab ab t15-script script" id="t15-t-groom">${esc(primaryName)}</div>
      <div class="t15-ab ab t15-script script" id="t15-t-amp">&amp;</div>
      <div class="t15-ab ab t15-script script" id="t15-t-bride">${esc(secondaryName)}</div>
      <i class="t15-rule rule"></i>
      <div class="t15-ab ab t15-cinzel cinzel" id="t15-t-inv">CORDIALLY INVITED</div>
      <div class="t15-ab ab" id="t15-t-guest" style="font-weight:700;">${esc(guestName)}</div>
      <div class="t15-ab ab t15-cinzel cinzel" id="t15-t-pers">${esc(personLabel)}</div>
      <button class="t15-open-btn open-btn" id="t15-open" type="button" aria-label="Open Invitation">OPEN</button>
    </div>
    <canvas id="t15-fx"></canvas>
    <div id="t15-flash" class="flash"></div>
  </section>

  <!-- PAGE 2: COUPLE DETAILS OVER IMAGE 2 -->
  <section class="t15-section" id="t15-p2">
    <div class="t15-bg" id="t15-b2" style="background-image: var(--t15-page);"></div>
    <div class="t15-board" id="t15-board">
      <h2 class="t15-h2">Two Hearts · One Destiny</h2>
      <div class="t15-sub">Together with their Families</div>
      <div class="t15-sub" style="font-size:3cqw;font-weight:500;margin-top:0.5cqw;">The Journey of Love &amp; Togetherness</div>
      <div class="t15-cols">
        <!-- Bride / Column 1 -->
        <div class="t15-col" id="t15-col-first">
          <div class="t15-role t15-cinzel">${isBrideFirst ? 'Bride' : 'Groom'}</div>
          <div class="t15-ring">
            <div class="t15-ring-inner" style="${(isBrideFirst ? bridePhoto : groomPhoto) ? `background-image:url('${esc(isBrideFirst ? bridePhoto : groomPhoto)}');` : ''}">
              ${!(isBrideFirst ? bridePhoto : groomPhoto) ? esc((isBrideFirst ? brideName : groomName).charAt(0)) : ''}
            </div>
          </div>
          <div class="t15-nm t15-script" id="t15-first-nm">${esc(isBrideFirst ? brideName : groomName)}</div>
          ${(isBrideFirst ? brideFather : groomFather) ? `
            <small class="t15-cinzel t15-kin-label">${isBrideFirst ? 'D/O' : 'S/O'}</small>
            <small>${esc(isBrideFirst ? brideFather : groomFather)}</small>
          ` : ''}
          ${(isBrideFirst ? brideAddress : groomAddress) ? `
            <small style="margin-top:1cqw;color:#50101e;">${esc(isBrideFirst ? brideAddress : groomAddress)}</small>
          ` : ''}
        </div>

        <!-- Groom / Column 2 -->
        <div class="t15-col" id="t15-col-second">
          <div class="t15-role t15-cinzel">${isBrideFirst ? 'Groom' : 'Bride'}</div>
          <div class="t15-ring">
            <div class="t15-ring-inner" style="${(isBrideFirst ? groomPhoto : bridePhoto) ? `background-image:url('${esc(isBrideFirst ? groomPhoto : bridePhoto)}');` : ''}">
              ${!(isBrideFirst ? groomPhoto : bridePhoto) ? esc((isBrideFirst ? groomName : brideName).charAt(0)) : ''}
            </div>
          </div>
          <div class="t15-nm t15-script" id="t15-second-nm">${esc(isBrideFirst ? groomName : brideName)}</div>
          ${(isBrideFirst ? groomFather : brideFather) ? `
            <small class="t15-cinzel t15-kin-label">${isBrideFirst ? 'S/O' : 'D/O'}</small>
            <small>${esc(isBrideFirst ? groomFather : brideFather)}</small>
          ` : ''}
          ${(isBrideFirst ? groomAddress : brideAddress) ? `
            <small style="margin-top:1cqw;color:#50101e;">${esc(isBrideFirst ? groomAddress : brideAddress)}</small>
          ` : ''}
        </div>
      </div>
      <div class="t15-sub" style="margin-top:3.5cqw;font-size:3.3cqw;">
        &ldquo;Two hearts, two families,<br>one beautiful beginning.&rdquo;
      </div>
    </div>
  </section>

  <!-- PAGE 3: WEDDING DATE REVEAL & COUNTDOWN -->
  <section class="t15-section t15-paper" id="t15-p3">
    <h2 class="t15-h2">Auspicious Wedding Muhurat</h2>
    <div class="t15-sub">The Sacred Wedding Date</div>
    <div class="t15-sub" style="font-weight:500;font-size:3cqw;">Scratch below to reveal our sacred wedding date, followed by live countdown &amp; calendar.</div>
    <div class="t15-reveal-box">
      <div class="t15-script" id="t15-wd" style="font-size:7cqw;color:#50101e;padding:2cqw;">${esc(weddingDateStr)}</div>
      <canvas id="t15-sc"></canvas>
    </div>
    <div id="t15-cd">
      <div><b id="t15-cd-d">--</b><span>Days</span></div>
      <div><b id="t15-cd-h">--</b><span>Hours</span></div>
      <div><b id="t15-cd-m">--</b><span>Mins</span></div>
      <div><b id="t15-cd-s">--</b><span>Secs</span></div>
    </div>
    <button class="t15-btn" id="t15-save" type="button">📅 SAVE TO CALENDAR</button>
  </section>

  <!-- PAGE 4: WEDDING PROGRAMME -->
  <section class="t15-section t15-paper" id="t15-p4">
    <h2 class="t15-h2">Wedding Programme</h2>
    <div class="t15-sub" style="font-weight:500;font-size:3cqw;">Sacred Ceremonies &amp; Timings</div>
    <div id="t15-ev" style="margin-top:2cqw;">
      ${eventList.map((ev, i) => {
        const evName = clean(ev.event_name || ev.name || `Ceremony ${i + 1}`);
        const evDate = clean(ev.event_date || ev.date || weddingDateStr);
        const evTime = clean(ev.event_time || ev.time || '');
        const evVenue = clean(ev.venue || venueName);
        const evImg = safeImg(ev.image || ev.event_image || '');
        return `
          <div class="t15-card" style="transition-delay:${i * 0.12}s;">
            <div class="t15-im" ${evImg ? `style="background-image:url('${esc(evImg)}');"` : ''}>
              ${!evImg ? esc(evName.charAt(0) || '✦') : ''}
            </div>
            <div>
              <div class="t15-t">${esc(evName)}</div>
              <p>📅 ${esc(evDate)}${evTime ? ` · ⏰ ${esc(evTime)}` : ''}</p>
              ${evVenue ? `<p>📍 ${esc(evVenue)}</p>` : ''}
            </div>
          </div>
        `;
      }).join('')}
    </div>
  </section>

  <!-- PAGE 5: BANQUET & CLOSING -->
  <section class="t15-section t15-paper" id="t15-p5">
    <canvas id="t15-pet"></canvas>
    <h2 class="t15-h2">Banquet &amp; Location</h2>
    <div class="t15-venue" id="t15-venue">
      ${venueLocation ? `<div class="t15-cinzel" style="font-size:3.2cqw;color:#8c6a22;margin-bottom:0.5cqw;">${esc(venueLocation)}</div>` : ''}
      <div class="t15-cinzel" style="font-size:4.6cqw;font-weight:700;color:#50101e;">${esc(venueName)}</div>
      ${venueAddress ? `<p style="margin:1.5cqw 0;font-size:3.4cqw;color:#502132;">${esc(venueAddress)}</p>` : ''}
      ${venueImage ? `<div class="t15-vi" style="background-image:url('${esc(venueImage)}');"></div>` : ''}
      ${mapLink ? `
        <a class="t15-btn" href="${mapLink}" target="_blank" rel="noopener noreferrer">
          📍 VIEW ON GOOGLE MAPS
        </a>
      ` : ''}
    </div>
    <div class="t15-sub t15-script" style="font-size:5.8cqw;font-weight:400;margin-top:3cqw;z-index:3;" id="t15-close">
      With love, affection, and best wishes,<br>
      The ${esc(groomName)} &amp; ${esc(brideName)} Families
    </div>
  </section>
</main>
`;
}

export function mount(root, options = {}) {
  if (typeof window === 'undefined' || !root) {
    return () => {};
  }
  const wedding = options.wedding || {};
  const guest = options.guest || {};
  const orderRef = wedding.order_reference || wedding.ref || '';

  const groomName = clean(wedding.groom_name) || 'Groom';
  const brideName = clean(wedding.bride_name) || 'Bride';
  const isBrideFirst = wedding.name_order === 'bride_first';
  const primaryName = isBrideFirst ? brideName : groomName;
  const secondaryName = isBrideFirst ? groomName : brideName;

  const isFamily = Boolean(guest.with_family || (guest.persons && guest.persons > 1) || String(guest.category || '').toLowerCase() === 'family');
  const guestName = clean(guest.name || guest.guest_name) || (isFamily ? 'Respected Family' : 'Respected Guest');
  const personCount = Number(guest.persons || guest.family_members || 1);
  const personLabel = isFamily ? 'Family Invitation' : `${personCount} ${personCount === 1 ? 'Person' : 'Persons'}`;

  // Configurable layout coordinates
  const L = Object.assign({
    title: [50, 14, 75],
    groom: [50, 30, 75],
    amp: [50, 38, 12],
    bride: [50, 46, 75],
    inv: [50, 58, 75],
    guest: [50, 66, 75],
    pers: [50, 72, 65],
    open: [50, 84, 0],
    lamps: [],
    doors: false,
    focal: [50, 50]
  }, window.T15_LAYOUT || {}, wedding.t15_layout || {});

  const ceremonyTitle = clean(wedding.ceremony_title || wedding.title || 'WELCOME\nA CELEBRATION OF LOVE');

  function el(id) {
    if (!root) return null;
    return root.querySelector('#' + id) || root.querySelector('#' + id.replace(/^t15-/, ''));
  }

  function place(id, key, txt, fs) {
    const e = el(id);
    if (!e) return;
    e.textContent = txt;
    if (!txt) { e.hidden = true; return; }
    e.hidden = false;
    e.style.color = (key === 'groom' || key === 'bride') ? '#5a1020' : '#7a1a2e';
    e.style.fontSize = fs + 'cqw';
    const gb = el('t15-gb') || el('gb');
    const w = (gb ? gb.clientWidth * 0.88 : 350);
    let s = fs;
    while (e.scrollWidth > w && s > 1.5) {
      s -= 0.3;
      e.style.fontSize = s + 'cqw';
    }
  }

  function layoutCover() {
    const gb = el('t15-gb') || el('gb');
    if (gb) {
      gb.style.top = ((L.board && L.board.y) || 50) + '%';
      gb.style.width = ((L.board && L.board.w) || 84) + 'cqw';
    }
    const p1 = el('t15-p1') || el('p1');
    if (p1) {
      p1.style.setProperty('--co', L.curtainOpacity == null ? .62 : L.curtainOpacity);
    }
    place('t15-t-title', 'title', ceremonyTitle, 3.6);
    place('t15-t-groom', 'groom', primaryName, 11);
    place('t15-t-amp', 'amp', '&', 8);
    place('t15-t-bride', 'bride', secondaryName, 11);
    place('t15-t-inv', 'inv', 'CORDIALLY INVITED', 3.4);
    place('t15-t-guest', 'guest', guestName, 7);
    place('t15-t-pers', 'pers', personLabel, 3.4);
  }

  layoutCover();
  window.addEventListener('resize', layoutCover);

  /* Scroll lock + OPEN sequence */
  const stage = el('t15-stage') || (root.classList && root.classList.contains('t15-stage') ? root : root.querySelector('.t15-stage, .stage'));
  let locked = true;
  const p1 = el('t15-p1') || el('p1');
  const fx = el('t15-fx') || el('fx');
  let fc = fx ? fx.getContext('2d') : null;
  let P = [];
  let run = false;
  let animId = null;
  const ds = ['t15-p2', 't15-p3', 't15-p4', 't15-p5', 'p2', 'p3', 'p4', 'p5'];
  const timeouts = [];

  function sizeCanvas(c) {
    if (!c) return;
    const dpr = window.devicePixelRatio || 1;
    c.width = c.clientWidth * dpr;
    c.height = c.clientHeight * dpr;
  }

  ds.forEach(i => {
    const elem = el(i);
    if (elem) elem.inert = true;
  });
  if (stage) stage.classList.add('locked');

  function stopScroll(e) {
    if (locked) e.preventDefault();
  }
  const scrollEvents = ['wheel', 'touchmove'];
  scrollEvents.forEach(evt => {
    document.addEventListener(evt, stopScroll, { passive: false });
    window.addEventListener(evt, stopScroll, { passive: false });
    if (stage) stage.addEventListener(evt, stopScroll, { passive: false });
  });

  function onKeydown(e) {
    if (locked && e.target && e.target.id !== 't15-open' && e.target.id !== 'open' && /^( |PageUp|PageDown|Home|End|ArrowUp|ArrowDown)$/.test(e.key)) {
      e.preventDefault();
    }
  }
  window.addEventListener('keydown', onKeydown, true);

  function onScroll() {
    if (locked && stage && stage.scrollTop > 0) {
      stage.scrollTop = 0;
    }
  }
  if (stage) stage.addEventListener('scroll', onScroll);

  function burst(x, y, n, h) {
    const d = window.devicePixelRatio || 1;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * 6.283;
      const s = (1.5 + Math.random() * 4.5) * d;
      P.push({
        x: x, y: y,
        vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        g: 0.06 * d, l: 1,
        d: 0.012 + Math.random() * 0.01,
        h: h, r: 2.2
      });
    }
  }

  function glit() {
    if (!fx) return;
    const d = window.devicePixelRatio || 1;
    P.push({
      x: Math.random() * fx.width,
      y: fx.height * (0.3 + Math.random() * 0.6),
      vx: (Math.random() - 0.5) * 0.6 * d,
      vy: -(0.4 + Math.random()) * d,
      g: 0, l: 1, d: 0.01, h: 45, r: 1.8
    });
  }

  function loop() {
    if (!fc || !fx) return;
    fc.clearRect(0, 0, fx.width, fx.height);
    fc.globalCompositeOperation = 'lighter';
    if (run) { glit(); glit(); }
    P = P.filter(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.l -= p.d;
      if (p.l <= 0) return false;
      fc.fillStyle = 'hsla(' + p.h + ',100%,62%,' + p.l + ')';
      fc.beginPath();
      fc.arc(p.x, p.y, p.r * (window.devicePixelRatio || 1) * p.l + 0.3, 0, 7);
      fc.fill();
      return true;
    });
    if (run || P.length) animId = requestAnimationFrame(loop);
  }

  function pataka() {
    const fl = el('t15-flash') || el('flash');
    if (fl && fl.animate) fl.animate([{ opacity: 0 }, { opacity: 0.75 }, { opacity: 0 }], { duration: 240 });
    if (p1 && p1.animate) p1.animate([
      { transform: 'translate(0,0)' },
      { transform: 'translate(-5px,3px)' },
      { transform: 'translate(4px,-3px)' },
      { transform: 'translate(0,0)' }
    ], { duration: 240 });
    if (fx) burst(fx.width * (0.2 + Math.random() * 0.6), fx.height * (0.25 + Math.random() * 0.3), 30, 30 + Math.random() * 30);
  }

  // Open Button Handler
  const openBtn = el('t15-open') || el('open');
  if (openBtn) {
    openBtn.onclick = function() {
      if (!locked || this.disabled) return;
      this.disabled = true;

      const g = el('t15-glow') || el('glow');
      if (g) {
        g.style.background = (L.lamps && L.lamps.length)
          ? L.lamps.map(a => `radial-gradient(circle at ${a[0]}% ${a[1]}%,rgba(255,190,90,.55),transparent 18%)`).join(',')
          : 'radial-gradient(circle at 50% 40%,rgba(255,200,110,.35),transparent 60%)';
      }

      const gb = el('t15-gb') || el('gb');
      if (gb) gb.classList.add('out');

      /* 600ms: lights ON + particle loop starts */
      timeouts.push(setTimeout(() => {
        if (p1) {
          p1.classList.add('lit');
          p1.classList.add('t15-lit');
        }
        if (g) g.style.opacity = '1';
        if (fx) sizeCanvas(fx);
        run = true;
        loop();
      }, 600));

      /* 1500ms: curtains part */
      timeouts.push(setTimeout(() => {
        if (p1) {
          p1.classList.add('opened');
          p1.classList.add('t15-opened');
        }
      }, 1500));

      /* Staggered bursts & patakas */
      [1800, 2300, 2900, 3500, 4100, 4600].forEach((t, i) => {
        timeouts.push(setTimeout(() => {
          if (!fx) return;
          i % 2 ? pataka() : burst(fx.width * (0.2 + Math.random() * 0.6), fx.height * (0.2 + Math.random() * 0.35), 60, [45, 350, 35][i % 3]);
        }, t));
      });

      /* 5400ms: UNLOCK ONLY AFTER FULL ANIMATION FINISHES */
      timeouts.push(setTimeout(() => {
        run = false;
        locked = false;
        if (stage) stage.classList.remove('locked');
        ds.forEach(i => {
          const elem = el(i);
          if (elem) elem.inert = false;
        });
        const p2 = el('t15-p2') || el('p2');
        if (p2 && p2.scrollIntoView) {
          p2.scrollIntoView({ behavior: 'smooth' });
        }
      }, 5400));
    };
  }

  // Page 3: Scratch Canvas & Countdown
  const sc = el('t15-sc');
  const scx = sc ? sc.getContext('2d') : null;
  let done = false;
  let scratchMoves = 0;
  let isDown = false;

  function paintScratch() {
    if (!sc || !scx) return;
    sizeCanvas(sc);
    const grad = scx.createLinearGradient(0, 0, sc.width, sc.height);
    grad.addColorStop(0, '#8a6a2a');
    grad.addColorStop(0.5, '#f3d9a0');
    grad.addColorStop(1, '#8a6a2a');
    scx.fillStyle = grad;
    scx.fillRect(0, 0, sc.width, sc.height);
    scx.fillStyle = '#5a1020';
    scx.font = `600 ${Math.round(sc.height * 0.17)}px 'Cinzel', Georgia, serif`;
    scx.textAlign = 'center';
    scx.textBaseline = 'middle';
    scx.fillText('SCRATCH HERE', sc.width / 2, sc.height / 2);
  }

  function scr(e) {
    if (done || !sc || !scx) return;
    const r = sc.getBoundingClientRect();
    const k = sc.width / r.width;
    scx.globalCompositeOperation = 'destination-out';
    scx.beginPath();
    scx.arc((e.clientX - r.left) * k, (e.clientY - r.top) * k, sc.height * 0.14, 0, Math.PI * 2);
    scx.fill();
    if (++scratchMoves % 7 === 0) {
      try {
        const d = scx.getImageData(0, 0, sc.width, sc.height).data;
        let cleared = 0;
        let total = 0;
        for (let i = 3; i < d.length; i += 160) {
          total++;
          if (!d[i]) cleared++;
        }
        if (cleared / total > 0.45) finishScratch();
      } catch (_) {
        finishScratch();
      }
    }
  }

  function finishScratch() {
    if (done) return;
    done = true;
    if (sc) {
      sc.style.opacity = '0';
      sc.style.pointerEvents = 'none';
    }
    const saveBtn = el('t15-save');
    if (saveBtn) saveBtn.hidden = false;
    burstStars();
  }

  function burstStars() {
    const p3 = el('t15-p3');
    const box = p3 ? p3.querySelector('.t15-reveal-box') : null;
    if (!box) return;
    for (let i = 0; i < 18; i++) {
      const s = document.createElement('i');
      s.style.cssText = 'position:absolute;left:50%;top:50%;width:1.4cqw;height:1.4cqw;background:#f3d9a0;border-radius:50%;z-index:5;pointer-events:none;';
      box.appendChild(s);
      const angle = (Math.PI * 2 * i) / 18;
      const dist = 15 + Math.random() * 25;
      const tx = Math.cos(angle) * dist;
      const ty = Math.sin(angle) * dist;
      s.animate([
        { transform: 'translate(0, 0) scale(1)', opacity: 1 },
        { transform: `translate(${tx}cqw, ${ty}cqw) scale(0)`, opacity: 0 }
      ], {
        duration: 1100 + Math.random() * 400,
        easing: 'cubic-bezier(0.2, 0.8, 0.4, 1)'
      }).onfinish = () => s.remove();
    }
  }

  if (sc) {
    paintScratch();
    sc.addEventListener('pointerdown', e => {
      isDown = true;
      try { sc.setPointerCapture(e.pointerId); } catch (_) {}
      scr(e);
    });
    sc.addEventListener('pointermove', e => { if (isDown) scr(e); });
    sc.addEventListener('pointerup', () => { isDown = false; });
    sc.addEventListener('pointercancel', () => { isDown = false; });
  }

  // Countdown Timer
  const rawDateStr = clean(wedding.date || wedding.event_date || '2026-11-28');
  const rawTime = clean(wedding.time || wedding.ceremony_time || '19:00');
  let targetDate = new Date(`${rawDateStr}T${rawTime}:00`);
  if (isNaN(targetDate.getTime())) targetDate = new Date(`${rawDateStr}`);
  let cdInterval = null;

  function updateCountdown() {
    const diff = Math.max(0, targetDate.getTime() - Date.now());
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
    const mins = Math.floor((diff / (1000 * 60)) % 60);
    const secs = Math.floor((diff / 1000) % 60);

    const dEl = el('t15-cd-d');
    const hEl = el('t15-cd-h');
    const mEl = el('t15-cd-m');
    const sEl = el('t15-cd-s');

    if (dEl) dEl.textContent = String(days).padStart(2, '0');
    if (hEl) hEl.textContent = String(hours).padStart(2, '0');
    if (mEl) mEl.textContent = String(mins).padStart(2, '0');
    if (sEl) sEl.textContent = String(secs).padStart(2, '0');
  }

  updateCountdown();
  cdInterval = setInterval(updateCountdown, 1000);

  // Save to Calendar (.ics download)
  const saveBtn = el('t15-save');
  if (saveBtn) {
    saveBtn.onclick = function() {
      const pad = n => String(n).padStart(2, '0');
      const d = isNaN(targetDate.getTime()) ? new Date('2026-11-28T19:00:00') : targetDate;
      const endD = new Date(d.getTime() + 4 * 60 * 60 * 1000);
      const f = dt => dt.getUTCFullYear() + pad(dt.getUTCMonth() + 1) + pad(dt.getUTCDate()) + 'T' + pad(dt.getUTCHours()) + pad(dt.getUTCMinutes()) + '00Z';
      const venueAddr = clean(wedding.venue_address || wedding.address || wedding.venue || '');
      const icsData = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'PRODID:-//PrimeEcard//Wedding Invitation//EN',
        'BEGIN:VEVENT',
        `DTSTART:${f(d)}`,
        `DTEND:${f(endD)}`,
        `SUMMARY:Wedding of ${groomName} & ${brideName}`,
        `DESCRIPTION:Auspicious wedding ceremony of ${groomName} and ${brideName}.`,
        `LOCATION:${venueAddr}`,
        'END:VEVENT',
        'END:VCALENDAR'
      ].join('\r\n');

      const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `Wedding-${groomName}-${brideName}.ics`;
      link.click();
      URL.revokeObjectURL(link.href);
    };
  }

  // Page 4: Intersection Observer for Event Cards
  const cards = root.querySelectorAll('.t15-card');
  const cardObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        cards.forEach(c => c.classList.add('in'));
      }
    });
  }, { threshold: 0.35 });

  const p4 = el('t15-p4');
  if (p4) cardObserver.observe(p4);

  // Page 5: Falling Flower Petals Canvas
  const petCanvas = el('t15-pet');
  let petCtx = petCanvas ? petCanvas.getContext('2d') : null;
  let petals = [];
  let isPetalActive = false;
  let petAnimId = null;

  function fallPetals() {
    if (!isPetalActive || !petCtx) return;
    sizeCanvas(petCanvas);
    petCtx.clearRect(0, 0, petCanvas.width, petCanvas.height);
    const dpr = window.devicePixelRatio || 1;
    if (petals.length < 24) {
      petals.push({
        x: Math.random() * petCanvas.width,
        y: -20,
        r: Math.random() * 6,
        s: (1.2 + Math.random() * 1.5) * dpr,
        w: Math.random() * 6
      });
    }
    petals = petals.filter(p => {
      p.y += p.s;
      p.r += 0.035;
      p.x += Math.sin(p.y / 35 + p.w) * 0.9 * dpr;
      petCtx.save();
      petCtx.translate(p.x, p.y);
      petCtx.rotate(p.r);
      petCtx.fillStyle = 'rgba(190, 50, 80, 0.72)';
      petCtx.beginPath();
      petCtx.ellipse(0, 0, 7.5 * dpr, 3.8 * dpr, 0, 0, Math.PI * 2);
      petCtx.fill();
      petCtx.restore();
      return p.y < petCanvas.height + 25;
    });
    petAnimId = requestAnimationFrame(fallPetals);
  }

  const p5 = el('t15-p5');
  const petObserver = new IntersectionObserver(entries => {
    const isVis = entries[0] && entries[0].isIntersecting;
    if (isVis && !isPetalActive && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      isPetalActive = true;
      fallPetals();
    } else if (!isVis) {
      isPetalActive = false;
      if (petAnimId) cancelAnimationFrame(petAnimId);
    }
  }, { threshold: 0.35 });

  if (p5) petObserver.observe(p5);

  // Cleanup Function
  return function cleanup() {
    timeouts.forEach(t => clearTimeout(t));
    window.removeEventListener('resize', layoutCover);
    window.removeEventListener('keydown', onKeydown, true);
    scrollEvents.forEach(evt => {
      document.removeEventListener(evt, stopScroll);
      window.removeEventListener(evt, stopScroll);
      if (stage) stage.removeEventListener(evt, stopScroll);
    });
    if (stage) stage.removeEventListener('scroll', onScroll);
    if (animId) cancelAnimationFrame(animId);
    if (petAnimId) cancelAnimationFrame(petAnimId);
    if (cdInterval) clearInterval(cdInterval);
    cardObserver.disconnect();
    petObserver.disconnect();
  };
}

export const initTemplate15 = mount;
