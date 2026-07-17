import React, { useState } from 'react';

function TemplateDesignEditor({ template, isOpen, onClose, onSave }) {
  const [templateData, setTemplateData] = useState(template || {});
  const [activeTab, setActiveTab] = useState('devices');
  const [editingDevice, setEditingDevice] = useState(null);
  const [newDevice, setNewDevice] = useState({ name: '', type: '', image: '' });
  const [loading, setLoading] = useState(false);

  const deviceTypes = [
    'Router',
    'Switch',
    'Firewall',
    'LoadBalancer',
    'Server',
    'PC',
    'CloudNode',
    'SecurityAppliance',
    'WAN-Optimizer',
    'VPN-Gateway',
  ];

  const handleAddDevice = () => {
    if (newDevice.name && newDevice.type) {
      setTemplateData((prev) => ({
        ...prev,
        devices: [
          ...(prev.devices || []),
          { id: Date.now(), ...newDevice, status: 'added' },
        ],
      }));
      setNewDevice({ name: '', type: '', image: '' });
    }
  };

  const handleDeleteDevice = (id) => {
    setTemplateData((prev) => ({
      ...prev,
      devices: prev.devices?.filter((d) => d.id !== id) || [],
    }));
  };

  const handleEditDevice = (device) => {
    setEditingDevice(device);
  };

  const handleAddLink = () => {
    setTemplateData((prev) => ({
      ...prev,
      links: [
        ...(prev.links || []),
        { id: Date.now(), source: '', target: '', bandwidth: '', latency: '' },
      ],
    }));
  };

  const handleDeleteLink = (id) => {
    setTemplateData((prev) => ({
      ...prev,
      links: prev.links?.filter((l) => l.id !== id) || [],
    }));
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(templateData);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-lg p-6 w-full max-w-4xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">✏️ Edit Template Design</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-4 border-b border-slate-700 mb-6">
          {[
            { id: 'devices', label: '🖥️ Devices' },
            { id: 'links', label: '🔗 Links' },
            { id: 'config', label: '⚙️ Configuration' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Devices Tab */}
        {activeTab === 'devices' && (
          <div className="space-y-4">
            {/* Add New Device */}
            <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
              <h3 className="text-lg font-bold text-white mb-4">➕ Add New Device</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <input
                  type="text"
                  placeholder="Device Name"
                  value={newDevice.name}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, name: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <select
                  value={newDevice.type}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, type: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Type</option>
                  {deviceTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Image/Icon"
                  value={newDevice.image}
                  onChange={(e) =>
                    setNewDevice({ ...newDevice, image: e.target.value })
                  }
                  className="bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
                <button
                  onClick={handleAddDevice}
                  className="bg-green-600 hover:bg-green-700 text-white font-medium rounded px-4 py-2 transition"
                >
                  Add Device
                </button>
              </div>
            </div>

            {/* Device List */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-white mb-2">📋 Devices List</h3>
              {templateData.devices && templateData.devices.length > 0 ? (
                templateData.devices.map((device) => (
                  <div
                    key={device.id}
                    className="bg-slate-800/50 border border-slate-700 rounded p-3 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <p className="text-white font-medium">
                        {device.name} <span className="text-gray-400 text-sm">({device.type})</span>
                      </p>
                      {device.image && (
                        <p className="text-gray-400 text-sm">Image: {device.image}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEditDevice(device)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteDevice(device.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No devices added yet</p>
              )}
            </div>
          </div>
        )}

        {/* Links Tab */}
        {activeTab === 'links' && (
          <div className="space-y-4">
            <button
              onClick={handleAddLink}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded font-medium transition"
            >
              ➕ Add Link
            </button>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {templateData.links && templateData.links.length > 0 ? (
                templateData.links.map((link, idx) => (
                  <div key={idx} className="bg-slate-800/50 border border-slate-700 rounded p-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Source Device"
                        defaultValue={link.source}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Target Device"
                        defaultValue={link.target}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Bandwidth (Mbps)"
                        defaultValue={link.bandwidth}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                      <input
                        type="text"
                        placeholder="Latency (ms)"
                        defaultValue={link.latency}
                        className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-white text-sm"
                      />
                    </div>
                    <button
                      onClick={() => handleDeleteLink(link.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition"
                    >
                      🗑️ Delete Link
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No links added yet</p>
              )}
            </div>
          </div>
        )}

        {/* Configuration Tab */}
        {activeTab === 'config' && (
          <div className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Template Name
              </label>
              <input
                type="text"
                value={templateData.name || ''}
                onChange={(e) =>
                  setTemplateData({ ...templateData, name: e.target.value })
                }
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">
                Description
              </label>
              <textarea
                value={templateData.description || ''}
                onChange={(e) =>
                  setTemplateData({ ...templateData, description: e.target.value })
                }
                rows="4"
                className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700 rounded p-3">
                <p className="text-gray-400 text-sm">Total Devices</p>
                <p className="text-white text-2xl font-bold">
                  {templateData.devices?.length || 0}
                </p>
              </div>
              <div className="bg-slate-800/50 border border-slate-700 rounded p-3">
                <p className="text-gray-400 text-sm">Total Links</p>
                <p className="text-white text-2xl font-bold">
                  {templateData.links?.length || 0}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-2 rounded font-medium transition"
          >
            {loading ? '💾 Saving...' : '💾 Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default TemplateDesignEditor;
