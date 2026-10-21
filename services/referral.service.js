import mongoose from 'mongoose';
import Order from '../models/Order.js';

export const normalizeReferralCode = (value = '') => {
  if (typeof value !== 'string' || value.trim().length > 100 || /[\x00-\x1f\x7f]/.test(value)) {
    const error = new Error('Enter a valid Jobzinda referral ID');
    error.status = 400;
    throw error;
  }
  return value.trim();
};

export const calculateReferralCommission = (amount, percent) =>
  Math.round(Math.round(amount * 100) * percent / 100) / 100;

const walletRequest = async (endpoint, payload) => {
  const base = process.env.JOBZINDA_API_URL;
  const key = process.env.JOBZINDA_REFERRAL_API_KEY;
  if (!base || !key) {
    const error = new Error('Referral service is not configured. Please contact support.');
    error.status = 503;
    throw error;
  }
  let response;
  try {
    response = await fetch(`${base.replace(/\/$/, '')}/wallet/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(10000)
    });
  } catch {
    const error = new Error('Jobzinda referral service is temporarily unavailable. Please retry.');
    error.status = 503;
    throw error;
  }
  if (!response.ok) {
    const error = new Error(`Jobzinda referral request failed (HTTP ${response.status})`);
    error.status = 503;
    throw error;
  }
  return response.json();
};

export const validateReferralCode = async (code) => {
  const result = await walletRequest('verifyLearnReferralCode', { referralCode: code });
  if (typeof result.valid !== 'boolean') throw new Error('Invalid referral verification response');
  if (!result.valid) {
    const error = new Error('Invalid Jobzinda referral ID');
    error.status = 400;
    throw error;
  }
};

export const creditOrderReferral = async (orderId) => {
  const now = new Date();
  const order = await Order.findOneAndUpdate({
    _id: orderId,
    status: 'paid',
    referralCreditStatus: { $in: ['pending', 'processing'] },
    referralNextAttemptAt: { $lte: now }
  }, {
    $set: { referralCreditStatus: 'processing', referralNextAttemptAt: new Date(Date.now() + 120000) }
  }, { new: true });
  if (!order) return;
  try {
    if (order.paymentMode === 'test' && process.env.JOBZINDA_CREDIT_TEST_PAYMENTS !== 'true') {
      throw new Error('Test payment wallet credits are disabled');
    }
    const result = await walletRequest('creditLearnReferral', {
      referralCode: order.referralCode,
      amount: order.referralCommissionAmount,
      purchaserName: order.purchaserName,
      courseName: order.courseName,
      paymentMode: order.paymentMode,
      reference: `zindalearn:${order._id}`
    });
    if (result.success !== true || result.credited !== true) throw new Error('Wallet did not confirm referral credit');
    await Order.updateOne({ _id: order._id }, {
      $set: { referralCreditStatus: 'credited', referralCreditedAt: new Date(), referralCreditError: '' }
    });
  } catch (error) {
    console.error(`[referral] Order ${order._id}: ${error.message}`);
    await Order.updateOne({ _id: order._id }, {
      $set: { referralCreditStatus: 'pending', referralNextAttemptAt: new Date(Date.now() + 60000), referralCreditError: error.message }
    });
  }
};

export const startReferralCreditWorker = () => {
  let running = false;
  const retry = async () => {
    if (running || mongoose.connection.readyState !== 1) return;
    running = true;
    try {
      const orders = await Order.find({
        status: 'paid',
        referralCreditStatus: { $in: ['pending', 'processing'] },
        referralNextAttemptAt: { $lte: new Date() }
      }).select('_id').limit(20);
      for (const order of orders) await creditOrderReferral(order._id);
    } catch (error) {
      console.error('[referral] Retry worker failed:', error.message);
    } finally {
      running = false;
    }
  };
  const interval = setInterval(retry, 60000);
  interval.unref();
};
