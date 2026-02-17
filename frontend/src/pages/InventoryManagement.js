import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import './InventoryManagement.css';

function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [municipality, setMunicipality] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  // Estados para el formulario de agregación
  const [showForm, setShowForm] = useState(false);
  const [aidTypes, setAidTypes] = useState([]);
  const [loadingAidTypes, setLoadingAidTypes] = useState(false);
  const [formData, setFormData] = useState({
    tipo_ayuda_id: '',
    cantidad: '',
    costo_unitario: '',
    municipio: '',
    ubicacion_almacen: ''
  });
  const [formErrors, setFormErrors] = useState({});

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };
      let url = 'http://localhost:5000/api/inventory';
      
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
      const response = await axios.get('http://localhost:5000/api/aids/types', { headers });
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

  const calculateTotalValue = () => {
    return inventory.reduce((total, item) => {
      const value = (parseFloat(item.cantidad) || 0) * (parseFloat(item.costo_unitario) || 0);
      return total + value;
    }, 0);
  };

  const validateForm = () => {
    const errors = {};
    
    if (!formData.tipo_ayuda_id) errors.tipo_ayuda_id = 'Selecciona un tipo de ayuda';
    if (!formData.cantidad || formData.cantidad <= 0) errors.cantidad = 'La cantidad debe ser mayor a 0';
    if (!formData.municipio) errors.municipio = 'Selecciona un municipio';
    if (!formData.costo_unitario || formData.costo_unitario < 0) errors.costo_unitario = 'Ingresa un costo unitario válido';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
        costo_unitario: parseFloat(formData.costo_unitario),
        municipio: formData.municipio,
        ubicacion_almacen: formData.ubicacion_almacen || ''
      };

      await axios.post('http://localhost:5000/api/inventory', inventoryData, { headers });
      
      // Éxito
      setSuccessMessage('Inventario agregado correctamente');
      setFormData({
        tipo_ayuda_id: '',
        cantidad: '',
        costo_unitario: '',
        municipio: '',
        ubicacion_almacen: ''
      });
      setShowForm(false);
      
      // Recargar inventario
      fetchInventory();
      
      // Limpiar mensaje después de 3 segundos
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      setError('Error al agregar inventario: ' + (err.response?.data?.message || err.message));
      console.error(err);
    }
  };

  const getUniqueМunicipalities = () => {
    return COLOMBIAN_MUNICIPALITIES;
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
              {getUniqueМunicipalities().map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <button 
            className="btn btn-primary"
            onClick={() => setShowForm(!showForm)}
            type="button"
          >
            {showForm ? 'Cancelar' : '+ Agregar Inventario'}
          </button>
        </div>

        {/* Formulario de adición de inventario */}
        {showForm && (
          <div className="inventory-form">
            <h3>Agregar Nuevo Item de Inventario</h3>
            <form onSubmit={handleAddInventory}>
              <div className="form-group">
                <label htmlFor="tipo_ayuda_id">Tipo de Ayuda: *</label>
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
                <label htmlFor="costo_unitario">Costo Unitario: *</label>
                <input
                  type="number"
                  id="costo_unitario"
                  name="costo_unitario"
                  value={formData.costo_unitario}
                  onChange={handleFormChange}
                  step="0.01"
                  min="0"
                  placeholder="Ej: 25.50"
                />
                {formErrors.costo_unitario && <span className="error-message">{formErrors.costo_unitario}</span>}
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
                  {getUniqueМunicipalities().map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
                {formErrors.municipio && <span className="error-message">{formErrors.municipio}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="ubicacion_almacen">Ubicación del Almacén:</label>
                <input
                  type="text"
                  id="ubicacion_almacen"
                  name="ubicacion_almacen"
                  value={formData.ubicacion_almacen}
                  onChange={handleFormChange}
                  placeholder="Ej: Bodega Centro, Piso 2"
                />
              </div>

              <div className="form-actions">
                <button type="submit" className="btn btn-success">Guardar Inventario</button>
                <button type="button" className="btn btn-secondary" onClick={() => setShowForm(false)}>Cancelar</button>
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
                <table className="table">
                  <thead>
                    <tr>
                      <th>Municipio</th>
                      <th>Tipo de Ayuda</th>
                      <th>Cantidad</th>
                      <th>Unidad</th>
                      <th>Costo Unitario</th>
                      <th>Valor Total</th>
                      <th>Ubicación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {inventory.map(item => (
                      <tr key={item.id}>
                        <td>{item.municipio}</td>
                        <td>{item.aid_type_name}</td>
                        <td>{item.cantidad || 0}</td>
                        <td>{item.unidad}</td>
                        <td>${(parseFloat(item.costo_unitario) || 0).toFixed(2)}</td>
                        <td>${((parseFloat(item.cantidad) || 0) * (parseFloat(item.costo_unitario) || 0)).toFixed(2)}</td>
                        <td>{item.ubicacion_almacen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="summary">
                  <h3>Valor Total de Inventario: ${calculateTotalValue().toFixed(2)}</h3>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default InventoryManagement;
