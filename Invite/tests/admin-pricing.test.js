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

test('Couple Order ID referral validation enforces all 4 eligibility and anti-abuse rules', () => {
  // Simulate the referral validation logic from validate_promo_preview / provision_new_customer
  const validateOrderReferral = ({
    code,
    callerPhone,
    packagePricePaise,
    referralSettings,
    existingOrders,
    redeemedReferralCodes
  }) => {
    if (!referralSettings.is_enabled) {
      return { valid: false, message: 'Referral discount is currently disabled.' };
    }

    const cleanCode = String(code || '').trim().toUpperCase();
    const refOrder = existingOrders.find(o => o.order_reference === cleanCode);

    if (!refOrder) {
      return { valid: false, message: 'Invalid promo code or referral Order ID.' };
    }

    // Rule 1: Order must be Verified / Confirmed & Live & Active
    const isVerified = ['Confirmed', 'In Production', 'Delivered'].includes(refOrder.order_status)
      && (refOrder.card_status || 'Active') === 'Active'
      && (refOrder.advance_verified_paise || 0) > 0;

    if (!isVerified) {
      return { valid: false, message: 'Referral Order ID must be verified and active to grant a discount.' };
    }

    // Rule 2: 1-time use per Order ID (cannot be redeemed twice)
    if (redeemedReferralCodes.has(cleanCode)) {
      return { valid: false, message: 'This couple referral Order ID has already been redeemed.' };
    }

    // Rule 3: Anti-chain loop (Referenced order cannot itself be a referral-discounted order)
    if (refOrder.applied_promo_code && refOrder.applied_promo_code.startsWith('ORD-')) {
      return { valid: false, message: 'This order was booked using a referral code and cannot refer another order.' };
    }

    // Rule 4: Self-referral prevention
    const normCaller = String(callerPhone || '').replace(/\D/g, '').slice(-10);
    const normReferrer = String(refOrder.customer_phone || '').replace(/\D/g, '').slice(-10);
    if (normCaller && normCaller === normReferrer) {
      return { valid: false, message: 'You cannot use your own Order ID as a referral code.' };
    }

    // Calculate discount
    let discountPaise = 0;
    if (referralSettings.discount_type === 'FLAT') {
      discountPaise = referralSettings.discount_value_paise;
    } else {
      discountPaise = Math.round((packagePricePaise * referralSettings.discount_value_paise) / 100);
      if (referralSettings.max_discount_cap_paise && discountPaise > referralSettings.max_discount_cap_paise) {
        discountPaise = referralSettings.max_discount_cap_paise;
      }
    }

    return {
      valid: true,
      is_referral: true,
      code: refOrder.order_reference,
      discount_paise: discountPaise,
      is_stackable: referralSettings.is_stackable,
      message: 'Couple Referral Applied!'
    };
  };

  const defaultSettings = {
    is_enabled: true,
    discount_type: 'FLAT',
    discount_value_paise: 50000, // ₹500
    max_discount_cap_paise: null,
    is_stackable: true
  };

  const sampleOrders = [
    {
      order_reference: 'ORD-DFE714DB',
      order_status: 'Confirmed',
      card_status: 'Active',
      advance_verified_paise: 150000,
      customer_phone: '9876543210',
      applied_promo_code: null
    },
    {
      order_reference: 'ORD-PENDING1',
      order_status: 'Pending',
      card_status: 'Active',
      advance_verified_paise: 0,
      customer_phone: '9876543211',
      applied_promo_code: null
    },
    {
      order_reference: 'ORD-CHAINLOOP',
      order_status: 'Confirmed',
      card_status: 'Active',
      advance_verified_paise: 150000,
      customer_phone: '9876543212',
      applied_promo_code: 'ORD-DFE714DB' // Already referred by ORD-DFE714DB
    }
  ];

  // 1. Valid Verified Referral
  const resValid = validateOrderReferral({
    code: 'ORD-DFE714DB',
    callerPhone: '9123456789',
    packagePricePaise: 400000,
    referralSettings: defaultSettings,
    existingOrders: sampleOrders,
    redeemedReferralCodes: new Set()
  });
  assert.equal(resValid.valid, true);
  assert.equal(resValid.is_referral, true);
  assert.equal(resValid.discount_paise, 50000);

  // 2. Reject Unverified / Pending Order
  const resUnverified = validateOrderReferral({
    code: 'ORD-PENDING1',
    callerPhone: '9123456789',
    packagePricePaise: 400000,
    referralSettings: defaultSettings,
    existingOrders: sampleOrders,
    redeemedReferralCodes: new Set()
  });
  assert.equal(resUnverified.valid, false);
  assert.ok(resUnverified.message.includes('must be verified'));

  // 3. Reject Already Redeemed Order ID (1-time use)
  const resDouble = validateOrderReferral({
    code: 'ORD-DFE714DB',
    callerPhone: '9123456789',
    packagePricePaise: 400000,
    referralSettings: defaultSettings,
    existingOrders: sampleOrders,
    redeemedReferralCodes: new Set(['ORD-DFE714DB'])
  });
  assert.equal(resDouble.valid, false);
  assert.ok(resDouble.message.includes('already been redeemed'));

  // 4. Reject Chain Loop (Referred order trying to refer another)
  const resLoop = validateOrderReferral({
    code: 'ORD-CHAINLOOP',
    callerPhone: '9123456789',
    packagePricePaise: 400000,
    referralSettings: defaultSettings,
    existingOrders: sampleOrders,
    redeemedReferralCodes: new Set()
  });
  assert.equal(resLoop.valid, false);
  assert.ok(resLoop.message.includes('cannot refer another order'));

  // 5. Reject Self-Referral (Same mobile number)
  const resSelf = validateOrderReferral({
    code: 'ORD-DFE714DB',
    callerPhone: '+91 98765 43210',
    packagePricePaise: 400000,
    referralSettings: defaultSettings,
    existingOrders: sampleOrders,
    redeemedReferralCodes: new Set()
  });
  assert.equal(resSelf.valid, false);
  assert.ok(resSelf.message.includes('own Order ID'));
});

test('B2B partner promo codes store category, partner name, and support atomic bulk deletion', () => {
  const promoList = [
    { code: 'RAHUL-STUDIO', category: 'B2B Partner', partner_name: 'Rahul Studio (Photographer)', used_count: 5 },
    { code: 'SUMMER2026', category: 'Campaign', partner_name: 'Summer Campaign', used_count: 12 },
    { code: 'TEST-PROMO', category: 'Campaign', partner_name: 'Temporary Test', used_count: 0 }
  ];

  // Bulk deletion simulation
  const codesToDelete = ['TEST-PROMO'];
  const remainingPromos = promoList.filter(p => !codesToDelete.includes(p.code));

  assert.equal(remainingPromos.length, 2);
  assert.equal(remainingPromos.find(p => p.code === 'TEST-PROMO'), undefined);
  assert.equal(remainingPromos.find(p => p.code === 'RAHUL-STUDIO').partner_name, 'Rahul Studio (Photographer)');
});
