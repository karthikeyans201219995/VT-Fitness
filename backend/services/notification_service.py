"""
Enhanced Notification Service
Handles Email, SMS, WhatsApp, Push notifications
"""
import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.application import MIMEApplication
from typing import Optional, Dict, Any, List
from datetime import datetime, date
from jinja2 import Template

logger = logging.getLogger(__name__)


class NotificationService:
    """Unified notification service for all communication channels"""
    
    def __init__(self):
        self.smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.environ.get('SMTP_PORT', '587'))
        self.smtp_username = os.environ.get('SMTP_USERNAME', '')
        self.smtp_password = os.environ.get('SMTP_PASSWORD', '')
        self.from_email = os.environ.get('FROM_EMAIL', self.smtp_username)
        self.gym_name = os.environ.get('GYM_NAME', 'FitLife Gym')
        self.gym_address = os.environ.get('GYM_ADDRESS', '')
        self.gym_phone = os.environ.get('GYM_PHONE', '')
        self.gym_email = os.environ.get('GYM_EMAIL', self.from_email)
        self.gym_gstin = os.environ.get('GYM_GSTIN', '')
        
    def is_email_configured(self) -> bool:
        """Check if email service is configured"""
        return bool(self.smtp_username and self.smtp_password)
    
    def render_template(self, template: str, variables: Dict[str, Any]) -> str:
        """Render template with variables"""
        try:
            jinja_template = Template(template)
            return jinja_template.render(**variables)
        except Exception as e:
            logger.error(f"Template rendering error: {str(e)}")
            return template
    
    def send_email(
        self,
        to_email: str,
        subject: str,
        body: str,
        html_body: Optional[str] = None,
        attachments: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """
        Send email notification
        
        Args:
            to_email: Recipient email
            subject: Email subject
            body: Plain text body
            html_body: HTML body (optional)
            attachments: List of attachments [{filename, content, mimetype}]
        """
        if not self.is_email_configured():
            logger.warning("Email service not configured")
            return False
        
        try:
            message = MIMEMultipart('alternative')
            message['Subject'] = subject
            message['From'] = f"{self.gym_name} <{self.from_email}>"
            message['To'] = to_email
            
            # Attach plain text
            part1 = MIMEText(body, 'plain')
            message.attach(part1)
            
            # Attach HTML if provided
            if html_body:
                part2 = MIMEText(html_body, 'html')
                message.attach(part2)
            
            # Attach files if provided
            if attachments:
                for attachment in attachments:
                    part = MIMEApplication(attachment['content'])
                    part.add_header(
                        'Content-Disposition',
                        'attachment',
                        filename=attachment['filename']
                    )
                    message.attach(part)
            
            # Send email
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_username, self.smtp_password)
                server.send_message(message)
            
            logger.info(f"Email sent successfully to {to_email}")
            return True
            
        except Exception as e:
            logger.error(f"Failed to send email to {to_email}: {str(e)}")
            return False
    
    def send_payment_due_alert(
        self,
        member_email: str,
        member_name: str,
        amount: float,
        due_date: date,
        days_until_due: int
    ) -> bool:
        """Send payment due alert"""
        
        if days_until_due == 7:
            urgency = "in 7 days"
            color = "#2563eb"
        elif days_until_due == 3:
            urgency = "in 3 days"
            color = "#f59e0b"
        elif days_until_due == 1:
            urgency = "TOMORROW"
            color = "#ef4444"
        elif days_until_due == 0:
            urgency = "TODAY"
            color = "#dc2626"
        else:
            urgency = "soon"
            color = "#2563eb"
        
        subject = f"Payment Reminder: Due {urgency}"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: {color}; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .amount {{ font-size: 32px; font-weight: bold; color: {color}; text-align: center; margin: 20px 0; }}
                .due-date {{ background-color: white; padding: 15px; text-align: center; border-left: 4px solid {color}; margin: 20px 0; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }}
                .button {{ display: inline-block; padding: 12px 24px; background-color: {color}; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Payment Reminder</h1>
                </div>
                <div class="content">
                    <h2>Hello {member_name},</h2>
                    <p>This is a friendly reminder about your upcoming payment.</p>
                    
                    <div class="amount">₹{amount:.2f}</div>
                    
                    <div class="due-date">
                        <strong>Due Date: {due_date.strftime('%B %d, %Y')}</strong><br>
                        <span style="color: {color}; font-size: 18px; font-weight: bold;">({urgency.upper()})</span>
                    </div>
                    
                    <p>Please ensure timely payment to continue enjoying your membership benefits without any interruption.</p>
                    
                    <p><strong>Payment Methods Available:</strong></p>
                    <ul>
                        <li>Cash at gym reception</li>
                        <li>UPI/Online transfer</li>
                        <li>Card payment</li>
                    </ul>
                    
                    <p>If you have already made the payment, please ignore this reminder.</p>
                    
                    <p>Thank you for being a valued member!</p>
                    
                    <p>Best regards,<br>
                    <strong>{self.gym_name} Team</strong></p>
                </div>
                <div class="footer">
                    <p>{self.gym_name} | {self.gym_address}</p>
                    <p>Phone: {self.gym_phone} | Email: {self.gym_email}</p>
                    <p>&copy; 2025 {self.gym_name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_body = f"""
        Payment Reminder
        
        Hello {member_name},
        
        This is a reminder about your upcoming payment:
        
        Amount: ₹{amount:.2f}
        Due Date: {due_date.strftime('%B %d, %Y')} ({urgency.upper()})
        
        Please ensure timely payment to continue your membership.
        
        Payment Methods:
        - Cash at gym reception
        - UPI/Online transfer
        - Card payment
        
        Thank you,
        {self.gym_name} Team
        """
        
        return self.send_email(member_email, subject, plain_body, html_body)
    
    def send_payment_overdue_alert(
        self,
        member_email: str,
        member_name: str,
        amount: float,
        due_date: date,
        days_overdue: int
    ) -> bool:
        """Send payment overdue alert"""
        
        subject = f"⚠️ Payment OVERDUE - Immediate Action Required"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #dc2626; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .warning {{ background-color: #fee2e2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0; }}
                .amount {{ font-size: 32px; font-weight: bold; color: #dc2626; text-align: center; margin: 20px 0; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>⚠️ PAYMENT OVERDUE</h1>
                </div>
                <div class="content">
                    <h2>Dear {member_name},</h2>
                    
                    <div class="warning">
                        <strong>URGENT:</strong> Your payment is now OVERDUE by {days_overdue} day(s).
                    </div>
                    
                    <div class="amount">₹{amount:.2f}</div>
                    
                    <p><strong>Original Due Date:</strong> {due_date.strftime('%B %d, %Y')}</p>
                    
                    <p>Please make the payment immediately to avoid:</p>
                    <ul>
                        <li>Suspension of membership access</li>
                        <li>Late payment charges</li>
                        <li>Service interruption</li>
                    </ul>
                    
                    <p>If you're facing any issues with payment or need to discuss a payment plan, please contact us immediately.</p>
                    
                    <p><strong>Contact Us:</strong></p>
                    <p>Phone: {self.gym_phone}<br>
                    Email: {self.gym_email}</p>
                    
                    <p>We value your membership and look forward to resolving this matter.</p>
                    
                    <p>Best regards,<br>
                    <strong>{self.gym_name} Team</strong></p>
                </div>
                <div class="footer">
                    <p>{self.gym_name} | {self.gym_address}</p>
                    <p>&copy; 2025 {self.gym_name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_body = f"""
        ⚠️ PAYMENT OVERDUE - URGENT
        
        Dear {member_name},
        
        Your payment is now OVERDUE by {days_overdue} day(s).
        
        Amount: ₹{amount:.2f}
        Original Due Date: {due_date.strftime('%B %d, %Y')}
        
        Please make payment immediately to avoid service suspension.
        
        Contact us if you need assistance:
        Phone: {self.gym_phone}
        Email: {self.gym_email}
        
        Thank you,
        {self.gym_name} Team
        """
        
        return self.send_email(member_email, subject, plain_body, html_body)
    
    def send_birthday_wish(
        self,
        member_email: str,
        member_name: str,
        special_offer: Optional[str] = None
    ) -> bool:
        """Send birthday wishes"""
        
        subject = f"🎉 Happy Birthday {member_name}! 🎂"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #8b5cf6; color: white; padding: 40px 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .birthday-icon {{ font-size: 64px; text-align: center; margin: 20px 0; }}
                .offer-box {{ background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; margin: 20px 0; text-align: center; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>🎉 Happy Birthday! 🎉</h1>
                </div>
                <div class="content">
                    <div class="birthday-icon">🎂🎈🎁</div>
                    
                    <h2 style="text-align: center;">Dear {member_name},</h2>
                    
                    <p style="text-align: center; font-size: 18px;">
                        Wishing you a very Happy Birthday filled with joy, health, and happiness!
                    </p>
                    
                    <p>Thank you for being an amazing member of the {self.gym_name} family. Your dedication to fitness inspires us every day!</p>
                    
                    {f'''
                    <div class="offer-box">
                        <h3>🎁 Birthday Special Gift! 🎁</h3>
                        <p style="font-size: 18px; margin: 15px 0;">
                            {special_offer}
                        </p>
                        <p style="font-size: 14px; margin-top: 10px;">
                            Valid for next 30 days
                        </p>
                    </div>
                    ''' if special_offer else ''}
                    
                    <p style="text-align: center; font-size: 16px; margin-top: 30px;">
                        May this year bring you closer to all your fitness goals! 💪
                    </p>
                    
                    <p style="text-align: center;">
                        With warm wishes,<br>
                        <strong>{self.gym_name} Team</strong>
                    </p>
                </div>
                <div class="footer">
                    <p>{self.gym_name} | Making fitness fun since day one!</p>
                    <p>&copy; 2025 {self.gym_name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_body = f"""
        🎉 HAPPY BIRTHDAY! 🎉
        
        Dear {member_name},
        
        Wishing you a very Happy Birthday filled with joy, health, and happiness!
        
        Thank you for being an amazing member of {self.gym_name}!
        
        {f'🎁 Birthday Special: {special_offer} (Valid for 30 days)' if special_offer else ''}
        
        May this year bring you closer to all your fitness goals! 💪
        
        With warm wishes,
        {self.gym_name} Team
        """
        
        return self.send_email(member_email, subject, plain_body, html_body)
    
    def send_membership_renewal_reminder(
        self,
        member_email: str,
        member_name: str,
        expiry_date: date,
        plan_name: str,
        days_until_expiry: int
    ) -> bool:
        """Send membership renewal reminder"""
        
        subject = f"Time to Renew Your {self.gym_name} Membership"
        
        html_body = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background-color: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
                .content {{ background-color: #f9fafb; padding: 30px; border: 1px solid #e5e7eb; }}
                .expiry-box {{ background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0; }}
                .footer {{ background-color: #1f2937; color: #9ca3af; padding: 20px; text-align: center; font-size: 12px; border-radius: 0 0 5px 5px; }}
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>Membership Renewal</h1>
                </div>
                <div class="content">
                    <h2>Hello {member_name},</h2>
                    
                    <p>We hope you've been enjoying your fitness journey with us!</p>
                    
                    <div class="expiry-box">
                        <strong>Your {plan_name} membership expires in {days_until_expiry} days</strong><br>
                        Expiry Date: {expiry_date.strftime('%B %d, %Y')}
                    </div>
                    
                    <p>Don't let your progress stop! Renew your membership today and continue your fitness journey without any interruption.</p>
                    
                    <p><strong>Why renew now?</strong></p>
                    <ul>
                        <li>Maintain your workout momentum</li>
                        <li>Continue accessing all gym facilities</li>
                        <li>Keep working towards your fitness goals</li>
                        <li>Stay part of our fitness community</li>
                    </ul>
                    
                    <p>Visit us at the gym or contact us to renew your membership.</p>
                    
                    <p><strong>Contact Information:</strong><br>
                    Phone: {self.gym_phone}<br>
                    Email: {self.gym_email}<br>
                    Address: {self.gym_address}</p>
                    
                    <p>We look forward to continuing your fitness journey together!</p>
                    
                    <p>Best regards,<br>
                    <strong>{self.gym_name} Team</strong></p>
                </div>
                <div class="footer">
                    <p>{self.gym_name} | {self.gym_address}</p>
                    <p>&copy; 2025 {self.gym_name}. All rights reserved.</p>
                </div>
            </div>
        </body>
        </html>
        """
        
        plain_body = f"""
        Membership Renewal Reminder
        
        Hello {member_name},
        
        Your {plan_name} membership expires in {days_until_expiry} days.
        Expiry Date: {expiry_date.strftime('%B %d, %Y')}
        
        Don't let your progress stop! Renew today and continue your fitness journey.
        
        Contact us:
        Phone: {self.gym_phone}
        Email: {self.gym_email}
        
        Best regards,
        {self.gym_name} Team
        """
        
        return self.send_email(member_email, subject, plain_body, html_body)
    
    def send_sms(self, phone: str, message: str) -> bool:
        """
        Send SMS notification
        Note: Requires SMS service integration (Twilio, MSG91, etc.)
        """
        logger.warning("SMS service not implemented. Requires API integration.")
        return False
    
    def send_whatsapp(self, phone: str, message: str) -> bool:
        """
        Send WhatsApp notification
        Note: Requires WhatsApp Business API integration
        """
        logger.warning("WhatsApp service not implemented. Requires Business API integration.")
        return False
    
    def send_push_notification(self, device_token: str, title: str, body: str) -> bool:
        """
        Send push notification
        Note: Requires Firebase Cloud Messaging setup
        """
        logger.warning("Push notification service not implemented. Requires FCM integration.")
        return False


# Singleton instance
notification_service = NotificationService()
