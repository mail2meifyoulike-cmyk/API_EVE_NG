import React, { useState } from 'react';
import { fetchEveNGTopology } from '../services/api';

function EveNGIntegration({ onTopologyFetched }) {
  const [loading, setLoading] = useState(false);
  const [labId, setLabId] = useState('');
  const [topology, setTopology] = useState(null);
  const [error, setError] = useState('');

  const handleFetchTopology = async () => {
    setError('');
    setTopology(null);

    if (!labId.trim()) {
      setError('Please enter a Lab ID');
      return;
    }

    try {
      setLoading(true);
      const data = await fetchEveNGTopology(labId);
      setTopology(data);
      if (onTopologyFetched) {
        onTopologyFetched(data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch topology from EVE-NG');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
      <h3 className="text-xl font-bold text-white mb-4">📊 EVE-NG Integration</h3>

      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex space-x-2">
          <input
            type="text"
            value={labId}
            onChange={(e) => setLabId(e.target.value)}
            placeholder="Enter EVE-NG Lab ID (e.g., 1, 2, 3...)"
            className="flex-1 bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
          />
          <button
            onClick={handleFetchTopology}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white px-4 py-2 rounded font-medium transition"
          >
            {loading ? 'Fetching...' : 'Fetch Topology'}
          </button>
        </div>

        {topology && (
          <div className="bg-slate-700/50 border border-slate-600 rounded p-4">
            <p className="text-gray-300 text-sm font-medium mb-2">📋 Topology Details:</p>
            <pre className="bg-slate-900 text-gray-300 text-xs p-3 rounded overflow-auto max-h-48">
              {JSON.stringify(topology, null, 2)}
            </pre>
          </div>
        )}

        <p className="text-gray-400 text-xs">
          💡 Tip: Get Lab IDs from your EVE-NG server at{' '}
          <code className="bg-slate-700 px-2 py-1 rounded">https://192.168.2.11:8443/labs</code>
        </p>
      </div>
    </div>
  );
}

export default EveNGIntegration;
