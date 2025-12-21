import QRCode from 'qrcode.react';

/**
 * QR Service
 * Handles QR code generation and processing (client-side)
 */

export const qrService = {
  /**
   * Generate QR code data for a member
   */
  generateMemberQRData: (memberId, memberData) => {
    return JSON.stringify({
      type: 'member',
      id: memberId,
      name: memberData.full_name,
      email: memberData.email,
      timestamp: new Date().toISOString()
    });
  },

  /**
   * Parse QR code data
   */
  parseQRData: (qrData) => {
    try {
      const parsed = JSON.parse(qrData);
      return parsed;
    } catch (error) {
      console.error('Invalid QR data:', error);
      return null;
    }
  },

  /**
   * Validate QR code data
   */
  validateQRData: (qrData) => {
    const parsed = qrService.parseQRData(qrData);
    if (!parsed) return false;

    // Check if it has required fields
    if (parsed.type === 'member' && parsed.id) {
      return true;
    }

    return false;
  },

  /**
   * Download QR code as image
   */
  downloadQRCode: (memberId, memberName) => {
    const canvas = document.querySelector(`canvas[data-member-id="${memberId}"]`);
    if (!canvas) {
      console.error('QR code canvas not found');
      return;
    }

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = url;
    link.download = `${memberName.replace(/\s+/g, '_')}_QR.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};
