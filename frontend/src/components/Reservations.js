import React, { useState, useEffect } from 'react';
import { fetchReservations, createReservation, deleteReservation } from '../services/api';

function Reservations() {
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    labId: '',
    userId: '',
    startTime: '',
    endTime: '',
  });

  useEffect(() => {
    loadReservations();
  }, []);

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await fetchReservations().catch(() => []);
      setReservations(data);
    } catch (error) {
      console.error('Error loading reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createReservation(
        formData.labId,
        formData.userId,
        formData.startTime,
        formData.endTime
      );
      setFormData({ labId: '', userId: '', startTime: '', endTime: '' });
      setShowForm(false);
      loadReservations();
    } catch (error) {
      console.error('Error creating reservation:', error);
    }
  };

  const handleCancel = async (reservationId) => {
    if (window.confirm('Cancel this reservation?')) {
      try {
        await deleteReservation(reservationId);
        loadReservations();
      } catch (error) {
        console.error('Error canceling reservation:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Lab Reservations</h2>
        <p className="text-blue-100">Schedule and manage lab reservations</p>
      </div>

      {/* Create Reservation Button */}
      <button
        onClick={() => setShowForm(!showForm)}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition"
      >
        {showForm ? '✕ Cancel' : '+ New Reservation'}
      </button>

      {/* Reservation Form */}
      {showForm && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Lab ID"
                value={formData.labId}
                onChange={(e) => setFormData({ ...formData, labId: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                required
              />
              <input
                type="text"
                placeholder="User ID"
                value={formData.userId}
                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                required
              />
              <input
                type="datetime-local"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                required
              />
              <input
                type="datetime-local"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded font-medium transition"
            >
              Create Reservation
            </button>
          </form>
        </div>
      )}

      {/* Reservations List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-600">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Lab</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">User</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Start Time</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">End Time</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Action</th>
                </tr>
              </thead>
              <tbody>
                {reservations.length > 0 ? (
                  reservations.map((res) => (
                    <tr key={res.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                      <td className="py-3 px-4 text-white">{res.lab_id}</td>
                      <td className="py-3 px-4 text-gray-400">{res.user_id}</td>
                      <td className="py-3 px-4 text-gray-400">{res.start_time}</td>
                      <td className="py-3 px-4 text-gray-400">{res.end_time}</td>
                      <td className="py-3 px-4">
                        <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-xs">Active</span>
                      </td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleCancel(res.id)}
                          className="text-red-400 hover:text-red-300 transition"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="py-4 px-4 text-gray-400 text-center">
                      No reservations found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Reservations;
