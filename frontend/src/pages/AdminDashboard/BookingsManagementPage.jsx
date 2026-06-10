import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';

export default function BookingsManagementPage() {
  const [roomBookings, setRoomBookings] = useState([]);
  const [hallBookings, setHallBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const params = statusFilter ? { status: statusFilter } : {};
      const [roomRes, hallRes] = await Promise.all([
        apiClient.get('/admin/bookings/rooms/all', { params }),
        apiClient.get('/admin/bookings/halls/all', { params }),
      ]);
      setRoomBookings(roomRes.data.bookings);
      setHallBookings(hallRes.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus, type) => {
    try {
      const endpoint = type === 'room' 
        ? `/admin/bookings/rooms/${bookingId}/status`
        : `/admin/bookings/halls/${bookingId}/status`;
      
      await apiClient.put(endpoint, { status: newStatus });
      alert('Booking status updated');
      fetchBookings();
    } catch (error) {
      alert('Error updating status');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getStatusBadgeColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      confirmed: 'bg-blue-100 text-blue-800',
      checked_in: 'bg-green-100 text-green-800',
      checked_out: 'bg-gray-100 text-gray-800',
      cancelled: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title="Manage Bookings" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Dashboard
          </button>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="checked_in">Checked In</option>
            <option value="checked_out">Checked Out</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'rooms'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            Room Bookings ({roomBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('halls')}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              activeTab === 'halls'
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-800 hover:bg-gray-100'
            }`}
          >
            Hall Bookings ({hallBookings.length})
          </button>
        </div>

        {/* Room Bookings */}
        {activeTab === 'rooms' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : roomBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Booking ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Guest</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Room</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Check-in</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Check-out</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Total</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {roomBookings.map((booking) => (
                      <tr key={booking.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4">#{booking.id}</td>
                        <td className="px-6 py-4">{booking.user?.first_name} {booking.user?.last_name}</td>
                        <td className="px-6 py-4">{booking.room?.room_number}</td>
                        <td className="px-6 py-4">{booking.check_in_date}</td>
                        <td className="px-6 py-4">{booking.check_out_date}</td>
                        <td className="px-6 py-4 font-semibold">${booking.total_price}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value, 'room')}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checked_in">Checked In</option>
                            <option value="checked_out">Checked Out</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No room bookings</p>
              </div>
            )}
          </div>
        )}

        {/* Hall Bookings */}
        {activeTab === 'halls' && (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : hallBookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Booking ID</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Guest</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Hall</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Event Date</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Time</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Total</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Status</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-800">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallBookings.map((booking) => (
                      <tr key={booking.id} className="border-t hover:bg-gray-50">
                        <td className="px-6 py-4">#{booking.id}</td>
                        <td className="px-6 py-4">{booking.user?.first_name} {booking.user?.last_name}</td>
                        <td className="px-6 py-4">{booking.hall?.hall_name}</td>
                        <td className="px-6 py-4">{booking.event_date}</td>
                        <td className="px-6 py-4">{booking.start_time} - {booking.end_time}</td>
                        <td className="px-6 py-4 font-semibold">${booking.total_price.toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <select
                            value={booking.status}
                            onChange={(e) => handleStatusChange(booking.id, e.target.value, 'hall')}
                            className="px-2 py-1 border border-gray-300 rounded text-xs"
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="checked_in">Checked In</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-gray-600">No hall bookings</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
