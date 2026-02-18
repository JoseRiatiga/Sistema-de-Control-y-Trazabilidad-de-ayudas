import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import { AuthContext } from '../App';
import AlertEditModal from './AlertEditModal';
import AlertViewModal from './AlertViewModal';
import './AuditTrail.css';

function AuditTrail() {
  const { user } = useContext(AuthContext);
  const isAdmin = user?.rol === 'administrador';

  const [auditData, setAuditData] = useState([]);
  const [alertData, setAlertData] = useState([]);
  const [activeTab, setActiveTab] = useState('alerts');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [municipality, setMunicipality] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState(null);
  const [modalAction, setModalAction] = useState(null);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedAlert, setViewedAlert] = useState(null);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Debug logging
  useEffect(() => {
    console.log('🔍 AuditTrail Debug:');
    console.log('  user:', user);
    console.log('  user?.rol:', user?.rol);
    console.log('  isAdmin:', isAdmin);
  }, [user, isAdmin]);

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

  const openModal = (alert, action) => {
    setSelectedAlert(alert);
    setModalAction(action);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedAlert(null);
    setModalAction(null);
  };

  const openViewModal = (alert) => {
    setViewedAlert(alert);
    setViewModalOpen(true);
  };

  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewedAlert(null);
  };

  const updateAlertStatus = async (razon, notas) => {
    try {
      const response = await axios.patch(
        `http://localhost:5000/api/audit/duplicate-alerts/${selectedAlert.id}`,
        { 
          status: modalAction, 
          razon: razon,
          notas: notas 
        },
        { headers }
      );
      
      setAlertData(prevData =>
        prevData.map(alert =>
          alert.id === selectedAlert.id 
            ? { ...alert, estado_alerta: response.data.alert.estado_alerta, razon_resolucion: razon, notas: notas } 
            : alert
        )
      );
      
      setSuccessMessage(response.data.message);
      setTimeout(() => setSuccessMessage(''), 5000);
      
      closeModal();
    } catch (err) {
      console.error('Error updating alert:', err);
      setError(err.response?.data?.error || 'Error al actualizar la alerta');
    }
  };

  const downloadReceiptPDF = async (deliveryId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/receipts/download/delivery/${deliveryId}`,
        {
          headers,
          responseType: 'blob'
        }
      );

      // Crear un blob URL y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `comprobante_entrega_${deliveryId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      setError('No se pudo descargar el comprobante. Verifique que exista.');
    }
  };

  const deleteDeliveryRecord = async (deliveryId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar este registro de entrega? Esto incluye su comprobante PDF.')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/aids/delivery/${deliveryId}`,
        { headers }
      );
      setSuccessMessage('✓ Registro de entrega y comprobante eliminados correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAuditData();
    } catch (err) {
      console.error('Error eliminando entrega:', err);
      setError('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  const deleteAlert = async (alertId) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta alerta de duplicidad? Esta acción no se puede deshacer.')) {
      return;
    }

    try {
      await axios.delete(
        `http://localhost:5000/api/audit/duplicate-alerts/${alertId}`,
        { headers }
      );
      setSuccessMessage('✓ Alerta de duplicidad eliminada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchAuditData();
    } catch (err) {
      console.error('Error eliminando alerta:', err);
      setError('Error al eliminar: ' + (err.response?.data?.error || err.message));
    }
  };

  return (
    <div className="container audit-trail">
      <h1>Sistema de Auditoría</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

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
                                onClick={() => openModal(alert, 'revisada')}
                              >
                                Revisar
                              </button>
                              <button
                                className="btn"
                                onClick={() => openModal(alert, 'resuelta')}
                              >
                                Resolver
                              </button>
                            </>
                          )}
                          {alert.estado_alerta === 'revisada' && (
                            <>
                              <button
                                className="btn btn-success"
                                onClick={() => openModal(alert, 'resuelta')}
                              >
                                Resolver
                              </button>
                              <button
                                className="btn btn-info"
                                onClick={() => openViewModal(alert)}
                                title="Ver detalles y opciones registradas"
                              >
                                ℹ️ Detalles
                              </button>
                              {isAdmin && (
                                <button
                                  className="btn btn-small btn-danger"
                                  onClick={() => deleteAlert(alert.id)}
                                  title="Eliminar esta alerta de duplicidad"
                                >
                                  🗑️ Eliminar
                                </button>
                              )}
                            </>
                          )}
                          {alert.estado_alerta === 'resuelta' && (
                            <>
                              <button
                                className="btn btn-info"
                                onClick={() => openViewModal(alert)}
                                title="Ver detalles y opciones registradas"
                              >
                                ℹ️ Detalles
                              </button>
                              {isAdmin && (
                                <button
                                  className="btn btn-small btn-danger"
                                  onClick={() => deleteAlert(alert.id)}
                                  title="Eliminar esta alerta de duplicidad"
                                >
                                  🗑️ Eliminar
                                </button>
                              )}
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
                      <th>Descargar</th>
                      {isAdmin && <th>Eliminar</th>}
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
                        <td>
                          <button
                            className="btn btn-small"
                            onClick={() => downloadReceiptPDF(entry.id)}
                            title="Descargar comprobante PDF"
                          >
                            📄 PDF
                          </button>
                        </td>
                        {isAdmin && (
                          <td>
                            <button
                              className="btn btn-small btn-danger"
                              onClick={() => deleteDeliveryRecord(entry.id)}
                              title="Eliminar registro de entrega"
                            >
                              🗑️ Eliminar
                            </button>
                          </td>
                        )}
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

      {modalOpen && selectedAlert && (
        <AlertEditModal
          alert={selectedAlert}
          action={modalAction}
          onClose={closeModal}
          onConfirm={updateAlertStatus}
        />
      )}

      {viewModalOpen && viewedAlert && (
        <AlertViewModal
          alert={viewedAlert}
          onClose={closeViewModal}
        />
      )}
    </div>
  );
}

export default AuditTrail;
