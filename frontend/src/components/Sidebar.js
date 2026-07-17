import React from 'react';

function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'cluster-status', label: 'Cluster Status', icon: '🖥️' },
    { id: 'lab-solutions', label: 'Lab Solutions', icon: '🧪' },
    { id: 'my-labs', label: 'My Labs', icon: '📁' },
    { id: 'reservations', label: 'Reservations', icon: '📅' },
    { id: 'monitoring', label: 'Monitoring', icon: '📈' },
    { id: 'reporting', label: 'Reporting', icon: '📋' },
    { id: 'user-management', label: 'User Management', icon: '👥' },
    { id: 'administration', label: 'Administration', icon: '⚙️' },
    { id: 'setup-guides', label: 'Setup Guides', icon: '📚' },
  ];

  return (
    <aside
      className={`${
        sidebarOpen ? 'w-64' : 'w-20'
      } bg-slate-900 border-r border-slate-700 transition-all duration-300 overflow-y-auto flex flex-col`}
    >
      <div className="p-4 flex-1">
        <div className="flex items-center justify-between mb-8">
          {sidebarOpen && <h2 className="text-lg font-bold text-white">EVE LAB</h2>}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1 hover:bg-slate-800 rounded"
          >
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        <nav className="space-y-2">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white'
                  : 'text-gray-400 hover:bg-slate-800 hover:text-white'
              }`}
              title={!sidebarOpen ? item.label : ''}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      {sidebarOpen && (
        <div className="p-4 border-t border-slate-700 bg-slate-800 rounded-lg m-4 text-xs text-gray-300">
          <p className="font-semibold mb-2">🌐 EVE-NG Server</p>
          <p className="mb-1">📍 IP: 192.168.2.11</p>
          <p className="mb-1">🔗 FQDN: evengvlab4you.ddns.net</p>
          <p>🔒 HTTPS : 8443</p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
