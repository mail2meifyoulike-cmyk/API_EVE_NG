import React, { useState, useEffect } from 'react';
import { fetchDashboardStats, fetchSystemStatus } from '../services/api';

function Dashboard() {
  const [stats, setStats] = useState({
    total_labs: 0,
    running_labs: 0,
    stopped_labs: 0,
    active_users: 0,
    cpu_percent: 0,
    memory_percent: 0,
    disk_usage: '0GB',
    uptime: '0h',
    version: 'Unknown',
  });
  const [systemInfo, setSystemInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    loadDashboardData();

    if (autoRefresh) {
      const interval = setInterval(loadDashboardData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const loadDashboardData = async () => {
    try {
      setError(null);
      const [dashboardStats, systemStatus] = await Promise.all([
        fetchDashboardStats(),
        fetchSystemStatus(),
      ]);

      setStats(dashboardStats);
      setSystemInfo(systemStatus);
      setLastUpdate(new Date());
      setLoading(false);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data. Please check your EVE-NG connection.');
      setLoading(false);
    }
  };

  const getMemoryString = (percent) => {
    if (systemInfo?.memory_total) {
      const used = (percent / 100) * systemInfo.memory_total;
      return `${used.toFixed(1)} GB / ${systemInfo.memory_total} GB`;
    }
    return `${percent}%`;
  };

  const getDiskString = (percent) => {
    if (systemInfo?.disk_total) {
      const used = (percent / 100) * systemInfo.disk_total;
      return `${used.toFixed(1)} GB / ${systemInfo.disk_total} GB`;
    }
    return systemInfo?.disk_usage || '0GB';
  };

  if (loading && !stats.total_labs) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading dashboard data from EVE-NG...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Main Title */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">📊 Dashboard</h2>
            <p className="text-blue-100">EVE Lab Orchestrator - Real-time EVE-NG Monitoring</p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={loadDashboardData}
              disabled={loading}
              className="bg-white/20 hover:bg-white/30 disabled:bg-white/10 text-white px-4 py-2 rounded font-medium transition"
            >
              {loading ? '⏳ Refreshing...' : '🔄 Refresh'}
            </button>
            <label className="flex items-center space-x-2 bg-white/20 hover:bg-white/30 px-4 py-2 rounded cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm">Auto</span>
            </label>
          </div>
        </div>
        {lastUpdate && (
          <p className="text-blue-200 text-xs mt-2">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 text-red-300 p-4 rounded-lg flex items-start space-x-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-bold">Connection Error</p>
            <p className="text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Live Lab Operations Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">📚 Live Lab Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-900/50 border border-emerald-500 rounded-lg p-6 hover:border-emerald-400 transition">
            <p className="text-gray-300 text-sm">🟢 Running Labs</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">{stats.running_labs}</p>
            <p className="text-xs text-gray-400 mt-2">Currently active sessions</p>
          </div>
          <div className="bg-blue-900/50 border border-blue-400 rounded-lg p-6 hover:border-blue-300 transition">
            <p className="text-gray-300 text-sm">📖 Total Labs</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{stats.total_labs}</p>
            <p className="text-xs text-gray-400 mt-2">All labs in system</p>
          </div>
          <div className="bg-orange-900/50 border border-orange-400 rounded-lg p-6 hover:border-orange-300 transition">
            <p className="text-gray-300 text-sm">⏸️ Stopped Labs</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">{stats.stopped_labs}</p>
            <p className="text-xs text-gray-400 mt-2">Idle labs</p>
          </div>
          <div className="bg-purple-900/50 border border-purple-400 rounded-lg p-6 hover:border-purple-300 transition">
            <p className="text-gray-300 text-sm">👥 Active Users</p>
            <p className="text-3xl font-bold text-purple-400 mt-2">{stats.active_users}</p>
            <p className="text-xs text-gray-400 mt-2">Connected users</p>
          </div>
        </div>
      </div>

      {/* System Resources Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">⚙️ System Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU Usage */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">CPU Usage</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">{stats.cpu_percent}%</p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{ width: `${stats.cpu_percent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">Processor utilization</p>
          </div>

          {/* Memory Usage */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Memory Usage</p>
            <p className="text-3xl font-bold text-cyan-400 mt-2">{stats.memory_percent}%</p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{ width: `${stats.memory_percent}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{getMemoryString(stats.memory_percent)}</p>
          </div>

          {/* Disk Usage */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Disk Usage</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {systemInfo?.disk_percent || 0}%
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-yellow-500 transition-all duration-300"
                style={{ width: `${systemInfo?.disk_percent || 0}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-400 mt-2">{getDiskString(systemInfo?.disk_percent || 0)}</p>
          </div>

          {/* Uptime */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">System Uptime</p>
            <p className="text-3xl font-bold text-green-400 mt-2">{stats.uptime}</p>
            <p className="text-xs text-gray-400 mt-2">Server running time</p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Lab Summary */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-white">
          <h4 className="text-lg font-bold mb-4">📋 Lab Summary</h4>
          <ul className="space-y-3 text-sm">
            <li className="flex justify-between items-center">
              <span className="text-gray-400">Total Labs:</span>
              <span className="font-bold text-blue-400 text-lg">{stats.total_labs}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-400">🟢 Running:</span>
              <span className="font-bold text-emerald-400 text-lg">{stats.running_labs}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-400">⏸️ Stopped:</span>
              <span className="font-bold text-orange-400 text-lg">{stats.stopped_labs}</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="text-gray-400">👥 Users:</span>
              <span className="font-bold text-purple-400 text-lg">{stats.active_users}</span>
            </li>
          </ul>
        </div>

        {/* System Information */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-white">
          <h4 className="text-lg font-bold mb-4">🖥️ System Information</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span className="text-gray-400">EVE-NG Version:</span>
              <span className="text-blue-400 font-mono">{systemInfo?.version || 'Unknown'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Hostname:</span>
              <span className="text-green-400 font-mono">{systemInfo?.hostname || 'N/A'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Kernel:</span>
              <span className="text-green-400 font-mono text-xs">{systemInfo?.kernel || 'N/A'}</span>
            </li>
            <li className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400 font-bold">🟢 Online</span>
            </li>
          </ul>
        </div>
      </div>

      {/* EVE-NG Server Configuration */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">🌐 EVE-NG Server Configuration</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-gray-400 text-xs">IP Address</p>
            <p className="text-blue-400 font-mono mt-1">192.168.2.11</p>
          </div>
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-gray-400 text-xs">FQDN</p>
            <p className="text-blue-400 font-mono mt-1">evengvlab4you.ddns.net</p>
          </div>
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-gray-400 text-xs">Protocol & Port</p>
            <p className="text-green-400 font-mono mt-1">HTTPS : 8443</p>
          </div>
          <div className="bg-slate-700/30 rounded p-3">
            <p className="text-gray-400 text-xs">Connection Status</p>
            <p className="text-green-400 font-bold mt-1">🟢 Connected</p>
          </div>
        </div>
      </div>

      {/* Real-time Updates Info */}
      <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4 text-sm text-blue-300">
        <p className="font-bold">💡 Real-time Updates</p>
        <p className="text-xs mt-1">
          Data is fetched directly from EVE-NG API endpoints. Auto-refresh is set to 10 seconds.
          Use Cluster Status tab for detailed node information.
        </p>
      </div>
    </div>
  );
}

export default Dashboard;
