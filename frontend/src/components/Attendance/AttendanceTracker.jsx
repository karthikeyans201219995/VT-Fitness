import React, { useState, useEffect } from 'react';
import { attendanceAPI } from '../../services/api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScanLine, Search, Clock, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import QRScanner from './QRScanner';
import { useToast } from '../../hooks/use-toast';

const AttendanceTracker = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      setLoading(true);
      const data = await attendanceAPI.getAll();
      setAttendance(data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendance records',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendance = attendance.filter(
    (record) =>
      record.member_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.member_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDateTime = (dateTime) => {
    if (!dateTime) return { date: 'N/A', time: 'N/A' };
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleScanSuccess = async (data) => {
    // QR scan was successful, refresh attendance list
    setShowScanner(false);
    fetchAttendance();
  };

  const handleCheckout = async (recordId) => {
    try {
      await attendanceAPI.update(recordId, {
        check_out_time: new Date().toISOString()
      });
      toast({
        title: 'Success',
        description: 'Check-out recorded successfully',
      });
      fetchAttendance();
    } catch (error) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to record check-out',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const todayAttendance = attendance.filter(a => {
    const date = new Date(a.check_in_time);
    return date.toDateString() === new Date().toDateString();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Attendance Tracking</h1>
          <p className="text-gray-400">Scan QR codes and track member check-ins</p>
        </div>
        <Dialog open={showScanner} onOpenChange={setShowScanner}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/50">
              <ScanLine className="mr-2 h-4 w-4" />
              Scan QR Code
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-gray-900 border-gray-800">
            <DialogHeader>
              <DialogTitle className="text-white">Scan Membership QR Code</DialogTitle>
            </DialogHeader>
            <QRScanner onScanSuccess={handleScanSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Today's Check-ins</CardTitle>
            <Clock className="h-5 w-5 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{todayAttendance.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Records</CardTitle>
            <Clock className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{attendance.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Currently In Gym</CardTitle>
            <Clock className="h-5 w-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {attendance.filter(a => !a.check_out_time).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Records */}
      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-500" />
              <Input
                placeholder="Search by member name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-gray-800 border-gray-700 text-white placeholder:text-gray-500 focus:border-blue-600"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredAttendance.map((record) => {
              const checkIn = formatDateTime(record.check_in_time);
              const checkOut = formatDateTime(record.check_out_time);
              
              return (
                <div
                  key={record.id}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{record.member_name || `Member: ${record.member_id}`}</h3>
                        <Badge className={record.check_out_time ? 'bg-gray-600' : 'bg-green-600'}>
                          {record.check_out_time ? 'Checked Out' : 'In Gym'}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-gray-400">
                          <span className="font-medium">Check-in:</span> {checkIn.date} at {checkIn.time}
                        </div>
                        <div className="text-gray-400">
                          <span className="font-medium">Check-out:</span> {checkOut.date} at {checkOut.time}
                        </div>
                      </div>
                    </div>
                    {!record.check_out_time && (
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => handleCheckout(record.id)}
                      >
                        Check Out
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          {filteredAttendance.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              No attendance records found.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AttendanceTracker;
