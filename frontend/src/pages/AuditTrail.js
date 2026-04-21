import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import API_URL from '../utils/apiConfig';
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

  // Filtros para Registro de Cambios
  const [changelogFilters, setChangelogFilters] = useState({
    accion: '', // LOGIN, LOGOUT, CREATE, UPDATE, DELETE
    tabla: '', // Nombre de tabla
    usuario: '', // Búsqueda por usuario
    fechaDesde: '',
    fechaHasta: ''
  });

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  // Mapeo de nombres de tablas a español
  const translateTableName = (tableName) => {
    const tableMapping = {
      'entregas_ayuda': 'Entregas de Ayuda',
      'censados': 'Beneficiarios',
      'tipos_ayuda': 'Tipos de Ayuda',
      'inventario': 'Inventario',
      'usuarios': 'Usuarios',
      'alertas_duplicidad': 'Alertas de Duplicidad',
      'comprobantes_entrega': 'Comprobantes de Entrega',
      'bitacora_auditoria': 'Bitácora de Auditoría'
    };
    if (!tableName) return 'N/A';
    return tableMapping[tableName] || tableName.replace(/_/g, ' ').toUpperCase();
  };

  // Debug logging
  useEffect(() => {
    console.log('🔍 AuditTrail Debug:');
    console.log('  user:', user);
    console.log('  user?.rol:', user?.rol);
    console.log('  isAdmin:', isAdmin);
  }, [user, isAdmin]);

  // Filtrar datos del changelog
  const getFilteredAuditData = () => {
    return auditData.filter(entry => {
      const accion = (entry.accion || entry.action || '').toUpperCase();
      const tabla = (entry.nombre_tabla || entry.table_name || '').toLowerCase();
      const usuario = (entry.user_name || 'Sistema').toLowerCase();
      const fecha = new Date(entry.fecha || entry.timestamp);

      // Filtro por acción
      if (changelogFilters.accion && !accion.includes(changelogFilters.accion.toUpperCase())) {
        return false;
      }

      // Filtro por tabla
      if (changelogFilters.tabla && !tabla.includes(changelogFilters.tabla.toLowerCase())) {
        return false;
      }

      // Filtro por usuario (búsqueda)
      if (changelogFilters.usuario && !usuario.includes(changelogFilters.usuario.toLowerCase())) {
        return false;
      }

      // Filtro por fecha desde
      if (changelogFilters.fechaDesde) {
        const fechaDesde = new Date(changelogFilters.fechaDesde);
        fechaDesde.setHours(0, 0, 0, 0);
        if (fecha < fechaDesde) {
          return false;
        }
      }

      // Filtro por fecha hasta
      if (changelogFilters.fechaHasta) {
        const fechaHasta = new Date(changelogFilters.fechaHasta);
        fechaHasta.setHours(23, 59, 59, 999);
        if (fecha > fechaHasta) {
          return false;
        }
      }

      return true;
    });
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setChangelogFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetFilters = () => {
    setChangelogFilters({
      accion: '',
      tabla: '',
      usuario: '',
      fechaDesde: '',
      fechaHasta: ''
    });
  };

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
        const response = await axios.get(`${API_URL}/api/audit/duplicate-alerts`, {
          headers,
          params: { municipality: municipality || undefined }
        });
        setAlertData(response.data);
      } else if (activeTab === 'delivery-log') {
        const response = await axios.get(`${API_URL}/api/audit/delivery-log`, {
          headers,
          params: { municipality: municipality || undefined }
        });
        setAuditData(response.data);
      } else {
        const response = await axios.get(`${API_URL}/api/audit/change-log`, {
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
        `${API_URL}/api/audit/duplicate-alerts/${selectedAlert.id}`,
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
      console.error('Error details:', err.response?.data);
      setError(err.response?.data?.error || 'Error al actualizar la alerta: ' + err.message);
    }
  };

  const downloadReceiptPDF = async (deliveryId) => {
    try {
      const response = await axios.get(
        `${API_URL}/api/receipts/download/delivery/${deliveryId}`,
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
        `${API_URL}/api/aids/delivery/${deliveryId}`,
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
        `${API_URL}/api/audit/duplicate-alerts/${alertId}`,
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
              <h2>Registro de Cambios Completo del Sistema</h2>
              
              {/* Filtros */}
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '5px' }}>
                <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '14px' }}>🔍 Filtros</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                      Tipo de Acción:
                    </label>
                    <select
                      name="accion"
                      value={changelogFilters.accion}
                      onChange={handleFilterChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="">-- Todas --</option>
                      <option value="LOGIN">🔐 Login</option>
                      <option value="LOGOUT">🚪 Logout</option>
                      <option value="CREATE">✅ Crear</option>
                      <option value="UPDATE">✏️ Editar</option>
                      <option value="DELETE">🗑️ Eliminar</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                      Recurso:
                    </label>
                    <select
                      name="tabla"
                      value={changelogFilters.tabla}
                      onChange={handleFilterChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
                    >
                      <option value="">-- Todos --</option>
                      <option value="sesiones_usuarios">Sesiones de Usuarios</option>
                      <option value="censados">Beneficiarios</option>
                      <option value="entregas_ayuda">Entregas de Ayuda</option>
                      <option value="inventario">Inventario</option>
                      <option value="usuarios">Usuarios</option>
                      <option value="tipos_ayuda">Tipos de Ayuda</option>
                      <option value="alertas_duplicidad">Alertas de Duplicidad</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                      Usuario:
                    </label>
                    <input
                      type="text"
                      name="usuario"
                      value={changelogFilters.usuario}
                      onChange={handleFilterChange}
                      placeholder="Buscar por nombre..."
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                      Desde:
                    </label>
                    <input
                      type="date"
                      name="fechaDesde"
                      value={changelogFilters.fechaDesde}
                      onChange={handleFilterChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '5px', fontSize: '12px', fontWeight: 'bold' }}>
                      Hasta:
                    </label>
                    <input
                      type="date"
                      name="fechaHasta"
                      value={changelogFilters.fechaHasta}
                      onChange={handleFilterChange}
                      style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                    <button
                      onClick={resetFilters}
                      style={{
                        width: '100%',
                        padding: '8px',
                        backgroundColor: '#95a5a6',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}
                    >
                      🔄 Limpiar Filtros
                    </button>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              {(() => {
                const filteredData = getFilteredAuditData();
                return filteredData.length === 0 ? (
                  <p>No hay registros que coincidan con los filtros seleccionados</p>
                ) : (
                  <>
                    <p style={{ marginBottom: '10px', color: '#7f8c8d' }}>
                      Mostrando <strong>{filteredData.length}</strong> de <strong>{auditData.length}</strong> registros
                    </p>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Fecha/Hora</th>
                          <th>Usuario</th>
                          <th>Acción</th>
                          <th>Recurso</th>
                          <th>Detalles</th>
                          <th>IP del Cliente</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredData.slice(0, 100).map(entry => {
                          const isSessionEvent = entry.nombre_tabla === 'sesiones_usuarios';
                          const accion = entry.accion || entry.action;
                          
                          return (
                            <tr key={entry.id} style={{ backgroundColor: isSessionEvent ? '#f0f8ff' : 'inherit' }}>
                              <td>{new Date(entry.fecha || entry.timestamp).toLocaleString('es-ES')}</td>
                              <td>{entry.user_name || 'Sistema'}</td>
                              <td>
                                <span style={{
                                  display: 'inline-block',
                                  padding: '4px 8px',
                                  borderRadius: '4px',
                                  fontWeight: 'bold',
                                  backgroundColor: 
                                    accion === 'LOGIN' ? '#27ae60' :
                                    accion === 'LOGOUT' ? '#e74c3c' :
                                    accion === 'CREATE' ? '#3498db' :
                                    accion === 'UPDATE' ? '#f39c12' :
                                    accion === 'DELETE' ? '#c0392b' :
                                    '#95a5a6',
                                  color: 'white',
                                  fontSize: '12px'
                                }}>
                                  {accion === 'LOGIN' ? '🔐 LOGIN' : 
                                   accion === 'LOGOUT' ? '🚪 LOGOUT' :
                                   accion === 'CREATE' ? '✅ CREAR' :
                                   accion === 'UPDATE' ? '✏️ EDITAR' :
                                   accion === 'DELETE' ? '🗑️ ELIMINAR' :
                                   accion}
                                </span>
                              </td>
                              <td>
                                {isSessionEvent ? '👤 Sesión de Usuario' : translateTableName(entry.nombre_tabla || entry.table_name)}
                              </td>
                              <td>
                                {isSessionEvent ? (
                                  accion === 'LOGIN' ? '✓ Inició sesión' : 'Cerró sesión'
                                ) : (
                                  accion === 'UPDATE' ? 'Datos modificados' : 
                                  accion === 'DELETE' ? 'Registro eliminado' :
                                  'Datos registrados'
                                )}
                              </td>
                              <td style={{ fontSize: '11px', color: '#7f8c8d' }}>
                                {entry.direccion_ip || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    {filteredData.length > 100 && (
                      <p style={{ marginTop: '10px', fontStyle: 'italic', color: '#7f8c8d' }}>
                        Mostrando los primeros 100 de {filteredData.length} registros
                      </p>
                    )}
                  </>
                );
              })()}
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
