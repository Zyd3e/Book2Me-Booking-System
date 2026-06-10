import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import { FaSearch, FaFilter } from 'react-icons/fa';

export default function RoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    room_type: '',
    min_capacity: '',
    max_price: '',
    check_in: '',
    check_out: '',
  });
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/rooms', { params: filterParams });
      setRooms(response.data.rooms);
      setFilteredRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyFilters = () => {
    const params = Object.fromEntries(Object.entries(filters).filter(([_, v]) => v));
    fetchRooms(params);
  };

  const handleBookRoom = (roomId) => {
    navigate(`/customer/book-room/${roomId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title="Room Booking" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaFilter /> Filters
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <select
              name="room_type"
              value={filters.room_type}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Room Type</option>
              <option value="Single">Single</option>
              <option value="Double">Double</option>
              <option value="Suite">Suite</option>
            </select>

            <input
              type="number"
              name="min_capacity"
              placeholder="Min Capacity"
              value={filters.min_capacity}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="number"
              name="max_price"
              placeholder="Max Price"
              value={filters.max_price}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="date"
              name="check_in"
              value={filters.check_in}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="date"
              name="check_out"
              value={filters.check_out}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleApplyFilters}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition flex items-center gap-2"
          >
            <FaSearch /> Apply Filters
          </button>
        </div>

        {/* Rooms Grid */}
        <div>
          {loading ? (
            <div className="text-center py-12">Loading rooms...</div>
          ) : filteredRooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRooms.map((room) => (
                <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="bg-gradient-to-r from-blue-400 to-blue-600 h-48 flex items-center justify-center">
                    <span className="text-white text-4xl font-bold">{room.room_number}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{room.room_type}</h3>
                    <p className="text-gray-600 text-sm mb-3">{room.description}</p>

                    <div className="mb-3 space-y-1">
                      <p className="text-sm"><span className="font-semibold">Capacity:</span> {room.capacity} guests</p>
                      <p className="text-sm"><span className="font-semibold">Floor:</span> {room.floor}</p>
                      <p className="text-sm"><span className="font-semibold">Price:</span> ${room.price_per_night}/night</p>
                    </div>

                    {room.amenities && room.amenities.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold">Amenities:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {room.amenities.map((amenity, idx) => (
                            <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleBookRoom(room.id)}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-lg transition"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600 text-lg">No rooms available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
