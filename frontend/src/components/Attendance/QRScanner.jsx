import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Camera, KeyRound } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';

const QRScanner = ({ onScanSuccess }) => {
  const [manualId, setManualId] = useState('');
  const [scanning, setScanning] = useState(false);

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualId.trim()) {
      // Simulate QR data format
      onScanSuccess(JSON.stringify({ memberId: manualId.trim() }));
      setManualId('');
    }
  };

  const handleCameraScan = () => {
    setScanning(true);
    // Simulate camera scanning - in real app, use a QR scanner library
    setTimeout(() => {
      // Demo: Auto-scan first member
      onScanSuccess(JSON.stringify({ memberId: 'GYM001' }));
      setScanning(false);
    }, 2000);
  };

  return (
    <Tabs defaultValue="camera" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-gray-800">
        <TabsTrigger value="camera" className="data-[state=active]:bg-blue-600">
          <Camera className="mr-2 h-4 w-4" />
          Camera Scan
        </TabsTrigger>
        <TabsTrigger value="manual" className="data-[state=active]:bg-blue-600">
          <KeyRound className="mr-2 h-4 w-4" />
          Manual Entry
        </TabsTrigger>
      </TabsList>

      <TabsContent value="camera" className="space-y-4 mt-4">
        <div className="bg-gray-800 rounded-lg p-8 flex flex-col items-center justify-center min-h-[300px]">
          {!scanning ? (
            <>
              <Camera className="h-16 w-16 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4 text-center">
                Click the button below to start scanning
              </p>
              <Button
                onClick={handleCameraScan}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Start Camera
              </Button>
            </>
          ) : (
            <>
              <div className="w-48 h-48 border-4 border-blue-600 rounded-lg flex items-center justify-center mb-4 animate-pulse">
                <Camera className="h-16 w-16 text-blue-600" />
              </div>
              <p className="text-white font-medium">Scanning QR Code...</p>
              <p className="text-gray-400 text-sm mt-2">Position the QR code within the frame</p>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">
          Note: Camera scanning simulated in demo. Real implementation will use device camera.
        </p>
      </TabsContent>

      <TabsContent value="manual" className="space-y-4 mt-4">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">Member ID</Label>
            <Input
              placeholder="Enter Member ID (e.g., GYM001)"
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              required
            />
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
            Check In Member
          </Button>
        </form>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">Demo Member IDs:</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-300">GYM001 - Sarah Johnson</p>
            <p className="text-gray-300">GYM002 - Michael Chen</p>
            <p className="text-gray-300">GYM003 - Emma Wilson</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default QRScanner;
