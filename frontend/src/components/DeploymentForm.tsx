import React, { useState, useEffect } from 'react';
import { createDeployment, fetchLabs } from '../services/api';

interface Lab {
  id: number;
  name: string;
}

interface DeploymentFormProps {
  onSuccess: () => void;
}

function DeploymentForm({ onSuccess }: DeploymentFormProps) {
  const [labs, setLabs] = useState<Lab[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    labId: '',
    deploymentName: '',
    topology: '',
    provisioningTime: '',
  });

  useEffect(() => {
    loadLabs();
  }, []);

  const loadLabs = async () => {
    try {
      setLoading(true);
      const data = await fetchLabs();
      setLabs(data);
    } catch (err) {
      setError('Failed to load labs');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.labId || !formData.deploymentName) {
      setError('Lab and Deployment Name are required');
      return;
    }

    try {
      await createDeployment(
        parseInt(formData.labId),
        formData.deploymentName,
        formData.topology || undefined,
        formData.provisioningTime ? parseInt(formData.provisioningTime) : undefined
      );
      setSuccess('Deployment created successfully!');
      setFormData({
        labId: '',
        deploymentName: '',
        topology: '',
        provisioningTime: '',
      });
      setTimeout(() => {
        setSuccess('');
        onSuccess();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create deployment');
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Deploy Lab</h2>

      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-8 max-w-2xl">
        <h3 className="text-lg font-bold text-white mb-6">Create Deployment</h3>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-4 py-3 rounded mb-4">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Select Lab *
            </label>
            <select
              name="labId"
              value={formData.labId}
              onChange={handleChange}
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white focus:outline-none focus:border-blue-500"
              disabled={loading}
            >
              <option value="">Choose a lab...</option>
              {labs.map((lab) => (
                <option key={lab.id} value={lab.id}>
                  {lab.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Deployment Name *
            </label>
            <input
              type="text"
              name="deploymentName"
              value={formData.deploymentName}
              onChange={handleChange}
              placeholder="e.g., Production Topology v1"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Topology
            </label>
            <input
              type="text"
              name="topology"
              value={formData.topology}
              onChange={handleChange}
              placeholder="e.g., Multi-vendor network solutions"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Provisioning Time (minutes)
            </label>
            <input
              type="number"
              name="provisioningTime"
              value={formData.provisioningTime}
              onChange={handleChange}
              placeholder="e.g., 30"
              min="1"
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded font-medium transition-all"
          >
            🚀 Deploy Lab
          </button>
        </form>
      </div>

      {/* Information Box */}
      <div className="bg-blue-900/30 border border-blue-600 rounded-lg p-6 text-blue-100 text-sm">
        <h4 className="font-bold mb-2">ℹ️ Deployment Info</h4>
        <ul className="list-disc list-inside space-y-1">
          <li>Select an existing lab to deploy</li>
          <li>Provide a unique deployment name</li>
          <li>Specify topology for multi-vendor POC</li>
          <li>Set provisioning time for lab startup</li>
        </ul>
      </div>
    </div>
  );
}

export default DeploymentForm;
