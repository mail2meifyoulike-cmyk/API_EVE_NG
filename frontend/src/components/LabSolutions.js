import React, { useState, useEffect } from 'react';
import { fetchSDWANLabs, fetchRoutingLabs, fetchSecurityLabs } from '../services/api';

function LabSolutions() {
  const [sdwanLabs, setSdwanLabs] = useState([]);
  const [routingLabs, setRoutingLabs] = useState([]);
  const [securityLabs, setSecurityLabs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('sdwan');

  useEffect(() => {
    loadLabSolutions();
  }, []);

  const loadLabSolutions = async () => {
    try {
      setLoading(true);
      const [sdwan, routing, security] = await Promise.all([
        fetchSDWANLabs().catch(() => []),
        fetchRoutingLabs().catch(() => []),
        fetchSecurityLabs().catch(() => []),
      ]);
      setSdwanLabs(sdwan);
      setRoutingLabs(routing);
      setSecurityLabs(security);
    } catch (error) {
      console.error('Error loading lab solutions:', error);
    } finally {
      setLoading(false);
    }
  };

  const LabCard = ({ lab }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6 hover:border-blue-500 transition">
      <h3 className="text-lg font-bold text-white mb-2">{lab.name}</h3>
      <p className="text-gray-400 text-sm mb-4">{lab.description}</p>
      <div className="flex flex-wrap gap-2 mb-4">
        {lab.vendors && lab.vendors.map((vendor) => (
          <span key={vendor} className="bg-blue-900/50 text-blue-300 text-xs px-2 py-1 rounded">
            {vendor}
          </span>
        ))}
      </div>
      <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded font-medium transition">
        Deploy Lab
      </button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Lab Solutions</h2>
        <p className="text-blue-100">Deploy pre-built network topologies for learning and testing</p>
      </div>

      {/* Category Tabs */}
      <div className="flex space-x-4 border-b border-slate-700">
        {[
          { id: 'sdwan', label: 'SD-WAN Solutions', icon: '🌐' },
          { id: 'routing', label: 'Routing & BGP', icon: '🔀' },
          { id: 'security', label: 'Security Solutions', icon: '🔒' },
        ].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-3 font-medium transition-colors flex items-center space-x-2 ${
              activeCategory === cat.id
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Lab Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {activeCategory === 'sdwan' &&
            (sdwanLabs.length > 0 ? sdwanLabs.map((lab) => <LabCard key={lab.id} lab={lab} />) : <p className="text-gray-400">No SD-WAN labs available</p>)}
          {activeCategory === 'routing' &&
            (routingLabs.length > 0 ? routingLabs.map((lab) => <LabCard key={lab.id} lab={lab} />) : <p className="text-gray-400">No Routing labs available</p>)}
          {activeCategory === 'security' &&
            (securityLabs.length > 0 ? securityLabs.map((lab) => <LabCard key={lab.id} lab={lab} />) : <p className="text-gray-400">No Security labs available</p>)}
        </div>
      )}
    </div>
  );
}

export default LabSolutions;
