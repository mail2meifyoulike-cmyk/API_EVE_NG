import React from 'react';
import StatusCard from './StatusCard';

function Dashboard({ stats }) {
  return (
    <div className="space-y-8">
      {/* Main Title */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-blue-100">AT&T | APSS | Lab Orchestrator</p>
      </div>

      {/* Lab Operations Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Live Lab Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Running Labs"
            value={stats.running_labs}
            icon="🟢"
            bgColor="bg-emerald-900/50"
            borderColor="border-emerald-500"
            subtitle="Currently active sessions"
          />
          <StatusCard
            title="Total Labs"
            value={stats.total_labs}
            icon="🔢"
            bgColor="bg-blue-900/50"
            borderColor="border-blue-400"
          />
          <StatusCard
            title="Provisioning"
            value={stats.provisioning_labs}
            icon="⚙️"
            bgColor="bg-yellow-900/50"
            borderColor="border-yellow-400"
            subtitle="Labs still starting or resuming"
          />
          <StatusCard
            title="Failed"
            value={stats.failed_labs}
            icon="❌"
            bgColor="bg-red-900/50"
            borderColor="border-red-400"
          />
        </div>
      </div>

      {/* Deployment Status Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Deployment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatusCard
            title="Deployed"
            value={stats.deployed_deployments}
            icon="✅"
            bgColor="bg-green-900/50"
            borderColor="border-green-400"
          />
          <StatusCard
            title="Expiring Soon"
            value={stats.expiring_soon_deployments}
            icon="⏰"
            bgColor="bg-orange-900/50"
            borderColor="border-orange-400"
            subtitle="Running labs ending within 30 minutes"
          />
          <StatusCard
            title="Pending"
            value={stats.pending_deployments}
            icon="⏳"
            bgColor="bg-gray-900/50"
            borderColor="border-gray-400"
          />
          <StatusCard
            title="Total Deployments"
            value={stats.total_deployments}
            icon="📦"
            bgColor="bg-purple-900/50"
            borderColor="border-purple-400"
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-white">
          <h4 className="text-lg font-bold mb-4">Lab Summary</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Total Labs:</span>
              <span className="font-bold text-blue-400">{stats.total_labs}</span>
            </li>
            <li className="flex justify-between">
              <span>Active:</span>
              <span className="font-bold text-emerald-400">{stats.running_labs}</span>
            </li>
            <li className="flex justify-between">
              <span>Provisioning:</span>
              <span className="font-bold text-yellow-400">{stats.provisioning_labs}</span>
            </li>
            <li className="flex justify-between">
              <span>Stopped:</span>
              <span className="font-bold text-gray-400">{stats.stopped_labs}</span>
            </li>
            <li className="flex justify-between">
              <span>Failed:</span>
              <span className="font-bold text-red-400">{stats.failed_labs}</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-white">
          <h4 className="text-lg font-bold mb-4">Deployment Summary</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Total Deployments:</span>
              <span className="font-bold text-purple-400">{stats.total_deployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Deployed:</span>
              <span className="font-bold text-green-400">{stats.deployed_deployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Pending:</span>
              <span className="font-bold text-gray-400">{stats.pending_deployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Expiring Soon:</span>
              <span className="font-bold text-orange-400">{stats.expiring_soon_deployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Failed:</span>
              <span className="font-bold text-red-400">{stats.failed_deployments}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
