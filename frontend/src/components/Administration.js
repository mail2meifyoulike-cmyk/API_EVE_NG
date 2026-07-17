import React, { useState, useEffect } from 'react';
import { fetchSystemConfig, updateSystemConfig } from '../services/api';

function Administration() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const data = await fetchSystemConfig().catch(() => null);
      setConfig(data);
    } catch (error) {
      console.error('Error loading config:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      await updateSystemConfig(config);
      setEditing(false);
      loadConfig();
    } catch (error) {
      console.error('Error saving config:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Administration & Configuration</h2>
        <p className="text-blue-100">Manage system settings and configuration</p>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">System Status</p>
          <p className="text-2xl font-bold text-green-400">🟢 Online</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Connected Nodes</p>
          <p className="text-2xl font-bold text-blue-400">12</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">Total Users</p>
          <p className="text-2xl font-bold text-purple-400">48</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <p className="text-gray-400 text-sm mb-2">System Uptime</p>
          <p className="text-2xl font-bold text-orange-400">45d</p>
        </div>
      </div>

      {/* Configuration Settings */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-white">System Configuration</h3>
          <button
            onClick={() => setEditing(!editing)}
            className={`px-4 py-2 rounded font-medium transition ${
              editing
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-blue-600 hover:bg-blue-700'
            } text-white`}
          >
            {editing ? 'Cancel' : 'Edit'}
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm">Max Concurrent Labs</label>
              <input
                type="number"
                value={config?.max_labs || 100}
                onChange={(e) => setConfig({ ...config, max_labs: parseInt(e.target.value) })}
                disabled={!editing}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Session Timeout (minutes)</label>
              <input
                type="number"
                value={config?.session_timeout || 60}
                onChange={(e) => setConfig({ ...config, session_timeout: parseInt(e.target.value) })}
                disabled={!editing}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm">Log Level</label>
              <select
                value={config?.log_level || 'INFO'}
                onChange={(e) => setConfig({ ...config, log_level: e.target.value })}
                disabled={!editing}
                className="w-full bg-slate-700 text-white px-4 py-2 rounded border border-slate-600 focus:border-blue-500 outline-none disabled:opacity-50"
              >
                <option>DEBUG</option>
                <option>INFO</option>
                <option>WARNING</option>
                <option>ERROR</option>
              </select>
            </div>

            {editing && (
              <button
                onClick={handleSaveConfig}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition mt-4"
              >
                Save Configuration
              </button>
            )}
          </div>
        )}
      </div>

      {/* System Logs */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent System Events</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="bg-slate-700/50 rounded p-3 text-sm text-gray-300 font-mono">
              [2026-07-17 14:{String(i).padStart(2, '0')}:00] System event log entry #{i}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Administration;
