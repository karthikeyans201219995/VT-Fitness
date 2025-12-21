# Supabase Edge Function for Email Service

This guide explains how to set up a Supabase Edge Function to handle email sending for your gym management PWA.

## Overview

Since we've migrated from Python backend to a pure React PWA, we need serverless functions to handle secure operations like sending emails. Supabase Edge Functions are perfect for this.

## Prerequisites

- Supabase CLI installed: `npm install -g supabase`
- Supabase project created
- SMTP credentials (Gmail, SendGrid, or any SMTP provider)

## Setup Steps

### 1. Initialize Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref aovfhvpzixctghtixchl
```

### 2. Create Edge Function

```bash
# Create the email function
supabase functions new send-email
```

### 3. Edge Function Code

Create the file `supabase/functions/send-email/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { SmtpClient } from "https://deno.land/x/smtp@v0.7.0/mod.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json()

    // Validate input
    if (!to || !subject || (!html && !text)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // SMTP configuration from environment variables
    const smtpConfig = {
      hostname: Deno.env.get('SMTP_HOSTNAME') || 'smtp.gmail.com',
      port: parseInt(Deno.env.get('SMTP_PORT') || '587'),
      username: Deno.env.get('SMTP_USERNAME')!,
      password: Deno.env.get('SMTP_PASSWORD')!,
    }

    const client = new SmtpClient()

    await client.connectTLS(smtpConfig)

    await client.send({
      from: Deno.env.get('SMTP_FROM_EMAIL') || smtpConfig.username,
      to: to,
      subject: subject,
      content: html || text,
      html: html,
    })

    await client.close()

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
```

### 4. Set Environment Secrets

```bash
# Set SMTP credentials as secrets
supabase secrets set SMTP_HOSTNAME=smtp.gmail.com
supabase secrets set SMTP_PORT=587
supabase secrets set SMTP_USERNAME=your-email@gmail.com
supabase secrets set SMTP_PASSWORD=your-app-password
supabase secrets set SMTP_FROM_EMAIL=your-email@gmail.com
```

**Note for Gmail users:** Use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

### 5. Deploy Edge Function

```bash
# Deploy the function
supabase functions deploy send-email
```

### 6. Test the Function

```bash
# Test locally
supabase functions serve

# Or test the deployed function
curl -i --location --request POST 'https://aovfhvpzixctghtixchl.supabase.co/functions/v1/send-email' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data-raw '{
    "to": "recipient@example.com",
    "subject": "Test Email",
    "html": "<h1>Hello from Supabase!</h1><p>This is a test email.</p>"
  }'
```

## Using in Your React App

Create a new service file: `src/services/supabase/emailService.js`

```javascript
import { supabase } from '../../lib/supabaseClient';

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
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Welcome to ${process.env.REACT_APP_GYM_NAME}!</h2>
        <p>Hello ${member.full_name},</p>
        <p>Your gym membership has been created. Here are your login credentials:</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Email:</strong> ${member.email}</p>
          <p><strong>Password:</strong> ${password}</p>
        </div>
        <p>Please change your password after your first login.</p>
        <p>Thank you for joining us!</p>
        <p>Best regards,<br>${process.env.REACT_APP_GYM_NAME} Team</p>
      </div>
    `;

    return await emailService.send({
      to: member.email,
      subject: `Welcome to ${process.env.REACT_APP_GYM_NAME}`,
      html
    });
  },

  /**
   * Send membership expiry reminder
   */
  sendExpiryReminder: async (member, daysRemaining) => {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Membership Expiry Reminder</h2>
        <p>Hello ${member.full_name},</p>
        <p>Your membership will expire in <strong>${daysRemaining} days</strong> on ${member.end_date}.</p>
        <p>Please renew your membership to continue enjoying our services.</p>
        <p>For renewal, please contact us or visit our gym.</p>
        <p>Best regards,<br>${process.env.REACT_APP_GYM_NAME} Team</p>
      </div>
    `;

    return await emailService.send({
      to: member.email,
      subject: 'Membership Expiry Reminder',
      html
    });
  }
};
```

## Alternative: Using Resend (Recommended for Production)

If you prefer a more robust email service, you can use Resend:

1. Sign up at [resend.com](https://resend.com)
2. Get your API key
3. Update the edge function to use Resend:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  const { to, subject, html } = await req.json()

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'VI Fitness <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  })

  const data = await response.json()
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  })
})
```

## Troubleshooting

### Function not deploying
- Make sure Supabase CLI is installed and updated
- Check that you're linked to the correct project
- Verify your authentication

### Emails not sending
- Check SMTP credentials are correct
- For Gmail, ensure "Less secure app access" is enabled or use App Password
- Check function logs: `supabase functions logs send-email`

### CORS errors
- Ensure corsHeaders are set in the function
- Check that the function handles OPTIONS requests

## Security Notes

- Never expose SMTP credentials in frontend code
- Always use environment secrets for sensitive data
- Use Supabase Row Level Security (RLS) to control who can call the function
- Consider rate limiting to prevent abuse

## Next Steps

1. Deploy the edge function
2. Test email sending
3. Integrate into your React components
4. Set up monitoring and error tracking
