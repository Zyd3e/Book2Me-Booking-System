import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ManageHallsPage() {
  const [halls, setHalls] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    hall_name: '',
    hall_type: 'Conference',
    capacity: 1,
    price_per_hour: 0,
    description: '',
    amenities: [],
  });
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchHalls();
  }, []);

  const fetchHalls = async () => {
    try {
      const response = await apiClient.get('/halls');
      setHalls(response.data.halls);
    } catch (error) {
      console.error('Error fetching halls:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingHall) {
        await apiClient.put(`/halls/${editingHall.id}`, formData);
        alert('Hall updated successfully');
      } else {
        await apiClient.post('/halls', formData);
        alert('Hall created successfully');
      }
      setShowForm(false);
      setEditingHall(null);
      resetForm();
      fetchHalls();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Operation failed'));
    }
  };

  const handleEditHall = (hall) => {
    setEditingHall(hall);
    setFormData({
      hall_name: hall.hall_name,
      hall_type: hall.hall_type,
      capacity: hall.capacity,
      price_per_hour: hall.price_per_hour,
      description: hall.description || '',
      amenities: hall.amenities || [],
    });
    setShowForm(true);
  };

  const handleDeleteHall = async (hallId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiClient.delete(`/halls/${hallId}`);
        alert('Hall deleted successfully');
        fetchHalls();
      } catch (error) {
        alert('Error deleting hall');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      hall_name: '',
      hall_type: 'Conference',
      capacity: 1,
      price_per_hour: 0,
      description: '',
      amenities: [],
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar title="Manage Halls" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="text-blue-600 hover:text-blue-700 font-semibold"
          >
            ← Back to Dashboard
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingHall(null);
              resetForm();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FaPlus /> {showForm ? 'Cancel' : 'Add Hall'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingHall ? 'Edit Hall' : 'Create New Hall'}
            </h2>
            <form onSubmit={handleSubmitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="hall_name"
                placeholder="Hall Name"
                value={formData.hall_name}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
                disabled={!!editingHall}
              />

              <select
                name="hall_type"
                value={formData.hall_type}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Conference">Conference</option>
                <option value="Banquet">Banquet</option>
                <option value="Wedding">Wedding</option>
                <option value="Corporate">Corporate</option>
              </select>

              <input
                type="number"
                name="capacity"
                placeholder="Capacity"
                value={formData.capacity}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
                min="1"
              />

              <input
                type="number"
                name="price_per_hour"
                placeholder="Price per Hour"
                value={formData.price_per_hour}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
                min="0"
                step="0.01"
              />

              <textarea
                name="description"
                placeholder="Description"
                value={formData.description}
                onChange={handleFormChange}
                className="md:col-span-2 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                rows="3"
              />

              <button
                type="submit"
                className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {editingHall ? 'Update Hall' : 'Create Hall'}
              </button>
            </form>
          </div>
        )}

        {/* Halls Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {halls.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Hall Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Capacity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Price/Hour</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {halls.map((hall) => (
                    <tr key={hall.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{hall.hall_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{hall.hall_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{hall.capacity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">${hall.price_per_hour}</td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEditHall(hall)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteHall(hall.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                        >
                          <FaTrash /> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No halls created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
