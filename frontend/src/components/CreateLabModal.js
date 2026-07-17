import React, { useState, useEffect } from 'react';
import { fetchAllTemplates, fetchTemplateDevices, createLab } from '../services/api';

function CreateLabModal({ isOpen, onClose, onLabCreated }) {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [templateDevices, setTemplateDevices] = useState([]);
  const [selectedDevices, setSelectedDevices] = useState([]);
  const [labName, setLabName] = useState('');
  const [labDescription, setLabDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingDevices, setLoadingDevices] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const templateList = await fetchAllTemplates();
      setTemplates(templateList);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (templateName) => {
    setSelectedTemplate(templateName);
    setSelectedDevices([]);
    setTemplateDevices([]);

    if (templateName) {
      try {
        setLoadingDevices(true);
        const devices = await fetchTemplateDevices(templateName);
        // Handle different response formats
        const deviceList = devices.devices || devices.data || Object.values(devices) || [];
        setTemplateDevices(Array.isArray(deviceList) ? deviceList : []);
      } catch (error) {
        console.error('Error loading template devices:', error);
        setTemplateDevices([]);
      } finally {
        setLoadingDevices(false);
      }
    }
  };

  const handleDeviceToggle = (deviceId) => {
    setSelectedDevices((prev) =>
      prev.includes(deviceId)
        ? prev.filter((id) => id !== deviceId)
        : [...prev, deviceId]
    );
  };

  const handleSelectAllDevices = () => {
    if (selectedDevices.length === templateDevices.length) {
      setSelectedDevices([]);
    } else {
      setSelectedDevices(templateDevices.map((device) => device.id || device.name));
    }
  };

  const handleCreateLab = async () => {
    if (!labName.trim()) {
      alert('Please enter a lab name');
      return;
    }

    if (!selectedTemplate) {
      alert('Please select a template');
      return;
    }

    if (selectedDevices.length === 0) {
      alert('Please select at least one device');
      return;
    }

    try {
      setLoading(true);
      const topology = {
        template: selectedTemplate,
        devices: selectedDevices.map((deviceId) => {
          const device = templateDevices.find((d) => (d.id || d.name) === deviceId);
          return device || { id: deviceId };
        }),
      };

      await createLab(labName, labDescription, topology);
      
      // Reset form
      setLabName('');
      setLabDescription('');
      setSelectedTemplate('');
      setSelectedDevices([]);
      setTemplateDevices([]);
      
      onLabCreated();
      onClose();
      alert('Lab created successfully!');
    } catch (error) {
      console.error('Error creating lab:', error);
      alert(`Error creating lab: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-lg p-6 w-full max-w-2xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">➕ Create New Lab</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 max-h-96 overflow-y-auto">
          {/* Lab Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Lab Name *
            </label>
            <input
              type="text"
              value={labName}
              onChange={(e) => setLabName(e.target.value)}
              placeholder="e.g., MPLS Network Lab"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          {/* Lab Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={labDescription}
              onChange={(e) => setLabDescription(e.target.value)}
              placeholder="Lab description (optional)"
              rows="2"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Select Template *
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">-- Choose a template --</option>
              {templates.map((template) => (
                <option key={template.id || template.name} value={template.name || template.id}>
                  {template.name || template.id}
                </option>
              ))}
            </select>
            {loading && <p className="text-gray-400 text-sm mt-1">Loading templates...</p>}
          </div>

          {/* Device Selection */}
          {selectedTemplate && (
            <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">🖥️ Available Devices</h3>
                <button
                  onClick={handleSelectAllDevices}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                >
                  {selectedDevices.length === templateDevices.length ? 'Deselect All' : 'Select All'}
                </button>
              </div>

              {loadingDevices ? (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                </div>
              ) : templateDevices.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {templateDevices.map((device) => {
                    const deviceId = device.id || device.name;
                    return (
                      <label key={deviceId} className="flex items-center space-x-3 cursor-pointer hover:bg-slate-700/30 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={selectedDevices.includes(deviceId)}
                          onChange={() => handleDeviceToggle(deviceId)}
                          className="w-4 h-4 rounded border-gray-500 text-blue-600 focus:ring-2 focus:ring-blue-600"
                        />
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {device.name || device.id}
                          </p>
                          {device.type && (
                            <p className="text-gray-400 text-sm">{device.type}</p>
                          )}
                        </div>
                        {selectedDevices.includes(deviceId) && (
                          <span className="text-green-400 text-sm font-bold">✓</span>
                        )}
                      </label>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No devices found in this template</p>
              )}

              {selectedDevices.length > 0 && (
                <p className="text-gray-300 text-sm mt-3">
                  Selected: <span className="font-bold text-blue-400">{selectedDevices.length}</span> device(s)
                </p>
              )}
            </div>
          )}

          {/* Summary */}
          {selectedTemplate && templateDevices.length > 0 && (
            <div className="bg-blue-900/20 border border-blue-500/30 rounded p-3 text-sm">
              <p className="text-blue-300">
                📋 Lab will be created with <span className="font-bold">{selectedDevices.length}</span> device(s) from the <span className="font-bold">{selectedTemplate}</span> template.
              </p>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 mt-6 pt-4 border-t border-slate-700">
          <button
            onClick={onClose}
            className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateLab}
            disabled={loading}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white py-2 rounded font-medium transition"
          >
            {loading ? '⏳ Creating Lab...' : '🚀 Create Lab'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateLabModal;
