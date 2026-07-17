import React, { useState, useEffect, useCallback } from 'react';
import { generateReport, fetchUserActivity, fetchSystemLogs } from '../services/api';

function Reporting() {
  const [reportType, setReportType] = useState('overview');
  const [userActivity, setUserActivity] = useState([]);
  const [systemLogs, setSystemLogs] = useState([]);
  const [loading, setLoading] = useState(false);

  const loadReports = useCallback(async () => {
    try {
      setLoading(true);
      if (reportType === 'user-activity') {
        const data = await fetchUserActivity('all').catch(() => []);
        setUserActivity(data);
      } else if (reportType === 'system-logs') {
        const data = await fetchSystemLogs().catch(() => []);
        setSystemLogs(data);
      }
    } catch (error) {
      console.error('Error loading reports:', error);
    } finally {
      setLoading(false);
    }
  }, [reportType]);

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const downloadReport = async () => {
    try {
      await generateReport(reportType, {}).catch(() => null);
    } catch (error) {
      console.error('Error downloading report:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-lg p-6 text-white">
        <h2 className="text-3xl font-bold mb-2">Reporting & Analytics</h2>
        <p className="text-blue-100">Generate and view detailed reports on lab usage and system performance</p>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { id: 'overview', label: 'Overview Report', icon: '📊' },
          { id: 'user-activity', label: 'User Activity', icon: '👥' },
          { id: 'system-logs', label: 'System Logs', icon: '📋' },
        ].map((report) => (
          <button
            key={report.id}
            onClick={() => setReportType(report.id)}
            className={`p-6 rounded-lg border-2 transition ${
              reportType === report.id
                ? 'bg-blue-600/20 border-blue-500'
                : 'bg-slate-800/50 border-slate-700 hover:border-slate-600'
            }`}
          >
            <div className="text-3xl mb-2">{report.icon}</div>
            <div className="text-white font-medium">{report.label}</div>
          </button>
        ))}
      </div>

      {/* Download Button */}
      <button
        onClick={downloadReport}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-medium transition"
      >
        📥 Download Report
      </button>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-400"></div>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
          {reportType === 'overview' && (
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-white">System Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-700/50 rounded p-4">
                  <p className="text-gray-400 text-sm">Total Labs Created</p>
                  <p className="text-3xl font-bold text-blue-400">245</p>
                </div>
                <div className="bg-slate-700/50 rounded p-4">
                  <p className="text-gray-400 text-sm">Active Users</p>
                  <p className="text-3xl font-bold text-green-400">48</p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'user-activity' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">Recent User Activity</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-600">
                    <tr>
                      <th className="text-left py-3 px-4 text-gray-300">User</th>
                      <th className="text-left py-3 px-4 text-gray-300">Action</th>
                      <th className="text-left py-3 px-4 text-gray-300">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userActivity.length > 0 ? (
                      userActivity.map((activity, idx) => (
                        <tr key={idx} className="border-b border-slate-700">
                          <td className="py-3 px-4 text-white">{activity.user}</td>
                          <td className="py-3 px-4 text-gray-400">{activity.action}</td>
                          <td className="py-3 px-4 text-gray-400">{activity.timestamp}</td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="3" className="py-4 px-4 text-gray-400 text-center">
                          No activity data available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {reportType === 'system-logs' && (
            <div>
              <h3 className="text-xl font-bold text-white mb-4">System Logs</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {systemLogs.length > 0 ? (
                  systemLogs.map((log, idx) => (
                    <div key={idx} className="bg-slate-700/50 rounded p-3 text-sm text-gray-300 font-mono">
                      {log.message}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400">No system logs available</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Reporting;
