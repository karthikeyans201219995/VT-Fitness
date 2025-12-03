import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, DollarSign, TrendingUp, AlertCircle, UserCheck } from 'lucide-react';
import { mockDashboardStats, mockAttendanceChart, mockRevenueChart, mockMembers } from '../../mockData';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <Card className="bg-gray-900 border-gray-800 hover:border-blue-600 transition-all duration-200">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-gray-400">{title}</CardTitle>
      <div className={`p-2 rounded-lg ${color}`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-3xl font-bold text-white">{value}</div>
      {trend && <p className="text-xs text-gray-400 mt-2">{trend}</p>}
    </CardContent>
  </Card>
);

const Dashboard = () => {
  const { user, isAdmin, isTrainer, isMember } = useAuth();
  const stats = mockDashboardStats;

  if (isMember) {
    const memberData = mockMembers.find(m => m.email === user.email) || mockMembers[0];
    
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, {user.name}!</h1>
          <p className="text-gray-400">Track your fitness journey</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Membership Status"
            value={memberData.status === 'active' ? 'Active' : 'Expired'}
            icon={UserCheck}
            color={memberData.status === 'active' ? 'bg-green-600' : 'bg-red-600'}
            trend={`Valid until ${memberData.validUntil}`}
          />
          <StatCard
            title="Current Plan"
            value={memberData.plan}
            icon={TrendingUp}
            color="bg-blue-600"
          />
          <StatCard
            title="Last Check-in"
            value={memberData.lastCheckIn}
            icon={AlertCircle}
            color="bg-purple-600"
          />
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Membership Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Member ID</span>
              <span className="text-white font-medium">{memberData.memberId}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Join Date</span>
              <span className="text-white font-medium">{memberData.joinDate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-gray-800">
              <span className="text-gray-400">Blood Group</span>
              <span className="text-white font-medium">{memberData.bloodGroup}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-gray-400">Emergency Contact</span>
              <span className="text-white font-medium">{memberData.emergencyContact}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">
          {isAdmin ? 'Admin Dashboard' : 'Trainer Dashboard'}
        </h1>
        <p className="text-gray-400">Overview of gym operations</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.totalMembers}
          icon={Users}
          color="bg-blue-600"
          trend={`+${stats.newMembersThisMonth} this month`}
        />
        <StatCard
          title="Active Members"
          value={stats.activeMembers}
          icon={UserCheck}
          color="bg-green-600"
        />
        {isAdmin && (
          <>
            <StatCard
              title="Monthly Revenue"
              value={`$${stats.monthlyRevenue}`}
              icon={DollarSign}
              color="bg-purple-600"
              trend="+12% from last month"
            />
            <StatCard
              title="Today's Check-ins"
              value={stats.todayCheckIns}
              icon={TrendingUp}
              color="bg-orange-600"
            />
          </>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Weekly Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockAttendanceChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={mockRevenueChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6', r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {isAdmin && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-orange-500" />
                Expiring This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">{stats.expiringThisWeek} Members</div>
              <p className="text-sm text-gray-400">Reach out for renewals</p>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <AlertCircle className="mr-2 h-5 w-5 text-red-500" />
                Pending Payments
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white mb-2">{stats.pendingPayments} Payments</div>
              <p className="text-sm text-gray-400">Follow up required</p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
