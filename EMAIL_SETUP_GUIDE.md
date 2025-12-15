# Email Setup Guide

## Overview
The system automatically sends welcome emails with login credentials to new members after payment is completed.

## Email Configuration

### 1. Update `.env` File
Edit `backend/.env` and configure the following email settings:

```env
# Email Configuration
SMTP_SERVER="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USERNAME="your-gym-email@gmail.com"
SMTP_PASSWORD="your-app-password"
FROM_EMAIL="your-gym-email@gmail.com"
GYM_NAME="Your Gym Name"
```

### 2. Gmail Setup (Recommended)

If using Gmail, you need to create an **App Password**:

#### Steps to Create Gmail App Password:
1. Go to your Google Account: https://myaccount.google.com/
2. Click on **Security** in the left sidebar
3. Enable **2-Step Verification** (if not already enabled)
4. After enabling 2-Step Verification, go back to Security
5. Click on **App passwords** (under "How you sign in to Google")
6. Select **Mail** as the app
7. Select **Other** as the device and name it "Gym Management System"
8. Click **Generate**
9. Copy the 16-character password (without spaces)
10. Use this password in `SMTP_PASSWORD` in your `.env` file

**Important:** Use the App Password, NOT your regular Gmail password!

### 3. Other Email Providers

#### Outlook/Hotmail:
```env
SMTP_SERVER="smtp-mail.outlook.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@outlook.com"
SMTP_PASSWORD="your-password"
```

#### Yahoo Mail:
```env
SMTP_SERVER="smtp.mail.yahoo.com"
SMTP_PORT="587"
SMTP_USERNAME="your-email@yahoo.com"
SMTP_PASSWORD="your-app-password"
```

#### Custom SMTP Server:
```env
SMTP_SERVER="mail.yourdomain.com"
SMTP_PORT="587"
SMTP_USERNAME="noreply@yourdomain.com"
SMTP_PASSWORD="your-password"
```

## What Gets Sent

### Welcome Email
When a new member is added via payment form, they receive:
- **Subject:** "Welcome to [Gym Name] - Your Login Credentials"
- **Content:**
  - Welcome message
  - Login credentials (email and password)
  - Membership details (plan, start/end dates, amount paid)
  - Security reminder to change password
  - Gym contact information

### Email Template Preview:
```
Welcome to VI FITNESS!

Hello John Doe,

Thank you for joining VI FITNESS! Your membership has been activated.

YOUR LOGIN CREDENTIALS:
Email: john@example.com
Password: Abc123!@#xyz

⚠️ IMPORTANT: Please change your password after your first login.

MEMBERSHIP DETAILS:
Plan: Premium Monthly
Start Date: January 1, 2025
End Date: February 1, 2025
Amount Paid: $2000.00

Best regards,
VI FITNESS Team
```

## Testing Email Configuration

### 1. Check Backend Logs
After adding a member, check the backend console for:
```
INFO - Welcome email sent to member@email.com
```

Or if there's an issue:
```
WARNING - Email service not configured
ERROR - Failed to send welcome email: [error details]
```

### 2. Test Email Manually
You can test the email service by adding a test member through the payment form.

### 3. Common Issues

**Issue:** "Email service not configured"
- **Solution:** Make sure `SMTP_USERNAME` and `SMTP_PASSWORD` are set in `.env`

**Issue:** "Authentication failed"
- **Solution:** 
  - For Gmail: Use App Password, not regular password
  - Ensure 2-Step Verification is enabled
  - Check username and password are correct

**Issue:** "Connection refused"
- **Solution:** 
  - Check SMTP_SERVER and SMTP_PORT are correct
  - Ensure firewall allows outgoing connections on port 587
  - Try port 465 with SSL if 587 doesn't work

**Issue:** Email not received
- **Solution:**
  - Check spam/junk folder
  - Verify recipient email address is correct
  - Check email provider's sending limits

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use App Passwords** instead of regular passwords
3. **Enable 2-Factor Authentication** on email account
4. **Use a dedicated email** for system notifications
5. **Monitor email sending** for suspicious activity
6. **Rotate passwords** regularly

## Email Sending Limits

### Gmail:
- Free accounts: 500 emails/day
- Google Workspace: 2000 emails/day

### Outlook:
- Free accounts: 300 emails/day
- Office 365: Higher limits based on plan

### Yahoo:
- Free accounts: 500 emails/day

## Disabling Email Notifications

If you don't want to send emails, simply leave `SMTP_USERNAME` and `SMTP_PASSWORD` empty in `.env`:

```env
SMTP_USERNAME=""
SMTP_PASSWORD=""
```

The system will log a warning but continue to create members without sending emails.

## Future Enhancements

Consider implementing:
- Payment receipt emails
- Membership expiry reminders
- Attendance notifications
- Promotional emails
- SMS notifications
- Email templates customization
- Bulk email campaigns
