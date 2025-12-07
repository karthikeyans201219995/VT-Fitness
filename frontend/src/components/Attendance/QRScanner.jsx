import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Camera, KeyRound, StopCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Html5Qrcode } from 'html5-qrcode';
import { useToast } from '../../hooks/use-toast';

const QRScanner = ({ onScanSuccess }) => {
  const [manualCode, setManualCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const html5QrCodeRef = useRef(null);
  const scannerRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, [scanning]);

  const handleQRScan = async (qrCode) => {
    if (processing) return;
    
    setProcessing(true);
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8000';
    try {
      const response = await fetch(`${API_BASE_URL}/api/qr-attendance/scan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          qr_code: qrCode,
          notes: null
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
          variant: data.action === 'check_in' ? 'default' : 'default',
        });
        if (onScanSuccess) {
          onScanSuccess(data);
        }
      } else {
        toast({
          title: 'Error',
          description: data.detail || 'Scan failed',
          variant: 'destructive',
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Network error. Please check your connection.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (manualCode.trim()) {
      handleQRScan(manualCode.trim());
      setManualCode('');
    }
  };

  const handleCameraScan = async () => {
    try {
      setError('');
      setScanning(true);

      // Check if camera is available
      const devices = await Html5Qrcode.getCameras();
      if (!devices || devices.length === 0) {
        throw new Error('No cameras found on this device');
      }

      // Initialize scanner
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Try to start with back camera first, fallback to any camera
      const cameraConfig = devices.length > 1 
        ? { facingMode: "environment" } 
        : { deviceId: devices[0].id };

      // Start scanning
      await html5QrCode.start(
        cameraConfig,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0
        },
        (decodedText) => {
          // Success callback
          handleQRScan(decodedText);
          handleStopScan();
        },
        (errorMessage) => {
          // Error callback (can be ignored for continuous scanning)
          // console.log('QR scan error:', errorMessage);
        }
      );
    } catch (err) {
      console.error('Error starting camera:', err);
      let errorMsg = 'Failed to access camera. ';
      
      if (err.name === 'NotAllowedError') {
        errorMsg += 'Please allow camera permissions in your browser settings.';
      } else if (err.message && err.message.includes('Permission')) {
        errorMsg += 'Camera permission denied.';
      } else if (err.message && err.message.includes('No cameras')) {
        errorMsg += 'No camera detected on this device.';
      } else if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
        errorMsg += 'Camera requires HTTPS or localhost.';
      } else {
        errorMsg += 'Please try manual entry instead.';
      }
      
      setError(errorMsg);
      setScanning(false);
    }
  };

  const handleStopScan = async () => {
    try {
      if (html5QrCodeRef.current) {
        await html5QrCodeRef.current.stop();
        html5QrCodeRef.current = null;
      }
    } catch (err) {
      console.error('Error stopping scanner:', err);
    } finally {
      setScanning(false);
    }
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
        <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center justify-center min-h-[300px]">
          {!scanning ? (
            <>
              <Camera className="h-16 w-16 text-gray-600 mb-4" />
              <p className="text-gray-400 mb-4 text-center">
                Click the button below to start scanning
              </p>
              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
              )}
              <Button
                onClick={handleCameraScan}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Camera className="mr-2 h-4 w-4" />
                Start Camera
              </Button>
            </>
          ) : (
            <>
              <div id="qr-reader" ref={scannerRef} className="w-full max-w-md"></div>
              <p className="text-white font-medium mt-4">Scanning QR Code...</p>
              <p className="text-gray-400 text-sm mt-2">Position the QR code within the frame</p>
              <Button
                onClick={handleStopScan}
                className="bg-red-600 hover:bg-red-700 mt-4"
              >
                <StopCircle className="mr-2 h-4 w-4" />
                Stop Scanning
              </Button>
            </>
          )}
        </div>
        <p className="text-xs text-gray-500 text-center">
          Camera access required. Please allow camera permissions when prompted.
        </p>
      </TabsContent>

      <TabsContent value="manual" className="space-y-4 mt-4">
        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label className="text-gray-300">QR Code</Label>
            <Input
              placeholder="Scan or paste QR code here..."
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              className="bg-gray-800 border-gray-700 text-white"
              required
              disabled={processing}
              autoFocus
            />
            <p className="text-xs text-gray-500">
              Use a barcode scanner or paste the QR code value
            </p>
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={processing}
          >
            {processing ? 'Processing...' : 'Scan QR Code'}
          </Button>
        </form>
        <div className="bg-gray-800 rounded-lg p-4">
          <p className="text-sm text-gray-400 mb-2">How it works:</p>
          <div className="space-y-1 text-sm text-gray-300">
            <p>• First scan: Check in the member</p>
            <p>• Second scan (same day): Check out the member</p>
            <p>• Only active members can check in</p>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default QRScanner;
