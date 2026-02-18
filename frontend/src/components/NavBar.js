import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';
import './NavBar.css';

function NavBar({ onLogout }) {
  const { user } = useContext(AuthContext);

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
        <div className="user-info">
          <span>{user.nombre} ({user.rol})</span>
          <button className="btn btn-logout" onClick={onLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}

export default NavBar;
