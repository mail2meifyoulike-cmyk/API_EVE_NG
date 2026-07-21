// Main App component with providers
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LabsProvider } from './context/LabsContext';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LabsPage from './pages/LabsPage';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <Router>
      <AuthProvider>
        <LabsProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/labs"
              element={
                <ProtectedRoute>
                  <LabsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
          </Routes>
        </LabsProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;