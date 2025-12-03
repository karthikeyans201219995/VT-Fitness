import React, { useState } from 'react';
import { mockAttendance, mockMembers } from '../../mockData';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { ScanLine, Search, Clock } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import QRScanner from './QRScanner';

const AttendanceTracker = () => {
  const [attendance, setAttendance] = useState(mockAttendance);
  const [searchQuery, setSearchQuery] = useState('');
  const [showScanner, setShowScanner] = useState(false);

  const filteredAttendance = attendance.filter(
    (record) =>
      record.memberName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.memberId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const handleScanSuccess = (data) => {
    try {
      const memberData = JSON.parse(data);
      const member = mockMembers.find(m => m.memberId === memberData.memberId);
      
      if (member) {
        const newRecord = {
          id: `A${attendance.length + 1}`,
          memberId: member.memberId,
          memberName: member.name,
          checkInTime: new Date().toISOString(),
          checkOutTime: null
        };
        setAttendance([newRecord, ...attendance]);
        setShowScanner(false);
      }
    } catch (error) {
      console.error('Invalid QR code data');
    }
  };

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
            <div className="text-3xl font-bold text-white">
              {attendance.filter(a => {
                const date = new Date(a.checkInTime);
                return date.toDateString() === new Date().toDateString();
              }).length}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">This Week</CardTitle>
            <Clock className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{attendance.length}</div>
          </CardContent>
        </Card>
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Active Now</CardTitle>
            <Clock className="h-5 w-5 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">
              {attendance.filter(a => !a.checkOutTime).length}
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
          <div className="space-y-3">
            {filteredAttendance.map((record) => {
              const checkIn = formatDateTime(record.checkInTime);
              const checkOut = record.checkOutTime ? formatDateTime(record.checkOutTime) : null;
              
              return (
                <div
                  key={record.id}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700 hover:border-blue-600 transition-all duration-200"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-semibold text-white">{record.memberName}</h3>
                        <Badge className="bg-blue-600">ID: {record.memberId}</Badge>
                        {!checkOut && (
                          <Badge className="bg-green-600">Active</Badge>
                        )}
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div>
                          <span className="text-gray-400">Check-in: </span>
                          <span className="text-white font-medium">
                            {checkIn.date} at {checkIn.time}
                          </span>
                        </div>
                        {checkOut && (
                          <div>
                            <span className="text-gray-400">Check-out: </span>
                            <span className="text-white font-medium">
                              {checkOut.date} at {checkOut.time}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
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
