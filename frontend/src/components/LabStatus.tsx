import React, { useState, useEffect } from 'react';
import { fetchLabs, createLab } from '../services/api';

interface Lab {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
  deployed_at?: string;
}

function LabStatus() {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [newLabName, setNewLabName] = useState('');
  const [newLabDesc, setNewLabDesc] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    try {
      setLoading(true);
      const data = await fetchLabs();
      setLabs(data);
    } catch (err) {
      setError('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLab = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLabName.trim()) {
      setError('Lab name is required');
      return;
    }

    try {
      await createLab(newLabName, newLabDesc);
      setSuccess('Lab created successfully!');
      setNewLabName('');
      setNewLabDesc('');
      setError('');
      setTimeout(() => setSuccess(''), 3000);
      loadLabs();
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create lab');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500';
      case 'provisioning':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500';
      case 'stopped':
        return 'bg-gray-500/20 text-gray-400 border-gray-500';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500';
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Lab Status</h2>

      {/* Create Lab Form */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">Create New Lab</h3>
        <form onSubmit={handleCreateLab} className="space-y-4">
          {error && (
            <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-4 py-3 rounded">
              {success}
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lab Name *
              </label>
              <input
                type="text"
                value={newLabName}
                onChange={(e) => setNewLabName(e.target.value)}
                placeholder="Enter lab name"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Description
              </label>
              <input
                type="text"
                value={newLabDesc}
                onChange={(e) => setNewLabDesc(e.target.value)}
                placeholder="Enter description"
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
          >
            Create Lab
          </button>
        </form>
      </div>

      {/* Labs List */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">All Labs</h3>
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
          </div>
        ) : labs.length === 0 ? (
          <p className="text-gray-400 text-center py-8">No labs found. Create one to get started!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-600">
                <tr>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Name</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Description</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-gray-300 font-medium">Created</th>
                </tr>
              </thead>
              <tbody>
                {labs.map((lab) => (
                  <tr key={lab.id} className="border-b border-slate-700 hover:bg-slate-700/30">
                    <td className="py-3 px-4 text-white font-medium">{lab.name}</td>
                    <td className="py-3 px-4 text-gray-400">{lab.description || '-'}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          lab.status
                        )}`}
                      >
                        {lab.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(lab.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default LabStatus;
