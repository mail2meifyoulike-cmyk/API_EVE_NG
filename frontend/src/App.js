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

  useEffect(() => {
    loadDashboardData();
    const interval = setInterval(loadDashboardData, 5000);
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
              <h1 className="text-2xl font-bold">EVE Lab Automation</h1>
            </div>
            <div className="text-sm text-blue-100">Lab Orchestrator</div>
          </div>
        </div>
      </header>

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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
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
        <p>EVE Lab Automation API v1.0.0 - Powered by FastAPI & React</p>
      </footer>
    </div>
  );
}

export default App;
