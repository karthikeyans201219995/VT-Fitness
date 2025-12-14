import React, { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import api from '../../services/api';

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

const DashboardCharts = ({ days = 30 }) => {
  const [revenueTrend, setRevenueTrend] = useState([]);
  const [attendanceTrend, setAttendanceTrend] = useState([]);
  const [memberGrowth, setMemberGrowth] = useState([]);
  const [classPopularity, setClassPopularity] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchChartData();
  }, [days]);

  const fetchChartData = async () => {
    setLoading(true);
    try {
      // Fetch all chart data
      const [revenue, attendance, growth, classes, payments] = await Promise.all([
        api.get(`/api/reports/charts/revenue-trend?days=${days}`),
        api.get(`/api/reports/charts/attendance-trend?days=${days}`),
        api.get(`/api/reports/charts/member-growth?months=6`),
        api.get(`/api/reports/charts/class-popularity`),
        api.get(`/api/reports/charts/payment-methods`)
      ]);

      setRevenueTrend(revenue.data?.data || []);
      setAttendanceTrend(attendance.data?.data || []);
      setMemberGrowth(growth.data?.data || []);
      setClassPopularity(classes.data?.data || []);
      setPaymentMethods(payments.data?.data || []);
    } catch (error) {
      console.error('Error fetching chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-64 bg-gray-100 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Revenue Trend */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue Trend (Last {days} Days)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={revenueTrend}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip 
              formatter={(value) => [`$${value.toFixed(2)}`, 'Revenue']}
              labelFormatter={(date) => new Date(date).toLocaleDateString()}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#4F46E5" 
              strokeWidth={2}
              dot={{ fill: '#4F46E5', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Attendance Trend */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Attendance Trend (Last {days} Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={attendanceTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis 
                dataKey="date"
                tick={{ fontSize: 12 }}
                tickFormatter={(date) => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value) => [value, 'Visits']}
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <Bar dataKey="attendance" fill="#10B981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        {/* Member Growth */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Member Growth (Last 6 Months)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={memberGrowth}>
              <defs>
                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area 
                type="monotone" 
                dataKey="total" 
                stroke="#4F46E5" 
                fillOpacity={1} 
                fill="url(#colorTotal)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Class Popularity */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Most Popular Classes</h3>
          {classPopularity.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={classPopularity.slice(0, 6)}
                  dataKey="bookings"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {classPopularity.slice(0, 6).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [value, 'Bookings']} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No class booking data available
            </div>
          )}
        </Card>

        {/* Payment Methods */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Payment Methods Distribution</h3>
          {paymentMethods.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={paymentMethods} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="method" width={100} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, 'Total']} />
                <Bar dataKey="total" fill="#F59E0B" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              No payment data available
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default DashboardCharts;
