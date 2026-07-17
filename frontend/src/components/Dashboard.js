import React from 'react';

function Dashboard({ stats = {} }) {
  // Safe data access with defaults - prevents null/undefined errors
  const runningLabs = stats?.running_labs ?? 0;
  const totalLabs = stats?.total_labs ?? 0;
  const provisioningLabs = stats?.provisioning_labs ?? 0;
  const failedLabs = stats?.failed_labs ?? 0;
  const stoppedLabs = stats?.stopped_labs ?? 0;
  const deployedDeployments = stats?.deployed_deployments ?? 0;
  const expiringDeployments = stats?.expiring_soon_deployments ?? 0;
  const pendingDeployments = stats?.pending_deployments ?? 0;
  const totalDeployments = stats?.total_deployments ?? 0;
  const failedDeployments = stats?.failed_deployments ?? 0;

  return (
    <div className="space-y-8">
      {/* Main Title */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
        <p className="text-blue-100">EVE Lab Orchestrator - Real-time Monitoring</p>
      </div>

      {/* Lab Operations Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Live Lab Operations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-emerald-900/50 border border-emerald-500 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Running Labs</p>
            <p className="text-3xl font-bold text-emerald-400">{runningLabs}</p>
            <p className="text-xs text-gray-400 mt-2">Currently active sessions</p>
          </div>
          <div className="bg-blue-900/50 border border-blue-400 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Total Labs</p>
            <p className="text-3xl font-bold text-blue-400">{totalLabs}</p>
          </div>
          <div className="bg-yellow-900/50 border border-yellow-400 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Provisioning</p>
            <p className="text-3xl font-bold text-yellow-400">{provisioningLabs}</p>
            <p className="text-xs text-gray-400 mt-2">Labs still starting</p>
          </div>
          <div className="bg-red-900/50 border border-red-400 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Failed</p>
            <p className="text-3xl font-bold text-red-400">{failedLabs}</p>
          </div>
        </div>
      </div>

      {/* Deployment Status Section */}
      <div className="space-y-4">
        <h3 className="text-2xl font-bold text-white">Deployment Status</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-green-900/50 border border-green-400 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Deployed</p>
            <p className="text-3xl font-bold text-green-400">{deployedDeployments}</p>
          </div>
          <div className="bg-orange-900/50 border border-orange-400 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Expiring Soon</p>
            <p className="text-3xl font-bold text-orange-400">{expiringDeployments}</p>
            <p className="text-xs text-gray-400 mt-2">Within 30 minutes</p>
          </div>
          <div className="bg-gray-900/50 border border-gray-400 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Pending</p>
            <p className="text-3xl font-bold text-gray-400">{pendingDeployments}</p>
          </div>
          <div className="bg-purple-900/50 border border-purple-400 rounded-lg p-6">
            <p className="text-gray-300 text-sm">Total Deployments</p>
            <p className="text-3xl font-bold text-purple-400">{totalDeployments}</p>
          </div>
        </div>
      </div>

      {/* Summary Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-white">
          <h4 className="text-lg font-bold mb-4">Lab Summary</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Total Labs:</span>
              <span className="font-bold text-blue-400">{totalLabs}</span>
            </li>
            <li className="flex justify-between">
              <span>Active:</span>
              <span className="font-bold text-emerald-400">{runningLabs}</span>
            </li>
            <li className="flex justify-between">
              <span>Provisioning:</span>
              <span className="font-bold text-yellow-400">{provisioningLabs}</span>
            </li>
            <li className="flex justify-between">
              <span>Stopped:</span>
              <span className="font-bold text-gray-400">{stoppedLabs}</span>
            </li>
            <li className="flex justify-between">
              <span>Failed:</span>
              <span className="font-bold text-red-400">{failedLabs}</span>
            </li>
          </ul>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 text-white">
          <h4 className="text-lg font-bold mb-4">Deployment Summary</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex justify-between">
              <span>Total Deployments:</span>
              <span className="font-bold text-purple-400">{totalDeployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Deployed:</span>
              <span className="font-bold text-green-400">{deployedDeployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Pending:</span>
              <span className="font-bold text-gray-400">{pendingDeployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Expiring Soon:</span>
              <span className="font-bold text-orange-400">{expiringDeployments}</span>
            </li>
            <li className="flex justify-between">
              <span>Failed:</span>
              <span className="font-bold text-red-400">{failedDeployments}</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Server Information */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-4">EVE-NG Server Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-400">IP Address</p>
            <p className="text-blue-400 font-mono">192.168.2.11</p>
          </div>
          <div>
            <p className="text-gray-400">FQDN</p>
            <p className="text-blue-400 font-mono">evengvlab4you.ddns.net</p>
          </div>
          <div>
            <p className="text-gray-400">Protocol</p>
            <p className="text-blue-400 font-mono">HTTPS (Port 8443)</p>
          </div>
          <div>
            <p className="text-gray-400">Status</p>
            <p className="text-green-400">🟢 Online</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
