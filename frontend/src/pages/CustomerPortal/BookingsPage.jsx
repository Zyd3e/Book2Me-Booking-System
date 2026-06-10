import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import { FaCalendarAlt, FaUsers, FaMapPin } from 'react-icons/fa';

export default function BookingsPage() {
  const [roomBookings, setRoomBookings] = useState([]);
  const [hallBookings, setHallBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('rooms');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const [roomRes, hallRes] = await Promise.all([
        apiClient.get('/bookings/rooms'),
        apiClient.get('/bookings/halls'),
      ]);
      setRoomBookings(roomRes.data.bookings);
      setHallBookings(hallRes.data.bookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCancelBooking = async (bookingId, type) => {
    if (window.confirm('Are you sure you want to cancel this booking?')) {
      try {
        const endpoint = type === 'room' ? `/bookings/rooms/${bookingId}/cancel` : `/bookings/halls/${bookingId}/cancel`;
        await apiClient.post(endpoint);
        alert('Booking cancelled successfully');
        fetchBookings();
      } catch (error) {
        alert('Error cancelling booking');
      }
    }
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
      <Navbar title="My Bookings" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Navigation Tabs */}
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
          <div>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : roomBookings.length > 0 ? (
              <div className="space-y-4">
                {roomBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">
                          Room {booking.room?.room_number} - {booking.room?.room_type}
                        </h3>
                        <p className="text-sm text-gray-600">{booking.room?.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Check-in</p>
                          <p className="font-semibold">{booking.check_in_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Check-out</p>
                          <p className="font-semibold">{booking.check_out_date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Guests</p>
                          <p className="font-semibold">{booking.number_of_guests}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Price</p>
                        <p className="font-semibold text-lg text-blue-600">${booking.total_price}</p>
                      </div>
                    </div>

                    {booking.special_requests && (
                      <div className="mb-4 p-3 bg-gray-50 rounded">
                        <p className="text-sm"><span className="font-semibold">Special Requests:</span> {booking.special_requests}</p>
                      </div>
                    )}

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id, 'room')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg">No room bookings yet</p>
              </div>
            )}
          </div>
        )}

        {/* Hall Bookings */}
        {activeTab === 'halls' && (
          <div>
            {loading ? (
              <div className="text-center py-12">Loading...</div>
            ) : hallBookings.length > 0 ? (
              <div className="space-y-4">
                {hallBookings.map((booking) => (
                  <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-800">{booking.hall?.hall_name}</h3>
                        <p className="text-sm text-gray-600">{booking.event_type}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(booking.status)}`}>
                        {booking.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Date</p>
                          <p className="font-semibold">{booking.event_date}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Time</p>
                        <p className="font-semibold">{booking.start_time} - {booking.end_time}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <FaUsers className="text-blue-600" />
                        <div>
                          <p className="text-xs text-gray-600">Expected Guests</p>
                          <p className="font-semibold">{booking.expected_guests}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600">Total Price</p>
                        <p className="font-semibold text-lg text-blue-600">${booking.total_price.toFixed(2)}</p>
                      </div>
                    </div>

                    {booking.status === 'pending' && (
                      <button
                        onClick={() => handleCancelBooking(booking.id, 'hall')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition"
                      >
                        Cancel Booking
                      </button>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg">No hall bookings yet</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
