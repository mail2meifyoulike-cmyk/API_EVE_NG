import React, { useState, useEffect } from 'react';
import { fetchClusterStatus, fetchSystemStatus } from '../services/api';

function ClusterStatus() {
  const [clusterData, setClusterData] = useState(null);
  const [systemData, setSystemData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(5000); // 5 seconds

  useEffect(() => {
    loadStatus();
    
    if (autoRefresh) {
      const interval = setInterval(loadStatus, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval]);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [cluster, system] = await Promise.all([
        fetchClusterStatus(),
        fetchSystemStatus(),
      ]);
      
      setClusterData(cluster);
      setSystemData(system);
    } catch (err) {
      console.error('Error loading cluster status:', err);
      setError(`Failed to load cluster status: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('online') || statusLower.includes('running')) {
      return 'text-green-400';
    }
    if (statusLower.includes('offline') || statusLower.includes('stopped')) {
      return 'text-red-400';
    }
    if (statusLower.includes('pending') || statusLower.includes('connecting')) {
      return 'text-yellow-400';
    }
    return 'text-gray-400';
  };

  const getStatusBadgeColor = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('online') || statusLower.includes('running')) {
      return 'bg-green-900/50 border-green-500 text-green-300';
    }
    if (statusLower.includes('offline') || statusLower.includes('stopped')) {
      return 'bg-red-900/50 border-red-500 text-red-300';
    }
    if (statusLower.includes('pending') || statusLower.includes('connecting')) {
      return 'bg-yellow-900/50 border-yellow-500 text-yellow-300';
    }
    return 'bg-gray-900/50 border-gray-500 text-gray-300';
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase() || '';
    if (statusLower.includes('online') || statusLower.includes('running')) {
      return '🟢';
    }
    if (statusLower.includes('offline') || statusLower.includes('stopped')) {
      return '🔴';
    }
    if (statusLower.includes('pending') || statusLower.includes('connecting')) {
      return '🟡';
    }
    return '⚪';
  };

  if (loading && !clusterData && !systemData) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-400 mx-auto mb-4"></div>
          <p className="text-gray-300">Loading cluster status...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-800 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold mb-2">🖥️ Cluster Status</h2>
            <p className="text-purple-100">Real-time EVE-NG Cluster Information</p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={loadStatus}
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
              <span className="text-sm">Auto Refresh</span>
            </label>
          </div>
        </div>
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

      {/* System Overview */}
      {systemData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* CPU Usage */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">CPU Usage</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {systemData.cpu_percent || 0}%
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${systemData.cpu_percent || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Memory Usage */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Memory Usage</p>
            <p className="text-3xl font-bold text-cyan-400 mt-2">
              {systemData.memory_percent || 0}%
            </p>
            <div className="mt-3 h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all"
                style={{ width: `${systemData.memory_percent || 0}%` }}
              ></div>
            </div>
          </div>

          {/* Disk Usage */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Disk Usage</p>
            <p className="text-3xl font-bold text-yellow-400 mt-2">
              {systemData.disk_percent || 0}%
            </p>
            <p className="text-gray-400 text-xs mt-2">{systemData.disk_usage || 'N/A'}</p>
          </div>

          {/* Uptime */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Uptime</p>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {systemData.uptime || 'N/A'}
            </p>
          </div>
        </div>
      )}

      {/* Cluster Nodes */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-2xl font-bold text-white mb-4">📊 Cluster Nodes</h3>
        
        {clusterData && Object.keys(clusterData).length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(clusterData).map(([nodeId, node]) => (
              <div key={nodeId} className={`border rounded-lg p-4 ${getStatusBadgeColor(node.status)}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-2xl">{getStatusIcon(node.status)}</span>
                    <div>
                      <p className="font-bold text-lg">{node.name || nodeId}</p>
                      <p className="text-xs opacity-80">{nodeId}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Status:</span>
                    <span className={`font-bold ${getStatusColor(node.status)}`}>
                      {node.status || 'Unknown'}
                    </span>
                  </div>

                  {node.cpu && (
                    <div className="flex justify-between">
                      <span>CPU Cores:</span>
                      <span className="font-mono">{node.cpu}</span>
                    </div>
                  )}

                  {node.memory && (
                    <div className="flex justify-between">
                      <span>Memory:</span>
                      <span className="font-mono">{node.memory}</span>
                    </div>
                  )}

                  {node.disk && (
                    <div className="flex justify-between">
                      <span>Disk:</span>
                      <span className="font-mono">{node.disk}</span>
                    </div>
                  )}

                  {node.version && (
                    <div className="flex justify-between">
                      <span>Version:</span>
                      <span className="font-mono text-xs">{node.version}</span>
                    </div>
                  )}

                  {node.labs && (
                    <div className="flex justify-between">
                      <span>Labs:</span>
                      <span className="font-bold">{node.labs}</span>
                    </div>
                  )}

                  {node.last_update && (
                    <div className="flex justify-between text-xs opacity-75">
                      <span>Updated:</span>
                      <span>{new Date(node.last_update).toLocaleString()}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-400 text-center py-8">No cluster nodes available</p>
        )}
      </div>

      {/* System Info */}
      {systemData && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Server Information */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">🖥️ Server Information</h4>
            <div className="space-y-3 text-sm">
              {systemData.version && (
                <div className="flex justify-between">
                  <span className="text-gray-300">EVE-NG Version:</span>
                  <span className="text-blue-400 font-mono">{systemData.version}</span>
                </div>
              )}
              {systemData.builtin_version && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Built-in Version:</span>
                  <span className="text-blue-400 font-mono">{systemData.builtin_version}</span>
                </div>
              )}
              {systemData.kernel && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Kernel:</span>
                  <span className="text-blue-400 font-mono">{systemData.kernel}</span>
                </div>
              )}
              {systemData.hostname && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Hostname:</span>
                  <span className="text-blue-400 font-mono">{systemData.hostname}</span>
                </div>
              )}
            </div>
          </div>

          {/* Network Information */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h4 className="text-lg font-bold text-white mb-4">🌐 Network Information</h4>
            <div className="space-y-3 text-sm">
              {systemData.ip && (
                <div className="flex justify-between">
                  <span className="text-gray-300">IP Address:</span>
                  <span className="text-green-400 font-mono">{systemData.ip}</span>
                </div>
              )}
              {systemData.mac && (
                <div className="flex justify-between">
                  <span className="text-gray-300">MAC Address:</span>
                  <span className="text-green-400 font-mono">{systemData.mac}</span>
                </div>
              )}
              {systemData.gateway && (
                <div className="flex justify-between">
                  <span className="text-gray-300">Gateway:</span>
                  <span className="text-green-400 font-mono">{systemData.gateway}</span>
                </div>
              )}
              {systemData.dns && (
                <div className="flex justify-between">
                  <span className="text-gray-300">DNS:</span>
                  <span className="text-green-400 font-mono">{systemData.dns}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Lab Statistics */}
      {systemData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-emerald-900/20 border border-emerald-500/30 rounded-lg p-4">
            <p className="text-emerald-300 text-sm">Total Labs</p>
            <p className="text-3xl font-bold text-emerald-400 mt-2">
              {systemData.total_labs || 0}
            </p>
          </div>

          <div className="bg-blue-900/20 border border-blue-500/30 rounded-lg p-4">
            <p className="text-blue-300 text-sm">Running Labs</p>
            <p className="text-3xl font-bold text-blue-400 mt-2">
              {systemData.running_labs || 0}
            </p>
          </div>

          <div className="bg-red-900/20 border border-red-500/30 rounded-lg p-4">
            <p className="text-red-300 text-sm">Stopped Labs</p>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {systemData.stopped_labs || 0}
            </p>
          </div>

          <div className="bg-orange-900/20 border border-orange-500/30 rounded-lg p-4">
            <p className="text-orange-300 text-sm">Active Users</p>
            <p className="text-3xl font-bold text-orange-400 mt-2">
              {systemData.active_users || 0}
            </p>
          </div>
        </div>
      )}

      {/* Refresh Settings */}
      {autoRefresh && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4">
          <label className="flex items-center space-x-3 cursor-pointer">
            <span className="text-gray-300 text-sm">Auto-refresh interval (seconds):</span>
            <select
              value={refreshInterval / 1000}
              onChange={(e) => setRefreshInterval(parseInt(e.target.value) * 1000)}
              className="bg-slate-700 border border-slate-600 rounded px-3 py-1 text-white text-sm"
            >
              <option value="5">5 seconds</option>
              <option value="10">10 seconds</option>
              <option value="15">15 seconds</option>
              <option value="30">30 seconds</option>
              <option value="60">1 minute</option>
            </select>
          </label>
        </div>
      )}
    </div>
  );
}

export default ClusterStatus;
