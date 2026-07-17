import React, { useState } from 'react';

function SetupGuides() {
  const [expandedGuide, setExpandedGuide] = useState(null);

  const guides = [
    {
      id: 'initial-setup',
      title: 'Initial Setup & Installation',
      icon: '🚀',
      sections: [
        {
          heading: 'Prerequisites',
          content: 'Ensure you have EVE-NG Pro installed with minimum 64GB RAM and 500GB storage.',
        },
        {
          heading: 'Connection Setup',
          content: 'Access the web interface at https://evengvlab4you.ddns.net:8443',
        },
      ],
    },
    {
      id: 'sdwan',
      title: 'SD-WAN Lab Configuration',
      icon: '🌐',
      sections: [
        {
          heading: 'Supported Vendors',
          content: 'Cisco SD-WAN, Velocloud, Palo Alto Networks',
        },
        {
          heading: 'Deployment Steps',
          content: '1. Select SD-WAN template\n2. Configure management IPs\n3. Deploy topology\n4. Verify connectivity',
        },
      ],
    },
    {
      id: 'routing',
      title: 'Routing & BGP Configuration',
      icon: '🔀',
      sections: [
        {
          heading: 'Supported Protocols',
          content: 'BGP, OSPF, EIGRP, Static Routing, MPLS',
        },
        {
          heading: 'Advanced Routing',
          content: 'Use AVPN Cloud topology for multi-site WAN optimization',
        },
      ],
    },
    {
      id: 'security',
      title: 'Security & Firewall Lab',
      icon: '🔒',
      sections: [
        {
          heading: 'Supported Firewalls',
          content: 'Cisco ASA, Cisco FTD, Palo Alto Networks, Fortigate, Juniper SRX',
        },
        {
          heading: 'Security Testing',
          content: 'Deploy firewalls with IDS/IPS, threat prevention, and policy enforcement',
        },
      ],
    },
    {
      id: 'reservation',
      title: 'Lab Reservation System',
      icon: '📅',
      sections: [
        {
          heading: 'Booking a Lab',
          content: '1. Navigate to Reservations\n2. Select desired lab\n3. Choose time slot\n4. Confirm booking',
        },
        {
          heading: 'Cancellation',
          content: 'Cancel at least 2 hours before scheduled time to avoid penalties',
        },
      ],
    },
    {
      id: 'monitoring',
      title: 'Monitoring & Performance Tuning',
      icon: '📈',
      sections: [
        {
          heading: 'Real-Time Monitoring',
          content: 'Monitor CPU, Memory, Network throughput, and Disk usage in real-time',
        },
        {
          heading: 'Performance Optimization',
          content: 'Adjust resource allocation and network performance settings for optimal results',
        },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Setup & Configuration Guides</h2>
        <p className="text-blue-100">Learn how to configure and manage your EVE Lab environment</p>
      </div>

      {/* Search Bar */}
      <input
        type="text"
        placeholder="Search guides..."
        className="w-full bg-slate-800/50 text-white px-4 py-3 rounded border border-slate-700 focus:border-blue-500 outline-none"
      />

      {/* Guides List */}
      <div className="space-y-4">
        {guides.map((guide) => (
          <div
            key={guide.id}
            className="bg-slate-800/50 border border-slate-700 rounded-lg overflow-hidden hover:border-blue-500 transition"
          >
            {/* Guide Header */}
            <button
              onClick={() => setExpandedGuide(expandedGuide === guide.id ? null : guide.id)}
              className="w-full flex items-center justify-between p-6 hover:bg-slate-700/30 transition"
            >
              <div className="flex items-center space-x-4">
                <span className="text-3xl">{guide.icon}</span>
                <h3 className="text-lg font-bold text-white">{guide.title}</h3>
              </div>
              <svg
                className={`w-6 h-6 text-gray-400 transition-transform ${
                  expandedGuide === guide.id ? 'rotate-180' : ''
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
              </svg>
            </button>

            {/* Guide Content */}
            {expandedGuide === guide.id && (
              <div className="border-t border-slate-700 p-6 bg-slate-700/20">
                <div className="space-y-6">
                  {guide.sections.map((section, idx) => (
                    <div key={idx}>
                      <h4 className="text-blue-400 font-bold mb-2">{section.heading}</h4>
                      <p className="text-gray-300 whitespace-pre-line">{section.content}</p>
                    </div>
                  ))}
                </div>

                {/* PDF Download Button */}
                <button className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition">
                  📥 Download Guide as PDF
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Quick Links */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
        <h3 className="text-xl font-bold text-white mb-4">Quick Links & Resources</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <button
            onClick={() => window.open('https://www.eve-ng.net/', '_blank')}
            className="text-blue-400 hover:text-blue-300 transition text-left"
          >
            📖 EVE-NG Official Documentation
          </button>
          <button
            onClick={() => window.open('https://www.eve-ng.net/documentation/videos', '_blank')}
            className="text-blue-400 hover:text-blue-300 transition text-left"
          >
            🎓 Training Videos
          </button>
          <button
            onClick={() => window.open('https://www.eve-ng.net/documentation/troubleshooting', '_blank')}
            className="text-blue-400 hover:text-blue-300 transition text-left"
          >
            🐛 Troubleshooting Guide
          </button>
          <button
            onClick={() => window.open('https://www.eve-ng.net/community', '_blank')}
            className="text-blue-400 hover:text-blue-300 transition text-left"
          >
            💬 Community Forum
          </button>
        </div>
      </div>
    </div>
  );
}

export default SetupGuides;
