"""
Invoice Generation Service with GST Support
Generates PDF invoices with GST compliance
"""
import os
import io
import logging
from datetime import datetime, date
from typing import Optional, List, Dict, Any
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image
from reportlab.lib.enums import TA_LEFT, TA_CENTER, TA_RIGHT

logger = logging.getLogger(__name__)


class InvoiceService:
    """Service for generating GST invoices"""
    
    def __init__(self):
        self.gym_name = os.environ.get('GYM_NAME', 'FitLife Gym')
        self.gym_address = os.environ.get('GYM_ADDRESS', '')
        self.gym_city = os.environ.get('GYM_CITY', '')
        self.gym_state = os.environ.get('GYM_STATE', '')
        self.gym_pincode = os.environ.get('GYM_PINCODE', '')
        self.gym_phone = os.environ.get('GYM_PHONE', '')
        self.gym_email = os.environ.get('GYM_EMAIL', '')
        self.gym_gstin = os.environ.get('GYM_GSTIN', '')
        self.gym_pan = os.environ.get('GYM_PAN', '')
        self.gym_logo = os.environ.get('GYM_LOGO_PATH', '')
    
    def calculate_gst(
        self,
        subtotal: float,
        tax_rate: float = 18.0,
        same_state: bool = True
    ) -> Dict[str, float]:
        """
        Calculate GST amounts
        
        Args:
            subtotal: Amount before tax
            tax_rate: GST rate (default 18%)
            same_state: Whether customer is in same state (for CGST+SGST vs IGST)
        
        Returns:
            Dict with tax_amount, cgst, sgst, igst, total
        """
        tax_amount = round(subtotal * (tax_rate / 100), 2)
        
        if same_state:
            # Split into CGST and SGST
            cgst = round(tax_amount / 2, 2)
            sgst = round(tax_amount / 2, 2)
            igst = 0
        else:
            # Interstate - use IGST
            cgst = 0
            sgst = 0
            igst = tax_amount
        
        total = subtotal + tax_amount
        
        return {
            'tax_amount': tax_amount,
            'cgst': cgst,
            'sgst': sgst,
            'igst': igst,
            'total': round(total, 2)
        }
    
    def generate_invoice_pdf(
        self,
        invoice_data: Dict[str, Any],
        member_data: Dict[str, Any]
    ) -> bytes:
        """
        Generate PDF invoice
        
        Args:
            invoice_data: Invoice information
            member_data: Member/customer information
        
        Returns:
            PDF file as bytes
        """
        buffer = io.BytesIO()
        
        # Create PDF document
        doc = SimpleDocTemplate(
            buffer,
            pagesize=A4,
            rightMargin=30,
            leftMargin=30,
            topMargin=30,
            bottomMargin=30
        )
        
        # Container for elements
        elements = []
        
        # Styles
        styles = getSampleStyleSheet()
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=24,
            textColor=colors.HexColor('#2563eb'),
            spaceAfter=30,
            alignment=TA_CENTER
        )
        
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=14,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=12
        )
        
        normal_style = styles['Normal']
        
        # Title
        elements.append(Paragraph('TAX INVOICE', title_style))
        elements.append(Spacer(1, 12))
        
        # Header - Company and Customer Info
        header_data = [
            [
                Paragraph(f'<b>{self.gym_name}</b><br/>{self.gym_address}<br/>{self.gym_city}, {self.gym_state} {self.gym_pincode}<br/>Phone: {self.gym_phone}<br/>Email: {self.gym_email}<br/>GSTIN: {self.gym_gstin}', normal_style),
                Paragraph(f'<b>Invoice No:</b> {invoice_data["invoice_number"]}<br/><b>Date:</b> {invoice_data["invoice_date"]}<br/><b>Due Date:</b> {invoice_data.get("due_date", "N/A")}', normal_style)
            ]
        ]
        
        header_table = Table(header_data, colWidths=[3.5*inch, 2.5*inch])
        header_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f3f4f6')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.black),
            ('ALIGN', (0, 0), (0, 0), 'LEFT'),
            ('ALIGN', (1, 0), (1, 0), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 12),
            ('TOPPADDING', (0, 0), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 12),
            ('RIGHTPADDING', (0, 0), (-1, -1), 12),
            ('BOX', (0, 0), (-1, -1), 1, colors.grey),
        ]))
        
        elements.append(header_table)
        elements.append(Spacer(1, 20))
        
        # Bill To
        elements.append(Paragraph('<b>Bill To:</b>', heading_style))
        bill_to_text = f'''
        <b>{member_data.get("full_name", "")}</b><br/>
        Email: {member_data.get("email", "")}<br/>
        Phone: {member_data.get("phone", "")}<br/>
        Address: {member_data.get("address", "N/A")}
        '''
        elements.append(Paragraph(bill_to_text, normal_style))
        elements.append(Spacer(1, 20))
        
        # Invoice Items
        items_data = [['#', 'Description', 'Qty', 'Rate', 'Amount']]
        
        for idx, item in enumerate(invoice_data['items'], 1):
            items_data.append([
                str(idx),
                f"{item['name']}\n{item.get('description', '')}",
                str(item.get('quantity', 1)),
                f"₹{item['rate']:.2f}",
                f"₹{item['amount']:.2f}"
            ])
        
        items_table = Table(items_data, colWidths=[0.5*inch, 3*inch, 0.7*inch, 1*inch, 1*inch])
        items_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#2563eb')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('ALIGN', (2, 0), (2, -1), 'CENTER'),
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 10),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('TOPPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.black),
            ('FONTNAME', (0, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 9),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(items_table)
        elements.append(Spacer(1, 20))
        
        # Totals
        subtotal = invoice_data.get('subtotal', 0)
        discount = invoice_data.get('discount_amount', 0)
        cgst = invoice_data.get('cgst', 0)
        sgst = invoice_data.get('sgst', 0)
        igst = invoice_data.get('igst', 0)
        total = invoice_data.get('total_amount', 0)
        
        totals_data = [
            ['', '', '', 'Subtotal:', f"₹{subtotal:.2f}"],
        ]
        
        if discount > 0:
            totals_data.append(['', '', '', 'Discount:', f"-₹{discount:.2f}"])
        
        if cgst > 0 and sgst > 0:
            totals_data.append(['', '', '', 'CGST (9%):', f"₹{cgst:.2f}"])
            totals_data.append(['', '', '', 'SGST (9%):', f"₹{sgst:.2f}"])
        elif igst > 0:
            totals_data.append(['', '', '', 'IGST (18%):', f"₹{igst:.2f}"])
        
        totals_data.append(['', '', '', 'Total Amount:', f"₹{total:.2f}"])
        
        totals_table = Table(totals_data, colWidths=[0.5*inch, 3*inch, 0.7*inch, 1*inch, 1*inch])
        totals_table.setStyle(TableStyle([
            ('ALIGN', (3, 0), (-1, -1), 'RIGHT'),
            ('FONTNAME', (3, -1), (-1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (3, -1), (-1, -1), 11),
            ('TEXTCOLOR', (3, -1), (-1, -1), colors.HexColor('#2563eb')),
            ('LINEABOVE', (3, -1), (-1, -1), 2, colors.HexColor('#2563eb')),
            ('TOPPADDING', (0, -1), (-1, -1), 12),
            ('LEFTPADDING', (0, 0), (-1, -1), 8),
            ('RIGHTPADDING', (0, 0), (-1, -1), 8),
        ]))
        
        elements.append(totals_table)
        elements.append(Spacer(1, 30))
        
        # Terms and Conditions
        if invoice_data.get('terms'):
            elements.append(Paragraph('<b>Terms and Conditions:</b>', heading_style))
            elements.append(Paragraph(invoice_data['terms'], normal_style))
            elements.append(Spacer(1, 20))
        
        # Notes
        if invoice_data.get('notes'):
            elements.append(Paragraph('<b>Notes:</b>', heading_style))
            elements.append(Paragraph(invoice_data['notes'], normal_style))
            elements.append(Spacer(1, 20))
        
        # Footer
        footer_text = f'''
        <para align="center">
        <b>Thank you for your business!</b><br/>
        This is a computer-generated invoice and does not require a signature.<br/>
        <i>{self.gym_name} | {self.gym_email} | {self.gym_phone}</i>
        </para>
        '''
        elements.append(Spacer(1, 30))
        elements.append(Paragraph(footer_text, normal_style))
        
        # Build PDF
        doc.build(elements)
        
        # Get PDF bytes
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes
    
    def generate_payment_receipt(
        self,
        payment_data: Dict[str, Any],
        member_data: Dict[str, Any]
    ) -> bytes:
        """Generate simple payment receipt"""
        
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(buffer, pagesize=A4)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title_style = ParagraphStyle(
            'ReceiptTitle',
            parent=styles['Heading1'],
            fontSize=20,
            textColor=colors.HexColor('#10b981'),
            alignment=TA_CENTER,
            spaceAfter=30
        )
        
        elements.append(Paragraph('PAYMENT RECEIPT', title_style))
        elements.append(Spacer(1, 20))
        
        # Receipt details
        receipt_data = [
            ['Receipt No:', payment_data.get('receipt_number', 'N/A')],
            ['Date:', payment_data.get('payment_date', datetime.now().strftime('%Y-%m-%d'))],
            ['Member Name:', member_data.get('full_name', '')],
            ['Member Email:', member_data.get('email', '')],
            ['Amount Paid:', f"₹{payment_data.get('amount', 0):.2f}"],
            ['Payment Method:', payment_data.get('payment_method', '').upper()],
            ['Status:', 'PAID ✓']
        ]
        
        receipt_table = Table(receipt_data, colWidths=[2*inch, 4*inch])
        receipt_table.setStyle(TableStyle([
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('LEFTPADDING', (0, 0), (-1, -1), 10),
            ('RIGHTPADDING', (0, 0), (-1, -1), 10),
            ('TOPPADDING', (0, 0), (-1, -1), 8),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 8),
            ('LINEBELOW', (0, 0), (-1, -1), 0.5, colors.grey),
        ]))
        
        elements.append(receipt_table)
        elements.append(Spacer(1, 40))
        
        # Thank you message
        footer = Paragraph(
            f'<para align="center"><b>Thank you for your payment!</b><br/><br/>{self.gym_name}<br/>{self.gym_email} | {self.gym_phone}</para>',
            styles['Normal']
        )
        elements.append(footer)
        
        doc.build(elements)
        
        pdf_bytes = buffer.getvalue()
        buffer.close()
        
        return pdf_bytes


# Singleton instance
invoice_service = InvoiceService()
