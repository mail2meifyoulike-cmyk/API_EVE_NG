import React, { useState, useEffect } from 'react';
import { fetchLabs, startLab, stopLab, deleteLab, deployLab } from '../services/api';
import CreateLabModal from './CreateLabModal';

function MyLabs() {
  const [labs, setLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deployingId, setDeployingId] = useState(null);

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
      alert('Failed to start lab: ' + error.message);
    }
  };

  const handleStopLab = async (labId) => {
    try {
      await stopLab(labId);
      loadMyLabs();
    } catch (error) {
      console.error('Error stopping lab:', error);
      alert('Failed to stop lab: ' + error.message);
    }
  };

  const handleDeleteLab = async (labId) => {
    if (window.confirm('Are you sure you want to delete this lab?')) {
      try {
        await deleteLab(labId);
        loadMyLabs();
      } catch (error) {
        console.error('Error deleting lab:', error);
        alert('Failed to delete lab: ' + error.message);
      }
    }
  };

  const handleDeployLab = async (labId, labName) => {
    const deploymentName = prompt(`Enter deployment name for "${labName}":`);
    if (!deploymentName) return;

    try {
      setDeployingId(labId);
      await deployLab(labId, deploymentName);
      alert('Lab deployment started successfully!');
      loadMyLabs();
    } catch (error) {
      console.error('Error deploying lab:', error);
      alert('Failed to deploy lab: ' + error.message);
    } finally {
      setDeployingId(null);
    }
  };

  const filteredLabs = filter === 'all' ? labs : labs.filter((l) => l.status === filter);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Labs</h2>
            <p className="text-blue-100">Manage your personal lab instances</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition"
          >
            ➕ Create Lab
          </button>
        </div>
      </div>

      {/* Filter Buttons */}
      <div className="flex space-x-4 flex-wrap">
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
            {f === 'all' ? '📋 All Labs' : f === 'running' ? '🟢 Running' : f === 'stopped' ? '🔴 Stopped' : '⏳ Provisioning'}
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
                <div className="mb-4">
                  <h3 className="text-lg font-bold text-white mb-1">{lab.name}</h3>
                  <p className="text-gray-400 text-sm mb-2">{lab.description || 'No description'}</p>
                  {lab.topology && (
                    <p className="text-gray-500 text-xs mb-2">
                      <span className="text-blue-400">Topology:</span> {lab.topology}
                    </p>
                  )}
                </div>

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

                <div className="flex flex-col space-y-2">
                  {lab.status === 'stopped' && (
                    <>
                      <button
                        onClick={() => handleStartLab(lab.id)}
                        className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded text-sm font-medium transition"
                      >
                        ▶️ Start Lab
                      </button>
                      <button
                        onClick={() => handleDeployLab(lab.id, lab.name)}
                        disabled={deployingId === lab.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-2 rounded text-sm font-medium transition"
                      >
                        {deployingId === lab.id ? '🚀 Deploying...' : '🚀 Deploy Lab'}
                      </button>
                    </>
                  )}
                  {lab.status === 'running' && (
                    <>
                      <button
                        onClick={() => handleStopLab(lab.id)}
                        className="w-full bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium transition"
                      >
                        ⏹️ Stop Lab
                      </button>
                      <button
                        onClick={() => handleDeployLab(lab.id, lab.name)}
                        disabled={deployingId === lab.id}
                        className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-2 rounded text-sm font-medium transition"
                      >
                        {deployingId === lab.id ? '🚀 Deploying...' : '🚀 Deploy'}
                      </button>
                    </>
                  )}
                  {lab.status === 'provisioning' && (
                    <button
                      disabled
                      className="w-full bg-yellow-600/50 text-white py-2 rounded text-sm font-medium cursor-not-allowed"
                    >
                      ⏳ Provisioning in progress...
                    </button>
                  )}
                  <button
                    onClick={() => handleDeleteLab(lab.id)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-gray-400 text-center py-8 col-span-full">
              <p className="mb-4">No labs found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition"
              >
                ➕ Create Your First Lab
              </button>
            </div>
          )}
        </div>
      )}

      {/* Create Lab Modal */}
      <CreateLabModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onLabCreated={loadMyLabs}
      />
    </div>
  );
}

export default MyLabs;
