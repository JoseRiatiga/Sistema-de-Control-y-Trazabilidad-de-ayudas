import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import './Home.css';

function Home() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [pendingAlerts, setPendingAlerts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHomeData();
  }, []);

  const fetchHomeData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Obtener estadísticas básicas
      const [deliveriesRes, alertsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/aids/delivery', { headers }),
        axios.get('http://localhost:5000/api/audit/duplicate-alerts', {
          headers
        })
      ]);

      const totalDeliveries = deliveriesRes.data.length;
      const alertsData = Array.isArray(alertsRes.data) ? alertsRes.data : [];
      // Filtrar: mostrar solo alertas NO resueltas (pendientes + revisadas)
      const activeAlerts = alertsData.filter(a => a.estado_alerta !== 'resuelta');
      const activeAlertsCount = activeAlerts.length;

      setStats({
        totalDeliveries,
        pendingAlerts: activeAlertsCount
      });
      setPendingAlerts(activeAlertsCount);
    } catch (err) {
      console.error('Error cargando datos del home:', err);
    } finally {
      setLoading(false);
    }
  };

  const getQuickActions = () => {
    const actions = [];

    if (user.rol === 'operador' || user.rol === 'administrador') {
      actions.push(
        {
          icon: '📋',
          title: 'Registrar Ayuda',
          description: 'Nueva entrega de ayuda',
          link: '/registrar-ayuda',
          color: '#3498db'
        },
        {
          icon: '📦',
          title: 'Inventario',
          description: 'Gestionar stock disponible',
          link: '/inventario',
          color: '#2ecc71'
        },
        {
          icon: '👥',
          title: 'Beneficiarios',
          description: 'Registro de beneficiarios',
          link: '/beneficiarios',
          color: '#f39c12'
        }
      );
    }

    if (user.rol === 'administrador' || user.rol === 'auditor') {
      actions.push(
        {
          icon: '⚠️',
          title: 'Auditoría',
          description: 'Revisar alertas y duplicidades',
          link: '/auditorias',
          color: '#e74c3c'
        },
        {
          icon: '📊',
          title: 'Reportes',
          description: 'Análisis y reportes',
          link: '/reportes',
          color: '#9b59b6'
        }
      );
    }

    if (user.rol === 'administrador') {
      actions.push(
        {
          icon: '⚙️',
          title: 'Gestión de Usuarios',
          description: 'Crear y editar usuarios',
          link: '/usuarios',
          color: '#34495e'
        }
      );
    }

    return actions;
  };

  const quickActions = getQuickActions();

  return (
    <div className="home-container">
      <div className="home-header">
        <div className="header-content">
          <h1>Bienvenido, {user?.nombre || user?.name}!</h1>
          <p className="subtitle">
            {user.rol === 'operador' && 'Sistema de Control de Ayudas - Operador'}
            {user.rol === 'auditor' && 'Sistema de Control de Ayudas - Auditor'}
            {user.rol === 'administrador' && 'Sistema de Control de Ayudas - Administrador'}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="home-content">
          <p>Cargando información...</p>
        </div>
      ) : (
        <>
          {/* Estadísticas Rápidas */}
          {stats && (
            <div className="stats-bar">
              <div className="stat-item">
                <span className="stat-label">Entregas Registradas</span>
                <span className="stat-value">{stats.totalDeliveries}</span>
              </div>
              {(user.rol === 'administrador' || user.rol === 'auditor') && (
                <div className="stat-item highlight">
                  <span className="stat-label">Alertas Pendientes</span>
                  <span className="stat-value">{pendingAlerts}</span>
                </div>
              )}
            </div>
          )}

          {/* Alerta de Acciones Pendientes */}
          {pendingAlerts > 0 && (user.rol === 'administrador' || user.rol === 'auditor') && (
            <div className="alert-banner">
              <span className="alert-icon">⚠️</span>
              <div className="alert-content">
                <strong>Tienes {pendingAlerts} alerta{pendingAlerts !== 1 ? 's' : ''} pendiente{pendingAlerts !== 1 ? 's' : ''}</strong>
                <p>Revisa las duplicidades detectadas en el registro de ayudas</p>
              </div>
              <Link to="/auditorias" className="btn btn-alert">
                Ir a Auditoría
              </Link>
            </div>
          )}

          {/* Acciones Rápidas */}
          <div className="home-content">
            <h2>Acciones Rápidas</h2>
            <div className="quick-actions-grid">
              {quickActions.map((action, index) => (
                <Link
                  key={index}
                  to={action.link}
                  className="quick-action-card"
                  style={{ borderTopColor: action.color }}
                >
                  <div className="action-icon" style={{ backgroundColor: action.color }}>
                    {action.icon}
                  </div>
                  <h3>{action.title}</h3>
                  <p>{action.description}</p>
                  <span className="arrow">→</span>
                </Link>
              ))}
            </div>
          </div>

          {/* Botón Dashboard Completo */}
          <div className="home-footer">
            <button
              className="btn btn-primary btn-large"
              onClick={() => navigate('/panel')}
            >
              📊 Ver Dashboard Completo
            </button>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
