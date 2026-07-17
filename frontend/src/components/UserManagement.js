import React, { useState, useEffect } from 'react';
import { fetchUsers, createUser, updateUser, deleteUser } from '../services/api';

function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await fetchUsers().catch(() => []);
      setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createUser(
        formData.username,
        formData.email,
        formData.password,
        formData.role
      );
      setFormData({ username: '', email: '', password: '', role: 'user' });
      setShowForm(false);
      loadUsers();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Delete this user?')) {
      try {
        await deleteUser(userId);
        loadUsers();
      } catch (error) {
        console.error('Error deleting user:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">User Management</h2>
        <p className="text-blue-100">Manage system users and their permissions</p>
      </div>

      {/* Create User Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition"
      >
        {showForm ? '✕ Cancel' : '+ Add User'}
      </button>

      {/* User Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                required
              />
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
                <option value="instructor">Instructor</option>
              </select>
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition"
            >
              Add User
            </button>
          </form>
        </div>
      )}

      {/* Users List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.length > 0 ? (
            users.map((user) => (
              <div key={user.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-2">{user.username}</h3>
                <p className="text-gray-400 text-sm mb-2">{user.email}</p>
                <div className="mb-4">
                  <span className="bg-blue-900/50 text-blue-300 text-xs px-3 py-1 rounded-full capitalize">
                    {user.role}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteUser(user.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium transition"
                >
                  Delete User
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8 col-span-full">No users found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default UserManagement;
