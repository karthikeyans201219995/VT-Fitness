"""
Email service for sending notifications to members
"""
import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging

logger = logging.getLogger(__name__)


def send_welcome_email(
    to_email: str,
    member_name: str,
    password: str,
    plan_name: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    amount: Optional[float] = None
) -> bool:
    """
    Send welcome email with login credentials to new member
    
    Args:
        to_email: Member's email address
        member_name: Member's full name
        password: Generated password for login
        plan_name: Name of the membership plan
        start_date: Membership start date
        end_date: Membership end date
        amount: Payment amount
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        # Get email configuration from environment variables
        smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_username = os.environ.get('SMTP_USERNAME', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        from_email = os.environ.get('FROM_EMAIL', smtp_username)
        gym_name = os.environ.get('GYM_NAME', 'FitLife Gym')
        
        # Check if email is configured
        if not smtp_username or not smtp_password:
            logger.warning("Email service not configured. Set SMTP_USERNAME and SMTP_PASSWORD in .env file")
            return False
        
        # Create message
        message = MIMEMultipart('alternative')
        message['Subject'] = f'Welcome to {gym_name} - Your Login Credentials'
        message['From'] = from_email
        message['To'] = to_email
        
        # Create HTML email body
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .credentials {{ background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #2563eb; }}
                .credentials strong {{ color: #2563eb; }}
                .membership-details {{ background-color: white; padding: 20px; margin: 20px 0; border-radius: 5px; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
                table {{ width: 100%; border-collapse: collapse; }}
                td {{ padding: 10px; border-bottom: 1px solid #e5e7eb; }}
                td:first-child {{ font-weight: bold; color: #6b7280; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Welcome to {gym_name}!</h1>
                </div>
                <div class="content">
                    <h2>Hello {member_name},</h2>
                    <p>Thank you for joining {gym_name}! Your membership has been activated and payment has been processed successfully.</p>
                    
                    <div class="credentials">
                        <h3>Your Login Credentials</h3>
                        <p>You can now access your member portal using the following credentials:</p>
                        <table>
                            <tr>
                                <td>Email:</td>
                                <td><strong>{to_email}</strong></td>
                            </tr>
                            <tr>
                                <td>Password:</td>
                                <td><strong>{password}</strong></td>
                            </tr>
                        </table>
                        <p style="color: #dc2626; margin-top: 15px;">
                            <strong>⚠️ Important:</strong> Please change your password after your first login for security.
                        </p>
                    </div>
                    
                    {f'''
                    <div class="membership-details">
                        <h3>Membership Details</h3>
                        <table>
                            {f'<tr><td>Plan:</td><td>{plan_name}</td></tr>' if plan_name else ''}
                            {f'<tr><td>Start Date:</td><td>{start_date}</td></tr>' if start_date else ''}
                            {f'<tr><td>End Date:</td><td>{end_date}</td></tr>' if end_date else ''}
                            {f'<tr><td>Amount Paid:</td><td>${amount:.2f}</td></tr>' if amount else ''}
                        </table>
                    </div>
                    ''' if plan_name or start_date or end_date or amount else ''}
                    
                    <p>If you have any questions or need assistance, please don't hesitate to contact us.</p>
                    
                    <p>We look forward to seeing you at the gym!</p>
                    
                    <p>Best regards,<br>
                    <strong>{gym_name} Team</strong></p>
                </div>
                <div class="footer">
                    <p>This is an automated message. Please do not reply to this email.</p>
                    <p>&copy; 2025 {gym_name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        # Create plain text version as fallback
        text_body = f"""
        Welcome to {gym_name}!
        
        Hello {member_name},
        
        Thank you for joining {gym_name}! Your membership has been activated.
        
        YOUR LOGIN CREDENTIALS:
        Email: {to_email}
        Password: {password}
        
        ⚠️ IMPORTANT: Please change your password after your first login for security.
        
        {f'''
        MEMBERSHIP DETAILS:
        Plan: {plan_name}
        Start Date: {start_date}
        End Date: {end_date}
        Amount Paid: ${amount:.2f}
        ''' if plan_name else ''}
        
        If you have any questions, please contact us.
        
        Best regards,
        {gym_name} Team
        """
        
        # Attach both versions
        part1 = MIMEText(text_body, 'plain')
        part2 = MIMEText(html_body, 'html')
        message.attach(part1)
        message.attach(part2)
        
        # Send email
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(message)
        
        logger.info(f"Welcome email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send welcome email to {to_email}: {str(e)}")
        return False


def send_payment_receipt(
    to_email: str,
    member_name: str,
    amount: float,
    payment_method: str,
    payment_date: str,
    invoice_number: str,
    plan_name: Optional[str] = None
) -> bool:
    """
    Send payment receipt email to member
    
    Args:
        to_email: Member's email address
        member_name: Member's full name
        amount: Payment amount
        payment_method: Method of payment
        payment_date: Date of payment
        invoice_number: Invoice/receipt number
        plan_name: Name of the membership plan
    
    Returns:
        bool: True if email sent successfully, False otherwise
    """
    try:
        smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        smtp_username = os.environ.get('SMTP_USERNAME', '')
        smtp_password = os.environ.get('SMTP_PASSWORD', '')
        from_email = os.environ.get('FROM_EMAIL', smtp_username)
        gym_name = os.environ.get('GYM_NAME', 'FitLife Gym')
        
        if not smtp_username or not smtp_password:
            logger.warning("Email service not configured")
            return False
        
        message = MIMEMultipart('alternative')
        message['Subject'] = f'Payment Receipt - {invoice_number}'
        message['From'] = from_email
        message['To'] = to_email
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #10b981; color: white; padding: 20px; text-align: center; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .receipt {{ background-color: white; padding: 20px; margin: 20px 0; }}
                table {{ width: 100%; border-collapse: collapse; }}
                td {{ padding: 10px; border-bottom: 1px solid #e5e7eb; }}
                .total {{ font-size: 20px; font-weight: bold; color: #10b981; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Receipt</h1>
                </div>
                <div class="content">
                    <h2>Thank you for your payment!</h2>
                    <p>Dear {member_name},</p>
                    <p>We have received your payment. Here are the details:</p>
                    
                    <div class="receipt">
                        <table>
                            <tr><td>Invoice Number:</td><td><strong>{invoice_number}</strong></td></tr>
                            <tr><td>Date:</td><td>{payment_date}</td></tr>
                            <tr><td>Payment Method:</td><td>{payment_method.upper()}</td></tr>
                            {f'<tr><td>Plan:</td><td>{plan_name}</td></tr>' if plan_name else ''}
                            <tr><td>Amount:</td><td class="total">${amount:.2f}</td></tr>
                        </table>
                    </div>
                    
                    <p>Thank you for your business!</p>
                    <p>Best regards,<br>{gym_name} Team</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        part = MIMEText(html_body, 'html')
        message.attach(part)
        
        with smtplib.SMTP(smtp_server, smtp_port) as server:
            server.starttls()
            server.login(smtp_username, smtp_password)
            server.send_message(message)
        
        logger.info(f"Payment receipt sent to {to_email}")
        return True
        
    except Exception as e:
        logger.error(f"Failed to send payment receipt to {to_email}: {str(e)}")
        return False
