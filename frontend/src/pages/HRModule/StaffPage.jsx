import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../context/store';
import apiClient from '../../utils/apiClient';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';

export default function StaffPage() {
  const [staff, setStaff] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState(null);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    employee_id: '',
    department: '',
    position: '',
    salary: '',
    hire_date: '',
  });
  const navigate = useNavigate();
  const logout = useAuthStore((state) => state.logout);

  useEffect(() => {
    fetchStaff();
    fetchUsers();
  }, []);

  const fetchStaff = async () => {
    try {
      const response = await apiClient.get('/hr/staff');
      setStaff(response.data.staff);
    } catch (error) {
      console.error('Error fetching staff:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await apiClient.get('/admin/users?role=customer');
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitForm = async (e) => {
    e.preventDefault();
    try {
      if (editingStaff) {
        await apiClient.put(`/hr/staff/${editingStaff.id}`, formData);
        alert('Staff updated successfully');
      } else {
        await apiClient.post('/hr/staff', formData);
        alert('Staff created successfully');
      }
      setShowForm(false);
      setEditingStaff(null);
      resetForm();
      fetchStaff();
    } catch (error) {
      alert('Error: ' + (error.response?.data?.error || 'Operation failed'));
    }
  };

  const handleEditStaff = (staffMember) => {
    setEditingStaff(staffMember);
    setFormData({
      user_id: staffMember.user_id,
      employee_id: staffMember.employee_id,
      department: staffMember.department,
      position: staffMember.position,
      salary: staffMember.salary || '',
      hire_date: staffMember.hire_date,
    });
    setShowForm(true);
  };

  const handleDeactivateStaff = async (staffId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await apiClient.post(`/hr/staff/${staffId}/deactivate`);
        alert('Staff deactivated successfully');
        fetchStaff();
      } catch (error) {
        alert('Error deactivating staff');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      employee_id: '',
      department: '',
      position: '',
      salary: '',
      hire_date: '',
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
      <Navbar title="Staff Management" onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Staff Management</h1>
            <p className="text-gray-600 mt-1">Manage employee profiles and information</p>
          </div>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setEditingStaff(null);
              resetForm();
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition"
          >
            <FaPlus /> {showForm ? 'Cancel' : 'Add Staff'}
          </button>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              {editingStaff ? 'Edit Staff Member' : 'Create New Staff Member'}
            </h2>
            <form onSubmit={handleSubmitForm} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {!editingStaff && (
                <select
                  name="user_id"
                  value={formData.user_id}
                  onChange={handleFormChange}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">Select User</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.first_name} {user.last_name}
                    </option>
                  ))}
                </select>
              )}

              <input
                type="text"
                name="employee_id"
                placeholder="Employee ID"
                value={formData.employee_id}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
                disabled={!!editingStaff}
              />

              <input
                type="text"
                name="department"
                placeholder="Department"
                value={formData.department}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />

              <input
                type="text"
                name="position"
                placeholder="Position"
                value={formData.position}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />

              <input
                type="number"
                name="salary"
                placeholder="Salary"
                value={formData.salary}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                step="0.01"
                min="0"
              />

              <input
                type="date"
                name="hire_date"
                value={formData.hire_date}
                onChange={handleFormChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                required
              />

              <button
                type="submit"
                className="md:col-span-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg transition"
              >
                {editingStaff ? 'Update Staff' : 'Create Staff'}
              </button>
            </form>
          </div>
        )}

        {/* Staff Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {staff.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Employee ID</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Department</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Position</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Salary</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Hire Date</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold text-gray-800">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {staff.map((member) => (
                    <tr key={member.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-800 font-semibold">{member.employee_id}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {member.user?.first_name} {member.user?.last_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.position}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">${member.salary || 'N/A'}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{member.hire_date}</td>
                      <td className="px-6 py-4 text-sm flex gap-2">
                        <button
                          onClick={() => handleEditStaff(member)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                        >
                          <FaEdit /> Edit
                        </button>
                        <button
                          onClick={() => handleDeactivateStaff(member.id)}
                          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded flex items-center gap-1 transition"
                        >
                          <FaTrash /> Deactivate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-gray-600">No staff members yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
