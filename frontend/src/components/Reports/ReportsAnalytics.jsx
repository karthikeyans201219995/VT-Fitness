import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { reportsAPI } from '../../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users, DollarSign, Calendar, Loader2 } from 'lucide-react';
import { useToast } from '../../hooks/use-toast';

const StatCard = ({ title, value, icon: Icon, color, trend }) => (
  <Card className="bg-gray-900 border-gray-800">
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

const ReportsAnalytics = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [memberStats, setMemberStats] = useState(null);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [dashboardData, revenueData, attendanceData, membersData, paymentsData] = await Promise.all([
        reportsAPI.getDashboard(),
        reportsAPI.getRevenue({ days: 30 }),
        reportsAPI.getAttendance({ days: 7 }),
        reportsAPI.getMembers(),
        fetch(`${process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001'}/api/reports/charts/payment-methods`)
          .then(res => res.json())
      ]);

      setStats(dashboardData);
      setMemberStats(membersData);
      
      // Format revenue trend for chart (last 7 days)
      const last7Days = Object.entries(revenueData.daily_data || {})
        .slice(-7)
        .map(([date, amount]) => ({
          date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          revenue: amount
        }));
      setRevenueTrend(last7Days);

      // Format attendance trend for chart
      const attendanceChart = Object.entries(attendanceData.attendance_by_date || {})
        .map(([date, count]) => ({
          day: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
          count: count
        }));
      setAttendanceTrend(attendanceChart);

      // Format payment methods
      if (paymentsData.success) {
        setPaymentMethods(paymentsData.data);
      }

    } catch (error) {
      console.error('Error fetching reports data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load reports data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  const membershipDistribution = [
    { name: 'Active', value: stats.active_members, color: '#10B981' },
    { name: 'Inactive', value: stats.total_members - stats.active_members, color: '#EF4444' }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Reports & Analytics</h1>
        <p className="text-gray-400">Real-time insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-6 md:grid-cols-4">
        <StatCard
          title="Total Members"
          value={stats.total_members}
          icon={Users}
          color="bg-blue-600"
          trend={`${stats.active_members} active`}
        />
        <StatCard
          title="Active Members"
          value={stats.active_members}
          icon={TrendingUp}
          color="bg-green-600"
          trend={`${((stats.active_members / stats.total_members) * 100).toFixed(0)}% of total`}
        />
        <StatCard
          title="Monthly Revenue"
          value={`$${stats.monthly_revenue.toFixed(2)}`}
          icon={DollarSign}
          color="bg-purple-600"
          trend="This month"
        />
        <StatCard
          title="Today's Check-ins"
          value={stats.today_attendance}
          icon={Calendar}
          color="bg-orange-600"
          trend="Today"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Weekly Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="day" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                <Bar dataKey="count" fill="#3B82F6" radius={[8, 8, 0, 0]} name="Check-ins" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend (Last 7 Days)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="date" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ fill: '#10B981', r: 5 }}
                  name="Revenue ($)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Membership Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={membershipDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value, percent }) => `${name}: ${value} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {membershipDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Revenue by Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={paymentMethods}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="method" stroke="#9CA3AF" />
                <YAxis stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1F2937',
                    border: '1px solid #374151',
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#9CA3AF' }} />
                <Bar dataKey="total" fill="#8B5CF6" radius={[8, 8, 0, 0]} name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      {memberStats && (
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Membership Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(memberStats.by_status || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center">
                    <span className="text-gray-400 capitalize">{status}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Gender Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(memberStats.by_gender || {}).map(([gender, count]) => (
                  <div key={gender} className="flex justify-between items-center">
                    <span className="text-gray-400 capitalize">{gender.replace('_', ' ')}</span>
                    <span className="text-white font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-900 border-gray-800">
            <CardHeader>
              <CardTitle className="text-white">Expiring Soon</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Within 30 days</span>
                  <span className="text-orange-400 font-bold text-2xl">{memberStats.expiring_soon}</span>
                </div>
                <p className="text-xs text-gray-500">Members whose membership expires soon</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ReportsAnalytics;
