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
  const [availableCameras, setAvailableCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');
  const html5QrCodeRef = useRef(null);
  const scannerRef = useRef(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load available cameras on mount
    loadCameras();
    
    return () => {
      // Cleanup on unmount
      if (html5QrCodeRef.current && scanning) {
        html5QrCodeRef.current.stop().catch(err => console.error('Error stopping scanner:', err));
      }
    };
  }, [scanning]);

  const loadCameras = async () => {
    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices && devices.length > 0) {
        setAvailableCameras(devices);
        
        // Auto-select best camera
        const bestCamera = devices.find(device => {
          const label = device.label.toLowerCase();
          return (label.includes('integrated') || 
                  label.includes('built-in') || 
                  label.includes('facetime') ||
                  label.includes('front') ||
                  label.includes('webcam')) &&
                 !label.includes('eos') &&
                 !label.includes('virtual') &&
                 !label.includes('utility');
        });
        
        setSelectedCameraId(bestCamera ? bestCamera.id : devices[0].id);
      }
    } catch (err) {
      console.error('Error loading cameras:', err);
    }
  };

  const handleQRScan = async (qrCode) => {
    if (processing) return;
    
    setProcessing(true);
    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
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
        console.error('Scan error:', data);
        console.log('Scanned QR code:', qrCode);
        toast({
          title: 'Scan Failed',
          description: data.detail || 'Invalid QR code',
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

      console.log('Available cameras:', devices);

      // Initialize scanner
      const html5QrCode = new Html5Qrcode("qr-reader");
      html5QrCodeRef.current = html5QrCode;

      // Use selected camera or fallback
      const cameraToUse = selectedCameraId || devices[0].id;
      const selectedDevice = devices.find(d => d.id === cameraToUse);
      
      console.log('Using camera:', selectedDevice?.label || cameraToUse);
      toast({
        title: 'Camera Starting',
        description: `Using: ${selectedDevice?.label || 'Selected camera'}`,
      });

      // Start scanning with optimized settings for screen QR codes
      await html5QrCode.start(
        { deviceId: cameraToUse },
        {
          fps: 20, // Increased FPS for better detection
          qrbox: function(viewfinderWidth, viewfinderHeight) {
            // Dynamic QR box size - 70% of the smaller dimension
            let minEdgePercentage = 0.7;
            let minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
            let qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
          disableFlip: false, // Allow flipped QR codes
          formatsToSupport: [ 'QR_CODE' ], // Only scan QR codes
          experimentalFeatures: {
            useBarCodeDetectorIfSupported: true // Use native detector if available
          },
          videoConstraints: {
            facingMode: { ideal: "environment" }, // Prefer rear camera on mobile
            width: { min: 640, ideal: 1920, max: 1920 },
            height: { min: 480, ideal: 1080, max: 1080 },
            focusMode: { ideal: "continuous" }, // Continuous autofocus
            advanced: [
              { zoom: 1.0 },
              { focusDistance: 0.5 }
            ]
          }
        },
        (decodedText) => {
          // Success callback - QR code detected
          console.log('QR Code detected:', decodedText);
          console.log('QR Code length:', decodedText.length);
          console.log('QR Code (trimmed):', decodedText.trim());
          
          // Show what was scanned
          toast({
            title: 'QR Code Detected!',
            description: `Scanned: ${decodedText.substring(0, 30)}...`,
          });
          
          // Use trimmed version to remove any whitespace
          handleQRScan(decodedText.trim());
          handleStopScan();
        },
        (errorMessage) => {
          // Error callback (can be ignored for continuous scanning)
          // This fires frequently while searching for QR codes
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
        errorMsg += 'Please try uploading a QR code image or use manual entry.';
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

  const handleImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setProcessing(true);
    try {
      const html5QrCode = new Html5Qrcode("qr-image-reader");
      
      const result = await html5QrCode.scanFile(file, true);
      
      toast({
        title: 'QR Code Detected',
        description: 'Processing...',
      });
      
      await handleQRScan(result);
      
      // Clear the file input
      event.target.value = '';
    } catch (err) {
      console.error('Error scanning image:', err);
      toast({
        title: 'Error',
        description: 'Could not detect QR code in image. Please try again.',
        variant: 'destructive',
      });
      event.target.value = '';
    } finally {
      setProcessing(false);
    }
  };

  return (
    <>
      <div id="qr-image-reader" style={{ display: 'none' }}></div>
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
                Select your camera and start scanning
              </p>
              {error && (
                <p className="text-red-400 text-sm mb-4 text-center">{error}</p>
              )}
              <div className="flex flex-col gap-3 w-full max-w-md">
                {availableCameras.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-gray-300">Select Camera</Label>
                    <select
                      value={selectedCameraId}
                      onChange={(e) => setSelectedCameraId(e.target.value)}
                      className="w-full bg-gray-900 border border-gray-700 text-white rounded-md px-3 py-2 focus:border-blue-600 focus:outline-none"
                    >
                      {availableCameras.map((camera) => (
                        <option key={camera.id} value={camera.id}>
                          {camera.label || `Camera ${camera.id}`}
                        </option>
                      ))}
                    </select>
                    <p className="text-xs text-gray-500">
                      ⚠️ Avoid virtual cameras like "EOS Webcam Utility"
                    </p>
                  </div>
                )}
                <Button
                  onClick={handleCameraScan}
                  className="bg-blue-600 hover:bg-blue-700 w-full"
                  disabled={!selectedCameraId}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="qr-image-upload"
                  />
                  <Button
                    onClick={() => document.getElementById('qr-image-upload').click()}
                    variant="outline"
                    className="border-gray-700 text-white hover:bg-gray-700 w-full"
                  >
                    Upload QR Image
                  </Button>
                </div>
                {process.env.NODE_ENV === 'development' && (
                  <Button
                    onClick={() => handleQRScan('GYM-c5e6aac2-7d8d-4b3d-a81a-85fbfb718188-68fa91b2')}
                    variant="outline"
                    className="border-green-700 text-green-400 hover:bg-gray-700 w-full text-xs"
                  >
                    🧪 Test Scan (sandhya)
                  </Button>
                )}
              </div>
            </>
          ) : (
            <>
              <div id="qr-reader" ref={scannerRef} className="w-full max-w-md"></div>
              <div className="mt-4 space-y-2 text-center">
                <p className="text-white font-medium">Scanning QR Code...</p>
                <p className="text-gray-400 text-sm">Position the QR code within the frame</p>
                <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-3 text-left">
                  <p className="text-blue-300 text-xs font-semibold mb-1">💡 Tips for scanning from phone screen:</p>
                  <ul className="text-gray-300 text-xs space-y-1">
                    <li>• Increase phone screen brightness to maximum</li>
                    <li>• Hold phone steady, 15-30cm from camera</li>
                    <li>• Avoid glare - tilt phone slightly if needed</li>
                    <li>• Make sure QR code fills most of the scan box</li>
                    <li>• Wait 2-3 seconds for camera to focus</li>
                  </ul>
                </div>
              </div>
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
          Camera access required. Or upload a screenshot/image of the QR code.
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
    </>
  );
};

export default QRScanner;
