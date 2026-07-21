// Labs page
import React, { useState } from 'react';
import { useLabsContext } from '../context/LabsContext';

const LabsPage = () => {
  const { labs, loading, error, startLab, stopLab, deleteLab } = useLabsContext();
  const [selectedLab, setSelectedLab] = useState(null);

  const handleStartLab = async (labId) => {
    try {
      await startLab(labId);
    } catch (err) {
      console.error('Failed to start lab:', err);
    }
  };

  const handleStopLab = async (labId) => {
    try {
      await stopLab(labId);
    } catch (err) {
      console.error('Failed to stop lab:', err);
    }
  };

  const handleDeleteLab = async (labId) => {
    if (window.confirm('Are you sure you want to delete this lab?')) {
      try {
        await deleteLab(labId);
      } catch (err) {
        console.error('Failed to delete lab:', err);
      }
    }
  };

  return (
    <div className="labs-container">
      <header className="labs-header">
        <h1>Labs</h1>
        <button className="btn-primary">Create New Lab</button>
      </header>

      {error && <div className="error-alert">{error}</div>}

      {loading ? (
        <p>Loading labs...</p>
      ) : labs.length === 0 ? (
        <p>No labs available</p>
      ) : (
        <div className="labs-grid">
          {labs.map((lab) => (
            <div key={lab.id} className="lab-card">
              <div className="lab-header">
                <h3>{lab.name}</h3>
                <span className={`status-badge ${lab.status}`}>{lab.status}</span>
              </div>
              <p className="lab-description">{lab.description}</p>
              <div className="lab-details">
                <p><strong>Nodes:</strong> {lab.nodes_count || 0}</p>
                <p><strong>Created:</strong> {new Date(lab.created_at).toLocaleDateString()}</p>
              </div>
              <div className="lab-actions">
                {lab.status === 'stopped' ? (
                  <button
                    className="btn-success"
                    onClick={() => handleStartLab(lab.id)}
                  >
                    Start
                  </button>
                ) : (
                  <button
                    className="btn-warning"
                    onClick={() => handleStopLab(lab.id)}
                  >
                    Stop
                  </button>
                )}
                <button
                  className="btn-secondary"
                  onClick={() => setSelectedLab(lab)}
                >
                  View Details
                </button>
                <button
                  className="btn-danger"
                  onClick={() => handleDeleteLab(lab.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LabsPage;