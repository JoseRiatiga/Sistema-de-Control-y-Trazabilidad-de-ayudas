import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../App';
import './Dashboard.css';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Obtener estadísticas
      const [deliveriesRes, alertsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/aids/delivery', { headers }),
        axios.get('http://localhost:5000/api/audit/duplicate-alerts', { 
          headers,
          params: { status: 'pending' }
        })
      ]);

      const deliveries = Array.isArray(deliveriesRes.data) ? deliveriesRes.data : [];
      const totalDeliveries = deliveries.length;
      const beneficiaries = new Set(deliveries.map(d => d.censado_id)).size;

      const alerts = Array.isArray(alertsRes.data) ? alertsRes.data : [];
      
      setStats({
        totalDeliveries,
        beneficiaries,
        totalAlerts: alerts.length
      });

      setAlerts(alerts.slice(0, 5));
    } catch (err) {
      setError('Error cargando datos del dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard">
      <div className="container">
        <h1>Bienvenido, {user?.nombre || user?.name}</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <p>Cargando datos...</p>
        ) : (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <h3>Entregas Realizadas</h3>
                <p className="stat-value">{stats?.totalDeliveries || 0}</p>
              </div>
              <div className="stat-card">
                <h3>Beneficiarios Asistidos</h3>
                <p className="stat-value">{stats?.beneficiaries || 0}</p>
              </div>
              <div className="stat-card alert-card">
                <h3>Alertas Pendientes</h3>
                <p className="stat-value">{stats?.totalAlerts || 0}</p>
              </div>
            </div>

            {alerts.length > 0 && (
              <div className="card">
                <h2>Alertas Recientes de Duplicidad</h2>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Beneficiario</th>
                      <th>Cédula</th>
                      <th>Tipo de Ayuda</th>
                      <th>Fecha de Alerta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alerts.map(alert => (
                      <tr key={alert.id}>
                        <td>{alert.primer_nombre} {alert.primer_apellido || ''}</td>
                        <td>{alert.cedula || alert.identification}</td>
                        <td>{alert.aid_type_name || alert.nombre}</td>
                        <td>{new Date(alert.alert_date || alert.fecha_alerta).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
