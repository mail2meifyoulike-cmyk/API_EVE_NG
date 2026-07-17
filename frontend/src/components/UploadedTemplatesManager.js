import React, { useState, useEffect } from 'react';
import { fetchUploadedTemplates, deleteTemplate } from '../services/api';
import TemplateDesignEditor from './TemplateDesignEditor';

function UploadedTemplatesManager({ isOpen, onClose }) {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showEditor, setShowEditor] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const data = await fetchUploadedTemplates();
      setTemplates(data);
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (window.confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate(templateId);
        loadTemplates();
      } catch (error) {
        alert('Failed to delete template: ' + error.message);
      }
    }
  };

  const handleEditTemplate = (template) => {
    setSelectedTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = async (updatedTemplate) => {
    setShowEditor(false);
    alert('Template updated successfully!');
    loadTemplates();
  };

  const categories = ['all', 'sdwan', 'mpls', 'routing', 'security', 'datacenter', 'iot'];

  const filteredTemplates =
    filter === 'all'
      ? templates
      : templates.filter((t) => t.category === filter);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-lg p-6 w-full max-w-5xl my-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">📋 Uploaded Templates Manager</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-2xl font-bold"
          >
            ✕
          </button>
        </div>

        {/* Category Filter */}
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-3 py-1 rounded text-sm font-medium transition capitalize ${
                filter === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-gray-400 hover:text-white'
              }`}
            >
              {cat === 'all' ? '📋 All' : cat}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
          </div>
        ) : filteredTemplates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 hover:border-blue-500 transition"
              >
                <div className="mb-3">
                  <h3 className="text-lg font-bold text-white mb-1">{template.name}</h3>
                  <p className="text-gray-400 text-sm mb-2 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded capitalize">
                      {template.category}
                    </span>
                    {template.is_public && (
                      <span className="bg-green-900/50 text-green-300 text-xs px-2 py-1 rounded">
                        🌍 Public
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  <p>📦 Size: {(template.file_size / (1024 * 1024)).toFixed(2)}MB</p>
                  <p>⏰ Uploaded: {new Date(template.created_at).toLocaleDateString()}</p>
                  {template.devices_count && (
                    <p>🖥️ Devices: {template.devices_count}</p>
                  )}
                </div>

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEditTemplate(template)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded text-sm font-medium transition"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeleteTemplate(template.id)}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded text-sm font-medium transition"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 text-lg mb-4">No templates found</p>
            <p className="text-gray-500 text-sm">
              Upload a template to get started!
            </p>
          </div>
        )}
      </div>

      {/* Template Design Editor Modal */}
      <TemplateDesignEditor
        template={selectedTemplate}
        isOpen={showEditor}
        onClose={() => setShowEditor(false)}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}

export default UploadedTemplatesManager;
