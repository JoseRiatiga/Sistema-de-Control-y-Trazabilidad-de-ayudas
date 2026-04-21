import React, { useState, useEffect, useCallback, useContext } from 'react';
import axios from 'axios';
import API_URL from '../utils/apiConfig';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import { WAREHOUSE_LOCATIONS } from '../utils/warehouseLocations';
import { AuthContext } from '../App';
import './InventoryManagement.css';

function InventoryManagement() {
  const { user } = useContext(AuthContext);
  const [inventory, setInventory] = useState([]);
  const [municipality, setMunicipality] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para el formulario de agregación
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [aidTypes, setAidTypes] = useState([]);
  const [loadingAidTypes, setLoadingAidTypes] = useState(false);
  const [noExpiryDate, setNoExpiryDate] = useState(false);
  const [formData, setFormData] = useState({
    tipo_ayuda_id: '',
    cantidad: '',
    fecha_caducidad: '',
    lote: '',
    estado: 'disponible',
    municipio: '',
    ubicacion_almacen: '',
    observaciones: ''
  });
  const [formErrors, setFormErrors] = useState({});

  // Estados para modal de gestión de tipos de ayuda
  const [showAidTypeModal, setShowAidTypeModal] = useState(false);
  const [editingAidTypeId, setEditingAidTypeId] = useState(null);
  const [aidTypeFormData, setAidTypeFormData] = useState({
    nombre: '',
    descripcion: '',
    unidad: ''
  });
  const [aidTypeErrors, setAidTypeErrors] = useState({});

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let url = `${API_URL}/api/inventory`;
      
      if (municipality) {
        url += `/municipality/${municipality}`;
      }

      const response = await axios.get(url, { headers });
      setInventory(response.data);
      setError('');
    } catch (err) {
      setError('Error cargando inventario');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [municipality]);

  // Obtener tipos de ayuda
  const fetchAidTypes = useCallback(async () => {
    try {
      setLoadingAidTypes(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      const response = await axios.get(`${API_URL}/api/aids/types`, { headers });
      setAidTypes(response.data);
    } catch (err) {
      console.error('Error cargando tipos de ayuda:', err);
    } finally {
      setLoadingAidTypes(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  useEffect(() => {
    if (showForm) {
      fetchAidTypes();
    }
  }, [showForm, fetchAidTypes]);

  const getSelectedAidType = () => {
    if (!formData.tipo_ayuda_id) return null;
    return aidTypes.find(aid => aid.id === formData.tipo_ayuda_id);
  };

  const isDonations = () => {
    const selectedAid = getSelectedAidType();
    return selectedAid && selectedAid.nombre.toLowerCase() === 'donaciones';
  };

  // Funciones para gestionar tipos de ayuda
  const handleOpenAidTypeModal = () => {
    setEditingAidTypeId(null);
    setAidTypeFormData({ nombre: '', descripcion: '', unidad: '' });
    setAidTypeErrors({});
    setShowAidTypeModal(true);
  };

  const handleCloseAidTypeModal = () => {
    setShowAidTypeModal(false);
    setEditingAidTypeId(null);
    setAidTypeFormData({ nombre: '', descripcion: '', unidad: '' });
    setAidTypeErrors({});
  };

  const handleEditAidType = (aidType) => {
    setEditingAidTypeId(aidType.id);
    setAidTypeFormData({
      nombre: aidType.nombre || '',
      descripcion: aidType.descripcion || '',
      unidad: aidType.unidad || ''
    });
    setAidTypeErrors({});
  };

  const validateAidTypeForm = () => {
    const errors = {};
    if (!aidTypeFormData.nombre.trim()) {
      errors.nombre = 'El nombre es requerido';
    }
    setAidTypeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSaveAidType = async () => {
    if (!validateAidTypeForm()) return;

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      if (editingAidTypeId) {
        // Editar tipo de ayuda existente
        await axios.put(
          `${API_URL}/api/aids/types/${editingAidTypeId}`,
          aidTypeFormData,
          { headers }
        );
        setSuccessMessage('✓ Tipo de ayuda actualizado correctamente');
      } else {
        // Crear nuevo tipo de ayuda
        await axios.post(
          `${API_URL}/api/aids/types`,
          aidTypeFormData,
          { headers }
        );
        setSuccessMessage('✓ Tipo de ayuda creado correctamente');
      }

      // Recargar tipos de ayuda
      await fetchAidTypes();
      handleCloseAidTypeModal();

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al guardar tipo de ayuda';
      setError(errorMessage);
    }
  };

  const handleDeleteAidType = async (aidTypeId, aidTypeName) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar "${aidTypeName}"?\n\nNota: No se puede eliminar si hay inventario o entregas asociadas.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      await axios.delete(
        `${API_URL}/api/aids/types/${aidTypeId}`,
        { headers }
      );

      setSuccessMessage('✓ Tipo de ayuda eliminado correctamente');
      await fetchAidTypes();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar tipo de ayuda';
      setError(errorMessage);
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.tipo_ayuda_id) errors.tipo_ayuda_id = 'Selecciona un tipo de ayuda';
    if (!formData.cantidad || formData.cantidad <= 0) errors.cantidad = 'La cantidad debe ser mayor a 0';
    if (!formData.municipio) errors.municipio = 'Selecciona un municipio';
    if (!noExpiryDate && !formData.fecha_caducidad) errors.fecha_caducidad = 'Selecciona una fecha o marca "No aplica"';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    let updatedData = {
      ...formData,
      [name]: value
    };
    
    // Si cambia el municipio, actualizar automáticamente la ubicación
    if (name === 'municipio' && WAREHOUSE_LOCATIONS[value]) {
      updatedData.ubicacion_almacen = WAREHOUSE_LOCATIONS[value];
    }
    
    setFormData(updatedData);
    
    // Limpiar error del campo cuando el usuario empieza a escribir
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleAddInventory = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      
      const inventoryData = {
        tipo_ayuda_id: formData.tipo_ayuda_id,
        cantidad: parseInt(formData.cantidad),
        fecha_caducidad: noExpiryDate ? null : (formData.fecha_caducidad || null),
        lote: formData.lote || null,
        estado: formData.estado || 'disponible',
        municipio: formData.municipio,
        ubicacion_almacen: formData.ubicacion_almacen || '',
        observaciones: formData.observaciones || null
      };

      let response;
      if (editingId) {
        // Editar inventario existente
        response = await axios.put(`${API_URL}/api/inventory/${editingId}`, inventoryData, { headers });
        setSuccessMessage(`✓ Inventario actualizado correctamente`);
      } else {
        // Crear nuevo inventario
        response = await axios.post(`${API_URL}/api/inventory`, inventoryData, { headers });
        let successMsg = response.data.isUpdate
          ? `✓ Cantidad actualizada correctamente a ${response.data.inventory.cantidad} unidades`
          : '✓ Nuevo item de inventario agregado correctamente';
        setSuccessMessage(successMsg);
      }
      
      // Resetear formulario
      setFormData({
        tipo_ayuda_id: '',
        cantidad: '',
        fecha_caducidad: '',
        lote: '',
        estado: 'disponible',
        municipio: '',
        ubicacion_almacen: '',
        observaciones: ''
      });
      setEditingId(null);
      setNoExpiryDate(false);
      setShowForm(false);
      
      // Recargar inventario
      fetchInventory();
      
      // Limpiar mensaje después de 4 segundos
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setError('Error al guardar inventario: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const getUniqueMunicipalities = () => {
    return COLOMBIAN_MUNICIPALITIES;
  };

  const handleEditInventory = (item) => {
    setFormData({
      tipo_ayuda_id: item.tipo_ayuda_id,
      cantidad: item.cantidad,
      fecha_caducidad: item.fecha_caducidad ? item.fecha_caducidad.split('T')[0] : '',
      lote: item.lote || '',
      estado: item.estado || 'disponible',
      municipio: item.municipio,
      ubicacion_almacen: item.ubicacion_almacen || '',
      observaciones: item.observaciones || ''
    });
    setNoExpiryDate(!item.fecha_caducidad);
    setEditingId(item.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setFormData({
      tipo_ayuda_id: '',
      cantidad: '',
      fecha_caducidad: '',
      lote: '',
      estado: 'disponible',
      municipio: '',
      ubicacion_almacen: '',
      observaciones: ''
    });
    setEditingId(null);
    setNoExpiryDate(false);
    setShowForm(false);
  };

  const handleDeleteInventory = async (inventoryId, aidTypeName, cantidad) => {
    if (window.confirm(`¿Está seguro que desea eliminar este inventario?\n\n${aidTypeName} (${cantidad} unidades)`)) {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        await axios.delete(`${API_URL}/api/inventory/${inventoryId}`, { headers });
        
        setSuccessMessage('✓ Inventario eliminado correctamente');
        fetchInventory();
        
        // Limpiar mensaje después de 3 segundos
        setTimeout(() => setSuccessMessage(''), 3000);
      } catch (err) {
        setError('Error al eliminar inventario: ' + (err.response?.data?.message || err.message));
        console.error(err);
      }
    }
  };

  const getEstadoColor = (estado) => {
    switch(estado) {
      case 'disponible': return '#27ae60';
      case 'dañado': return '#e74c3c';
      case 'vencido': return '#f39c12';
      case 'retirado': return '#95a5a6';
      default: return '#2c3e50';
    }
  };

  return (
    <div className="container inventory-management">
      <h1>Gestión de Inventario</h1>

      {error && <div className="alert alert-danger">{error}</div>}
      {successMessage && <div className="alert alert-success">{successMessage}</div>}

      <div className="card">
        <div className="form-section-header">
          <div className="filter-section">
            <label htmlFor="municipality">Filtrar por Municipio:</label>
            <select
              id="municipality"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
            >
              <option value="">-- Todos los Municipios --</option>
              {getUniqueMunicipalities().map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            style={{ display: showForm ? 'none' : 'block' }}
            type="button"
          >
            + Agregar Inventario
          </button>
        </div>

        {/* Formulario de adición de inventario */}
        {showForm && (
          <div className="inventory-form">
            <h3>{editingId ? 'Editar Item de Inventario' : 'Agregar Nuevo Item de Inventario'}</h3>
            <form onSubmit={handleAddInventory}>
              {/* Fila 1: Tipo, Cantidad, Municipio */}
              <div className="form-group">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <label htmlFor="tipo_ayuda_id">Tipo de Ayuda: *</label>
                  {user?.rol === 'administrador' && (
                    <button
                      type="button"
                      onClick={handleOpenAidTypeModal}
                      style={{
                        padding: '4px 12px',
                        backgroundColor: '#3498db',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#2980b9'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = '#3498db'}
                    >
                      ⚙️ Gestionar
                    </button>
                  )}
                </div>
                <select
                  id="tipo_ayuda_id"
                  name="tipo_ayuda_id"
                  value={formData.tipo_ayuda_id}
                  onChange={handleFormChange}
                  disabled={loadingAidTypes}
                >
                  <option value="">-- Selecciona un tipo de ayuda --</option>
                  {aidTypes.map(aid => (
                    <option key={aid.id} value={aid.id}>{aid.nombre}</option>
                  ))}
                </select>
                {formErrors.tipo_ayuda_id && <span className="error-message">{formErrors.tipo_ayuda_id}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="cantidad">Cantidad: *</label>
                <input
                  type="number"
                  id="cantidad"
                  name="cantidad"
                  value={formData.cantidad}
                  onChange={handleFormChange}
                  min="1"
                  placeholder="Ej: 100"
                />
                {formErrors.cantidad && <span className="error-message">{formErrors.cantidad}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="municipio">Municipio: *</label>
                <select
                  id="municipio"
                  name="municipio"
                  value={formData.municipio}
                  onChange={handleFormChange}
                >
                  <option value="">-- Selecciona un municipio --</option>
                  {getUniqueMunicipalities().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {formErrors.municipio && <span className="error-message">{formErrors.municipio}</span>}
              </div>

              {/* Fila 2: Fecha, Lote, Estado */}
              <div className="form-group">
                <label htmlFor="fecha_caducidad">Fecha de Caducidad: *</label>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <input
                    type="date"
                    id="fecha_caducidad"
                    name="fecha_caducidad"
                    value={formData.fecha_caducidad}
                    onChange={handleFormChange}
                    disabled={noExpiryDate}
                    style={{ flex: 1, opacity: noExpiryDate ? 0.5 : 1, cursor: noExpiryDate ? 'not-allowed' : 'pointer' }}
                  />
                  <label style={{ display: 'flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap', cursor: 'pointer', marginBottom: 0 }}>
                    <input
                      type="checkbox"
                      checked={noExpiryDate}
                      onChange={(e) => {
                        setNoExpiryDate(e.target.checked);
                        if (e.target.checked) {
                          setFormData(prev => ({ ...prev, fecha_caducidad: '' }));
                        }
                      }}
                      style={{ cursor: 'pointer' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: '600', color: '#7f8c8d' }}>No aplica</span>
                  </label>
                </div>
                {formErrors.fecha_caducidad && <span className="error-message">{formErrors.fecha_caducidad}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="lote">Lote/Número de Donación:</label>
                <input
                  type="text"
                  id="lote"
                  name="lote"
                  value={formData.lote}
                  onChange={handleFormChange}
                  placeholder="Ej: LOTE-001 o DON-2026-04"
                />
              </div>

              <div className="form-group">
                <label htmlFor="estado">Estado:</label>
                <select
                  id="estado"
                  name="estado"
                  value={formData.estado}
                  onChange={handleFormChange}
                >
                  <option value="disponible">Disponible</option>
                  <option value="dañado">Dañado</option>
                  <option value="vencido">Vencido</option>
                  <option value="retirado">Retirado</option>
                </select>
              </div>

              {/* Fila 3: Ubicación del Almacén (ancho completo) */}
              <div className="form-group full-width">
                <label htmlFor="ubicacion_almacen">Ubicación del Almacén:</label>
                <input
                  type="text"
                  id="ubicacion_almacen"
                  name="ubicacion_almacen"
                  value={formData.ubicacion_almacen}
                  readOnly
                  className="input-readonly"
                  placeholder="Se asigna automáticamente según el municipio"
                />
                <small style={{ color: '#7f8c8d', marginTop: '4px', display: 'block' }}>
                  Se asigna automáticamente según el municipio seleccionado
                </small>
              </div>

              {/* Fila 4: Observaciones (ancho completo) */}
              <div className="form-group full-width">
                <label htmlFor="observaciones">Observaciones:</label>
                <textarea
                  id="observaciones"
                  name="observaciones"
                  value={formData.observaciones}
                  onChange={handleFormChange}
                  placeholder="Ej: Caja abierta, producto húmedo, etc."
                  rows="3"
                />
              </div>

              {/* Fila 5: Botones de acción */}
              <div className="form-actions">
                <button type="submit" className="btn btn-success">{editingId ? 'Guardar cambios' : 'Agregar al Inventario'}</button>
                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>Cancelar</button>
              </div>
            </form>
          </div>
        )}
      </div>

      {loading ? (
        <p>Cargando inventario...</p>
      ) : (
        <>
          <div className="card">
            <h2>Inventario Actual</h2>
            {inventory.length === 0 ? (
              <p>No hay items en inventario</p>
            ) : (
              <>
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Municipio</th>
                        <th>Tipo de Ayuda</th>
                        <th>Cantidad</th>
                        <th>Unidad</th>
                        <th>Caducidad</th>
                        <th>Lote</th>
                        <th>Estado</th>
                        <th>Ubicación</th>
                        <th>Observaciones</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventory.map(item => {
                        const estaVencido = item.fecha_caducidad && new Date(item.fecha_caducidad) < new Date();
                        return (
                        <tr key={item.id} style={{ backgroundColor: estaVencido && item.estado !== 'vencido' ? '#fff3cd' : 'inherit' }}>
                          <td>{item.municipio}</td>
                          <td>{item.aid_type_name}</td>
                          <td>{item.cantidad}</td>
                          <td>{item.unidad}</td>
                          <td>{item.fecha_caducidad ? new Date(item.fecha_caducidad).toLocaleDateString('es-CO') : <span style={{ color: '#95a5a6', fontStyle: 'italic' }}>N/A</span>}</td>
                          <td>{item.lote || '-'}</td>
                          <td>
                            <span style={{
                              display: 'inline-block',
                              padding: '4px 8px',
                              borderRadius: '4px',
                              backgroundColor: getEstadoColor(item.estado),
                              color: 'white',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {item.estado.charAt(0).toUpperCase() + item.estado.slice(1)}
                            </span>
                          </td>
                          <td>{item.ubicacion_almacen || '-'}</td>
                          <td>{item.observaciones || '-'}</td>
                          <td>
                            <button
                              className="btn btn-primary btn-sm"
                              onClick={() => handleEditInventory(item)}
                              title="Editar inventario"
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-danger btn-sm"
                              onClick={() => handleDeleteInventory(item.id, item.aid_type_name, item.cantidad)}
                              title="Eliminar inventario"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </>
      )}

      {/* Modal para gestionar tipos de ayuda */}
      {showAidTypeModal && user?.rol === 'administrador' && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '8px',
            padding: '30px',
            maxWidth: '900px',
            width: '90%',
            maxHeight: '80vh',
            overflowY: 'auto',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)'
          }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', color: '#2c3e50' }}>Gestionar Tipos de Ayuda</h2>

            {/* Formulario para crear/editar */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '20px',
              borderRadius: '8px',
              marginBottom: '30px',
              border: '1px solid #dee2e6'
            }}>
              <h3 style={{ marginTop: 0, fontSize: '16px', marginBottom: '15px' }}>
                {editingAidTypeId ? 'Editar Tipo de Ayuda' : 'Crear Nuevo Tipo de Ayuda'}
              </h3>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px', marginBottom: '15px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Nombre: *
                  </label>
                  <input
                    type="text"
                    value={aidTypeFormData.nombre}
                    onChange={(e) => {
                      setAidTypeFormData({ ...aidTypeFormData, nombre: e.target.value });
                      if (aidTypeErrors.nombre) {
                        setAidTypeErrors({ ...aidTypeErrors, nombre: '' });
                      }
                    }}
                    placeholder="Ej: Mantas"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: aidTypeErrors.nombre ? '2px solid #e74c3c' : '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                  {aidTypeErrors.nombre && <span style={{ color: '#e74c3c', fontSize: '12px' }}>{aidTypeErrors.nombre}</span>}
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Descripción:
                  </label>
                  <input
                    type="text"
                    value={aidTypeFormData.descripcion}
                    onChange={(e) => setAidTypeFormData({ ...aidTypeFormData, descripcion: e.target.value })}
                    placeholder="Ej: Mantas de lana"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', fontSize: '14px' }}>
                    Unidad:
                  </label>
                  <input
                    type="text"
                    value={aidTypeFormData.unidad}
                    onChange={(e) => setAidTypeFormData({ ...aidTypeFormData, unidad: e.target.value })}
                    placeholder="Ej: Unidad, Kilo, Litro"
                    style={{
                      width: '100%',
                      padding: '10px',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={handleSaveAidType}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: '#27ae60',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold'
                  }}
                >
                  {editingAidTypeId ? 'Guardar Cambios' : 'Crear Tipo'}
                </button>
                {editingAidTypeId && (
                  <button
                    onClick={() => {
                      setEditingAidTypeId(null);
                      setAidTypeFormData({ nombre: '', descripcion: '', unidad: '' });
                      setAidTypeErrors({});
                    }}
                    style={{
                      padding: '10px 20px',
                      backgroundColor: '#95a5a6',
                      color: 'white',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      fontWeight: 'bold'
                    }}
                  >
                    Cancelar Edición
                  </button>
                )}
              </div>
            </div>

            {/* Tabla de tipos de ayuda */}
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '15px', fontSize: '16px' }}>Tipos de Ayuda Existentes</h3>
              {aidTypes.length === 0 ? (
                <p style={{ color: '#7f8c8d' }}>No hay tipos de ayuda registrados</p>
              ) : (
                <table style={{
                  width: '100%',
                  borderCollapse: 'collapse',
                  backgroundColor: 'white'
                }}>
                  <thead>
                    <tr style={{ backgroundColor: '#ecf0f1', borderBottom: '2px solid #bdc3c7' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Nombre</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Descripción</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: 'bold', fontSize: '14px' }}>Unidad</th>
                      <th style={{ padding: '12px', textAlign: 'center', fontWeight: 'bold', fontSize: '14px' }}>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aidTypes.map(aidType => (
                      <tr key={aidType.id} style={{ borderBottom: '1px solid #ecf0f1' }}>
                        <td style={{ padding: '12px', color: '#2c3e50' }}>{aidType.nombre}</td>
                        <td style={{ padding: '12px', color: '#7f8c8d', fontSize: '14px' }}>{aidType.descripcion || '-'}</td>
                        <td style={{ padding: '12px', color: '#7f8c8d', fontSize: '14px' }}>{aidType.unidad || '-'}</td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <button
                            onClick={() => handleEditAidType(aidType)}
                            style={{
                              padding: '6px 12px',
                              marginRight: '8px',
                              backgroundColor: '#3498db',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            ✏️ Editar
                          </button>
                          <button
                            onClick={() => handleDeleteAidType(aidType.id, aidType.nombre)}
                            style={{
                              padding: '6px 12px',
                              backgroundColor: '#e74c3c',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}
                          >
                            🗑️ Eliminar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Botón cerrar */}
            <button
              onClick={handleCloseAidTypeModal}
              style={{
                marginTop: '20px',
                padding: '10px 20px',
                backgroundColor: '#95a5a6',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InventoryManagement;
