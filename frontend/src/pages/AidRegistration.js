import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import './AidRegistration.css';

function AidRegistration() {
  // Estados para formulario de ayuda
  const [formData, setFormData] = useState({
    censado_id: '',
    tipo_ayuda_id: '',
    cantidad: '',
    municipio: '',
    notas: ''
  });

  // Estado para los items agregados de ayudas
  const [aidItems, setAidItems] = useState([]);

  // Estado para entregas ya registradas del beneficiario
  const [registeredDeliveries, setRegisteredDeliveries] = useState([]);

  const [censados, setCensados] = useState([]);
  const [aidTypes, setAidTypes] = useState([]);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchBeneficiary, setSearchBeneficiary] = useState('');
  const [showBeneficiaryDropdown, setShowBeneficiaryDropdown] = useState(false);
  const [censadosWithDeliveries, setCensadosWithDeliveries] = useState([]);
  const [checkingInventory, setCheckingInventory] = useState(false); // Indicador de carga
  const [inventoryStatusMap, setInventoryStatusMap] = useState({}); // Mapa de inventarios para todos los tipos
  const [generatedReceipts, setGeneratedReceipts] = useState([]); // Comprobantes generados
  const [beneficiarySigned, setBeneficiarySigned] = useState(false); // Si el beneficiario firmó

  const getHeaders = () => {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}` };
  };

  const fetchData = useCallback(async () => {
    try {
      const [censadosRes, aidTypesRes, deliveriesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/censo', { headers: getHeaders() }),
        axios.get('http://localhost:5000/api/aids/types', { headers: getHeaders() }),
        axios.get('http://localhost:5000/api/aids/delivery', { headers: getHeaders() })
      ]);

      setCensados(censadosRes.data);
      setAidTypes(aidTypesRes.data);
      
      // Agrupar entregas por censado_id
      const deliveriesByCensado = {};
      deliveriesRes.data.forEach(delivery => {
        if (!deliveriesByCensado[delivery.censado_id]) {
          deliveriesByCensado[delivery.censado_id] = true;
        }
      });
      setCensadosWithDeliveries(Object.keys(deliveriesByCensado));
    } catch (err) {
      setError('Error cargando datos');
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Monitorear cambios en censado_id
  useEffect(() => {
    console.log('▶▶▶ formData.censado_id cambió a:', formData.censado_id);
  }, [formData.censado_id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Si el cambio es en censado_id, auto-llenar el municipio y cargar entregas
    if (name === 'censado_id') {
      console.log('▶ handleChange censado_id:', value);
      const selectedCensado = censados.find(c => c.id === value);
      console.log('  Censado encontrado:', selectedCensado);
      
      const newFormData = {
        ...formData,
        censado_id: value,
        municipio: selectedCensado ? selectedCensado.municipio : ''
      };
      
      setFormData(newFormData);
      
      // Cargar entregas registradas de este beneficiario
      if (value) {
        console.log('  Llamando fetchBeneficiaryDeliveries...');
        fetchBeneficiaryDeliveries(value);
      } else {
        setRegisteredDeliveries([]);
      }
    } else if (name === 'tipo_ayuda_id') {
      console.log('▶ handleChange tipo_ayuda_id:', value);
      console.log('  municipio actual en formData:', formData.municipio);
      
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Verificar inventario cuando cambia el tipo de ayuda
      // Usar el municipio actual de formData
      if (value && formData.municipio) {
        console.log('  Llamando checkInventory con:', value, formData.municipio);
        checkInventory(value, formData.municipio);
      } else {
        console.log('  No se puede verificar - falta tipo_ayuda_id o municipio');
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const fetchBeneficiaryDeliveries = async (censadoId) => {
    try {
      console.log('▶▶ INICIANDO FETCH DE ENTREGAS');
      console.log('   censado_id:', censadoId);
      console.log('   tipo:', typeof censadoId);
      
      const url = `http://localhost:5000/api/aids/delivery/beneficiary/${censadoId}`;
      console.log('   URL:', url);
      
      const response = await axios.get(url, { headers: getHeaders() });
      console.log('   Status:', response.status);
      console.log('   Datos recibidos:', response.data);
      console.log('   Total de entregas:', response.data?.length || 0);
      
      // Ordenar entregas por fecha (más recientes primero)
      const sortedDeliveries = (response.data || []).sort(
        (a, b) => new Date(b.fecha_entrega) - new Date(a.fecha_entrega)
      );
      
      setRegisteredDeliveries(sortedDeliveries);
    } catch (err) {
      console.error('❌ ERROR CARGANDO ENTREGAS');
      console.error('   Status:', err.response?.status);
      console.error('   Error data:', err.response?.data);
      console.error('   Mensaje:', err.message);
      
      setError(`Error al cargar entregas: ${err.response?.data?.error || err.message}`);
      setRegisteredDeliveries([]);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleBeneficiarySearch = (e) => {
    const value = e.target.value;
    setSearchBeneficiary(value);
    setShowBeneficiaryDropdown(value.length > 0);
  };

  const handleSelectBeneficiary = (censado) => {
    console.log('▶ Seleccionando beneficiario:', censado);
    console.log('  ID:', censado.id);
    console.log('  Nombre:', censado.primer_nombre, censado.primer_apellido);
    console.log('  Municipio:', censado.municipio);
    
    setFormData(prev => ({
      ...prev,
      censado_id: censado.id,
      municipio: censado.municipio,
      tipo_ayuda_id: '' // Limpiar selección de tipo de ayuda
    }));
    setSearchBeneficiary('');
    setShowBeneficiaryDropdown(false);

    
    // Cargar inventarios para TODOS los tipos de ayuda
    loadAllInventories(censado.municipio);
    
    // Cargar entregas después de seleccionar el beneficiario
    fetchBeneficiaryDeliveries(censado.id);
  };

  const loadAllInventories = async (municipality) => {
    if (!aidTypes.length || !municipality) return;
    
    const newMap = {};
    
    for (const aidType of aidTypes) {
      if (aidType.nombre.toLowerCase() === 'donaciones') continue;
      
      try {
        const response = await axios.get(
          `http://localhost:5000/api/aids/inventory-check/${aidType.id}/${municipality}`,
          { headers: getHeaders() }
        );
        newMap[aidType.id] = response.data;
      } catch (err) {
        console.error(`Error checking inventory for aid type ${aidType.id}:`, err);
        newMap[aidType.id] = { disponible: false, cantidad: 0 };
      }
    }
    
    setInventoryStatusMap(newMap);
  };

  // Filtrar beneficiarios según la búsqueda
  const filteredBeneficiaries = searchBeneficiary.length > 0
    ? censados.filter(c =>
        `${c.primer_nombre} ${c.primer_apellido} ${c.cedula}`
          .toLowerCase()
          .includes(searchBeneficiary.toLowerCase())
      )
    : [];

  const checkInventory = async (aidTypeId, municipality) => {
    if (!aidTypeId || !municipality) {
      console.log('⚠️  checkInventory: faltan parámetros', { aidTypeId, municipality });
      return;
    }

    try {
      setCheckingInventory(true);
      console.log('🔍 Llamando API de inventario:');
      console.log('  aidTypeId:', aidTypeId);
      console.log('  municipality:', municipality);
      
      const response = await axios.get(
        `http://localhost:5000/api/aids/inventory-check/${aidTypeId}/${municipality}`,
        { headers: getHeaders() }
      );
      
      console.log('✓ Respuesta del servidor:', response.data);
    } catch (err) {
      console.error('❌ Error checking inventory:', err);
    } finally {
      setCheckingInventory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (aidItems.length === 0) {
      setError('Agrega al menos un tipo de ayuda');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');
    setDuplicateAlert(null);
    setGeneratedReceipts([]);

    try {
      const createdDeliveries = [];
      
      // Registrar todos los items
      for (const item of aidItems) {
        const deliveryData = {
          censado_id: formData.censado_id,
          tipo_ayuda_id: item.tipo_ayuda_id,
          cantidad: item.cantidad,
          municipio: formData.municipio,
          notas: formData.notas
        };

        const deliveryResponse = await axios.post(
          'http://localhost:5000/api/aids/delivery',
          deliveryData,
          { headers: getHeaders() }
        );

        createdDeliveries.push(deliveryResponse.data.delivery);
      }

      // Generar UN SOLO comprobante que agrupe todas las entregas
      const receipts = [];

      if (createdDeliveries.length > 0) {
        try {
          // Usar la primera entrega como referencia y enviar todos los IDs
          const deliveryIds = createdDeliveries.map(d => d.id);
          
          console.log('Intentando generar comprobante...');
          console.log('  deliveryId:', createdDeliveries[0].id);
          console.log('  relatedDeliveries:', deliveryIds);
          
          const receiptResponse = await axios.post(
            `http://localhost:5000/api/receipts/${createdDeliveries[0].id}`,
            { 
              signedByBeneficiary: beneficiarySigned,
              relatedDeliveries: deliveryIds  // Pasar todos los IDs relacionados
            },
            { headers: getHeaders() }
          );

          console.log('Comprobante generado exitosamente:', receiptResponse.data);
          
          receipts.push({
            deliveryId: createdDeliveries[0].id,
            receiptId: receiptResponse.data.id,
            receiptNumber: receiptResponse.data.receipt_number,
            hash: receiptResponse.data.hash
          });
        } catch (err) {
          console.error('Error generando comprobante:');
          console.error('  Status:', err.response?.status);
          console.error('  Message:', err.response?.data?.error || err.message);
          console.error('  Response:', err.response?.data);
          console.error('  Full error:', err);
        }
      }

      setGeneratedReceipts(receipts);

      setMessage(
        `✓ ${aidItems.length} ayuda(s) registrada(s) exitosamente - ${receipts.length} comprobante(s) generado(s)`
      );
      
      // Limpiar todo PERO NO LIMPIAR generatedReceipts inmediatamente
      setFormData({
        censado_id: '',
        tipo_ayuda_id: '',
        cantidad: '',
        municipio: '',
        notas: ''
      });
      setAidItems([]);
      setBeneficiarySigned(false);

      // El mensaje se limpia después 10 segundos, pero generatedReceipts permanece visible
      setTimeout(() => setMessage(''), 10000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar ayudas');
    } finally {
      setLoading(false);
    }
  };

  const handleAddAidItem = (e) => {
    e.preventDefault();
    
    if (!formData.tipo_ayuda_id || !formData.cantidad) {
      setError('Selecciona tipo de ayuda y cantidad');
      return;
    }

    const selectedAid = aidTypes.find(a => a.id === formData.tipo_ayuda_id);
    
    const newItem = {
      id: Date.now(),
      tipo_ayuda_id: formData.tipo_ayuda_id,
      nombre: selectedAid.nombre,
      unidad: selectedAid.unidad,
      cantidad: formData.cantidad
    };

    setAidItems([...aidItems, newItem]);
    setError('');
    
    // Limpiar solo tipo_ayuda_id y cantidad
    setFormData(prev => ({
      ...prev,
      tipo_ayuda_id: '',
      cantidad: ''
    }));
  };

  const handleRemoveAidItem = (itemId) => {
    setAidItems(aidItems.filter(item => item.id !== itemId));
  };

  const handleDeleteDelivery = async (deliveryId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta entrega?')) {
      return;
    }

    try {
      await axios.delete(`http://localhost:5000/api/aids/delivery/${deliveryId}`, { headers: getHeaders() });
      setMessage('✓ Entrega eliminada correctamente');
      // Recargar las entregas del beneficiario
      if (formData.censado_id) {
        fetchBeneficiaryDeliveries(formData.censado_id);
      }
      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.message;
      
      // Mostrar un mensaje específico para comprobantes
      if (err.response?.data?.hasReceipts) {
        setError('❌ No se puede eliminar: Esta entrega tiene comprobantes generados. Los registros con comprobantes están protegidos por auditoría.');
      } else {
        setError('Error al eliminar la entrega: ' + errorMessage);
      }
    }
  };

  const downloadReceipt = async (receiptId, receiptNumber) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/receipts/${receiptId}/download`,
        {
          headers: getHeaders(),
          responseType: 'blob'
        }
      );

      // Crear un blob URL y descargar
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${receiptNumber}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Error descargando comprobante: ' + (err.response?.data?.error || err.message));
    }
  };


  return (
    <div className="container aid-registration">
      <h1>Registro de Ayudas</h1>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      {duplicateAlert && (
        <div className="alert alert-warning">
          <strong>Alerta de Duplicidad:</strong> {duplicateAlert.message}
          <br />
          Última entrega: {new Date(duplicateAlert.lastDelivery).toLocaleDateString()}
          ({duplicateAlert.daysSince} días)
        </div>
      )}

      {/* Pestañas */}
      <div className="tabs-container">
        <div className="tabs-header">
          <button
            className={`tab-button active`}
          >
            Registrar Ayuda
          </button>
        </div>

        {/* Pestaña: Registrar Ayuda */}
        {true && (
          <div className="tab-content">
            <div className="card">
              <form onSubmit={handleSubmit}>
                <div className="form-group beneficiary-search-group">
                  <label htmlFor="beneficiary_search">Beneficiario</label>
                  <div className="beneficiary-search-container">
                    <input
                      id="beneficiary_search"
                      type="text"
                      placeholder="Escribe nombre o cédula del beneficiario..."
                      value={searchBeneficiary}
                      onChange={handleBeneficiarySearch}
                      onFocus={() => searchBeneficiary && setShowBeneficiaryDropdown(true)}
                      required={!formData.censado_id}
                    />
                    {showBeneficiaryDropdown && filteredBeneficiaries.length > 0 && (
                      <div className="beneficiary-dropdown">
                        {filteredBeneficiaries.map(c => (
                          <div
                            key={c.id}
                            className="beneficiary-option"
                            onClick={() => handleSelectBeneficiary(c)}
                          >
                            <div className="beneficiary-name">
                              {c.primer_nombre} {c.primer_apellido}
                              {censadosWithDeliveries.includes(c.id) && (
                                <span style={{ marginLeft: '10px', color: '#27ae60', fontWeight: 'bold' }}>(con entregas)</span>
                              )}
                            </div>
                            <div className="beneficiary-cedula">{c.cedula}</div>
                          </div>
                        ))}
                      </div>
                    )}
                    {showBeneficiaryDropdown && searchBeneficiary && filteredBeneficiaries.length === 0 && (
                      <div className="beneficiary-dropdown">
                        <div className="no-results">No se encontró beneficiario</div>
                      </div>
                    )}
                  </div>
                  {formData.censado_id && (
                    <div className="selected-beneficiary">
                      ✓ Seleccionado: {censados.find(c => c.id === formData.censado_id)?.primer_nombre} {censados.find(c => c.id === formData.censado_id)?.primer_apellido}
                    </div>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="aid_type_id">Tipo de Ayuda {!formData.censado_id && <span style={{color: '#dc3545'}}>*Selecciona beneficiario primero</span>}</label>
                  <select
                    id="tipo_ayuda_id"
                    name="tipo_ayuda_id"
                    value={formData.tipo_ayuda_id}
                    onChange={handleChange}
                    disabled={!formData.censado_id}
                  >
                    <option value="">Seleccionar tipo de ayuda</option>
                    {aidTypes
                      .filter(a => a.nombre.toLowerCase() !== 'donaciones')
                      .map(a => {
                        const inventoryData = inventoryStatusMap[a.id];
                        const stockAvailable = inventoryData && inventoryData.disponible;
                        const stockIndicator = stockAvailable ? '✓' : '✗';
                        return (
                          <option key={a.id} value={a.id}>
                            {a.nombre} ({a.unidad}) {stockIndicator}
                          </option>
                        );
                      })}
                  </select>
                </div>

                {/* Indicador de disponibilidad de inventario */}
                {formData.tipo_ayuda_id && inventoryStatusMap[formData.tipo_ayuda_id] && (
                  <div style={{
                    padding: '10px 15px',
                    marginBottom: '15px',
                    borderRadius: '4px',
                    backgroundColor: inventoryStatusMap[formData.tipo_ayuda_id]?.disponible ? '#d4edda' : '#f8d7da',
                    borderLeft: `4px solid ${inventoryStatusMap[formData.tipo_ayuda_id]?.disponible ? '#28a745' : '#dc3545'}`,
                    fontSize: '13px'
                  }}>
                    {inventoryStatusMap[formData.tipo_ayuda_id]?.disponible ? (
                      <span style={{ color: '#155724' }}>
                        ✓ {inventoryStatusMap[formData.tipo_ayuda_id]?.cantidad} unidades disponibles en {inventoryStatusMap[formData.tipo_ayuda_id]?.ubicacion || formData.municipio}
                      </span>
                    ) : (
                      <span style={{ color: '#721c24' }}>
                        ✗ No hay disponibilidad en {formData.municipio}
                      </span>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="cantidad">Cantidad {!formData.censado_id && <span style={{color: '#dc3545'}}>*Selecciona beneficiario primero</span>}</label>
                  <input
                    type="number"
                    id="cantidad"
                    name="cantidad"
                    value={formData.cantidad}
                    onChange={handleChange}
                    min="1"
                    disabled={!formData.censado_id}
                  />
                </div>

                <button 
                  type="button" 
                  className="btn btn-success"
                  onClick={handleAddAidItem}
                  style={{ marginBottom: '20px' }}
                  disabled={checkingInventory}
                >
                  Agregar Tipo de Ayuda
                </button>

                {/* Tabla de items agregados */}
                {aidItems.length > 0 && (
                  <div style={{ marginBottom: '20px' }}>
                    <h3>Ayudas Seleccionadas</h3>
                    <table className="table">
                      <thead>
                        <tr>
                          <th>Tipo de Ayuda</th>
                          <th>Cantidad</th>
                          <th>Unidad</th>
                          <th>Acciones</th>
                        </tr>
                      </thead>
                      <tbody>
                        {aidItems.map(item => (
                          <tr key={item.id}>
                            <td>{item.nombre}</td>
                            <td>{item.cantidad}</td>
                            <td>{item.unidad}</td>
                            <td>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger"
                                onClick={() => handleRemoveAidItem(item.id)}
                              >
                                Eliminar
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Tabla de entregas ya registradas */}
                {formData.censado_id && (
                  <div className="registered-deliveries-section">
                    <h3>Entregas Registradas para este Beneficiario</h3>
                    {registeredDeliveries.length > 0 ? (
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Tipo de Ayuda</th>
                            <th>Cantidad</th>
                            <th>Operador</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                          </tr>
                        </thead>
                        <tbody>
                          {registeredDeliveries.map(delivery => (
                            <tr key={delivery.id}>
                              <td>{delivery.aid_type_name}</td>
                              <td>{delivery.cantidad}</td>
                              <td>{delivery.operator_name || 'Sistema'}</td>
                              <td>{new Date(delivery.fecha_entrega).toLocaleDateString('es-ES')}</td>
                              <td>
                                <button
                                  type="button"
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleDeleteDelivery(delivery.id)}
                                >
                                  Eliminar
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    ) : (
                      <div className="registered-deliveries-empty">
                        <p>✓ No hay entregas registradas para este beneficiario</p>
                        <small>Una vez registres ayudas, aparecerán aquí para que puedas consultarlas o eliminarlas</small>
                      </div>
                    )}
                  </div>
                )}

                <div className="form-group">
                  <label htmlFor="municipio">Municipio</label>
                  <input
                    type="text"
                    id="municipio"
                    name="municipio"
                    value={formData.municipio}
                    readOnly
                    className="input-readonly"
                    placeholder="Se asigna automáticamente según el beneficiario"
                  />
                  <small style={{ color: '#7f8c8d', marginTop: '4px', display: 'block' }}>
                    Se asigna automáticamente según el beneficiario seleccionado
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="notas">Observaciones</label>
                  <textarea
                    id="notas"
                    name="notas"
                    value={formData.notas}
                    onChange={handleChange}
                    placeholder="Observaciones adicionales..."
                    disabled={!formData.censado_id}
                  ></textarea>
                </div>

                <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                  <input
                    type="checkbox"
                    id="beneficiary_signed"
                    checked={beneficiarySigned}
                    onChange={(e) => setBeneficiarySigned(e.target.checked)}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <label htmlFor="beneficiary_signed" style={{ margin: 0, cursor: 'pointer', userSelect: 'none' }}>
                    El beneficiario firmó el comprobante
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '30px' }}>
                  <button 
                    type="submit" 
                    className="btn btn-primary" 
                    disabled={loading || aidItems.length === 0}
                    style={{ minWidth: '250px' }}
                  >
                    {loading ? 'Registrando...' : `📤 Registrar ${aidItems.length} Ayuda(s)`}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Sección de Comprobantes Generados - Permanece visible */}
      {generatedReceipts.length > 0 && (
        <div style={{
          backgroundColor: 'rgba(40, 167, 69, 0.15)',
          border: '3px solid #28a745',
          borderRadius: '12px',
          padding: '25px',
          marginTop: '30px',
          boxShadow: '0 4px 12px rgba(40, 167, 69, 0.2)'
        }}>
          <h2 style={{ color: '#155724', marginTop: 0, fontSize: '20px' }}>
            ✓ Comprobante(s) Generado(s) Exitosamente
          </h2>
          <p style={{ color: '#155724', marginBottom: '25px', fontSize: '15px' }}>
            Se han generado {generatedReceipts.length} comprobante(s) digital(es). 
            Descarga el PDF para obtener tu comprobante de entrega:
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
            gap: '20px'
          }}>
            {generatedReceipts.map((receipt, index) => (
              <div key={index} style={{
                backgroundColor: 'white',
                border: '2px solid #28a745',
                borderRadius: '8px',
                padding: '20px',
                boxShadow: '0 3px 10px rgba(40, 167, 69, 0.15)',
                transition: 'all 0.3s ease'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#155724', fontSize: '16px' }}>
                  Comprobante #{index + 1}
                </h3>
                <div style={{ backgroundColor: '#f8f9fa', padding: '12px', borderRadius: '5px', marginBottom: '15px' }}>
                  <p style={{ margin: '8px 0', fontSize: '13px' }}>
                    <strong style={{ color: '#2c3e50' }}>Número:</strong> <span style={{ color: '#27ae60', fontWeight: 'bold' }}>{receipt.receiptNumber}</span>
                  </p>
                  <p style={{ margin: '8px 0', fontSize: '13px' }}>
                    <strong style={{ color: '#2c3e50' }}>Hash de Verificación:</strong> <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#7f8c8d' }}>{receipt.hash.substring(0, 20)}...</span>
                  </p>
                </div>
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => downloadReceipt(receipt.receiptId, receipt.receiptNumber)}
                  style={{ 
                    marginTop: '0', 
                    width: '100%',
                    fontSize: '15px',
                    padding: '12px',
                    fontWeight: 'bold',
                    backgroundColor: '#28a745',
                    border: 'none',
                    borderRadius: '5px',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseOver={(e) => {
                    e.target.style.backgroundColor = '#218838';
                    e.target.style.transform = 'translateY(-2px)';
                  }}
                  onMouseOut={(e) => {
                    e.target.style.backgroundColor = '#28a745';
                    e.target.style.transform = 'translateY(0)';
                  }}
                >
                  📥 Descargar PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default AidRegistration;
