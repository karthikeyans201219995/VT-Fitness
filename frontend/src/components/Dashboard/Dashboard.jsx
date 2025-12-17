import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Users, DollarSign, TrendingUp, AlertCircle, UserCheck, Loader2 } from 'lucide-react';
import { reportsAPI, membersAPI } from '../../services/api';
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
  const [dashboardData, setDashboardData] = useState(null);
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      if (isMember) {
        // Fetch member-specific data
        const members = await membersAPI.getAll();
        const myData = members.find(m => m.email === user?.email);
        setMemberData(myData);
      } else {
        // Fetch admin/trainer dashboard stats
        const stats = await reportsAPI.getDashboard();
        setDashboardData(stats);
      }
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (isMember) {
    if (!memberData) {
      return (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Welcome Back, {user?.full_name || user?.name}!</h1>
            <p className="text-gray-400">Track your fitness journey</p>
          </div>
          <Card className="bg-gray-900 border-gray-800">
            <CardContent className="py-8">
              <p className="text-center text-gray-400">No membership data found. Please contact your gym administrator.</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    return (
      <div className="space-y-4 sm:space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Welcome Back, {memberData.full_name}!</h1>
          <p className="text-sm sm:text-base text-gray-400">Track your fitness journey</p>
        </div>

        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          <StatCard
            title="Membership Status"
            value={memberData.status === 'active' ? 'Active' : memberData.status === 'inactive' ? 'Inactive' : 'Expired'}
            icon={UserCheck}
            color={memberData.status === 'active' ? 'bg-green-600' : memberData.status === 'inactive' ? 'bg-yellow-600' : 'bg-red-600'}
            trend={`Valid until ${new Date(memberData.end_date).toLocaleDateString()}`}
          />
          <StatCard
            title="Join Date"
            value={new Date(memberData.start_date).toLocaleDateString()}
            icon={TrendingUp}
            color="bg-blue-600"
          />
          <StatCard
            title="Member Since"
            value={`${Math.floor((new Date() - new Date(memberData.start_date)) / (1000 * 60 * 60 * 24))} days`}
            icon={AlertCircle}
            color="bg-purple-600"
          />
        </div>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-lg sm:text-xl">Membership Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-800 gap-1">
              <span className="text-gray-400 text-sm">Email</span>
              <span className="text-white font-medium text-sm break-all">{memberData.email}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-800 gap-1">
              <span className="text-gray-400 text-sm">Phone</span>
              <span className="text-white font-medium text-sm">{memberData.phone}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 border-b border-gray-800 gap-1">
              <span className="text-gray-400 text-sm">Blood Group</span>
              <span className="text-white font-medium text-sm">{memberData.blood_group || 'N/A'}</span>
            </div>
            <div className="flex flex-col sm:flex-row sm:justify-between py-2 gap-1">
              <span className="text-gray-400 text-sm">Emergency Contact</span>
              <span className="text-white font-medium text-sm">{memberData.emergency_contact} ({memberData.emergency_phone})</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">
          {isAdmin ? 'Admin Dashboard' : 'Trainer Dashboard'}
        </h1>
        <p className="text-sm sm:text-base text-gray-400">Overview of gym operations</p>
      </div>

      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Members"
          value={dashboardData?.total_members || 0}
          icon={Users}
          color="bg-blue-600"
          trend={dashboardData?.new_members_this_month ? `+${dashboardData.new_members_this_month} this month` : ''}
        />
        <StatCard
          title="Active Members"
          value={dashboardData?.active_members || 0}
          icon={UserCheck}
          color="bg-green-600"
        />
        {isAdmin && (
          <>
            <StatCard
              title="Monthly Revenue"
              value={`$${dashboardData?.monthly_revenue || 0}`}
              icon={DollarSign}
              color="bg-purple-600"
              trend={dashboardData?.revenue_trend || ''}
            />
            <StatCard
              title="Today's Check-ins"
              value={dashboardData?.today_checkins || 0}
              icon={TrendingUp}
              color="bg-orange-600"
            />
          </>
        )}
      </div>

      {dashboardData?.attendance_chart && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Weekly Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={dashboardData.attendance_chart}>
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

          {isAdmin && dashboardData?.revenue_chart && (
            <Card className="bg-gray-900 border-gray-800">
              <CardHeader>
                <CardTitle className="text-white">Revenue Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={dashboardData.revenue_chart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="month" stroke="#9CA3AF" />
                    <YAxis stroke="#9CA3AF" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151', borderRadius: '8px' }}
                      labelStyle={{ color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
