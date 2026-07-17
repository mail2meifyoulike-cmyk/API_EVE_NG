import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import ClusterStatus from './components/ClusterStatus';
import LabSolutions from './components/LabSolutions';
import Monitoring from './components/Monitoring';
import Reporting from './components/Reporting';
import MyLabs from './components/MyLabs';
import Reservations from './components/Reservations';
import UserManagement from './components/UserManagement';
import Administration from './components/Administration';
import SetupGuides from './components/SetupGuides';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'cluster-status':
        return <ClusterStatus />;
      case 'lab-solutions':
        return <LabSolutions />;
      case 'monitoring':
        return <Monitoring />;
      case 'reporting':
        return <Reporting />;
      case 'my-labs':
        return <MyLabs />;
      case 'reservations':
        return <Reservations />;
      case 'user-management':
        return <UserManagement />;
      case 'administration':
        return <Administration />;
      case 'setup-guides':
        return <SetupGuides />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-slate-900 to-slate-800 flex">
      {/* Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-gradient-to-r from-blue-800 to-blue-600 text-white shadow-lg z-10">
          <div className="px-6 py-4 flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-blue-700 rounded-lg transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <div>
                <h1 className="text-2xl font-bold">EVE Lab Automation</h1>
                <p className="text-blue-100 text-sm">Professional Network Emulation Platform</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm text-blue-100">Connected to:</p>
                <p className="font-semibold">evengvlab4you.ddns.net</p>
              </div>
              <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold">👤</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-auto p-6">
          {renderContent()}
        </main>

        {/* Footer */}
        <footer className="bg-slate-900 border-t border-slate-700 text-gray-400 text-center py-4">
          <p>EVE Lab Automation v2.0 - Professional Edition | Connected to EVE-NG at evengvlab4you.ddns.net:8443</p>
        </footer>
      </div>
    </div>
  );
}

export default App;
