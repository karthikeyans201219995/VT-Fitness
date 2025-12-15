# Supabase Edge Functions Setup Guide

This guide explains how to set up Supabase Edge Functions for Email and SMS notifications.

## Prerequisites

1. Supabase CLI installed: `npm install -g supabase`
2. Supabase project set up and linked
3. SMS provider credentials (Twilio recommended)

## Step 1: Initialize Edge Functions

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref YOUR_PROJECT_REF

# Initialize functions folder
supabase functions new send-email
supabase functions new send-sms
```

## Step 2: Create Email Notification Function

Create file: `supabase/functions/send-email/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailRequest {
  to: string
  subject: string
  html: string
  text?: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, subject, html, text } = await req.json() as EmailRequest

    // Initialize Supabase client with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    
    // Send email using your preferred email service
    // Option 1: SendGrid
    const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: Deno.env.get('FROM_EMAIL') || 'noreply@fitlife.com' },
        subject: subject,
        content: [
          { type: 'text/html', value: html },
          { type: 'text/plain', value: text || '' }
        ]
      })
    })

    if (!response.ok) {
      throw new Error(`SendGrid API error: ${response.status}`)
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Email sent successfully' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

## Step 3: Create SMS Notification Function

Create file: `supabase/functions/send-sms/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface SMSRequest {
  phone_number: string
  message: string
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phone_number, message } = await req.json() as SMSRequest

    // Twilio credentials from environment
    const TWILIO_ACCOUNT_SID = Deno.env.get('TWILIO_ACCOUNT_SID')
    const TWILIO_AUTH_TOKEN = Deno.env.get('TWILIO_AUTH_TOKEN')
    const TWILIO_PHONE_NUMBER = Deno.env.get('TWILIO_PHONE_NUMBER')

    // Prepare Twilio API request
    const auth = btoa(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`)
    
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`
    
    const formData = new URLSearchParams({
      To: phone_number,
      From: TWILIO_PHONE_NUMBER,
      Body: message
    })

    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString()
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Twilio API error: ${JSON.stringify(errorData)}`)
    }

    const data = await response.json()

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'SMS sent successfully',
        sid: data.sid 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
```

## Step 4: Deploy Edge Functions

```bash
# Deploy send-email function
supabase functions deploy send-email

# Deploy send-sms function
supabase functions deploy send-sms
```

## Step 5: Set Environment Variables

Set secrets for your edge functions:

```bash
# For Email (SendGrid)
supabase secrets set SENDGRID_API_KEY=your_sendgrid_api_key
supabase secrets set FROM_EMAIL=noreply@yourdomain.com

# For SMS (Twilio)
supabase secrets set TWILIO_ACCOUNT_SID=your_twilio_account_sid
supabase secrets set TWILIO_AUTH_TOKEN=your_twilio_auth_token
supabase secrets set TWILIO_PHONE_NUMBER=+1234567890
```

## Step 6: Test Functions

```bash
# Test send-email function
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-email' \\
  --header 'Authorization: Bearer YOUR_ANON_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{"to":"test@example.com","subject":"Test","html":"<p>Test email</p>"}'

# Test send-sms function
curl -i --location --request POST 'https://YOUR_PROJECT_REF.supabase.co/functions/v1/send-sms' \\
  --header 'Authorization: Bearer YOUR_ANON_KEY' \\
  --header 'Content-Type: application/json' \\
  --data '{"phone_number":"+1234567890","message":"Test SMS"}'
```

## Alternative: Use Supabase Auth SMS (Easier Option)

If you want a simpler solution, you can use Supabase's built-in SMS functionality:

1. Go to your Supabase project dashboard
2. Navigate to Authentication > Settings
3. Enable Phone Auth
4. Configure Twilio settings directly in the dashboard
5. Supabase will handle SMS sending automatically for auth flows

For custom SMS (like notifications), you can still use the edge function approach above.

## Email Templates

You can create email templates for different notifications:

### Membership Expiry Reminder

```html
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #4F46E5; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background: #f9fafb; }
        .button { background: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>VI FITNESS</h1>
        </div>
        <div class="content">
            <h2>Membership Expiry Reminder</h2>
            <p>Hi {{member_name}},</p>
            <p>Your membership will expire on {{expiry_date}}.</p>
            <p>Please renew your membership to continue enjoying our facilities.</p>
            <a href="{{renewal_link}}" class="button">Renew Now</a>
        </div>
    </div>
</body>
</html>
```

### Payment Reminder

```html
<!DOCTYPE html>
<html>
<body>
    <div class="container">
        <h2>Payment Reminder</h2>
        <p>Hi {{member_name}},</p>
        <p>This is a reminder that you have an outstanding payment of ${{amount}}.</p>
        <p>Due date: {{due_date}}</p>
        <p>Please make the payment at your earliest convenience.</p>
    </div>
</body>
</html>
```

## Integration with Backend

Your backend can call these edge functions like this:

```python
from supabase_client import get_supabase_client

async def send_notification_email(to: str, subject: str, html: str):
    supabase = get_supabase_client()
    response = supabase.functions.invoke(
        "send-email",
        invoke_options={
            "body": {
                "to": to,
                "subject": subject,
                "html": html
            }
        }
    )
    return response

async def send_notification_sms(phone_number: str, message: str):
    supabase = get_supabase_client()
    response = supabase.functions.invoke(
        "send-sms",
        invoke_options={
            "body": {
                "phone_number": phone_number,
                "message": message
            }
        }
    )
    return response
```

## Scheduled Notifications

You can set up scheduled notifications using Supabase Database Webhooks or external cron services:

1. Create a scheduled function to check for expiring memberships
2. Send email/SMS notifications automatically
3. Run daily or weekly

Example: Use GitHub Actions or Vercel Cron to trigger your notification endpoint.

## Notes

- Edge functions run on Deno runtime
- They have a 50MB size limit
- Free tier: 500,000 function invocations per month
- For production, consider implementing retry logic and logging
- Store notification history in your database for tracking

## Next Steps

1. Deploy the edge functions to your Supabase project
2. Configure your API keys and environment variables
3. Test the functions with your backend integration
4. Set up scheduled notifications for automated reminders
5. Monitor function logs in Supabase dashboard
