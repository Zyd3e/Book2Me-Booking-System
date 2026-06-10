import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import { FaHome, FaCalendar, FaDollarSign, FaUsers } from 'react-icons/fa';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [revenueData, setRevenueData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const [analyticsRes, revenueRes] = await Promise.all([
        apiClient.get('/admin/analytics/overview'),
        apiClient.get('/admin/analytics/revenue?days=30'),
      ]);
      setAnalytics(analyticsRes.data);
      setRevenueData(revenueRes.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading || !analytics) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const StatCard = ({ icon: Icon, title, value, color }) => (
    <div className={`bg-white rounded-lg shadow-md p-6 border-l-4 ${color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-semibold">{title}</p>
          <p className="text-2xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <Icon className="text-3xl opacity-20" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title="Admin Dashboard" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={FaDollarSign}
            title="Total Revenue"
            value={`$${analytics.total_revenue.toFixed(2)}`}
            color="border-blue-600"
          />
          <StatCard
            icon={FaHome}
            title="Occupancy Rate"
            value={`${analytics.room_occupancy_rate}%`}
            color="border-green-600"
          />
          <StatCard
            icon={FaCalendar}
            title="Active Bookings"
            value={analytics.active_room_bookings + analytics.active_hall_bookings}
            color="border-purple-600"
          />
          <StatCard
            icon={FaUsers}
            title="Total Users"
            value={analytics.total_users}
            color="border-orange-600"
          />
        </div>

        {/* Navigation Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <button
            onClick={() => navigate('/admin/rooms')}
            className="bg-white hover:shadow-lg rounded-lg shadow-md p-4 text-left transition"
          >
            <h3 className="text-lg font-bold text-gray-800">Manage Rooms</h3>
            <p className="text-sm text-gray-600 mt-1">Add, edit, or delete rooms</p>
          </button>
          <button
            onClick={() => navigate('/admin/halls')}
            className="bg-white hover:shadow-lg rounded-lg shadow-md p-4 text-left transition"
          >
            <h3 className="text-lg font-bold text-gray-800">Manage Halls</h3>
            <p className="text-sm text-gray-600 mt-1">Add, edit, or delete event spaces</p>
          </button>
          <button
            onClick={() => navigate('/admin/bookings')}
            className="bg-white hover:shadow-lg rounded-lg shadow-md p-4 text-left transition"
          >
            <h3 className="text-lg font-bold text-gray-800">View Bookings</h3>
            <p className="text-sm text-gray-600 mt-1">Manage all room and hall bookings</p>
          </button>
          <button
            onClick={() => navigate('/admin/users')}
            className="bg-white hover:shadow-lg rounded-lg shadow-md p-4 text-left transition"
          >
            <h3 className="text-lg font-bold text-gray-800">Users</h3>
            <p className="text-sm text-gray-600 mt-1">Manage system users and roles</p>
          </button>
        </div>

        {/* Revenue Chart */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Revenue Trend (Last 30 Days)</h2>
          {revenueData.room_revenue && revenueData.room_revenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData.room_revenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" name="Revenue" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600">No revenue data available</p>
          )}
        </div>
      </div>
    </div>
  );
}
