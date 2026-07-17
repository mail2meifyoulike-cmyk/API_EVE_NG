import React, { useState, useEffect } from 'react';
import { fetchClusterStatus, fetchActiveUsers } from '../services/api';

function Dashboard({ stats }) {
  const [clusterStatus, setClusterStatus] = useState(null);
  const [activeUsers, setActiveUsers] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [cluster, users] = await Promise.all([
        fetchClusterStatus().catch(() => null),
        fetchActiveUsers().catch(() => null),
      ]);
      setClusterStatus(cluster);
      setActiveUsers(users);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Safe data access with defaults
  const runningLabs = stats?.running_labs || 0;
  const totalLabs = stats?.total_labs || 0;
  const activeUsersCount = activeUsers?.count || 0;
  const clusterNodes = clusterStatus?.nodes || 0;
  const cpuUsage = clusterStatus?.cpu_usage || 0;
  const memoryUsage = clusterStatus?.memory_usage || 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-blue-100">Real-time overview of your EVE Lab environment</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Running Labs</p>
              <p className="text-3xl font-bold text-blue-400">{runningLabs}</p>
            </div>
            <span className="text-4xl">🧪</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Total Labs</p>
              <p className="text-3xl font-bold text-green-400">{totalLabs}</p>
            </div>
            <span className="text-4xl">📁</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Active Users</p>
              <p className="text-3xl font-bold text-purple-400">{activeUsersCount}</p>
            </div>
            <span className="text-4xl">👥</span>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm mb-2">Cluster Nodes</p>
              <p className="text-3xl font-bold text-orange-400">{clusterNodes}</p>
            </div>
            <span className="text-4xl">🖥️</span>
          </div>
        </div>
      </div>

      {/* System Performance */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Cluster Status */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">Cluster Status</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">CPU Usage</span>
                <span className="text-blue-400 font-semibold">{cpuUsage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${cpuUsage}%` }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-gray-400">Memory Usage</span>
                <span className="text-green-400 font-semibold">{memoryUsage}%</span>
              </div>
              <div className="w-full bg-slate-700 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all"
                  style={{ width: `${memoryUsage}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-6">Quick Actions</h3>
          <div className="space-y-2">
            <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition">
              🚀 Deploy New Lab
            </button>
            <button className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded font-medium transition">
              📅 View Reservations
            </button>
            <button className="w-full bg-purple-600 hover:bg-purple-700 text-white py-2 rounded font-medium transition">
              📊 Generate Report
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {[
            { icon: '✅', text: 'Lab "CCNA-Routing" started by user John', time: '5 min ago' },
            { icon: '➕', text: 'New user "admin2" created', time: '15 min ago' },
            { icon: '⏹️', text: 'Lab "SD-WAN-POC" stopped', time: '1 hour ago' },
            { icon: '🔄', text: 'System backup completed', time: '2 hours ago' },
            { icon: '📈', text: 'Performance metrics updated', time: '3 hours ago' },
          ].map((activity, idx) => (
            <div key={idx} className="flex items-start space-x-3 p-3 bg-slate-700/30 rounded">
              <span className="text-lg mt-1">{activity.icon}</span>
              <div className="flex-1 min-w-0">
                <p className="text-gray-300 text-sm">{activity.text}</p>
                <p className="text-gray-500 text-xs">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Server Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">IP Address:</span>
              <span className="text-blue-400 font-mono">192.168.2.11</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">FQDN:</span>
              <span className="text-blue-400 font-mono">evengvlab4you.ddns.net</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Protocol:</span>
              <span className="text-blue-400 font-mono">HTTPS (8443)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Status:</span>
              <span className="text-green-400">🟢 Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Uptime:</span>
              <span className="text-gray-300">45 days 12 hours</span>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          <h3 className="text-xl font-bold text-white mb-4">Lab Solutions Available</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">✓</span>
              <span className="text-gray-300">SD-WAN (Cisco, Velocloud, Palo Alto)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">✓</span>
              <span className="text-gray-300">Routing & BGP (R&S, AVPN, MPLS)</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-blue-400">✓</span>
              <span className="text-gray-300">Security (Cisco FTD, Palo Alto, Fortigate, Juniper)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
