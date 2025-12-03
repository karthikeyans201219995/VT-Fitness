import React, { useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { mockMembers } from '../../mockData';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Download, Printer } from 'lucide-react';
import QRCode from 'qrcode.react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const MembershipCard = () => {
  const { user } = useAuth();
  const cardRef = useRef(null);
  const memberData = mockMembers.find(m => m.email === user.email) || mockMembers[0];

  const handleDownload = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: null
      });
      const link = document.createElement('a');
      link.download = `${memberData.memberId}-membership-card.png`;
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  const handlePrint = async () => {
    if (cardRef.current) {
      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: '#ffffff'
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: [85.6, 53.98] // Credit card size
      });
      pdf.addImage(imgData, 'PNG', 0, 0, 85.6, 53.98);
      pdf.save(`${memberData.memberId}-membership-card.pdf`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Digital Membership Card</h1>
        <p className="text-gray-400">Your digital gym membership card</p>
      </div>

      <div className="flex flex-col items-center space-y-6">
        <div ref={cardRef} className="relative w-full max-w-2xl">
          <Card className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900 border-none shadow-2xl overflow-hidden">
            <CardContent className="p-8">
              {/* Card Header */}
              <div className="flex justify-between items-start mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">FitLife Gym</h2>
                  <p className="text-blue-200 text-sm">Premium Fitness Center</p>
                </div>
                <div className="bg-white rounded-lg p-2">
                  <QRCode
                    value={JSON.stringify({
                      memberId: memberData.memberId,
                      name: memberData.name,
                      validUntil: memberData.validUntil
                    })}
                    size={100}
                    level="H"
                    includeMargin={false}
                  />
                </div>
              </div>

              {/* Member Info */}
              <div className="space-y-4">
                <div>
                  <p className="text-blue-200 text-sm mb-1">Member Name</p>
                  <p className="text-2xl font-bold text-white">{memberData.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Member ID</p>
                    <p className="text-white font-semibold text-lg">{memberData.memberId}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Blood Group</p>
                    <p className="text-white font-semibold text-lg">{memberData.bloodGroup}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Plan</p>
                    <p className="text-white font-semibold">{memberData.plan}</p>
                  </div>
                  <div>
                    <p className="text-blue-200 text-sm mb-1">Valid Until</p>
                    <p className="text-white font-semibold">{memberData.validUntil}</p>
                  </div>
                </div>

                <div>
                  <p className="text-blue-200 text-sm mb-1">Emergency Contact</p>
                  <p className="text-white font-semibold">{memberData.emergencyContact}</p>
                </div>
              </div>

              {/* Card Footer */}
              <div className="mt-8 pt-4 border-t border-blue-500">
                <p className="text-blue-200 text-xs text-center">
                  Scan QR code at entrance for check-in
                </p>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full opacity-10 -mr-32 -mt-32"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-400 rounded-full opacity-10 -ml-24 -mb-24"></div>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <Button
            onClick={handleDownload}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Card
          </Button>
          <Button
            onClick={handlePrint}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-700"
          >
            <Printer className="mr-2 h-4 w-4" />
            Print Card
          </Button>
        </div>

        {/* Instructions */}
        <Card className="bg-gray-900 border-gray-800 w-full max-w-2xl">
          <CardContent className="pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">How to Use Your Digital Card</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">1.</span>
                <span>Show this card at the gym entrance for quick check-in</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">2.</span>
                <span>The QR code contains your membership details and validity</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">3.</span>
                <span>Download or print the card for offline access</span>
              </li>
              <li className="flex items-start">
                <span className="text-blue-400 mr-2">4.</span>
                <span>Emergency contact information is displayed for safety</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MembershipCard;
