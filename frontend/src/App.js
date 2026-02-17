import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importar páginas
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AidRegistration from './pages/AidRegistration';
import InventoryManagement from './pages/InventoryManagement';
import Reports from './pages/Reports';
import AuditTrail from './pages/AuditTrail';
import NavBar from './components/NavBar';

// Contexto para autenticación
export const AuthContext = React.createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    if (token) {
      setIsAuthenticated(true);
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      setUser(userData);
    }
  }, [token]);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(token);
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token }}>
      <Router>
        {isAuthenticated && <NavBar onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/login"
            element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/dashboard"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />}
          />
          <Route
            path="/aid-registration"
            element={isAuthenticated && (user.role === 'operador' || user.role === 'admin') ? <AidRegistration /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/inventory"
            element={isAuthenticated && (user.role === 'admin' || user.role === 'operador') ? <InventoryManagement /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/reports"
            element={isAuthenticated && (user.role === 'admin' || user.role === 'auditor') ? <Reports /> : <Navigate to="/dashboard" />}
          />
          <Route
            path="/audit"
            element={isAuthenticated && (user.role === 'admin' || user.role === 'auditor') ? <AuditTrail /> : <Navigate to="/dashboard" />}
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? '/dashboard' : '/login'} />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
