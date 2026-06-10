import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function ManageRoomsPage() {
  const [rooms, setRooms] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    room_number: '',
    room_type: 'Single',
    capacity: 1,
    price_per_night: 0,
    description: '',
    floor: 1,
    amenities: [],
  });
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await apiClient.get('/rooms');
      setRooms(response.data.rooms);
    } catch (error) {
      console.error('Error fetching rooms:', error);
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
      if (editingRoom) {
        await apiClient.put(`/rooms/${editingRoom.id}`, formData);
        alert('Room updated successfully');
      } else {
        await apiClient.post('/rooms', formData);
        alert('Room created successfully');
      }
      setShowForm(false);
      setEditingRoom(null);
      resetForm();
      fetchRooms();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Operation failed'));
    }
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setFormData({
      room_number: room.room_number,
      room_type: room.room_type,
      capacity: room.capacity,
      price_per_night: room.price_per_night,
      description: room.description || '',
      floor: room.floor,
      amenities: room.amenities || [],
    });
    setShowForm(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiClient.delete(`/rooms/${roomId}`);
        alert('Room deleted successfully');
        fetchRooms();
      } catch (error) {
        alert('Error deleting room');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      room_number: '',
      room_type: 'Single',
      capacity: 1,
      price_per_night: 0,
      description: '',
      floor: 1,
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
      <Navbar title="Manage Rooms" onLogout={handleLogout} />

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
              setEditingRoom(null);
              resetForm();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FaPlus /> {showForm ? 'Cancel' : 'Add Room'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingRoom ? 'Edit Room' : 'Create New Room'}
            </h2>
            <form onSubmit={handleSubmitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                name="room_number"
                placeholder="Room Number"
                value={formData.room_number}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
                disabled={!!editingRoom}
              />

              <select
                name="room_type"
                value={formData.room_type}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
              >
                <option value="Single">Single</option>
                <option value="Double">Double</option>
                <option value="Suite">Suite</option>
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
                name="price_per_night"
                placeholder="Price per Night"
                value={formData.price_per_night}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
                min="0"
                step="0.01"
              />

              <input
                type="number"
                name="floor"
                placeholder="Floor"
                value={formData.floor}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
                min="1"
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
                {editingRoom ? 'Update Room' : 'Create Room'}
              </button>
            </form>
          </div>
        )}

        {/* Rooms Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {rooms.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Room Number</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Type</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Capacity</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Price/Night</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Floor</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{room.room_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{room.room_type}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{room.capacity}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">${room.price_per_night}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{room.floor}</td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEditRoom(room)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRoom(room.id)}
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
              <p className="text-gray-600">No rooms created yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
