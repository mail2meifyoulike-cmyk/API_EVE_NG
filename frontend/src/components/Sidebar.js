import React from 'react';

function Sidebar({ activeTab, setActiveTab, sidebarOpen, setSidebarOpen }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
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
      } bg-slate-900 border-r border-slate-700 transition-all duration-300 overflow-y-auto`}
    >
      <div className="p-4">
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
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>
      </div>

      {/* Footer Info */}
      {sidebarOpen && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-800 rounded-lg p-3 text-xs text-gray-300">
          <p className="font-semibold mb-2">Server Info</p>
          <p>IP: 192.168.2.11</p>
          <p>FQDN: evengvlab4you.ddns.net</p>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;
