# Password Storage Setup Guide

## ⚠️ Security Warning

Storing passwords (even encrypted) is a **security risk**. This feature should only be used if:
- You have proper security measures in place
- You understand the risks
- Your members are aware their passwords are stored
- You comply with data protection regulations (GDPR, etc.)

## Setup Steps

### 1. Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

This will output something like:
```
xK8vN2mQ5rT9wB3dF6hJ8kL0nP2sU4vX7zA1cE3gH5i=
```

### 2. Update .env File

Add the generated key to `backend/.env`:

```env
PASSWORD_ENCRYPTION_KEY="xK8vN2mQ5rT9wB3dF6hJ8kL0nP2sU4vX7zA1cE3gH5i="
```

**IMPORTANT:** 
- Keep this key SECRET
- Never commit it to version control
- If you lose this key, stored passwords CANNOT be decrypted
- Back up this key securely

### 3. Create Database Table

Run the SQL migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of backend/add_member_passwords_table.sql
```

Or run it directly:
1. Go to Supabase Dashboard
2. Click on "SQL Editor"
3. Click "New Query"
4. Paste the contents of `backend/add_member_passwords_table.sql`
5. Click "Run"

### 4. Install Dependencies

Make sure cryptography is installed:

```bash
cd backend
pip install cryptography
```

### 5. Restart Backend

Restart your backend server to load the new configuration:

```bash
python -m uvicorn server:app --reload --port 8001
```

## How It Works

### When Creating a Member:
1. Admin enters member details and password in payment form
2. Password is sent to Supabase Auth (hashed)
3. Password is also encrypted using Fernet encryption
4. Encrypted password is stored in `member_passwords` table
5. Member receives welcome email with password

### When Viewing Password:
1. Admin clicks the Key icon (🔑) next to member
2. System retrieves encrypted password from database
3. Password is decrypted using the encryption key
4. Decrypted password is shown to admin
5. Admin can copy password to clipboard

## Security Features

✅ **Encryption** - Passwords are encrypted using Fernet (symmetric encryption)
✅ **Admin Only** - Only admins can view passwords (RLS policies)
✅ **Secure Key** - Encryption key stored in environment variable
✅ **Audit Trail** - Created/updated timestamps tracked
✅ **Cascade Delete** - Passwords deleted when member is deleted

## Usage

### View Member Password:
1. Go to Members page
2. Find the member
3. Click the Key icon (🔑)
4. Password will be retrieved and displayed
5. Click copy icon to copy to clipboard

### After Member Creation:
- Password is shown immediately in a dialog
- Admin can copy and share with member
- Password is also stored encrypted in database
- Admin can retrieve it later if needed

## Best Practices

1. **Limit Access** - Only give admin role to trusted staff
2. **Audit Regularly** - Monitor who accesses passwords
3. **Rotate Keys** - Consider rotating encryption key periodically
4. **Backup Key** - Store encryption key in secure location
5. **Member Awareness** - Inform members their passwords are stored
6. **Use Strong Passwords** - Encourage members to use strong passwords
7. **Password Reset** - Encourage members to change password after first login

## Compliance Considerations

### GDPR (Europe):
- Inform members their passwords are stored
- Provide option to delete password
- Document why passwords are stored
- Implement access controls

### Data Protection:
- Encrypt passwords (✓ Done)
- Limit access to authorized personnel (✓ Done)
- Log access attempts (Consider implementing)
- Regular security audits (Recommended)

## Troubleshooting

### "Password not available"
- Member was created before password storage was enabled
- Password storage failed during creation
- Encryption key is incorrect

### "Failed to decrypt password"
- Encryption key in .env is wrong
- Encryption key was changed after password was stored
- Database corruption

### "Password not found"
- Member was created before this feature was added
- Password record was manually deleted
- Database table not created

## Disabling Password Storage

To disable password storage:

1. Remove `PASSWORD_ENCRYPTION_KEY` from `.env`
2. System will continue to work but won't store new passwords
3. Existing stored passwords remain accessible

## Migration for Existing Members

Existing members (created before this feature) won't have stored passwords:
- They can use "Forgot Password" to reset
- Or admin can manually reset their password
- New password will be stored if feature is enabled

## Alternative Solutions

Consider these alternatives:
1. **Email Only** - Send password via email, don't store
2. **Temporary Passwords** - Generate temporary password, force reset on first login
3. **Password Reset** - Don't store passwords, use password reset flow
4. **SSO/OAuth** - Use third-party authentication (Google, Facebook, etc.)
