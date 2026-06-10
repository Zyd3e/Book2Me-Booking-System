import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import { FaSearch, FaFilter } from 'react-icons/fa';

export default function HallsPage() {
  const [halls, setHalls] = useState([]);
  const [filteredHalls, setFilteredHalls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    hall_type: '',
    min_capacity: '',
    max_price: '',
    event_date: '',
  });
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async (filterParams = {}) => {
    try {
      setLoading(true);
      const response = await apiClient.get('/halls', { params: filterParams });
      setHalls(response.data.halls);
      setFilteredHalls(response.data.halls);
    } catch (error) {
      console.error('Error fetching halls:', error);
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
    fetchHalls(params);
  };

  const handleBookHall = (hallId) => {
    navigate(`/customer/book-hall/${hallId}`);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title="Hall Booking" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-6">
        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <FaFilter /> Filters
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <select
              name="hall_type"
              value={filters.hall_type}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            >
              <option value="">Hall Type</option>
              <option value="Conference">Conference</option>
              <option value="Banquet">Banquet</option>
              <option value="Wedding">Wedding</option>
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
              placeholder="Max Price/Hour"
              value={filters.max_price}
              onChange={handleFilterChange}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
            />

            <input
              type="date"
              name="event_date"
              value={filters.event_date}
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

        {/* Halls Grid */}
        <div>
          {loading ? (
            <div className="text-center py-12">Loading halls...</div>
          ) : filteredHalls.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHalls.map((hall) => (
                <div key={hall.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                  <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-48 flex items-center justify-center">
                    <span className="text-white text-3xl font-bold text-center px-4">{hall.hall_name}</span>
                  </div>
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-gray-800 mb-2">{hall.hall_type}</h3>
                    <p className="text-gray-600 text-sm mb-3">{hall.description}</p>

                    <div className="mb-3 space-y-1">
                      <p className="text-sm"><span className="font-semibold">Capacity:</span> {hall.capacity} guests</p>
                      <p className="text-sm"><span className="font-semibold">Price:</span> ${hall.price_per_hour}/hour</p>
                    </div>

                    {hall.amenities && hall.amenities.length > 0 && (
                      <div className="mb-3">
                        <p className="text-sm font-semibold">Amenities:</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {hall.amenities.map((amenity, idx) => (
                            <span key={idx} className="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      onClick={() => handleBookHall(hall.id)}
                      className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 rounded-lg transition"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-lg">
              <p className="text-gray-600 text-lg">No halls available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
