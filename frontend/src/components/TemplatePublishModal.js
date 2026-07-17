import React, { useState } from 'react';
import { publishTemplate } from '../services/api';

function TemplatePublishModal({ isOpen, onClose, onPublished }) {
  const [formData, setFormData] = useState({
    templateName: '',
    templateDescription: '',
    topology: '',
    category: 'sdwan',
    isPublic: true,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const categories = [
    { id: 'sdwan', label: 'SD-WAN Solutions' },
    { id: 'routing', label: 'Routing & BGP' },
    { id: 'security', label: 'Security Solutions' },
  ];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.templateName.trim()) {
      setError('Template name is required');
      return;
    }

    if (!formData.topology.trim()) {
      setError('Topology configuration is required');
      return;
    }

    try {
      setLoading(true);
      await publishTemplate({
        name: formData.templateName,
        description: formData.templateDescription,
        topology: formData.topology,
        category: formData.category,
        isPublic: formData.isPublic,
      });
      setFormData({
        templateName: '',
        templateDescription: '',
        topology: '',
        category: 'sdwan',
        isPublic: true,
      });
      onPublished();
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to publish template');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-white mb-6">Publish Custom Template</h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Template Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Template Name *
            </label>
            <input
              type="text"
              name="templateName"
              value={formData.templateName}
              onChange={handleChange}
              placeholder="e.g., Advanced Cisco SD-WAN"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              name="templateDescription"
              value={formData.templateDescription}
              onChange={handleChange}
              placeholder="Describe this template for other users"
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
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.label}
                </option>
              ))}
            </select>
          </div>

          {/* Topology JSON */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Topology Configuration (JSON) *
            </label>
            <textarea
              name="topology"
              value={formData.topology}
              onChange={handleChange}
              placeholder='{"nodes": [], "links": []}'
              rows="4"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 font-mono text-xs"
            />
            <p className="text-gray-500 text-xs mt-1">
              Paste your EVE-NG topology JSON configuration here
            </p>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPublic"
              name="isPublic"
              checked={formData.isPublic}
              onChange={handleChange}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isPublic" className="text-gray-300 text-sm">
              Make available to all users
            </label>
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
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white py-2 rounded font-medium transition"
            >
              {loading ? 'Publishing...' : 'Publish Template'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TemplatePublishModal;
