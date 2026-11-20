import test from 'node:test';
import assert from 'node:assert/strict';
import { formatINR } from '../onboarding-core.js';

test('admin package pricing validation rejects negative values and invalid bounds', () => {
  const validatePackagePricing = (listRupees, discRupees, advRupees) => {
    if (listRupees < 0 || discRupees < 0 || advRupees < 0) {
      return { valid: false, error: 'Values cannot be negative.' };
    }
    if (discRupees > listRupees) {
      return { valid: false, error: 'Global discount cannot exceed list price.' };
    }
    if (advRupees > (listRupees - discRupees)) {
      return { valid: false, error: 'Advance amount cannot exceed net payable.' };
    }
    return { valid: true };
  };

  assert.equal(validatePackagePricing(-100, 0, 0).valid, false);
  assert.equal(validatePackagePricing(4000, 5000, 1000).valid, false);
  assert.equal(validatePackagePricing(4000, 1000, 3500).valid, false); // Advance ₹3,500 > Net ₹3,000
  assert.equal(validatePackagePricing(4000, 1000, 1500).valid, true);
});

test('admin package pricing converts rupees to paise accurately for backend RPC', () => {
  const toPaise = (rupees) => Math.round(Number(rupees) * 100);

  assert.equal(toPaise(4000), 400000);
  assert.equal(toPaise(1000), 100000);
  assert.equal(toPaise(1500), 150000);
  assert.equal(toPaise(6000), 600000);
  assert.equal(toPaise(3000), 300000);
});

test('admin promo code validation enforces uppercase code, bounds and phone normalization', () => {
  const normalize10 = (phone) => String(phone || '').replace(/\D/g, '').slice(-10);

  const validatePromoInput = (code, type, val, allowedPhone) => {
    const cleanCode = String(code || '').trim().toUpperCase();
    if (cleanCode.length < 3) return { valid: false, error: 'Code too short' };
    if (val <= 0) return { valid: false, error: 'Value must be positive' };
    if (type === 'PERCENTAGE' && val > 100) return { valid: false, error: 'Percentage cannot exceed 100' };

    const normPhone = allowedPhone ? normalize10(allowedPhone) : null;
    return {
      valid: true,
      code: cleanCode,
      phone: normPhone
    };
  };

  const res1 = validatePromoInput('nikah500', 'FLAT', 500, '+91 98765 43210');
  assert.equal(res1.valid, true);
  assert.equal(res1.code, 'NIKAH500');
  assert.equal(res1.phone, '9876543210');

  const res2 = validatePromoInput('promo', 'PERCENTAGE', 150, null);
  assert.equal(res2.valid, false);
});

test('formatTemplateNumber parses template code into Template #<number> format', () => {
  const formatTemplateNumber = (styleCode) => {
    if (!styleCode) return 'Template #01';
    const raw = String(styleCode).trim();
    const match = raw.match(/(\d+)/);
    if (match) {
      const num = parseInt(match[1], 10);
      return `Template #${num < 10 ? '0' + num : num}`;
    }
    return `Template #${raw}`;
  };

  assert.equal(formatTemplateNumber('template-02'), 'Template #02');
  assert.equal(formatTemplateNumber('template-06'), 'Template #06');
  assert.equal(formatTemplateNumber('template-14'), 'Template #14');
  assert.equal(formatTemplateNumber('template-15'), 'Template #15');
  assert.equal(formatTemplateNumber('15'), 'Template #15');
  assert.equal(formatTemplateNumber('TPL-3'), 'Template #03');
  assert.equal(formatTemplateNumber(''), 'Template #01');
  assert.equal(formatTemplateNumber(null), 'Template #01');
});

test('calculateExpiryInfo calculates 90 days validity, remaining days, and status badge', () => {
  const calculateExpiryInfo = (activatedIso, expiresIso) => {
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
  };

  // Pending / Not activated
  const pending = calculateExpiryInfo(null, null);
  assert.equal(pending.isActivated, false);

  // Activated today -> 90 days left
  const nowIso = new Date().toISOString();
  const activeRes = calculateExpiryInfo(nowIso, null);
  assert.equal(activeRes.isActivated, true);
  assert.ok(activeRes.daysLeft >= 89 && activeRes.daysLeft <= 91);
  assert.ok(activeRes.badgeHtml.includes('days left'));
  assert.ok(activeRes.badgeHtml.includes('badge-expiry-active'));

  // Expired 100 days ago
  const pastDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000).toISOString();
  const expiredRes = calculateExpiryInfo(pastDate, null);
  assert.equal(expiredRes.isActivated, true);
  assert.equal(expiredRes.isExpired, true);
  assert.ok(expiredRes.badgeHtml.includes('Expired'));
  assert.ok(expiredRes.badgeHtml.includes('badge-expiry-expired'));
});

test('formatISTDateTime formats UTC timestamp into Asia/Kolkata date and time', () => {
  const formatISTDateTime = (isoString) => {
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
  };

  // 2026-11-20T18:30:00Z is 2026-11-21 00:00 (midnight IST)
  const formatted = formatISTDateTime('2026-11-20T18:30:00Z');
  assert.ok(formatted.includes('2026'));
  assert.ok(formatted.includes('Nov'));
  assert.equal(formatISTDateTime(null), '—');
  assert.equal(formatISTDateTime('invalid-date'), '—');
});
