import React, { useState } from 'react';
import { uploadTemplate } from '../services/api';

function UploadTemplateModal({ isOpen, onClose, onTemplateUploaded }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [category, setCategory] = useState('sdwan');
  const [isPublic, setIsPublic] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  const categories = [
    { id: 'sdwan', label: 'SD-WAN Solutions', icon: '🌐' },
    { id: 'mpls', label: 'MPLS VPN', icon: '🔀' },
    { id: 'routing', label: 'Routing & BGP', icon: '🛣️' },
    { id: 'security', label: 'Security Solutions', icon: '🔒' },
    { id: 'datacenter', label: 'Data Center', icon: '🏢' },
    { id: 'iot', label: 'IoT & Edge', icon: '📡' },
    { id: 'other', label: 'Other', icon: '📦' },
  ];

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.name.endsWith('.zip')) {
        setError('❌ Please upload a ZIP file');
        setSelectedFile(null);
        return;
      }
      if (file.size > 500 * 1024 * 1024) {
        setError('❌ File size exceeds 500MB limit');
        setSelectedFile(null);
        return;
      }
      setSelectedFile(file);
      setError('');
      const name = file.name.replace('.zip', '').replace(/[-_]/g, ' ');
      setTemplateName(name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedFile) {
      setError('❌ Please select a ZIP file');
      return;
    }

    if (!templateName.trim()) {
      setError('❌ Template name is required');
      return;
    }

    try {
      setLoading(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('name', templateName);
      formData.append('description', templateDescription);
      formData.append('category', category);
      formData.append('is_public', isPublic);

      await uploadTemplate(formData, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      });

      setSelectedFile(null);
      setTemplateName('');
      setTemplateDescription('');
      setUploadProgress(0);
      onTemplateUploaded();
      onClose();
    } catch (err) {
      setError(err.message || '❌ Failed to upload template');
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
      <div className="bg-slate-900 rounded-lg p-8 w-full max-w-2xl my-8">
        <h2 className="text-2xl font-bold text-white mb-2">📦 Upload EVE-NG Template</h2>
        <p className="text-gray-400 text-sm mb-6">Upload pre-built lab templates in ZIP format (e.g., from eve-ng.net)</p>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* File Upload */}
          <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-blue-500 transition">
            <input
              type="file"
              accept=".zip"
              onChange={handleFileChange}
              disabled={loading}
              className="hidden"
              id="zipFile"
            />
            <label htmlFor="zipFile" className="cursor-pointer">
              <div className="text-center">
                <p className="text-4xl mb-2">📁</p>
                <p className="text-white font-medium">
                  {selectedFile ? selectedFile.name : 'Click to select ZIP file'}
                </p>
                <p className="text-gray-400 text-sm mt-1">
                  {selectedFile
                    ? `Size: ${(selectedFile.size / (1024 * 1024)).toFixed(2)}MB`
                    : 'Maximum file size: 500MB'}
                </p>
                <p className="text-blue-400 text-sm mt-2">
                  Sample: sdwan_pro_f_lab.zip
                </p>
              </div>
            </label>
          </div>

          {/* Template Name */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Template Name *
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="e.g., SD-WAN Professional Lab"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={templateDescription}
              onChange={(e) => setTemplateDescription(e.target.value)}
              placeholder="Describe the lab topology, devices, and use cases"
              rows="3"
              className="w-full bg-slate-800 border border-slate-700 rounded px-3 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category */}
          <div>
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id)}
                  className={`p-2 rounded text-sm font-medium transition ${
                    category === cat.id
                      ? 'bg-blue-600 text-white border border-blue-500'
                      : 'bg-slate-800 text-gray-400 border border-slate-700 hover:text-white'
                  }`}
                >
                  <span>{cat.icon}</span> {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Public/Private Toggle */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="isPublic"
              checked={isPublic}
              onChange={(e) => setIsPublic(e.target.checked)}
              className="w-4 h-4 rounded border-slate-700 bg-slate-800 text-blue-600"
            />
            <label htmlFor="isPublic" className="text-gray-300 text-sm">
              Make available to all users 🌍
            </label>
          </div>

          {/* Upload Progress */}
          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
          )}
          {uploadProgress > 0 && (
            <p className="text-center text-gray-400 text-sm">
              📤 Uploading: {uploadProgress}%
            </p>
          )}

          {/* Buttons */}
          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-800 text-white py-2 rounded font-medium transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-green-900 text-white py-2 rounded font-medium transition"
            >
              {loading ? `⏳ Uploading (${uploadProgress}%)...` : '📤 Upload Template'}
            </button>
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 bg-slate-800/50 border border-slate-700 rounded p-4">
          <p className="text-gray-300 text-sm font-medium mb-2">💡 Supported Template Formats:</p>
          <ul className="text-gray-400 text-sm space-y-1 ml-4">
            <li>✓ EVE-NG lab ZIP files (eve-ng.net)</li>
            <li>✓ Network topology configurations</li>
            <li>✓ Device configurations included</li>
            <li>✓ Modify devices, names, and design after upload</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UploadTemplateModal;
