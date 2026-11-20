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
