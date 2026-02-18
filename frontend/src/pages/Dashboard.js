import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../App';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import './Dashboard.css';

function Dashboard() {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Estados para gráficos
  const [deliveriesByMunicipality, setDeliveriesByMunicipality] = useState([]);
  const [deliveriesByType, setDeliveriesByType] = useState([]);
  const [deliveriesTrend, setDeliveriesTrend] = useState([]);
  const [alertsStats, setAlertsStats] = useState([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [deliveriesRes, alertsRes] = await Promise.all([
        axios.get('http://localhost:5000/api/aids/delivery', { headers }),
        axios.get('http://localhost:5000/api/audit/duplicate-alerts', {
          headers
        })
      ]);

      const deliveriesData = Array.isArray(deliveriesRes.data) ? deliveriesRes.data : [];
      const alertsData = Array.isArray(alertsRes.data) ? alertsRes.data : [];
      
      // Filtrar: mostrar solo alertas NO resueltas (pendientes + revisadas)
      const activeAlerts = alertsData.filter(a => a.estado_alerta !== 'resuelta');

      // Estadísticas básicas
      const totalDeliveries = deliveriesData.length;
      const beneficiaries = new Set(deliveriesData.map(d => d.censado_id)).size;

      setStats({
        totalDeliveries,
        beneficiaries,
        totalAlerts: activeAlerts.length
      });

      setAlerts(activeAlerts.slice(0, 5));
      setDeliveries(deliveriesData);

      // Procesar datos para gráficos (usa todas las alertas para ver estado completo)
      processGraphData(deliveriesData, alertsData);
    } catch (err) {
      setError('Error cargando datos del dashboard');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const processGraphData = (deliveriesData, alertsData) => {
    // 1. Entregas por Municipio
    const municipalityMap = {};
    deliveriesData.forEach(d => {
      const municipality = d.municipio_beneficiario || 'Desconocido';
      municipalityMap[municipality] = (municipalityMap[municipality] || 0) + 1;
    });
    const municipalityData = Object.entries(municipalityMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    setDeliveriesByMunicipality(municipalityData);

    // 2. Entregas por Tipo de Ayuda
    const typeMap = {};
    deliveriesData.forEach(d => {
      const type = d.aid_type_name || 'Desconocido';
      typeMap[type] = (typeMap[type] || 0) + 1;
    });
    const typeData = Object.entries(typeMap).map(([name, value]) => ({ name, value }));
    setDeliveriesByType(typeData);

    // 3. Tendencia Temporal (últimos 30 días)
    const today = new Date();
    const last30Days = {};
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      last30Days[dateStr] = 0;
    }

    deliveriesData.forEach(d => {
      const dateStr = new Date(d.fecha_entrega).toISOString().split('T')[0];
      if (last30Days.hasOwnProperty(dateStr)) {
        last30Days[dateStr]++;
      }
    });

    const trendData = Object.entries(last30Days).map(([date, count]) => ({
      date: new Date(date).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' }),
      entregas: count
    }));
    setDeliveriesTrend(trendData);

    // 4. Estadísticas de Alertas
    const alertStatus = {
      pendiente: alertsData.filter(a => a.estado_alerta === 'pendiente').length,
      revisada: alertsData.filter(a => a.estado_alerta === 'revisada').length,
      resuelta: alertsData.filter(a => a.estado_alerta === 'resuelta').length
    };
    const alertsData2 = [
      { name: 'Pendientes', value: alertStatus.pendiente || 0, fill: '#e74c3c' },
      { name: 'Revisadas', value: alertStatus.revisada || 0, fill: '#f39c12' },
      { name: 'Resueltas', value: alertStatus.resuelta || 0, fill: '#2ecc71' }
    ];
    console.log('Alert Stats:', alertsData2);
    setAlertsStats(alertsData2);
  };

  const COLORS = ['#667eea', '#764ba2', '#f093fb', '#4facfe', '#00f2fe', '#43e97b'];

  return (
    <div className="dashboard">
      <div className="container">
        <h1>Dashboard - Bienvenido, {user?.nombre || user?.name}</h1>

        {error && <div className="alert alert-danger">{error}</div>}

        {loading ? (
          <p className="loading">Cargando datos...</p>
        ) : (
          <>
            {/* Cards de Estadísticas */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <h3>Entregas Realizadas</h3>
                <p className="stat-value">{stats?.totalDeliveries || 0}</p>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <h3>Beneficiarios Asistidos</h3>
                <p className="stat-value">{stats?.beneficiaries || 0}</p>
              </div>
              <div className="stat-card alert-card">
                <div className="stat-icon">⚠️</div>
                <h3>Alertas Pendientes</h3>
                <p className="stat-value">{stats?.totalAlerts || 0}</p>
              </div>
            </div>

            {/* Alertas Recientes */}
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
                        <td>{new Date(alert.alert_date || alert.fecha_alerta).toLocaleDateString('es-ES')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p style={{ marginTop: '12px', fontSize: '13px', color: '#7f8c8d', textAlign: 'right' }}>
                  Mostrando últimas 5 alertas. <Link to="/auditorias" style={{ color: '#3498db', textDecoration: 'none', fontWeight: 'bold' }}>Ver todas en Auditoría →</Link>
                </p>
              </div>
            )}

            {/* Últimas Entregas */}
            <div className="card">
              <h2>Últimas Entregas Registradas</h2>
              {deliveries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Beneficiario</th>
                        <th>Cédula</th>
                        <th>Tipo de Ayuda</th>
                        <th>Cantidad</th>
                        <th>Municipio</th>
                        <th>Operador</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deliveries.slice(0, 10).map(delivery => (
                        <tr key={delivery.id}>
                          <td>{delivery.primer_nombre} {delivery.primer_apellido || ''}</td>
                          <td>{delivery.cedula}</td>
                          <td>{delivery.aid_type_name}</td>
                          <td><strong>{delivery.cantidad_entregada}</strong></td>
                          <td>{delivery.municipio_beneficiario}</td>
                          <td>{delivery.operator_name}</td>
                          <td>{new Date(delivery.fecha_entrega).toLocaleDateString('es-ES')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Sin entregas registradas</p>
              )}
            </div>

            {/* Gráficos principales */}
            <div className="charts-section">
              
              {/* Entregas por Municipio */}
              <div className="chart-card">
                <h2>Entregas por Municipio (Top 10)</h2>
                {deliveriesByMunicipality.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={deliveriesByMunicipality}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#667eea" name="Entregas" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p>Sin datos disponibles</p>
                )}
              </div>

              {/* Ayudas por Tipo */}
              <div className="chart-card">
                <h2>Distribución por Tipo de Ayuda</h2>
                {deliveriesByType.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={deliveriesByType}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {deliveriesByType.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p>Sin datos disponibles</p>
                )}
              </div>

              {/* Tendencia Temporal */}
              <div className="chart-card">
                <h2>Tendencia de Entregas (Últimos 30 días)</h2>
                {deliveriesTrend.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={deliveriesTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="entregas"
                        stroke="#667eea"
                        strokeWidth={2}
                        dot={{ fill: '#667eea', r: 5 }}
                        activeDot={{ r: 7 }}
                        name="Entregas del día"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <p>Sin datos disponibles</p>
                )}
              </div>

              {/* Alertas por Estado */}
              <div className="chart-card">
                <h2>Estado de Alertas</h2>
                {alertsStats && Array.isArray(alertsStats) && alertsStats.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={300}>
                      <PieChart>
                        <Pie
                          data={alertsStats}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {alertsStats.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '24px', marginTop: '20px', flexWrap: 'wrap' }}>
                      {alertsStats.map((item, index) => (
                        <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '16px', height: '16px', backgroundColor: item.fill, borderRadius: '4px' }}></div>
                          <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.name}: {item.value}</span>
                        </div>
                      ))}
                    </div>
                  </>
                ) : (
                  <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <p style={{ textAlign: 'center', color: '#999' }}>Cargando gráfica de alertas...</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
