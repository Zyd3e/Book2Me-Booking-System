import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import Navbar from '../../components/Navbar';

export default function BookRoomPage() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState({
    check_in_date: '',
    check_out_date: '',
    number_of_guests: 1,
    special_requests: '',
  });
  const [error, setError] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchRoom();
  }, [roomId]);

  useEffect(() => {
    calculatePrice();
  }, [booking.check_in_date, booking.check_out_date]);

  const fetchRoom = async () => {
    try {
      const response = await apiClient.get(`/rooms/${roomId}`);
      setRoom(response.data.room);
    } catch (error) {
      setError('Failed to load room details');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const calculatePrice = () => {
    if (booking.check_in_date && booking.check_out_date && room) {
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const nights = Math.max(0, (checkOut - checkIn) / (1000 * 60 * 60 * 24));
      setTotalPrice(nights * room.price_per_night);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBooking((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await apiClient.post('/bookings/rooms', {
        room_id: parseInt(roomId),
        ...booking,
        number_of_guests: parseInt(booking.number_of_guests),
      });

      alert('Room booking successful!');
      navigate('/customer/bookings');
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!room) {
    return <div className="text-center py-12">Room not found</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title="Book Room" onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto p-6">
        <button
          onClick={() => navigate('/customer/rooms')}
          className="mb-4 text-blue-600 hover:text-blue-700 font-semibold"
        >
          ← Back to Rooms
        </button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Room Details */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-64 flex items-center justify-center rounded-lg mb-4">
              <span className="text-white text-6xl font-bold">{room.room_number}</span>
            </div>

            <h1 className="text-2xl font-bold text-gray-800 mb-2">{room.room_type}</h1>
            <p className="text-gray-600 mb-4">{room.description}</p>

            <div className="space-y-2 mb-4">
              <p><span className="font-semibold">Capacity:</span> {room.capacity} guests</p>
              <p><span className="font-semibold">Floor:</span> {room.floor}</p>
              <p><span className="font-semibold">Price:</span> ${room.price_per_night}/night</p>
            </div>

            {room.amenities && room.amenities.length > 0 && (
              <div>
                <p className="font-semibold mb-2">Amenities:</p>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((amenity, idx) => (
                    <span key={idx} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Booking Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Booking Details</h2>

            {error && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitBooking}>
              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Check-in Date</label>
                <input
                  type="date"
                  name="check_in_date"
                  value={booking.check_in_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Check-out Date</label>
                <input
                  type="date"
                  name="check_out_date"
                  value={booking.check_out_date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Number of Guests</label>
                <input
                  type="number"
                  name="number_of_guests"
                  min="1"
                  max={room.capacity}
                  value={booking.number_of_guests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">Special Requests</label>
                <textarea
                  name="special_requests"
                  value={booking.special_requests}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  rows="3"
                />
              </div>

              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <p className="text-lg font-bold text-gray-800">Total Price: ${totalPrice.toFixed(2)}</p>
              </div>

              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                Confirm Booking
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
