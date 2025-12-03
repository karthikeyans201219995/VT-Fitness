import React from 'react';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { User, Mail, Phone, MapPin, Calendar, Heart, AlertTriangle } from 'lucide-react';

const MemberDetails = ({ member }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between pb-4 border-b border-gray-800">
        <div>
          <h2 className="text-2xl font-bold text-white">{member.name}</h2>
          <p className="text-gray-400">Member ID: {member.memberId}</p>
        </div>
        <Badge className={member.status === 'active' ? 'bg-green-600' : 'bg-red-600'}>
          {member.status}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <Mail className="mr-3 h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Email</p>
                  <p className="text-white">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-300">
                <Phone className="mr-3 h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Phone</p>
                  <p className="text-white">{member.phone}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-300">
                <MapPin className="mr-3 h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Address</p>
                  <p className="text-white">{member.address}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center text-gray-300">
                <User className="mr-3 h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Age & Gender</p>
                  <p className="text-white">{member.age} years, {member.gender}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-300">
                <Heart className="mr-3 h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Blood Group</p>
                  <p className="text-white">{member.bloodGroup}</p>
                </div>
              </div>
              <div className="flex items-center text-gray-300">
                <AlertTriangle className="mr-3 h-5 w-5 text-blue-400" />
                <div>
                  <p className="text-xs text-gray-500">Emergency Contact</p>
                  <p className="text-white">{member.emergencyContact}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-white mb-4">Membership Information</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-gray-500 mb-1">Current Plan</p>
              <p className="text-white font-medium">{member.plan}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Join Date</p>
              <p className="text-white font-medium">{member.joinDate}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Valid Until</p>
              <p className="text-white font-medium">{member.validUntil}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500 mb-1">Last Check-in</p>
              <p className="text-white font-medium">{member.lastCheckIn}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MemberDetails;
