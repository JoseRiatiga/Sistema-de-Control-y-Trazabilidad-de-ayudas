import React, { useContext, useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../App';
import './NavBar.css';

function NavBar({ onLogout }) {
  const { user, theme, handleThemeChange } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Cerrar dropdown cuando se hace clic fuera
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    setDropdownOpen(false);
    onLogout();
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h1>Sistema de Ayudas</h1>
      </div>
      <div className="navbar-links">
        <Link to="/inicio">Inicio</Link>
        <Link to="/panel">Dashboard</Link>
        {(user.rol === 'operador' || user.rol === 'administrador') && (
          <Link to="/registrar-ayuda">Registrar Ayuda</Link>
        )}
        {(user.rol === 'operador' || user.rol === 'administrador') && (
          <Link to="/inventario">Inventario</Link>
        )}
        {(user.rol === 'operador' || user.rol === 'administrador') && (
          <Link to="/beneficiarios">Beneficiarios</Link>
        )}
        {(user.rol === 'administrador' || user.rol === 'auditor') && (
          <Link to="/reportes">Reportes</Link>
        )}
        {(user.rol === 'administrador' || user.rol === 'auditor') && (
          <Link to="/auditorias">Auditoría</Link>
        )}
        {user.rol === 'administrador' && (
          <Link to="/usuarios">Gestión de Usuarios</Link>
        )}
        
        {/* User Dropdown */}
        <div className="user-dropdown" ref={dropdownRef}>
          <button 
            className="user-dropdown-btn"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            title={`${user.nombre} (${user.rol})`}
          >
            <span className="user-avatar">{user.nombre?.charAt(0).toUpperCase()}</span>
            <span className="user-name">{user.nombre}</span>
          </button>

          {dropdownOpen && (
            <div className="dropdown-menu">
              <div className="dropdown-header">
                <div className="dropdown-user-info">
                  <span className="dropdown-avatar">{user.nombre?.charAt(0).toUpperCase()}</span>
                  <div>
                    <p className="dropdown-username">{user.nombre}</p>
                    <p className="dropdown-role">{user.rol}</p>
                  </div>
                </div>
              </div>
              <div className="dropdown-divider"></div>
              <button 
                className="dropdown-item"
                onClick={() => {
                  navigate('/configuracion');
                  setDropdownOpen(false);
                }}
              >
                ⚙️ Configuración
              </button>
              <div className="dropdown-divider"></div>

              {/* Theme Toggle */}
              <div className="dropdown-item theme-toggle">
                <span className="theme-label">🎨 Tema</span>
                <button 
                  className={`theme-switch ${theme === 'dark' ? 'dark' : 'light'}`}
                  onClick={() => handleThemeChange(theme === 'light' ? 'dark' : 'light')}
                  title={`Cambiar a tema ${theme === 'light' ? 'oscuro' : 'claro'}`}
                  aria-label="Toggle theme"
                >
                  <span className="theme-icon">{theme === 'light' ? '☀️' : '🌙'}</span>
                </button>
              </div>
              <div className="dropdown-divider"></div>

              <button 
                className="dropdown-item logout-btn"
                onClick={handleLogout}
              >
                🚪 Cerrar Sesión
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
