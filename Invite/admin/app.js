import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { ONBOARDING_CONFIG } from '../onboarding-config.js';
import { formatINR } from '../onboarding-core.js';

/* Security model
 * - Identity: Supabase Auth (email + password), then TOTP authenticator code (MFA -> JWT claim aal2).
 * - Authority: enforced in the database (admin-security.sql).
 * - Multi-Admin Audit: tracked per action (verified_by, action_by).
 * - Kill-Switch: activates/deactivates live guest card URLs.
 */

const SUPABASE_URL = ONBOARDING_CONFIG.supabaseUrl
  || (ONBOARDING_CONFIG.verifyPaymentEndpoint ? ONBOARDING_CONFIG.verifyPaymentEndpoint.split('/functions/')[0] : 'https://skpcxbdrmsnwmggjodkz.supabase.co');
const IDLE_MS = 15 * 60 * 1000;
const MAX_PASSWORD_TRIES = 5;
const MAX_CODE_TRIES = 5;
const LOCK_MS = 60 * 1000;

try { sessionStorage.removeItem('wedding-admin-access-token'); } catch (e) { /* ignore */ }

const sb = createClient(SUPABASE_URL, ONBOARDING_CONFIG.publishableKey, {
  auth: {
    storage: window.sessionStorage,
    storageKey: 'wedding-admin-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false
  }
});

const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const digitsOnly = value => String(value || '').replace(/\D/g, '').slice(0, 6);

function formatISTDateTime(isoString) {
  if (!isoString) return '—';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(d);
  } catch (_) {
    return '—';
  }
}

function formatTemplateNumber(styleCode) {
  if (!styleCode) return 'Template #01';
  const raw = String(styleCode).trim();
  const match = raw.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    return `Template #${num < 10 ? '0' + num : num}`;
  }
  return `Template #${raw}`;
}

const formatTemplateLabel = formatTemplateNumber;

function calculateExpiryInfo(activatedIso, expiresIso) {
  if (!activatedIso && !expiresIso) {
    return {
      isActivated: false,
      formattedDate: '',
      daysLeft: 0,
      isExpired: false,
      badgeHtml: ''
    };
  }

  try {
    const activatedDate = activatedIso ? new Date(activatedIso) : null;
    let expiresDate = expiresIso ? new Date(expiresIso) : null;

    if (!expiresDate && activatedDate && !isNaN(activatedDate.getTime())) {
      expiresDate = new Date(activatedDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    }

    if (!expiresDate || isNaN(expiresDate.getTime())) {
      return {
        isActivated: false,
        formattedDate: '',
        daysLeft: 0,
        isExpired: false,
        badgeHtml: ''
      };
    }

    const formattedDate = new Intl.DateTimeFormat('en-IN', {
      timeZone: 'Asia/Kolkata',
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(expiresDate);

    const now = new Date();
    const diffMs = expiresDate.getTime() - now.getTime();
    const daysLeft = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (daysLeft <= 0) {
      return {
        isActivated: true,
        formattedDate,
        daysLeft: 0,
        isExpired: true,
        badgeHtml: '<span class="badge-expiry-expired">Expired</span>'
      };
    }

    return {
      isActivated: true,
      formattedDate,
      daysLeft,
      isExpired: false,
      badgeHtml: `<span class="badge-expiry-active">${daysLeft} days left</span>`
    };
  } catch (_) {
    return {
      isActivated: false,
      formattedDate: '',
      daysLeft: 0,
      isExpired: false,
      badgeHtml: ''
    };
  }
}

const getStoredInt = (k, def = 0) => {
  try {
    const val = Number(sessionStorage.getItem(k));
    return Number.isFinite(val) ? val : def;
  } catch { return def; }
};
const setStoredInt = (k, val) => {
  try { sessionStorage.setItem(k, String(val)); } catch {}
};

let payments = [];
let cashRequests = [];
let adminPackages = [];
let adminPromos = [];
let enrollFactorId = '';
let passwordFails = getStoredInt('wedding-admin-pwd-fails', 0);
let codeFails = getStoredInt('wedding-admin-code-fails', 0);
let lockedUntil = getStoredInt('wedding-admin-lock-until', 0);
let idleTimer = null;
let idleActive = false;
let currentFilter = 'pending';
let searchQuery = '';

/* ───────────── views ───────────── */

const AUTH_VIEWS = ['password', 'mfa', 'enroll', 'denied'];

function showView(name) {
  document.body.dataset.view = name;
  $('view-boot').hidden = name !== 'boot';
  $('auth-card').hidden = !AUTH_VIEWS.includes(name);
  for (const v of AUTH_VIEWS) $('view-' + v).hidden = v !== name;
  $('view-console').hidden = name !== 'console';
  const signedIn = ['mfa', 'enroll', 'denied', 'console'].includes(name);
  $('session-bar').hidden = !signedIn;
  $('staff-label').hidden = signedIn;
  $('aal-badge').hidden = name !== 'console';
  $('stepper').dataset.step = name === 'password' ? '1' : '2';
  const focusTarget = { password: 'view-password', mfa: 'mfa-code', enroll: 'enroll-code' }[name];
  if (focusTarget) {
    const el = $(focusTarget);
    (el.matches('input') ? el : el.querySelector('input'))?.focus();
  }
}

function setMsg(id, text, kind = 'error') {
  const el = $(id);
  if (!el) return;
  el.textContent = text || '';
  el.dataset.kind = kind;
}

let toastTimer;
function toast(message) {
  const el = $('toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 3000);
}

function showError(message) {
  const box = $('admin-error');
  box.textContent = message;
  box.hidden = !message;
}

function wipeConsole() {
  payments = [];
  cashRequests = [];
  adminPackages = [];
  adminPromos = [];
  $('payment-queue').replaceChildren();
  $('cash-request-queue').replaceChildren();
  $('stats').replaceChildren();
  $('package-pricing-cards')?.replaceChildren();
  $('promo-table-body')?.replaceChildren();
  showError('');
}

/* ───────────── idle timeout ───────────── */

function bumpIdle() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => forceSignOut('You were signed out after 15 minutes of inactivity.'), IDLE_MS);
}
function startIdle() { idleActive = true; bumpIdle(); }
function stopIdle() { idleActive = false; clearTimeout(idleTimer); }
for (const eventName of ['pointerdown', 'keydown', 'touchstart', 'scroll']) {
  window.addEventListener(eventName, () => { if (idleActive) bumpIdle(); }, { passive: true });
}

async function forceSignOut(message) {
  stopIdle();
  wipeConsole();
  try { await sb.auth.signOut(); } catch (e) { /* session may already be gone */ }
  setMsg('login-message', message || '', 'info');
  showView('password');
}

/* ───────────── routing ───────────── */

async function route() {
  try {
    const { data: { session } } = await sb.auth.getSession();
    if (!session) { stopIdle(); wipeConsole(); return showView('password'); }
    $('session-email').textContent = session.user.email || '';

    const { data: who, error: whoError } = await sb.rpc('admin_whoami');
    if (whoError) {
      const missing = whoError.code === 'PGRST202' || /admin_whoami/i.test(whoError.message || '');
      throw new Error(missing ? 'setup' : 'whoami');
    }
    if (!who || !who.is_admin) { stopIdle(); wipeConsole(); return showView('denied'); }

    startIdle();
    const { data: aal, error: aalError } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aalError) throw aalError;
    if (aal.currentLevel === 'aal2') return openConsole();
    if (aal.nextLevel === 'aal2') return showView('mfa');
    return beginEnrollment();
  } catch (error) {
    console.error('Admin route error:', error);
    const text = error && error.message === 'setup'
      ? 'Server security is not installed yet. Run admin-security.sql in Supabase, then reload.'
      : 'We could not verify your session. Please sign in again.';
    await forceSignOut(text);
  }
}

/* ───────────── step 1: password ───────────── */

$('view-password').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type=submit]');
  const wait = Math.ceil((lockedUntil - Date.now()) / 1000);
  if (wait > 0) return setMsg('login-message', 'Too many attempts. Try again in ' + wait + ' seconds.');

  const values = new FormData(form);
  const email = String(values.get('email') || '').trim();
  const password = String(values.get('password') || '');
  form.elements.password.value = '';
  if (!email || !password) return setMsg('login-message', 'Enter your email and password.');

  button.disabled = true;
  setMsg('login-message', 'Signing in…', 'info');
  const { error } = await sb.auth.signInWithPassword({ email, password });
  button.disabled = false;

  if (error) {
    passwordFails += 1;
    setStoredInt('wedding-admin-pwd-fails', passwordFails);
    if (passwordFails >= MAX_PASSWORD_TRIES || error.status === 429) {
      lockedUntil = Date.now() + LOCK_MS;
      passwordFails = 0;
      setStoredInt('wedding-admin-lock-until', lockedUntil);
      setStoredInt('wedding-admin-pwd-fails', 0);
      return setMsg('login-message', 'Too many attempts. Please wait a minute and try again.');
    }
    return setMsg('login-message', 'Incorrect email or password.');
  }
  passwordFails = 0;
  setStoredInt('wedding-admin-pwd-fails', 0);
  setStoredInt('wedding-admin-lock-until', 0);
  setMsg('login-message', '');
  await route();
});

$('pw-toggle').addEventListener('click', event => {
  const input = $('pw');
  const show = input.type === 'password';
  input.type = show ? 'text' : 'password';
  event.currentTarget.textContent = show ? 'Hide' : 'Show';
  event.currentTarget.setAttribute('aria-pressed', String(show));
});

/* ───────────── step 2a: verify code ───────────── */

function wireCodeInput(inputId, formId) {
  const input = $(inputId);
  input.addEventListener('input', () => {
    input.value = digitsOnly(input.value);
    if (input.value.length === 6) $(formId).requestSubmit();
  });
}
wireCodeInput('mfa-code', 'view-mfa');
wireCodeInput('enroll-code', 'view-enroll');

$('view-mfa').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type=submit]');
  const code = digitsOnly(form.elements.code.value);
  if (code.length !== 6) return setMsg('mfa-message', 'Enter the 6-digit code.');
  button.disabled = true;
  setMsg('mfa-message', 'Checking…', 'info');
  try {
    const { data: factors, error: listError } = await sb.auth.mfa.listFactors();
    if (listError) throw listError;
    const factor = factors && factors.totp && factors.totp[0];
    if (!factor) { setMsg('mfa-message', ''); return await route(); }
    const { data: verifyData, error } = await sb.auth.mfa.challengeAndVerify({ factorId: factor.id, code });
    if (error) {
      codeFails += 1;
      setStoredInt('wedding-admin-code-fails', codeFails);
      form.elements.code.value = '';
      if (codeFails >= MAX_CODE_TRIES) {
        codeFails = 0;
        setStoredInt('wedding-admin-code-fails', 0);
        return await forceSignOut('Too many incorrect codes. Please sign in again.');
      }
      return setMsg('mfa-message', 'That code is incorrect or has expired. Check your app and try again.');
    }
    if (verifyData && verifyData.session) {
      try { await sb.auth.setSession(verifyData.session); } catch (_) {}
    }
    codeFails = 0;
    setStoredInt('wedding-admin-code-fails', 0);
    form.elements.code.value = '';
    setMsg('mfa-message', '');
    await route();
  } catch (error) {
    console.error(error);
    setMsg('mfa-message', 'Could not verify the code right now. Please try again.');
  } finally {
    button.disabled = false;
  }
});

/* ───────────── step 2b: enroll ───────────── */

async function beginEnrollment() {
  showView('enroll');
  $('enroll-secret').textContent = 'Preparing…';
  $('enroll-qr').removeAttribute('src');
  setMsg('enroll-message', '');
  try {
    const { data: list } = await sb.auth.mfa.listFactors();
    for (const factor of (list && list.all) || []) {
      if (factor.factor_type === 'totp' && factor.status === 'unverified') await sb.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data, error } = await sb.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName: 'Admin app ' + Math.random().toString(36).slice(2, 8)
    });
    if (error) throw error;
    enrollFactorId = data.id;
    $('enroll-qr').src = data.totp.qr_code;
    $('enroll-secret').textContent = String(data.totp.secret || '').replace(/(.{4})/g, '$1 ').trim();
  } catch (error) {
    console.error(error);
    $('enroll-secret').textContent = '—';
    setMsg('enroll-message', 'Could not start setup. Reload the page and try again.');
  }
}

$('copy-secret').addEventListener('click', async () => {
  try { await navigator.clipboard.writeText($('enroll-secret').textContent.replace(/\s/g, '')); toast('Key copied'); }
  catch { toast('Could not copy. Select the key and copy it manually.'); }
});

$('view-enroll').addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const button = form.querySelector('[type=submit]');
  const code = digitsOnly(form.elements.code.value);
  if (!enrollFactorId) return setMsg('enroll-message', 'Setup is not ready. Reload the page and try again.');
  if (code.length !== 6) return setMsg('enroll-message', 'Enter the 6-digit code from your app.');
  button.disabled = true;
  setMsg('enroll-message', 'Checking…', 'info');
  const { error } = await sb.auth.mfa.challengeAndVerify({ factorId: enrollFactorId, code });
  button.disabled = false;
  if (error) {
    form.elements.code.value = '';
    return setMsg('enroll-message', 'That code did not match. Wait for the next code in your app and try again.');
  }
  enrollFactorId = '';
  form.elements.code.value = '';
  setMsg('enroll-message', '');
  toast('Two-step verification is now on');
  await route();
});

for (const el of document.querySelectorAll('[data-signout]')) el.addEventListener('click', () => forceSignOut(''));
$('signout').addEventListener('click', () => forceSignOut(''));

sb.auth.onAuthStateChange(event => {
  if (event === 'SIGNED_OUT') { stopIdle(); wipeConsole(); showView('password'); }
});

/* ───────────── admin calls ───────────── */

async function callAdmin(action, payload = {}) {
  const { data, error } = await sb.rpc('manage_admin_portal', { p_action: action, p_payload: payload });
  if (error) {
    if (error.code === 'PGRST301' || /jwt/i.test(error.message || '')) {
      await forceSignOut('Your session expired. Please sign in again.');
      throw new Error('Session expired.');
    }
    throw new Error(error.message || 'Administrator request failed.');
  }
  if (!data || data.success !== true) {
    if (data && data.code === 'unauthenticated') {
      await forceSignOut('Your session expired. Please sign in again.');
      throw new Error('Session expired.');
    }
    if (data && data.code === 'not_authorised') {
      showView('denied');
      stopIdle();
      wipeConsole();
      throw new Error(data.error || 'Administrator access required.');
    }
    if (data && data.code === 'mfa_required') {
      showView('mfa');
      throw new Error('MFA verification required.');
    }
    throw new Error((data && (data.error || data.message)) || 'Administrator request failed.');
  }
  return data;
}

function confirmAction({ title, body, confirmLabel, danger = false }) {
  return new Promise(resolve => {
    const dialog = $('confirm-dialog');
    $('confirm-title').textContent = title;
    $('confirm-body').textContent = body;
    const ok = $('confirm-ok');
    ok.textContent = confirmLabel;
    ok.classList.toggle('button-danger', danger);
    ok.classList.toggle('button-primary', !danger);
    dialog.returnValue = '';
    dialog.addEventListener('close', () => resolve(dialog.returnValue === 'ok'), { once: true });
    dialog.showModal();
  });
}

/* ───────────── console ───────────── */

let isOpeningConsole = false;
async function openConsole() {
  if (isOpeningConsole) return;
  isOpeningConsole = true;
  showView('console');
  try {
    await Promise.allSettled([
      renderQueue(),
      loadPricingConfig()
    ]);
  } catch (error) {
    showError(error.message);
  } finally {
    isOpeningConsole = false;
  }
}

async function renderQueue() {
  showError('');
  const [queueRes, cashRes] = await Promise.allSettled([
    callAdmin('list', { action: 'list' }),
    callAdmin('list_cash_requests', { action: 'list_cash_requests' })
  ]);

  if (queueRes.status === 'fulfilled') {
    payments = queueRes.value.payments || [];
  } else {
    showError(queueRes.reason?.message || 'Failed to load payment queue.');
  }

  if (cashRes.status === 'fulfilled') {
    cashRequests = cashRes.value.cash_requests || [];
  }

  renderStats();
  renderPayments();
  renderCashRequests();
}

function renderStats() {
  const claimed = payments.reduce((sum, p) => sum + (Number(p.claimed_amount_paise) || 0), 0);
  const expected = payments.reduce((sum, p) => sum + (Number(p.expected_amount_paise) || 0), 0);
  const fresh = cashRequests.filter(r => r.status === 'New').length;
  const tiles = [
    ['Awaiting review', String(payments.filter(p => (p.payment_status || '').toLowerCase().includes('pending')).length), 'pending claims', 'warn'],
    ['Claimed total', formatINR(claimed), 'across all orders', ''],
    ['Expected total', formatINR(expected), 'advance due', ''],
    ['New cash requests', String(fresh), fresh ? 'need a call' : 'none waiting', fresh ? 'warn' : 'ok']
  ];
  $('stats').innerHTML = tiles.map(t => '<article class="stat ' + t[3] + '"><small>' + escapeHtml(t[0]) + '</small><strong>' + escapeHtml(t[1]) + '</strong><span>' + escapeHtml(t[2]) + '</span></article>').join('');
}

function renderPayments() {
  const host = $('payment-queue');
  if (!host) return;

  const counts = {
    pending: 0,
    verified: 0,
    rejected: 0,
    suspended: 0,
    all: payments.length
  };

  payments.forEach(p => {
    const pStatus = (p.payment_status || '').toLowerCase();
    const cStatus = (p.card_status || 'Active').toLowerCase();

    if (cStatus === 'suspended') counts.suspended++;
    if (pStatus.includes('pending')) counts.pending++;
    else if (pStatus.includes('verified')) counts.verified++;
    else if (pStatus.includes('rejected')) counts.rejected++;
  });

  if ($('count-pending')) $('count-pending').textContent = counts.pending;
  if ($('count-verified')) $('count-verified').textContent = counts.verified;
  if ($('count-rejected')) $('count-rejected').textContent = counts.rejected;
  if ($('count-suspended')) $('count-suspended').textContent = counts.suspended;
  if ($('count-all')) $('count-all').textContent = counts.all;

  const filtered = payments.filter(payment => {
    const pStatus = (payment.payment_status || '').toLowerCase();
    const cStatus = (payment.card_status || 'Active').toLowerCase();

    let tabMatch = true;
    if (currentFilter === 'pending') tabMatch = pStatus.includes('pending');
    else if (currentFilter === 'verified') tabMatch = pStatus.includes('verified');
    else if (currentFilter === 'rejected') tabMatch = pStatus.includes('rejected');
    else if (currentFilter === 'suspended') tabMatch = (cStatus === 'suspended');

    if (!tabMatch) return false;

    if (searchQuery) {
      const matchTarget = `${payment.order_reference} ${payment.customer_name} ${payment.customer_phone} ${payment.couple_name}`.toLowerCase();
      return matchTarget.includes(searchQuery);
    }

    return true;
  });

  if (!filtered.length) {
    host.innerHTML = `<div class="empty"><strong>No records found.</strong><span>No data matching the current filter.</span></div>`;
    return;
  }

  host.innerHTML = filtered.map(payment => {
    const isVerified = (payment.payment_status || '').toLowerCase().includes('verified');
    const isRejected = (payment.payment_status || '').toLowerCase().includes('rejected');
    const isPending = !isVerified && !isRejected;
    const isCardSuspended = (payment.card_status || 'Active') === 'Suspended';
    const mismatch = Number(payment.claimed_amount_paise) !== Number(payment.expected_amount_paise);

    let auditHtml = '';
    if (payment.verified_by) {
      const dateStr = payment.verified_at ? new Date(payment.verified_at).toLocaleString() : '';
      auditHtml = `
        <div class="audit-stamp">
          <b>Action by Admin:</b> ${escapeHtml(payment.verified_by)} <br>
          <small><b>Timestamp:</b> ${escapeHtml(dateStr)}</small>
          ${payment.rejection_reason ? `<br><small class="rejection-reason-text"><b>Rejection reason:</b> ${escapeHtml(payment.rejection_reason)}</small>` : ''}
        </div>
      `;
    }

    const publicUrl = new URL('?code=' + encodeURIComponent(payment.preview_guest_code || ''), new URL('../', location.href)).href;

    const hasCity = Boolean(payment.city && payment.city !== '—' && payment.city.trim() !== '');
    const coupleText = [payment.couple_name, payment.event_date].filter(Boolean).join(' · ');
    const customerText = [payment.customer_name, payment.customer_phone].filter(Boolean).join(' · ');
    const templateText = formatTemplateNumber(payment.template_style || payment.template_id || payment.template_number);
    const activatedTimestamp = payment.activated_at || (isVerified ? payment.verified_at : null);
    const bookingDateTimeText = activatedTimestamp ? formatISTDateTime(activatedTimestamp) : 'Pending Verification';
    const expiryInfo = calculateExpiryInfo(activatedTimestamp, payment.expires_at);

    return `
      <article class="payment-card" data-payment="${escapeHtml(payment.payment_id)}">
        <!-- Top Header: Order ID (Left) + Status Badge (Right) on same line -->
        <div class="payment-card-head">
          <div class="head-left">
            <h3 class="order-id">${escapeHtml(payment.order_reference)}</h3>
            <p class="order-subtext">${escapeHtml(payment.payment_status)} · ${escapeHtml(payment.payment_mode || 'UPI')}</p>
          </div>
          <button type="button" 
                  class="status-badge ${isCardSuspended ? 'is-suspended' : 'is-active'}" 
                  data-toggle-card="${escapeHtml(payment.order_reference)}" 
                  data-next-state="${isCardSuspended ? 'Active' : 'Suspended'}"
                  title="Click to toggle URL status">
            <span class="status-dot"></span>
            ${isCardSuspended ? 'Suspended' : 'Live &amp; Active'}
          </button>
        </div>

        ${mismatch && isPending ? `
          <div class="mismatch-banner">
            Claimed amount differs from expected advance of ${formatINR(payment.expected_amount_paise)}.
          </div>
        ` : ''}

        <!-- Middle Section: Compact 2-Column Metadata Grid -->
        <div class="card-grid">
          <div class="grid-cell">
            <span class="cell-label">Couple &amp; Date</span>
            <span class="cell-value">${escapeHtml(coupleText || '—')}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Package</span>
            <span class="cell-value capitalize">${escapeHtml(payment.package || 'Standard')}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Selected Template</span>
            <span class="cell-value"><strong class="template-pill-tag">${escapeHtml(templateText)}</strong></span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Customer</span>
            <span class="cell-value">${escapeHtml(customerText || '—')}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Booking Date &amp; Time</span>
            <span class="cell-value">${activatedTimestamp ? escapeHtml(bookingDateTimeText) : '<span class="text-muted">Pending Verification</span>'}</span>
          </div>

          <div class="grid-cell">
            <span class="cell-label">Card Expiry (90 Days)</span>
            <span class="cell-value">${expiryInfo.isActivated ? `${escapeHtml(expiryInfo.formattedDate)} ${expiryInfo.badgeHtml}` : '<span class="text-muted">Starts upon activation</span>'}</span>
          </div>

          ${hasCity ? `
            <div class="grid-cell">
              <span class="cell-label">City</span>
              <span class="cell-value">${escapeHtml(payment.city)}</span>
            </div>
          ` : ''}

          <div class="grid-cell col-left">
            <span class="cell-label">Claimed / Expected</span>
            <span class="cell-value amount-combo">
              <strong class="${mismatch && isPending ? 'text-warn' : 'text-ok'}">${formatINR(payment.claimed_amount_paise)}</strong>
              <span class="text-expected"> / ${formatINR(payment.expected_amount_paise)}</span>
            </span>
          </div>

          <div class="grid-cell col-right preview-cell">
            <span class="cell-label">Invitation</span>
            <a href="${escapeHtml(publicUrl)}" target="_blank" rel="noopener noreferrer" class="preview-pill-btn">
              Preview Card ↗
            </a>
          </div>
        </div>

        ${auditHtml}

        ${isPending ? `
          <!-- Bottom Action Area -->
          <form class="card-action-form" data-review="${escapeHtml(payment.payment_id)}">
            <div class="verified-amount-wrap">
              <label class="amount-label" for="rupees-${escapeHtml(payment.payment_id)}">Verified amount (INR)</label>
              <div class="rupee-input-box">
                <span class="rupee-affix">₹</span>
                <input id="rupees-${escapeHtml(payment.payment_id)}" 
                       name="verified_rupees" 
                       type="number" 
                       min="0" 
                       step="0.01" 
                       value="${(Number(payment.expected_amount_paise) / 100).toFixed(2)}" 
                       required 
                       class="rupee-input">
              </div>
            </div>

            <!-- Side-by-side Primary & Secondary Actions -->
            <div class="action-btn-row">
              <button class="btn-verify" name="decision" value="verify" type="submit">
                <span class="btn-icon">✓</span> Verify &amp; Activate
              </button>
              <button class="btn-reject-toggle" type="button" data-toggle-reject>
                <span class="btn-icon">✕</span> Reject
              </button>
            </div>

            <!-- Progressive Disclosure: Expands only when Reject is clicked -->
            <div class="reject-drawer" hidden>
              <div class="reject-drawer-flex">
                <input name="rejection_reason" 
                       class="reject-reason-input" 
                       maxlength="500" 
                       placeholder="Enter rejection reason...">
                <button class="btn-reject-confirm" name="decision" value="reject" type="submit" formnovalidate>
                  Confirm ➔
                </button>
              </div>
            </div>
          </form>
        ` : `
          <div class="settled-status-bar">
            <span class="settled-label">Processed &amp; locked in ledger.</span>
            ${isVerified ? '<span class="settled-tag tag-verified">✓ Settlement Completed</span>' : ''}
            ${isRejected ? '<span class="settled-tag tag-rejected">✕ Claim Rejected</span>' : ''}
          </div>
        `}
      </article>
    `;
  }).join('');
}

function renderCashRequests() {
  const host = $('cash-request-queue');
  if (!cashRequests.length) {
    host.innerHTML = '<div class="empty"><strong>No cash quote requests need follow-up.</strong></div>';
    return;
  }
  host.innerHTML = cashRequests.map(request => {
    const details = request.request_details || {};
    const id = escapeHtml(request.request_id);
    const hasCity = Boolean(request.city && request.city !== '—' && request.city.trim() !== '');
    const coupleText = [request.bride_name, request.groom_name].filter(Boolean).join(' & ');
    return `
      <article class="payment-card">
        <div class="payment-card-head">
          <div class="head-left">
            <h3 class="order-id">${escapeHtml(request.request_reference)}</h3>
            <p class="order-subtext">${escapeHtml(request.status)} · Manual quote request</p>
          </div>
        </div>
        <div class="card-grid">
          <div class="grid-cell">
            <span class="cell-label">Customer</span>
            <span class="cell-value">${escapeHtml(request.customer_name || '—')}</span>
          </div>
          <div class="grid-cell">
            <span class="cell-label">Phone</span>
            <span class="cell-value">${escapeHtml(request.phone || '—')}</span>
          </div>
          <div class="grid-cell">
            <span class="cell-label">Couple &amp; Date</span>
            <span class="cell-value">${escapeHtml(coupleText || '—')}${request.event_date ? ' · ' + escapeHtml(request.event_date) : ''}</span>
          </div>
          ${hasCity ? `
            <div class="grid-cell">
              <span class="cell-label">City</span>
              <span class="cell-value">${escapeHtml(request.city)}</span>
            </div>
          ` : ''}
          ${details.venue && details.venue !== '—' ? `
            <div class="grid-cell">
              <span class="cell-label">Venue</span>
              <span class="cell-value">${escapeHtml(details.venue)}</span>
            </div>
          ` : ''}
          <div class="grid-cell">
            <span class="cell-label">Received</span>
            <span class="cell-value">${escapeHtml(new Date(request.created_at).toLocaleDateString())}</span>
          </div>
        </div>
        <div class="request-actions">
          ${request.status === 'New' ? `<button class="button button-outline button-small" type="button" data-cash-status="Contacted" data-cash-request="${id}">Mark contacted</button>` : ''}
          <button class="button button-primary button-small" type="button" data-cash-status="Converted" data-cash-request="${id}">Mark converted</button>
          <button class="button button-outline button-small" type="button" data-cash-status="Closed" data-cash-request="${id}">Close request</button>
        </div>
      </article>
    `;
  }).join('');
}

/* ───────────── event handlers ───────────── */

$('payment-filter-tabs')?.addEventListener('click', event => {
  const btn = event.target.closest('[data-filter]');
  if (!btn) return;
  document.querySelectorAll('#payment-filter-tabs .chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  currentFilter = btn.dataset.filter;
  renderPayments();
});

$('admin-search-input')?.addEventListener('input', event => {
  searchQuery = event.target.value.trim().toLowerCase();
  renderPayments();
});

$('payment-queue').addEventListener('click', async event => {
  const rejectToggle = event.target.closest('[data-toggle-reject]');
  if (rejectToggle) {
    const card = rejectToggle.closest('.payment-card');
    const drawer = card ? card.querySelector('.reject-drawer') : null;
    if (drawer) {
      drawer.hidden = !drawer.hidden;
      if (!drawer.hidden) {
        const input = drawer.querySelector('input[name="rejection_reason"]');
        if (input) input.focus();
      }
    }
    return;
  }

  const toggleBtn = event.target.closest('[data-toggle-card]');
  if (!toggleBtn) return;

  const orderRef = toggleBtn.dataset.toggleCard;
  const nextState = toggleBtn.dataset.nextState;

  const ok = await confirmAction({
    title: `${nextState === 'Suspended' ? 'Deactivate' : 'Activate'} Invitation URL?`,
    body: nextState === 'Suspended'
      ? `Kya aap order ${orderRef} ka invitation URL temporarily suspend karna chahte hain? Guest link kholne par card inactive message show hoga.`
      : `Order ${orderRef} ke invitation card ko wapas Live aur active kar diya jayega.`,
    confirmLabel: nextState === 'Suspended' ? 'Yes, Disable URL' : 'Yes, Activate URL',
    danger: nextState === 'Suspended'
  });

  if (!ok) return;

  toggleBtn.disabled = true;
  toggleBtn.textContent = 'Updating...';

  try {
    await callAdmin('toggle_card_status', { customer_id: orderRef, status: nextState });
    toast(`Order ${orderRef} status set to ${nextState}`);
    await renderQueue();
  } catch (err) {
    showError(err.message);
    toggleBtn.disabled = false;
  }
});

$('payment-queue').addEventListener('submit', async event => {
  const form = event.target.closest('[data-review]');
  if (!form) return;
  event.preventDefault();
  const button = event.submitter;
  const decision = button && button.value;
  if (decision !== 'verify' && decision !== 'reject') return;
  const payment = payments.find(p => String(p.payment_id) === form.dataset.review);
  if (!payment) return;
  const values = new FormData(form);
  const reason = String(values.get('rejection_reason') || '').trim();
  const rupees = Number(values.get('verified_rupees'));

  if (decision === 'reject') {
    const finalReason = reason || 'Payment not verified';
    const ok = await confirmAction({
      title: 'Reject the claim for ' + payment.order_reference + '?',
      body: 'The customer’s card stays inactive. Reason: ' + finalReason,
      confirmLabel: 'Reject claim',
      danger: true
    });
    if (!ok) return;

    for (const b of form.querySelectorAll('button')) b.disabled = true;
    try {
      await callAdmin('verify_payment', {
        payment_id: form.dataset.review,
        decision: 'reject',
        verified_amount_paise: null,
        rejection_reason: finalReason
      });
      toast('Claim rejected.');
      await renderQueue();
    } catch (error) {
      showError(error.message);
      for (const b of form.querySelectorAll('button')) b.disabled = false;
    }
    return;
  }

  if (decision === 'verify') {
    if (!Number.isFinite(rupees) || rupees < 0) return showError('Enter a valid amount.');
    showError('');

    const paise = Math.round(rupees * 100);
    const differs = paise !== Number(payment.expected_amount_paise);
    const ok = await confirmAction({
      title: 'Verify ' + formatINR(paise) + ' for ' + payment.order_reference + '?',
      body: 'This records ' + formatINR(paise) + ' as received, activates the card, and logs your admin credentials in the audit ledger.' +
        (differs ? ' Note: this differs from expected advance of ' + formatINR(payment.expected_amount_paise) + '.' : ''),
      confirmLabel: 'Yes, verify and activate'
    });
    if (!ok) return;

    for (const b of form.querySelectorAll('button')) b.disabled = true;
    try {
      await callAdmin('verify_payment', {
        payment_id: form.dataset.review,
        decision: 'verify',
        verified_amount_paise: paise,
        rejection_reason: ''
      });
      toast('Payment verified. Card activated.');
      await renderQueue();
    } catch (error) {
      showError(error.message);
      for (const b of form.querySelectorAll('button')) b.disabled = false;
    }
  }
});

$('cash-request-queue').addEventListener('click', async event => {
  const button = event.target.closest('[data-cash-status]');
  if (!button) return;
  const status = button.dataset.cashStatus;
  if (status !== 'Contacted') {
    const ok = await confirmAction({
      title: status === 'Converted' ? 'Mark as converted?' : 'Close this request?',
      body: status === 'Converted' ? 'Use this once the customer has agreed a package and price.' : 'The request will leave the follow-up list.',
      confirmLabel: status === 'Converted' ? 'Yes, converted' : 'Close request',
      danger: status === 'Closed'
    });
    if (!ok) return;
  }
  button.disabled = true;
  showError('');
  try {
    await callAdmin('update_cash_request', { action: 'update_cash_request', request_id: button.dataset.cashRequest, status });
    toast('Request updated: ' + status);
    await renderQueue();
  } catch (error) {
    showError(error.message);
    button.disabled = false;
  }
});

$('refresh').addEventListener('click', async event => {
  const button = event.currentTarget;
  button.disabled = true;
  try { await renderQueue(); toast('Queue refreshed'); } catch (error) { showError(error.message); }
  button.disabled = false;
});

/* ───────────── Package Pricing & Promo Code Manager ───────────── */

async function loadPricingConfig() {
  const pError = $('pricing-error');
  if (pError) pError.hidden = true;
  try {
    const res = await callAdmin('get_pricing_config');
    adminPackages = (res && res.packages) || [];
    adminPromos = (res && res.promo_codes) || [];
  } catch (err) {
    console.warn('Live pricing config load failed, using fallback:', err);
    if (!adminPackages.length) {
      adminPackages = [
        {
          package_code: 'standard',
          display_name: 'Standard Package',
          list_price_paise: 400000,
          discount_paise: 100000,
          advance_paise: 150000,
          active: true
        },
        {
          package_code: 'premium',
          display_name: 'Royal Arch Premium',
          list_price_paise: 600000,
          discount_paise: 0,
          advance_paise: 300000,
          active: true
        }
      ];
    }
    if (!adminPromos.length) {
      adminPromos = [
        {
          code: 'NIKAH500',
          discount_type: 'FLAT',
          discount_value_paise: 50000,
          max_discount_cap_paise: null,
          applicable_package_code: null,
          allowed_phones: null,
          is_stackable: false,
          usage_limit: 100,
          used_count: 0,
          is_active: true
        }
      ];
    }
  }
  renderPackagePricingCards();
  renderPromoCodesTable();
}

function renderPackagePricingCards() {
  const host = $('package-pricing-cards');
  if (!host) return;
  if (!adminPackages.length) {
    host.innerHTML = '<p class="empty">No packages found.</p>';
    return;
  }

  host.innerHTML = adminPackages.map(pkg => {
    const listRupees = (Number(pkg.list_price_paise || 0) / 100).toFixed(0);
    const discRupees = (Number(pkg.discount_paise || 0) / 100).toFixed(0);
    const advRupees = (Number(pkg.advance_paise || 0) / 100).toFixed(0);
    const netRupees = Math.max(0, Number(listRupees) - Number(discRupees));

    return `
      <article class="pkg-edit-box package-pricing-card ${pkg.active ? 'is-active' : ''}" data-package="${escapeHtml(pkg.package_code)}">
        <div class="package-pricing-head">
          <div>
            <h3>${escapeHtml(pkg.display_name || pkg.package_code)}</h3>
            <span class="code-tag">${escapeHtml(pkg.package_code)}</span>
          </div>
          <span class="badge ${pkg.active ? 'badge-verified' : 'badge-rejected'}">${pkg.active ? 'Active on Site' : 'Inactive'}</span>
        </div>

        <div class="pricing-field-grid">
          <label class="field">List Price (₹)
            <input type="number" name="list_rupees" min="0" step="1" value="${listRupees}" required>
          </label>
          <label class="field">Global Discount (₹)
            <input type="number" name="discount_rupees" min="0" step="1" value="${discRupees}" required>
          </label>
        </div>

        <div class="pricing-field-grid">
          <label class="field">Advance Expected (₹)
            <input type="number" name="advance_rupees" min="0" step="1" value="${advRupees}" required>
          </label>
          <div class="package-net-summary">
            <span class="net-label">Net Payable</span>
            <strong class="net-display net-val">₹${netRupees.toLocaleString('en-IN')}</strong>
          </div>
        </div>

        <label class="checkbox-field checkbox-row">
          <input type="checkbox" name="is_active" ${pkg.active ? 'checked' : ''}>
          <span><b>Active</b> (Enable on customer checkout)</span>
        </label>

        <button type="button" class="button button-primary button-small btn-save-package">
          Save Package Pricing
        </button>
      </article>
    `;
  }).join('');
}

function renderPromoCodesTable() {
  const tbody = $('promo-table-body');
  if (!tbody) return;
  if (!adminPromos.length) {
    tbody.innerHTML = '<tr><td colspan="8" class="empty">No promo codes created yet.</td></tr>';
    return;
  }

  tbody.innerHTML = adminPromos.map(promo => {
    const discountText = promo.discount_type === 'FLAT'
      ? formatINR(promo.discount_value_paise) + ' Flat'
      : `${promo.discount_value_paise}%` + (promo.max_discount_cap_paise ? ` (Cap: ${formatINR(promo.max_discount_cap_paise)})` : '');

    const scopeText = promo.applicable_package_code
      ? (promo.applicable_package_code === 'standard' ? 'Standard' : (promo.applicable_package_code === 'premium' ? 'Premium' : promo.applicable_package_code))
      : 'All Packages';

    const phonesText = (promo.allowed_phones && promo.allowed_phones.length)
      ? promo.allowed_phones.join(', ')
      : 'All Customers';

    const usageText = `${promo.used_count || 0} / ${promo.usage_limit != null ? promo.usage_limit : '∞'}`;
    const stackText = promo.is_stackable ? '✓ Stackable' : 'Override';
    const statusBadge = promo.is_active
      ? '<span class="badge-active">Active</span>'
      : '<span class="badge-inactive">Disabled</span>';

    return `
      <tr data-promo-row="${escapeHtml(promo.code)}">
        <td><strong>${escapeHtml(promo.code)}</strong></td>
        <td>${escapeHtml(discountText)}</td>
        <td>${escapeHtml(scopeText)}</td>
        <td><code class="phone-code">${escapeHtml(phonesText)}</code></td>
        <td>${escapeHtml(usageText)}</td>
        <td><small>${escapeHtml(stackText)}</small></td>
        <td>${statusBadge}</td>
        <td>
          <button type="button" class="button button-outline button-small btn-toggle-promo" data-promo="${escapeHtml(promo.code)}" data-active="${promo.is_active ? 'true' : 'false'}">
            ${promo.is_active ? 'Disable' : 'Enable'}
          </button>
        </td>
      </tr>
    `;
  }).join('');
}

// Main Tab Navigation
$('admin-main-tabs')?.addEventListener('click', event => {
  const chip = event.target.closest('[data-tab]');
  if (!chip) return;
  document.querySelectorAll('#admin-main-tabs .chip').forEach(c => c.classList.remove('active'));
  chip.classList.add('active');
  const target = chip.dataset.tab;
  $('tab-section-payments').hidden = target !== 'payments';
  $('tab-section-pricing').hidden = target !== 'pricing';
  if (target === 'pricing') {
    loadPricingConfig();
  }
});

// Live Net Payable calculation on card input
$('package-pricing-cards')?.addEventListener('input', event => {
  const card = event.target.closest('.package-pricing-card');
  if (!card) return;
  const list = Number(card.querySelector('[name="list_rupees"]')?.value || 0);
  const disc = Number(card.querySelector('[name="discount_rupees"]')?.value || 0);
  const net = Math.max(0, list - disc);
  const netDisplay = card.querySelector('.net-display');
  if (netDisplay) netDisplay.textContent = `₹${net.toLocaleString('en-IN')}`;
});

// Save Package Pricing Action
$('package-pricing-cards')?.addEventListener('click', async event => {
  const btn = event.target.closest('.btn-save-package');
  if (!btn) return;
  const card = btn.closest('.package-pricing-card');
  if (!card) return;

  const pkgCode = card.dataset.package;
  const listRupees = Number(card.querySelector('[name="list_rupees"]')?.value || 0);
  const discRupees = Number(card.querySelector('[name="discount_rupees"]')?.value || 0);
  const advRupees = Number(card.querySelector('[name="advance_rupees"]')?.value || 0);
  const isActive = card.querySelector('[name="is_active"]')?.checked ?? false;

  if (listRupees < 0 || discRupees < 0 || advRupees < 0) {
    return showError('Values cannot be negative.');
  }
  if (discRupees > listRupees) {
    return showError('Global discount cannot exceed list price.');
  }
  if (advRupees > (listRupees - discRupees)) {
    return showError('Advance amount cannot exceed net payable.');
  }

  btn.disabled = true;
  btn.textContent = 'Saving…';
  showError('');

  try {
    await callAdmin('update_package_pricing', {
      package_code: pkgCode,
      list_price_paise: Math.round(listRupees * 100),
      discount_paise: Math.round(discRupees * 100),
      advance_paise: Math.round(advRupees * 100),
      active: isActive
    });
    toast(`Package ${pkgCode} updated successfully!`);
    await loadPricingConfig();
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
    btn.textContent = 'Save Package Pricing';
  }
});

// Toggle Promo Status (Enable/Disable)
$('promo-table')?.addEventListener('click', async event => {
  const btn = event.target.closest('.btn-toggle-promo');
  if (!btn) return;
  const code = btn.dataset.promo;
  const currentActive = btn.dataset.active === 'true';
  const nextActive = !currentActive;

  btn.disabled = true;
  try {
    await callAdmin('toggle_promo_status', {
      code,
      is_active: nextActive
    });
    toast(`Promo code ${code} is now ${nextActive ? 'Active' : 'Disabled'}.`);
    await loadPricingConfig();
  } catch (err) {
    showError(err.message);
    btn.disabled = false;
  }
});

// Create Promo Code Form Submit
$('promo-create-form')?.addEventListener('submit', async event => {
  event.preventDefault();
  const form = event.target;
  const code = (form.elements.code?.value || '').trim().toUpperCase();
  const type = form.elements.discount_type?.value || 'FLAT';
  const valNum = Number(form.elements.discount_value?.value || 0);
  const capNum = form.elements.max_cap?.value ? Number(form.elements.max_cap.value) : null;
  const pkgCode = (form.elements.applicable_package?.value || '').trim() || null;
  const phone = (form.elements.allowed_phone?.value || '').replace(/\D/g, '').slice(-10) || null;
  const limit = form.elements.usage_limit?.value ? parseInt(form.elements.usage_limit.value, 10) : null;
  const isStackable = form.elements.is_stackable?.checked ?? false;

  if (!code || code.length < 3) {
    return showError('Promo code must be at least 3 characters.');
  }
  if (valNum <= 0) {
    return showError('Discount value must be greater than zero.');
  }
  if (type === 'PERCENTAGE' && valNum > 100) {
    return showError('Percentage discount cannot exceed 100%.');
  }

  const submitBtn = document.getElementById('btn-create-promo');
  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Creating…'; }
  showError('');

  try {
    const payload = {
      code,
      discount_type: type,
      discount_value_paise: type === 'FLAT' ? Math.round(valNum * 100) : valNum,
      max_discount_cap_paise: capNum ? Math.round(capNum * 100) : null,
      applicable_package_code: pkgCode,
      allowed_phones: phone ? [phone] : null,
      is_stackable: isStackable,
      usage_limit: limit,
      is_active: true
    };

    await callAdmin('upsert_promo_code', payload);
    toast(`Promo code ${code} saved successfully!`);
    form.reset();
    await loadPricingConfig();
  } catch (err) {
    showError(err.message);
  } finally {
    if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Create Promo Code'; }
  }
});

// Discount Type Switch Indicator
document.querySelector('[name="discount_type"]')?.addEventListener('change', event => {
  const indicator = document.getElementById('val-type-indicator');
  const valInput = document.querySelector('[name="discount_value"]');
  if (event.target.value === 'PERCENTAGE') {
    if (indicator) indicator.textContent = '%';
    if (valInput) valInput.placeholder = 'e.g. 10 (for 10%)';
  } else {
    if (indicator) indicator.textContent = '₹';
    if (valInput) valInput.placeholder = 'e.g. 500';
  }
});

// Refresh Pricing Button
$('refresh-pricing')?.addEventListener('click', async event => {
  const btn = event.currentTarget;
  btn.disabled = true;
  try {
    await loadPricingConfig();
    toast('Pricing and promo codes refreshed.');
  } catch (err) {
    showError(err.message);
  } finally {
    btn.disabled = false;
  }
});

route();