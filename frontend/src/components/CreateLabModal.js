import React, { useState } from 'react';
import { createLab } from '../services/api';

function CreateLabModal({ isOpen, onClose, onLabCreated }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'sdwan',
    topology: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const topologies = {
    sdwan: [
      { id: 'cisco-sdwan', name: 'Cisco SD-WAN Hub & Spoke' },
      { id: 'velocloud', name: 'VMware VeloCloud' },
      { id: 'paloalto-sdwan', name: 'Palo Alto Networks SD-WAN' },
    ],
    routing: [
      { id: 'bgp-mesh', name: 'BGP Full Mesh' },
      { id: 'ospf-area', name: 'OSPF Multi-Area' },
      { id: 'eigrp-network', name: 'EIGRP Network' },
      { id: 'mpls-vpn', name: 'MPLS L3VPN' },
    ],
    security: [
      { id: 'cisco-asa', name: 'Cisco ASA Firewall' },
      { id: 'fortigate', name: 'Fortigate IPS/IDS' },
      { id: 'palo-alto-fw', name: 'Palo Alto Networks Firewall' },
      { id: 'juniper-srx', name: 'Juniper SRX' },
    ],
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      ...(name === 'category' && { topology: '' }), // Reset topology on category change
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.name.trim()) {
      setError('Lab name is required');
      return;
    }

    if (!formData.topology) {
      setError('Please select a topology');
      return;
    }

    try {
      setLoading(true);
      await createLab(
        formData.name,
        formData.description,
        formData.topology,
        formData.category
      );
      setFormData({ name: '', description: '', category: 'sdwan', topology: '' });
      onLabCreated();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create lab');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Create New Lab</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lab Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Lab Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Cisco SD-WAN Lab 1"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Describe the purpose of this lab"
              rows="3"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="sdwan">SD-WAN Solutions</option>
              <option value="routing">Routing & BGP</option>
              <option value="security">Security Solutions</option>
            </select>
          </div>

          {/* Topology */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Topology *
            </label>
            <select
              name="topology"
              value={formData.topology}
              onChange={handleChange}
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white focus:outline-none focus:border-blue-500"
            >
              <option value="">Select a topology...</option>
              {topologies[formData.category]?.map((topo) => (
                <option key={topo.id} value={topo.id}>
                  {topo.name}
                </option>
              ))}
            </select>
          </div>

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-900 text-white py-2 rounded font-medium transition"
            >
              {loading ? 'Creating...' : 'Create Lab'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateLabModal;
