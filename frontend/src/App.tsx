import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import LabStatus from './components/LabStatus';
import DeploymentForm from './components/DeploymentForm';
import { fetchDashboardStats } from './services/api';
import './App.css';

function App() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [serverInfo, setServerInfo] = useState({
    appServer: process.env.REACT_APP_API_URL || 'http://localhost:8000',
    eveNgFqdn: process.env.REACT_APP_EVE_NG_FQDN || 'apssevengvlab.attniglobal.com',
    eveNgPort: process.env.REACT_APP_EVE_NG_PORT || '8443',
    eveNgProtocol: process.env.REACT_APP_EVE_NG_PROTOCOL || 'https',
  });
  const [eveNgConnected, setEveNgConnected] = useState(false);

  useEffect(() => {
    loadDashboardData();
    checkEveNgHealth();
    const interval = setInterval(() => {
      loadDashboardData();
      checkEveNgHealth();
    }, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const loadDashboardData = async () => {
    try {
      const data = await fetchDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEveNgHealth = async () => {
    try {
      const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/api/status/eve-ng/health`);
      if (response.ok) {
        const health = await response.json();
        setEveNgConnected(health.connected || false);
      }
    } catch (error) {
      console.warn('EVE-NG health check failed:', error);
      setEveNgConnected(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800">
      {/* Header */}
      <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
                <span className="text-blue-600 font-bold text-lg">⚙️</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold">EVE Lab Automation</h1>
                <p className="text-xs text-blue-200">AT&T | APSS | Lab Orchestrator</p>
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="text-blue-100">EVE-NG Server</div>
              <div className="font-mono text-xs">
                {serverInfo.eveNgFqdn}:{serverInfo.eveNgPort}
              </div>
              <div className={`text-xs mt-1 ${eveNgConnected ? 'text-green-300' : 'text-yellow-300'}`}>
                {eveNgConnected ? '🟢 Connected' : '🟡 Connecting...'}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Server Information Banner */}
      <div className="bg-slate-800 border-b border-slate-700 text-gray-300 text-xs">
        <div className="container mx-auto px-4 py-2">
          <div className="flex justify-between items-center space-x-8">
            <div>
              <span className="text-gray-400">Application Server:</span>
              <span className="ml-2 font-mono text-blue-300">{serverInfo.appServer}</span>
            </div>
            <div>
              <span className="text-gray-400">EVE-NG:</span>
              <span className="ml-2 font-mono text-blue-300">
                {serverInfo.eveNgProtocol}://{serverInfo.eveNgFqdn}:{serverInfo.eveNgPort}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Mode:</span>
              <span className="ml-2 font-mono text-green-300">
                {eveNgConnected ? 'Real-time' : 'Database'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="bg-slate-800 border-b border-slate-700">
        <div className="container mx-auto px-4">
          <div className="flex space-x-8">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'dashboard'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              📊 Dashboard
            </button>
            <button
              onClick={() => setActiveTab('labs')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'labs'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🧪 Lab Status
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === 'deploy'
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              🚀 Deploy Lab
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="flex justify-center items-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400 mx-auto mb-4"></div>
              <p className="text-gray-300">Loading real EVE-NG data...</p>
            </div>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && stats && <Dashboard stats={stats} />}
            {activeTab === 'labs' && <LabStatus />}
            {activeTab === 'deploy' && <DeploymentForm onSuccess={loadDashboardData} />}
          </>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-700 text-gray-400 text-center py-4 mt-12">
        <p>EVE Lab Automation API v2.0.0 - Real EVE-NG Integration</p>
        <p className="text-xs mt-1 text-gray-500">
          {eveNgConnected 
            ? `✓ Connected to EVE-NG: ${serverInfo.eveNgFqdn}` 
            : '⚠ Using database-only mode'}
        </p>
      </footer>
    </div>
  );
}

export default App;
