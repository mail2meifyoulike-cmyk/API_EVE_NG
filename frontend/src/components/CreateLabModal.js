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
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('[CreateLabModal] Loading templates...');
      
      const templateList = await fetchAllTemplates();
      console.log('[CreateLabModal] Templates loaded:', templateList);
      
      if (Array.isArray(templateList) && templateList.length > 0) {
        setTemplates(templateList);
      } else {
        console.warn('[CreateLabModal] No templates returned, got:', templateList);
        setTemplates([]);
        setError('No templates available from EVE-NG server');
      }
    } catch (error) {
      console.error('[CreateLabModal] Error loading templates:', error);
      setError(`Failed to load templates: ${error.message || 'Unknown error'}`);
      setTemplates([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateChange = async (templateName) => {
    setSelectedTemplate(templateName);
    setSelectedDevices([]);
    setTemplateDevices([]);
    setError('');

    if (templateName) {
      try {
        setLoadingDevices(true);
        console.log('[CreateLabModal] Loading devices for template:', templateName);
        
        const devices = await fetchTemplateDevices(templateName);
        console.log('[CreateLabModal] Devices loaded:', devices);
        
        // Handle different response formats
        let deviceList = [];
        
        if (Array.isArray(devices)) {
          deviceList = devices;
        } else if (devices.devices && Array.isArray(devices.devices)) {
          deviceList = devices.devices;
        } else if (devices.data && Array.isArray(devices.data)) {
          deviceList = devices.data;
        } else if (typeof devices === 'object' && devices !== null) {
          // Convert object to array
          deviceList = Object.values(devices).filter(item => item && typeof item === 'object');
        }
        
        console.log('[CreateLabModal] Processed device list:', deviceList);
        setTemplateDevices(deviceList);
        
        if (deviceList.length === 0) {
          setError(`No devices found in template: ${templateName}`);
        }
      } catch (error) {
        console.error('[CreateLabModal] Error loading template devices:', error);
        setError(`Failed to load devices: ${error.message || 'Unknown error'}`);
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
      setError('Please enter a lab name');
      return;
    }

    if (!selectedTemplate) {
      setError('Please select a template');
      return;
    }

    if (selectedDevices.length === 0) {
      setError('Please select at least one device');
      return;
    }

    try {
      setLoading(true);
      setError('');
      console.log('[CreateLabModal] Creating lab:', { labName, selectedTemplate, selectedDevices });
      
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
      setError('');
      
      onLabCreated();
      onClose();
      alert('Lab created successfully!');
    } catch (error) {
      console.error('[CreateLabModal] Error creating lab:', error);
      setError(`Error creating lab: ${error.message || 'Unknown error'}`);
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

        {/* Error Messages */}
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
            ⚠️ {error}
          </div>
        )}

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
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
            {loading && templates.length === 0 ? (
              <div className="flex items-center space-x-2 text-gray-400">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                <span>Loading templates...</span>
              </div>
            ) : templates.length === 0 ? (
              <div className="bg-yellow-900/30 border border-yellow-600 text-yellow-400 p-3 rounded text-sm">
                ⚠️ No templates available. Please ensure EVE-NG is running and has templates configured.
              </div>
            ) : (
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
            )}
          </div>

          {/* Device Selection */}
          {selectedTemplate && (
            <div className="bg-slate-800/50 border border-slate-700 rounded p-4">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-lg font-bold text-white">🖥️ Available Devices</h3>
                {templateDevices.length > 0 && (
                  <button
                    onClick={handleSelectAllDevices}
                    className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded transition"
                  >
                    {selectedDevices.length === templateDevices.length ? 'Deselect All' : 'Select All'}
                  </button>
                )}
              </div>

              {loadingDevices ? (
                <div className="flex justify-center py-4">
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
                    <span className="text-gray-400">Loading devices...</span>
                  </div>
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
                          {device.image && (
                            <p className="text-gray-500 text-xs">📦 {device.image}</p>
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
            disabled={loading || templates.length === 0}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 disabled:cursor-not-allowed text-white py-2 rounded font-medium transition"
          >
            {loading ? '⏳ Creating Lab...' : '🚀 Create Lab'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateLabModal;
