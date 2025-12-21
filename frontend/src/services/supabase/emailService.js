import { supabase } from '../../lib/supabaseClient';

/**
 * Email Service
 * Handles email sending via Supabase Edge Function
 */

const GYM_NAME = process.env.REACT_APP_GYM_NAME || 'VI Fitness';

export const emailService = {
  /**
   * Send email via Supabase Edge Function
   */
  send: async ({ to, subject, html, text }) => {
    try {
      const { data, error } = await supabase.functions.invoke('send-email', {
        body: { to, subject, html, text }
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Email send error:', error);
      throw error;
    }
  },

  /**
   * Send member login credentials
   */
  sendMemberCredentials: async (member, password) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #333;">Welcome to ${GYM_NAME}!</h2>
        <p>Hello ${member.full_name},</p>
        <p>Your gym membership has been created. Here are your login credentials:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Email:</strong> ${member.email}</p>
          <p style="margin: 5px 0;"><strong>Password:</strong> <code style="background: #fff; padding: 2px 5px; border-radius: 3px;">${password}</code></p>
        </div>
        <p style="color: #d32f2f;">⚠️ Please change your password after your first login for security.</p>
        <p>Thank you for joining us!</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 14px;">Best regards,<br>${GYM_NAME} Team</p>
      </div>
    `;

    return await emailService.send({
      to: member.email,
      subject: `Welcome to ${GYM_NAME}`,
      html
    });
  },

  /**
   * Send membership expiry reminder
   */
  sendExpiryReminder: async (member, daysRemaining) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #f57c00;">⏰ Membership Expiry Reminder</h2>
        <p>Hello ${member.full_name},</p>
        <p>Your membership will expire in <strong style="color: #d32f2f;">${daysRemaining} days</strong> on <strong>${new Date(member.end_date).toLocaleDateString()}</strong>.</p>
        <div style="background: #fff3e0; border-left: 4px solid #f57c00; padding: 15px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Don't miss out on your fitness journey!</p>
        </div>
        <p>Please renew your membership to continue enjoying our services.</p>
        <p>For renewal, please contact us or visit our gym.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 14px;">Best regards,<br>${GYM_NAME} Team</p>
      </div>
    `;

    return await emailService.send({
      to: member.email,
      subject: `${GYM_NAME} - Membership Expiry Reminder`,
      html
    });
  },

  /**
   * Send payment receipt
   */
  sendPaymentReceipt: async (payment, member) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #4caf50;">💳 Payment Receipt</h2>
        <p>Hello ${member.full_name},</p>
        <p>Thank you for your payment. Here are the details:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f9f9f9;">
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Amount:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">₹${parseFloat(payment.amount).toFixed(2)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Payment Method:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd; text-transform: capitalize;">${payment.payment_method.replace('_', ' ')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;"><strong>Date:</strong></td>
            <td style="padding: 10px; border-bottom: 1px solid #ddd;">${new Date(payment.payment_date).toLocaleDateString()}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Status:</strong></td>
            <td style="padding: 10px; color: #4caf50; font-weight: bold; text-transform: uppercase;">${payment.status}</td>
          </tr>
        </table>
        <p>Keep this receipt for your records.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 14px;">Best regards,<br>${GYM_NAME} Team</p>
      </div>
    `;

    return await emailService.send({
      to: member.email,
      subject: `${GYM_NAME} - Payment Receipt`,
      html
    });
  },

  /**
   * Send class booking confirmation
   */
  sendClassBookingConfirmation: async (booking, classInfo, member) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #2196f3;">🎯 Class Booking Confirmed</h2>
        <p>Hello ${member.full_name},</p>
        <p>Your class booking has been confirmed!</p>
        <div style="background: #e3f2fd; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p style="margin: 5px 0;"><strong>Class:</strong> ${classInfo.name}</p>
          <p style="margin: 5px 0;"><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
          <p style="margin: 5px 0;"><strong>Time:</strong> ${classInfo.schedule_time}</p>
          <p style="margin: 5px 0;"><strong>Room:</strong> ${classInfo.room || 'Main Hall'}</p>
        </div>
        <p>Please arrive 5 minutes before the class starts.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 14px;">Best regards,<br>${GYM_NAME} Team</p>
      </div>
    `;

    return await emailService.send({
      to: member.email,
      subject: `${GYM_NAME} - Class Booking Confirmed`,
      html
    });
  }
};
