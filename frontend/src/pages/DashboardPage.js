// Dashboard page
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../context/AuthContext';
import { useLabsContext } from '../context/LabsContext';

const DashboardPage = () => {
  const { user, logout } = useAuthContext();
  const { labs, loading } = useLabsContext();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {user?.username}</span>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>

      <main className="dashboard-content">
        <section className="stats">
          <div className="stat-card">
            <h3>Total Labs</h3>
            <p className="stat-value">{labs.length}</p>
          </div>
          <div className="stat-card">
            <h3>Active Labs</h3>
            <p className="stat-value">{labs.filter(l => l.status === 'running').length}</p>
          </div>
          <div className="stat-card">
            <h3>Stopped Labs</h3>
            <p className="stat-value">{labs.filter(l => l.status === 'stopped').length}</p>
          </div>
        </section>

        <section className="recent-labs">
          <h2>Recent Labs</h2>
          {loading ? (
            <p>Loading labs...</p>
          ) : labs.length === 0 ? (
            <p>No labs available</p>
          ) : (
            <div className="labs-list">
              {labs.slice(0, 5).map((lab) => (
                <div key={lab.id} className="lab-item">
                  <h4>{lab.name}</h4>
                  <p>{lab.description}</p>
                  <span className={`status ${lab.status}`}>{lab.status}</span>
                </div>
              ))}
            </div>
          )}
          <button onClick={() => navigate('/labs')}>View All Labs</button>
        </section>
      </main>
    </div>
  );
};

export default DashboardPage;