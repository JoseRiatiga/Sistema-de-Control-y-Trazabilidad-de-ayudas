import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import './AuditTrail.css';

function AuditTrail() {
  const [auditData, setAuditData] = useState([]);
  const [alertData, setAlertData] = useState([]);
  const [activeTab, setActiveTab] = useState('alerts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [municipality, setMunicipality] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchAuditData();
  }, [municipality, activeTab]);

  const fetchAuditData = async () => {
    try {
      setLoading(true);

      if (activeTab === 'alerts') {
        const response = await axios.get('http://localhost:5000/api/audit/duplicate-alerts', {
          headers,
          params: { municipality: municipality || undefined }
        });
        setAlertData(response.data);
      } else if (activeTab === 'delivery-log') {
        const response = await axios.get('http://localhost:5000/api/audit/delivery-log', {
          headers,
          params: { municipality: municipality || undefined }
        });
        setAuditData(response.data);
      } else {
        const response = await axios.get('http://localhost:5000/api/audit/change-log', {
          headers
        });
        setAuditData(response.data);
      }

      setError('');
    } catch (err) {
      setError('Error cargando datos de auditoría');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const updateAlertStatus = async (alertId, newStatus) => {
    try {
      await axios.patch(
        `http://localhost:5000/api/audit/duplicate-alerts/${alertId}`,
        { status: newStatus },
        { headers }
      );
      // Actualizar localmente sin recargar desde servidor
      setAlertData(prevData =>
        prevData.map(alert =>
          alert.id === alertId ? { ...alert, estado_alerta: newStatus } : alert
        )
      );
    } catch (err) {
      console.error('Error updating alert:', err);
    }
  };

  return (
    <div className="container audit-trail">
      <h1>Sistema de Auditoría</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="tabs">
          <button
            className={`tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            Alertas de Duplicidad
          </button>
          <button
            className={`tab ${activeTab === 'delivery-log' ? 'active' : ''}`}
            onClick={() => setActiveTab('delivery-log')}
          >
            Bitácora de Entregas
          </button>
          <button
            className={`tab ${activeTab === 'change-log' ? 'active' : ''}`}
            onClick={() => setActiveTab('change-log')}
          >
            Registro de Cambios
          </button>
        </div>

        {(activeTab === 'alerts' || activeTab === 'delivery-log') && (
          <div className="form-group">
            <label htmlFor="municipality">Filtrar por Municipio:</label>
            <select
              id="municipality"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
            >
              <option value="">-- Todos los municipios --</option>
              {COLOMBIAN_MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <p>Cargando datos de auditoría...</p>
      ) : (
        <>
          {activeTab === 'alerts' && (
            <div className="card">
              <h2>Alertas de Duplicidad</h2>
              {alertData.length === 0 ? (
                <p>No hay alertas registradas</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Beneficiario</th>
                      <th>Cédula</th>
                      <th>Tipo de Ayuda</th>
                      <th>Última Entrega</th>
                      <th>Días Desde</th>
                      <th>Estado</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {alertData.map(alert => (
                      <tr key={alert.id}>
                        <td>{alert.primer_nombre} {alert.primer_apellido || ''}</td>
                        <td>{alert.cedula || alert.identification}</td>
                        <td>{alert.aid_type_name}</td>
                        <td>{alert.fecha_ultima_entrega ? new Date(alert.fecha_ultima_entrega).toLocaleDateString('es-ES') : 'N/A'}</td>
                        <td>{alert.dias_desde_ultima_entrega || 0} días</td>
                        <td>
                          <span className={`badge badge-${alert.estado_alerta}`}>
                            {alert.estado_alerta === 'pendiente' ? '⚠️ Pendiente' : 
                             alert.estado_alerta === 'revisada' ? '👁️ Revisada' : 
                             alert.estado_alerta === 'resuelta' ? '✅ Resuelta' : alert.estado_alerta}
                          </span>
                        </td>
                        <td>
                          {alert.estado_alerta === 'pendiente' && (
                            <>
                              <button
                                className="btn"
                                onClick={() => updateAlertStatus(alert.id, 'revisada')}
                              >
                                Revisar
                              </button>
                              <button
                                className="btn"
                                onClick={() => updateAlertStatus(alert.id, 'resuelta')}
                              >
                                Resolver
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'delivery-log' && (
            <div className="card">
              <h2>Bitácora de Entregas</h2>
              {auditData.length === 0 ? (
                <p>No hay entregas registradas</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Beneficiario</th>
                      <th>Ayuda</th>
                      <th>Cantidad</th>
                      <th>Operador</th>
                      <th>Municipio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.map(entry => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.fecha_entrega || entry.delivery_date).toLocaleDateString()}</td>
                        <td>{entry.primer_nombre} {entry.primer_apellido || ''}</td>
                        <td>{entry.aid_type_name}</td>
                        <td>{entry.cantidad || entry.quantity}</td>
                        <td>{entry.operator_name}</td>
                        <td>{entry.municipio || entry.municipality}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'change-log' && (
            <div className="card">
              <h2>Registro de Cambios</h2>
              {auditData.length === 0 ? (
                <p>No hay cambios registrados</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha/Hora</th>
                      <th>Usuario</th>
                      <th>Acción</th>
                      <th>Tabla</th>
                      <th>Detalles</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditData.slice(0, 50).map(entry => (
                      <tr key={entry.id}>
                        <td>{new Date(entry.fecha || entry.timestamp).toLocaleString()}</td>
                        <td>{entry.user_name || 'Sistema'}</td>
                        <td>{entry.accion || entry.action}</td>
                        <td>{entry.nombre_tabla || entry.table_name}</td>
                        <td>{(entry.accion || entry.action) === 'UPDATE' ? 'Modificado' : 'Creado'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AuditTrail;
