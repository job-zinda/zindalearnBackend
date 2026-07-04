import User from '../models/User.js';
import { notificationService } from './notification.service.js';
import { emitToUser } from '../sockets/index.js';
import sendEmail from '../utils/sendEmail.js';

/**
 * Dispatch a notification across DB, Socket.io, and Email (checking preferences)
 * 
 * @param {Object} params
 * @param {string} params.userId - Recipient user/instructor ID
 * @param {string} params.type - 'courseEnrollments' | 'reviews' | 'qaQuestions' | 'payouts' | 'messages' | 'liveClasses'
 * @param {string} params.title - Alert title
 * @param {string} params.message - Detailed alert message
 * @param {string} [params.link] - Deep link URL for frontend redirect
 * @param {Object} [params.metadata] - Extra notification metadata
 */
export const dispatchNotification = async ({
  userId,
  type,
  title,
  message,
  link = '',
  metadata = {}
}) => {
  try {
    const user = await User.findById(userId);
    if (!user) return;

    const preferences = user.notificationPreferences || {};
    
    // Map of check conditions. If undefined/not set, we default to true.
    const toggleMap = {
      courseEnrollments: preferences.courseEnrollments !== false,
      reviews: preferences.reviews !== false,
      qaQuestions: preferences.qaQuestions !== false,
      payouts: preferences.payouts !== false,
      messages: preferences.messages !== false,
      liveClasses: preferences.liveClasses !== false
    };

    // If the preference for this specific alert type is off, ignore it
    if (!toggleMap[type]) {
      console.log(`[Notification Engine] Type: ${type} is disabled for User: ${userId}`);
      return;
    }

    // 1. Create database notification document
    const dbNotif = await notificationService.createNotification({
      userId,
      title,
      message,
      type,
      link,
      metadata
    });

    // 2. Real-time push via Socket.io
    emitToUser(userId, 'notification', dbNotif);

    // 3. Email notification if emailNotifications general preference is active
    if (preferences.emailNotifications !== false) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      const actionUrl = link ? `${frontendUrl}${link}` : '';

      const html = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="background: linear-gradient(135deg, #7c3aed, #a855f7); padding: 40px 32px; text-align: center;">
            <h1 style="color: #ffffff; font-size: 24px; font-weight: 900; margin: 0; text-transform: uppercase; letter-spacing: 1px;">Zinda Learn</h1>
            <p style="color: rgba(255, 255, 255, 0.85); font-size: 14px; font-weight: 500; margin: 8px 0 0;">New Alert Notification</p>
          </div>
          <div style="padding: 42px 36px; background-color: #ffffff;">
            <h2 style="color: #1e293b; font-size: 20px; font-weight: 800; margin-top: 0; margin-bottom: 12px; line-height: 1.3;">${title}</h2>
            <p style="color: #475569; font-size: 15px; line-height: 1.6; margin-top: 0; margin-bottom: 30px; font-weight: 500;">
              ${message}
            </p>
            ${actionUrl ? `
              <div style="text-align: center; margin-bottom: 10px;">
                <a href="${actionUrl}" style="display: inline-block; padding: 14px 36px; background: linear-gradient(135deg, #7c3aed, #a855f7); color: #ffffff; text-decoration: none; border-radius: 14px; font-weight: 700; font-size: 14px; box-shadow: 0 4px 14px rgba(124, 58, 237, 0.25);">
                  View Details
                </a>
              </div>
            ` : ''}
          </div>
          <div style="background-color: #f8fafc; padding: 24px 36px; border-top: 1px solid #f1f5f9; text-align: center;">
            <p style="color: #94a3b8; font-size: 11px; font-weight: 500; line-height: 1.5; margin: 0;">
              You received this message because email notifications are enabled in your settings. To unsubscribe, log in and change your notification preferences.
            </p>
            <p style="color: #94a3b8; font-size: 11px; font-weight: 500; margin: 8px 0 0;">
              © ${new Date().getFullYear()} Zinda Learn. All rights reserved.
            </p>
          </div>
        </div>
      `;

      await sendEmail({
        email: user.email,
        subject: `[Zinda Learn Alert] ${title}`,
        html,
        message: `${title}: ${message} ${actionUrl ? `Visit: ${actionUrl}` : ''}`
      }).catch(err => console.error('[Notification Engine] Nodemailer dispatch failed:', err.message));
    }
  } catch (error) {
    console.error('[Notification Engine] Failed to dispatch notification:', error);
  }
};
