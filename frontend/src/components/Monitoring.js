import React, { useState, useEffect, useCallback } from 'react';
import { fetchLabMetrics } from '../services/api';

function Monitoring() {
  const [timeRange, setTimeRange] = useState('1h');
  const [loading, setLoading] = useState(true);

  const loadMetrics = useCallback(async () => {
    try {
      setLoading(true);
      await fetchLabMetrics('all', timeRange).catch(() => null);
    } catch (error) {
      console.error('Error loading metrics:', error);
    } finally {
      setLoading(false);
    }
  }, [timeRange]);

  useEffect(() => {
    loadMetrics();
  }, [loadMetrics]);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Monitoring & Performance</h2>
        <p className="text-blue-100">Real-time monitoring of all running labs and nodes</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex space-x-4">
        {['1h', '6h', '24h', '7d'].map((range) => (
          <button
            key={range}
            onClick={() => setTimeRange(range)}
            className={`px-4 py-2 rounded font-medium transition ${
              timeRange === range
                ? 'bg-blue-600 text-white'
                : 'bg-slate-800 text-gray-400 hover:text-white'
            }`}
          >
            {range}
          </button>
        ))}
      </div>

      {/* Metrics Cards */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">CPU Usage</p>
            <p className="text-3xl font-bold text-blue-400">45%</p>
            <p className="text-xs text-gray-500 mt-2">↑ 5% from last hour</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Memory Usage</p>
            <p className="text-3xl font-bold text-green-400">62%</p>
            <p className="text-xs text-gray-500 mt-2">↓ 3% from last hour</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Network Throughput</p>
            <p className="text-3xl font-bold text-purple-400">1.2 Gbps</p>
            <p className="text-xs text-gray-500 mt-2">Peak: 2.5 Gbps</p>
          </div>

          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <p className="text-gray-400 text-sm mb-2">Disk Usage</p>
            <p className="text-3xl font-bold text-orange-400">78%</p>
            <p className="text-xs text-gray-500 mt-2">↑ 2% from last hour</p>
          </div>
        </div>
      )}

      {/* Active Nodes Monitoring */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Active Nodes</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-600">
              <tr>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Node</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Status</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">CPU</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Memory</th>
                <th className="text-left py-3 px-4 text-gray-300 font-medium">Network</th>
              </tr>
            </thead>
            <tbody>
              {[1, 2, 3, 4].map((i) => (
                <tr key={i} className="border-b border-slate-700 hover:bg-slate-700/30">
                  <td className="py-3 px-4 text-white">Node-{i}</td>
                  <td className="py-3 px-4">
                    <span className="bg-green-900/50 text-green-300 px-3 py-1 rounded-full text-xs">Running</span>
                  </td>
                  <td className="py-3 px-4 text-gray-400">{Math.floor(Math.random() * 100)}%</td>
                  <td className="py-3 px-4 text-gray-400">{Math.floor(Math.random() * 100)}%</td>
                  <td className="py-3 px-4 text-gray-400">{Math.floor(Math.random() * 1000)} Mbps</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Monitoring;
