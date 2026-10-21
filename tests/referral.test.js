import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import vm from 'node:vm';
import Course from '../models/Course.js';
import { calculateReferralCommission, normalizeReferralCode } from '../services/referral.service.js';

async function loadModule(file, mocks, globals = {}) {
  const context = vm.createContext({ console: { error() {} }, Date, process: { env: {} }, ...globals });
  const module = new vm.SourceTextModule(await fs.readFile(file, 'utf8'), { context });
  await module.link(async name => {
    const exports = mocks[name] || { default: {} };
    return new vm.SyntheticModule(Object.keys(exports), function () {
      for (const [key, value] of Object.entries(exports)) this.setExport(key, value);
    }, { context });
  });
  await module.evaluate();
  return module.namespace;
}

const response = () => ({
  statusCode: 200, status(code) { this.statusCode = code; return this; },
  json(body) { this.body = body; return this; }
});

test('percentage uses paid amount rounded to paise, including zero and full commission', () => {
  assert.equal(calculateReferralCommission(599, 10), 59.9);
  assert.equal(calculateReferralCommission(999.99, 12.5), 125);
  assert.equal(calculateReferralCommission(1, 0), 0);
  assert.equal(calculateReferralCommission(0, 100), 0);
  assert.equal(calculateReferralCommission(100, 100), 100);
});

test('referral IDs are trimmed, optional, and reject invalid types/control characters', () => {
  assert.equal(normalizeReferralCode(' JOB123 '), 'JOB123');
  assert.equal(normalizeReferralCode(), '');
  for (const value of [null, {}, ['JOB123'], 'A'.repeat(101), 'JOB\n123']) {
    assert.throws(() => normalizeReferralCode(value));
  }
});

test('course schema enforces zero through 100 percent and defaults old courses to zero', () => {
  for (const percent of [-1, 101, NaN]) {
    const course = new Course({ referralCommissionPercent: percent });
    assert.ok(course.validateSync().errors.referralCommissionPercent);
  }
  assert.equal(new Course().referralCommissionPercent, 0);
});

test('order snapshots discount commission, purchaser, course and test mode; rejects invalid code', async () => {
  const saved = [];
  const queries = [];
  let valid = true;
  class Order {
    constructor(data) { Object.assign(this, data); }
    async save() { saved.push(this); }
    static async findOne(query) { queries.push(query); return null; }
  }
  const service = await loadModule('controllers/paymentController.js', {
    '../services/payment.service.js': { paymentService: { createRazorpayOrder: async (amount, currency) => ({ id: 'order-test', amount: Math.round(amount * 100), currency }) } },
    '../models/Order.js': { default: Order },
    '../models/Course.js': { default: { findById: async () => ({ status: 'published', price: 1000, discountPrice: 599, referralCommissionPercent: 10, title: 'Design Basics', currency: 'INR' }) } },
    '../models/Enrollment.js': { default: { findOne: async () => null } },
    '../models/User.js': { default: { findById: () => ({ select: async () => ({ name: 'Asha' }) }) } },
    '../services/referral.service.js': {
      normalizeReferralCode, calculateReferralCommission,
      validateReferralCode: async () => { if (!valid) throw Object.assign(new Error('Invalid Jobzinda referral ID'), { status: 400 }); },
      creditOrderReferral: async () => {},
    },
    '../services/notificationDispatcher.js': { dispatchNotification: async () => {} },
  }, { process: { env: { RAZORPAY_KEY_ID: 'rzp_test_mock' } } });
  const req = { user: { id: 'student' }, body: { courseId: 'course', referralCode: 'JOB123' } };
  const res = response();
  await service.createOrder(req, res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.amount, 59900);
  assert.equal(saved[0].referralCommissionAmount, 59.9);
  assert.equal(saved[0].referralCommissionPercent, 10);
  assert.equal(saved[0].courseName, 'Design Basics');
  assert.equal(saved[0].purchaserName, 'Asha');
  assert.equal(saved[0].paymentMode, 'test');
  assert.equal(queries.at(-1).referralCode, 'JOB123');
  valid = false;
  const rejected = response();
  await service.createOrder(req, rejected);
  assert.equal(rejected.statusCode, 400);
  assert.equal(saved.length, 1);
});

test('wallet outbox retries a lost acknowledgement using the same purchase reference', async () => {
  let order = {
    _id: '1234567890abcdef12345678', status: 'paid', referralCreditStatus: 'pending',
    paymentMode: 'test', referralCode: 'JOB123', referralCommissionAmount: 59.9,
    purchaserName: 'Asha', courseName: 'Design Basics', referralNextAttemptAt: new Date(0)
  };
  const deliveries = [];
  let fail = true;
  const service = await loadModule('services/referral.service.js', {
    mongoose: { default: {} },
    '../models/Order.js': { default: {
      findOneAndUpdate: async (query, update) => {
        if (order.status !== 'paid' || !query.referralCreditStatus.$in.includes(order.referralCreditStatus)
            || order.referralNextAttemptAt > query.referralNextAttemptAt.$lte) return null;
        Object.assign(order, update.$set); return { ...order };
      },
      updateOne: async (_query, update) => { Object.assign(order, update.$set); }
    } },
  }, {
    process: { env: { JOBZINDA_API_URL: 'http://wallet.test/api/v1', JOBZINDA_REFERRAL_API_KEY: 'shared-test', JOBZINDA_CREDIT_TEST_PAYMENTS: 'true' } },
    AbortSignal,
    fetch: async (_url, options) => {
      deliveries.push(JSON.parse(options.body));
      if (fail) throw new Error('Lost response');
      return { ok: true, json: async () => ({ success: true, credited: true, duplicate: true }) };
    }
  });
  await service.creditOrderReferral(order._id);
  assert.equal(order.referralCreditStatus, 'pending');
  assert.match(order.referralCreditError, /unavailable/);
  order.referralNextAttemptAt = new Date(0); fail = false;
  await service.creditOrderReferral(order._id);
  assert.equal(order.referralCreditStatus, 'credited');
  assert.equal(deliveries.length, 2);
  assert.equal(deliveries[0].reference, deliveries[1].reference);
  assert.equal(deliveries[1].purchaserName, 'Asha');
  await service.creditOrderReferral(order._id);
  assert.equal(deliveries.length, 2);
});

test('payment must belong to buyer and be captured for exact order amount before any commission', async () => {
  let owner = 'other', captured = false, credits = 0, saves = 0;
  const order = {
    user: { toString: () => owner }, amount: 599, currency: 'INR', status: 'created',
    save: async () => { saves++; },
  };
  const service = await loadModule('controllers/paymentController.js', {
    '../services/payment.service.js': { paymentService: {
      verifySignature: () => true,
      getPayment: async () => ({ status: captured ? 'captured' : 'authorized', order_id: 'order', amount: 1, currency: 'INR' })
    } },
    '../models/Order.js': { default: { findOne: async () => order } },
    '../services/referral.service.js': {
      normalizeReferralCode, calculateReferralCommission, validateReferralCode: async () => {},
      creditOrderReferral: async () => { credits++; }
    },
    '../services/notificationDispatcher.js': { dispatchNotification: async () => {} },
  });
  const req = { user: { id: 'buyer' }, body: { razorpay_order_id: 'order', razorpay_payment_id: 'payment', razorpay_signature: 'signature' } };
  const forbidden = response(); await service.verifyPayment(req, forbidden);
  assert.equal(forbidden.statusCode, 403);
  owner = 'buyer';
  const unpaid = response(); await service.verifyPayment(req, unpaid);
  assert.equal(unpaid.statusCode, 400);
  captured = true;
  const wrongAmount = response(); await service.verifyPayment(req, wrongAmount);
  assert.equal(wrongAmount.statusCode, 400);
  assert.equal(credits, 0);
  assert.equal(saves, 0);
});

test('captured payment creates enrollment once and repeated verification keeps commission snapshot', async () => {
  let enrollmentExists = false, studentIncrements = 0, deliveries = 0;
  const order = {
    _id: '1234567890abcdef12345678', user: 'buyer', course: 'course',
    amount: 599, currency: 'INR', status: 'created', referralCode: 'JOB123',
    referralCommissionAmount: 59.9, referralCommissionPercent: 10,
    save: async () => {},
  };
  const service = await loadModule('controllers/paymentController.js', {
    '../services/payment.service.js': { paymentService: {
      verifySignature: () => true,
      getPayment: async () => ({ status: 'captured', order_id: 'order', amount: 59900, currency: 'INR' })
    } },
    '../models/Order.js': { default: {
      findOne: async () => order,
      findById: () => ({ select: async () => ({ referralCreditStatus: 'credited' }) })
    } },
    '../models/Course.js': { default: {
      findById: async () => ({ title: 'Design Basics' }),
      findByIdAndUpdate: async () => { studentIncrements++; }
    } },
    '../models/User.js': { default: {
      findByIdAndUpdate: async () => {},
      findById: () => ({ select: async () => ({ name: 'Asha' }) })
    } },
    '../models/Enrollment.js': { default: {
      findOneAndUpdate: async () => {
        const updatedExisting = enrollmentExists; enrollmentExists = true;
        return { value: { _id: 'enrollment' }, lastErrorObject: { updatedExisting } };
      }
    } },
    '../services/referral.service.js': {
      normalizeReferralCode, calculateReferralCommission, validateReferralCode: async () => {},
      creditOrderReferral: async () => { deliveries++; }
    },
    '../services/notificationDispatcher.js': { dispatchNotification: async () => {} },
  });
  const req = { user: { id: 'buyer' }, body: { razorpay_order_id: 'order', razorpay_payment_id: 'payment', razorpay_signature: 'signature' } };
  for (let i = 0; i < 2; i++) {
    const res = response(); await service.verifyPayment(req, res);
    assert.equal(res.statusCode, 200);
    assert.equal(res.body.referralCreditStatus, 'credited');
  }
  assert.equal(studentIncrements, 1);
  assert.equal(order.referralCommissionAmount, 59.9);
  assert.equal(order.status, 'paid');
  assert.equal(deliveries, 2);
});

test('only admins can update commission and zero/invalid referral lookup cannot be ignored', async () => {
  const { courseService } = await import('../services/course.service.js');
  await assert.rejects(
    courseService.updateCourse('unused', { referralCommissionPercent: 20 }, { id: 'teacher', role: 'instructor' }),
    error => error.status === 403
  );
  const service = await loadModule('controllers/paymentController.js', {
    '../services/referral.service.js': {
      normalizeReferralCode, calculateReferralCommission, creditOrderReferral: async () => {},
      validateReferralCode: async () => { throw Object.assign(new Error('Jobzinda temporarily unavailable'), { status: 503 }); }
    },
    '../services/payment.service.js': { paymentService: {} },
    '../services/notificationDispatcher.js': { dispatchNotification: async () => {} },
  });
  const empty = response();
  await service.verifyReferral({ body: {} }, empty);
  assert.equal(empty.statusCode, 400);
  const offline = response();
  await service.verifyReferral({ body: { referralCode: 'JOB123' } }, offline);
  assert.equal(offline.statusCode, 503);
});
