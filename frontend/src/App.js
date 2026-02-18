import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import './App.css';

// Importar páginas
import Login from './pages/Login';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import AidRegistration from './pages/AidRegistration';
import InventoryManagement from './pages/InventoryManagement';
import BeneficiaryManagement from './pages/BeneficiaryManagement';
import Reports from './pages/Reports';
import AuditTrail from './pages/AuditTrail';
import UserManagement from './pages/UserManagement';
import Settings from './pages/Settings';
import NavBar from './components/NavBar';

// Contexto para autenticación
export const AuthContext = React.createContext();

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  // Aplicar tema al cargar la página
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, token, theme, handleThemeChange }}>
      <Router>
        {isAuthenticated && <NavBar onLogout={handleLogout} />}
        <Routes>
          <Route
            path="/ingreso"
            element={!isAuthenticated ? <Login onLogin={handleLogin} /> : <Navigate to="/inicio" />}
          />
          <Route
            path="/inicio"
            element={isAuthenticated ? <Home /> : <Navigate to="/ingreso" />}
          />
          <Route
            path="/panel"
            element={isAuthenticated ? <Dashboard /> : <Navigate to="/ingreso" />}
          />
          <Route
            path="/registrar-ayuda"
            element={isAuthenticated && (user.rol === 'operador' || user.rol === 'administrador') ? <AidRegistration /> : <Navigate to="/inicio" />}
          />
          <Route
            path="/inventario"
            element={isAuthenticated && (user.rol === 'administrador' || user.rol === 'operador') ? <InventoryManagement /> : <Navigate to="/inicio" />}
          />
          <Route
            path="/beneficiarios"
            element={isAuthenticated && (user.rol === 'administrador' || user.rol === 'operador') ? <BeneficiaryManagement /> : <Navigate to="/inicio" />}
          />
          <Route
            path="/reportes"
            element={isAuthenticated && (user.rol === 'administrador' || user.rol === 'auditor') ? <Reports /> : <Navigate to="/inicio" />}
          />
          <Route
            path="/auditorias"
            element={isAuthenticated && (user.rol === 'administrador' || user.rol === 'auditor') ? <AuditTrail /> : <Navigate to="/inicio" />}
          />
          <Route
            path="/usuarios"
            element={isAuthenticated && user.rol === 'administrador' ? <UserManagement /> : <Navigate to="/inicio" />}
          />
          <Route
            path="/configuracion"
            element={isAuthenticated ? <Settings /> : <Navigate to="/ingreso" />}
          />
          <Route path="/" element={<Navigate to={isAuthenticated ? '/inicio' : '/ingreso'} />} />
        </Routes>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
