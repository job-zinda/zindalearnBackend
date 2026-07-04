import redisClient from '../config/redis.js';
import bcrypt from 'bcryptjs';

const OTP_TTL = 300; // 5 minutes
const MAX_ATTEMPTS = 3;
const COOLDOWN_TTL = 30; // 30 seconds

export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const saveOTP = async (email, otp) => {
  const cooldownKey = `otp_cooldown:${email}`;
  const isCooldown = await redisClient.get(cooldownKey);
  if (isCooldown) {
    throw new Error('Please wait before requesting another OTP');
  }

  // Hash OTP for secure storage
  const salt = await bcrypt.genSalt(10);
  const hashedOTP = await bcrypt.hash(otp, salt);

  const otpKey = `otp:${email}`;
  const attemptsKey = `otp_attempts:${email}`;

  // Store in Redis with TTLs
  await redisClient.setEx(otpKey, OTP_TTL, hashedOTP);
  await redisClient.setEx(attemptsKey, OTP_TTL, '0');
  await redisClient.setEx(cooldownKey, COOLDOWN_TTL, '1');
};

export const verifyOTP = async (email, userOtp) => {
  const otpKey = `otp:${email}`;
  const attemptsKey = `otp_attempts:${email}`;

  const hashedOTP = await redisClient.get(otpKey);
  if (!hashedOTP) {
    throw new Error('OTP expired or not found');
  }

  const attemptsStr = await redisClient.get(attemptsKey);
  let attempts = parseInt(attemptsStr || '0', 10);

  if (attempts >= MAX_ATTEMPTS) {
    await redisClient.del(otpKey);
    await redisClient.del(attemptsKey);
    throw new Error('Max attempts reached. Please request a new OTP');
  }

  const isValid = await bcrypt.compare(userOtp, hashedOTP);

  if (!isValid) {
    attempts += 1;
    await redisClient.setEx(attemptsKey, OTP_TTL, attempts.toString());
    throw new Error('Invalid OTP');
  }

  // Verification successful, cleanup
  await redisClient.del(otpKey);
  await redisClient.del(attemptsKey);

  return true;
};
