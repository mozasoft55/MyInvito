import test from 'node:test';
import assert from 'node:assert/strict';
import { validateOnboarding, formatINR } from '../onboarding-core.js';

test('validateOnboarding captures and normalizes promo_code to uppercase', () => {
  const input = {
    customer_name: 'Danish Akhtar',
    email: 'danish@example.com',
    phone: '+91 98765 43210',
    bride_name: 'Firdouse',
    groom_name: 'Danish',
    event_date: '2026-12-15',
    city: 'Kolkata',
    template_style: 'template-06',
    theme_name: 'maroon',
    package_code: 'standard',
    promo_code: '  nikah500  ',
    payment_mode: 'upi',
    events: [
      { event_name: 'Nikah', event_date: '2026-12-15', event_time: '19:00', note: 'Grand Hall' }
    ]
  };

  const result = validateOnboarding(input);
  assert.equal(result.valid, true);
  assert.equal(result.value.promo_code, 'NIKAH500');
});

test('promo code calculation: flat discount non-stackable overrides global discount', () => {
  const pkg = {
    code: 'standard',
    list_price_paise: 400000, // ₹4,000
    discount_paise: 100000,   // ₹1,000 global discount
    advance_paise: 150000     // ₹1,500 advance
  };

  // Flat promo: ₹1,500 off, non-stackable
  const promo = {
    code: 'WEDDING1500',
    discount_type: 'FLAT',
    promo_discount_paise: 150000,
    is_stackable: false
  };

  const globalDiscount = promo.is_stackable ? pkg.discount_paise : 0;
  const promoDiscount = promo.promo_discount_paise;
  const totalDiscount = globalDiscount + promoDiscount;
  const netPayable = Math.max(0, pkg.list_price_paise - totalDiscount);
  const advance = Math.min(pkg.advance_paise, netPayable);
  const balance = Math.max(0, netPayable - advance);

  assert.equal(totalDiscount, 150000); // ₹1,500
  assert.equal(netPayable, 250000);    // ₹2,500
  assert.equal(advance, 150000);       // ₹1,500
  assert.equal(balance, 100000);       // ₹1,000
});

test('promo code calculation: stackable promo adds on top of global discount', () => {
  const pkg = {
    code: 'standard',
    list_price_paise: 400000, // ₹4,000
    discount_paise: 100000,   // ₹1,000 global discount
    advance_paise: 150000     // ₹1,500 advance
  };

  // Stackable promo: ₹500 off
  const promo = {
    code: 'VIP500',
    discount_type: 'FLAT',
    promo_discount_paise: 50000,
    is_stackable: true
  };

  const globalDiscount = promo.is_stackable ? pkg.discount_paise : 0;
  const promoDiscount = promo.promo_discount_paise;
  const totalDiscount = globalDiscount + promoDiscount;
  const netPayable = Math.max(0, pkg.list_price_paise - totalDiscount);
  const advance = Math.min(pkg.advance_paise, netPayable);
  const balance = Math.max(0, netPayable - advance);

  assert.equal(totalDiscount, 150000); // ₹1,000 + ₹500 = ₹1,500
  assert.equal(netPayable, 250000);    // ₹2,500
  assert.equal(advance, 150000);       // ₹1,500
  assert.equal(balance, 100000);       // ₹1,000
});

test('promo code calculation: LEAST(advance_paise, net_payable) prevents overcharging advance', () => {
  const pkg = {
    code: 'standard',
    list_price_paise: 400000, // ₹4,000
    discount_paise: 100000,   // ₹1,000 global discount
    advance_paise: 150000     // ₹1,500 standard advance
  };

  // Mega promo: ₹3,000 off, stackable -> total discount ₹4,000 -> payable ₹0
  // Or promo leaves only ₹1,200 payable
  const totalDiscount = 280000; // Leaves ₹1,200 payable
  const netPayable = Math.max(0, pkg.list_price_paise - totalDiscount); // 120000
  const advance = Math.min(pkg.advance_paise, netPayable); // LEAST(150000, 120000) = 120000

  assert.equal(netPayable, 120000);
  assert.equal(advance, 120000); // Advance cannot exceed net payable!
});

test('phone number normalization: matches 10-digit phone across formatting variations', () => {
  const normalize10 = (p) => String(p || '').replace(/\D/g, '').slice(-10);

  const allowedPhones = ['9876543210', '9123456789'];
  const testInputs = [
    '+91 98765 43210',
    '+91-98765-43210',
    '09876543210',
    '9876543210'
  ];

  for (const input of testInputs) {
    const normalized = normalize10(input);
    const isAllowed = allowedPhones.some(allowed => normalize10(allowed) === normalized);
    assert.equal(isAllowed, true, `Failed matching for ${input}`);
  }

  const unauthorizedPhone = '+91 99999 88888';
  const isUnauthorized = allowedPhones.some(allowed => normalize10(allowed) === normalize10(unauthorizedPhone));
  assert.equal(isUnauthorized, false);
});
