import React, { useState, useEffect } from 'react';
import { fetchLabs, startLab, stopLab, deleteLab } from '../services/api';

function MyLabs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    loadMyLabs();
  }, []);

  const loadMyLabs = async () => {
    try {
      setLoading(true);
      const data = await fetchLabs().catch(() => []);
      setLabs(data);
    } catch (error) {
      console.error('Error loading labs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartLab = async (labId) => {
    try {
      await startLab(labId);
      loadMyLabs();
    } catch (error) {
      console.error('Error starting lab:', error);
    }
  };

  const handleStopLab = async (labId) => {
    try {
      await stopLab(labId);
      loadMyLabs();
    } catch (error) {
      console.error('Error stopping lab:', error);
    }
  };

  const handleDeleteLab = async (labId) => {
    if (window.confirm('Are you sure you want to delete this lab?')) {
      try {
        await deleteLab(labId);
        loadMyLabs();
      } catch (error) {
        console.error('Error deleting lab:', error);
      }
    }
  };

  const filteredLabs = filter === 'all' ? labs : labs.filter((l) => l.status === filter);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">My Labs</h2>
        <p className="text-blue-100">Manage your personal lab instances</p>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4">
        {['all', 'running', 'stopped', 'provisioning'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded font-medium transition capitalize ${
              filter === f
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Labs List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredLabs.length > 0 ? (
            filteredLabs.map((lab) => (
              <div key={lab.id} className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
                <h3 className="text-lg font-bold text-white mb-2">{lab.name}</h3>
                <p className="text-gray-400 text-sm mb-4">{lab.description}</p>

                <div className="mb-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      lab.status === 'running'
                        ? 'bg-green-900/50 text-green-300'
                        : lab.status === 'stopped'
                        ? 'bg-red-900/50 text-red-300'
                        : 'bg-yellow-900/50 text-yellow-300'
                    }`}
                  >
                    {lab.status.toUpperCase()}
                  </span>
                </div>

                <div className="flex space-x-2">
                  {lab.status === 'stopped' && (
                    <button
                      onClick={() => handleStartLab(lab.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium transition"
                    >
                      Start
                    </button>
                  )}
                  {lab.status === 'running' && (
                    <button
                      onClick={() => handleStopLab(lab.id)}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium transition"
                    >
                      Stop
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteLab(lab.id)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-400 text-center py-8 col-span-full">No labs found</p>
          )}
        </div>
      )}
    </div>
  );
}

export default MyLabs;
