import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import './BeneficiaryManagement.css';

function BeneficiaryManagement() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [activeTab, setActiveTab] = useState('list'); // 'list' o 'add'
  const [currentPage, setCurrentPage] = useState(1); // Paginación
  const ITEMS_PER_PAGE = 10;
  
  // Estados para agregar beneficiario
  const [newBeneficiaryForm, setNewBeneficiaryForm] = useState({
    cedula: '',
    primer_nombre: '',
    primer_apellido: '',
    telefono: '',
    email: '',
    direccion: '',
    municipio: '',
    miembros_familia: 1
  });

  // Estados para modal de registros
  const [showDeliveriesModal, setShowDeliveriesModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState(null);
  const [beneficiaryDeliveries, setBeneficiaryDeliveries] = useState([]);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchBeneficiaries();
  }, []);

  const fetchBeneficiaries = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:5000/api/censo?limit=1000', { headers });
      setBeneficiaries(response.data);
      setFilteredBeneficiaries(response.data);
      setError('');
    } catch (err) {
      setError('Error cargando beneficiarios: ' + err.message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (municipio, search) => {
    let filtered = beneficiaries;

    // Filtro por municipio
    if (municipio !== '') {
      filtered = filtered.filter(b => b.municipio === municipio);
    }

    // Filtro por búsqueda (nombre, apellido, cédula)
    if (search !== '') {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(b =>
        `${b.primer_nombre} ${b.primer_apellido} ${b.cedula}`
          .toLowerCase()
          .includes(searchLower)
      );
    }

    setFilteredBeneficiaries(filtered);
    setCurrentPage(1); // Resetear a página 1 cuando se aplican filtros
  };

  const handleFilterChange = (e) => {
    const municipality = e.target.value;
    setSelectedMunicipality(municipality);
    applyFilters(municipality, searchTerm);
  };

  const handleSearchChange = (e) => {
    const search = e.target.value;
    setSearchTerm(search);
    applyFilters(selectedMunicipality, search);
  };

  const startEdit = (beneficiary) => {
    setEditingId(beneficiary.id);
    setEditData({ ...beneficiary });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveEdit = async () => {
    try {
      setLoading(true);
      await axios.put(
        `http://localhost:5000/api/censo/${editingId}`,
        editData,
        { headers }
      );
      setMessage('✓ Beneficiario actualizado correctamente');
      setEditingId(null);
      setEditData({});
      resetMessages();
      await fetchBeneficiaries();
    } catch (err) {
      setError('Error actualizando beneficiario: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar a ${name}?`)) {
      return;
    }

    try {
      setLoading(true);
      await axios.delete(`http://localhost:5000/api/censo/${id}`, { headers });
      setMessage('✓ Beneficiario eliminado correctamente');
      resetMessages();
      await fetchBeneficiaries();
    } catch (err) {
      setError('Error eliminando beneficiario: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const resetMessages = () => {
    setTimeout(() => {
      setMessage('');
      setError('');
    }, 3000);
  };

  const handleBeneficiaryChange = (e) => {
    const { name, value } = e.target;
    setNewBeneficiaryForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddBeneficiary = async (e) => {
    e.preventDefault();

    // Validar campos obligatorios
    if (!newBeneficiaryForm.cedula || !newBeneficiaryForm.primer_nombre || !newBeneficiaryForm.primer_apellido) {
      setError('Por favor completa los campos obligatorios: Cédula, Nombre y Apellido');
      return;
    }

    try {
      setLoading(true);
      await axios.post(
        'http://localhost:5000/api/censo',
        newBeneficiaryForm,
        { headers }
      );
      setMessage('✓ Beneficiario agregado correctamente');
      setNewBeneficiaryForm({
        cedula: '',
        primer_nombre: '',
        primer_apellido: '',
        telefono: '',
        email: '',
        direccion: '',
        municipio: '',
        miembros_familia: 1
      });
      setActiveTab('list');
      resetMessages();
      await fetchBeneficiaries();
    } catch (err) {
      setError('Error agregando beneficiario: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchBeneficiaryDeliveries = async (censadoId) => {
    try {
      const response = await axios.get(
        `http://localhost:5000/api/aids/delivery/beneficiary/${censadoId}`,
        { headers }
      );
      const deliveries = response.data.sort(
        (a, b) => new Date(b.fecha_entrega) - new Date(a.fecha_entrega)
      );
      setBeneficiaryDeliveries(deliveries);
    } catch (err) {
      setError('Error cargando entregas: ' + err.message);
    }
  };

  const handleViewRecords = (beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowDeliveriesModal(true);
    fetchBeneficiaryDeliveries(beneficiary.id);
  };

  const closeDeliveriesModal = () => {
    setShowDeliveriesModal(false);
    setSelectedBeneficiary(null);
    setBeneficiaryDeliveries([]);
  };

  return (
    <div className="container beneficiary-management">
      <h1>Gestión de Beneficiarios</h1>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-button ${activeTab === 'list' ? 'active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Ver Beneficiarios
        </button>
        <button 
          className={`tab-button ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          Agregar Beneficiario
        </button>
      </div>

      {/* Pestaña: Ver Beneficiarios */}
      {activeTab === 'list' && (
        <>
          {/* Filtro por municipio y búsqueda */}
          <div className="filter-section">
            <div className="filter-group">
              <label htmlFor="municipality">Filtrar por Municipio</label>
              <select
                id="municipality"
                value={selectedMunicipality}
                onChange={handleFilterChange}
              >
                <option value="">Todos los municipios ({beneficiaries.length})</option>
                {Array.from(new Set(beneficiaries.map(b => b.municipio))).map(municipality => (
                  <option key={municipality} value={municipality}>
                    {municipality} ({beneficiaries.filter(b => b.municipio === municipality).length})
                  </option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label htmlFor="search">🔍 Buscar Beneficiario</label>
              <input
                type="text"
                id="search"
                value={searchTerm}
                onChange={handleSearchChange}
                placeholder="Por nombre, apellido o cédula..."
                className="search-input"
              />
            </div>
            <p className="results-info">
              Mostrando <strong>{filteredBeneficiaries.length}</strong> de <strong>{beneficiaries.length}</strong> beneficiarios
            </p>
          </div>

          {/* Tabla de beneficiarios */}
          {loading ? (
            <div className="loading">Cargando...</div>
          ) : filteredBeneficiaries.length > 0 ? (
            <div className="table-responsive">
              <table className="table">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Cédula</th>
                    <th>Teléfono</th>
                    <th>Municipio</th>
                    <th>Email</th>
                    <th>Miembros Familia</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
                    const endIndex = startIndex + ITEMS_PER_PAGE;
                    const paginatedBeneficiaries = filteredBeneficiaries.slice(startIndex, endIndex);
                    return paginatedBeneficiaries.map(beneficiary => (
                      <tr key={beneficiary.id}>
                      {editingId === beneficiary.id ? (
                        <>
                          <td>
                            <input
                              type="text"
                              name="primer_nombre"
                              value={editData.primer_nombre || ''}
                              onChange={handleEditChange}
                              placeholder="Nombre"
                              className="edit-input"
                            />
                            <input
                              type="text"
                              name="primer_apellido"
                              value={editData.primer_apellido || ''}
                              onChange={handleEditChange}
                              placeholder="Apellido"
                              className="edit-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="cedula"
                              value={editData.cedula || ''}
                              onChange={handleEditChange}
                              className="edit-input"
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              name="telefono"
                              value={editData.telefono || ''}
                              onChange={handleEditChange}
                              className="edit-input"
                            />
                          </td>
                          <td>
                            <select
                              name="municipio"
                              value={editData.municipio || ''}
                              onChange={handleEditChange}
                              className="edit-input"
                            >
                              <option value="">Seleccionar...</option>
                              {COLOMBIAN_MUNICIPALITIES.map(m => (
                                <option key={m} value={m}>{m}</option>
                              ))}
                            </select>
                          </td>
                          <td>
                            <input
                              type="email"
                              name="email"
                              value={editData.email || ''}
                              onChange={handleEditChange}
                              className="edit-input"
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              name="miembros_familia"
                              value={editData.miembros_familia || 1}
                              onChange={handleEditChange}
                              min="1"
                              className="edit-input"
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-sm btn-success"
                              onClick={saveEdit}
                              disabled={loading}
                            >
                              ✓ Guardar
                            </button>
                            <button
                              className="btn btn-sm btn-secondary"
                              onClick={cancelEdit}
                              disabled={loading}
                            >
                              ✗ Cancelar
                            </button>
                          </td>
                        </>
                      ) : (
                        <>
                          <td>{beneficiary.primer_nombre} {beneficiary.primer_apellido}</td>
                          <td>{beneficiary.cedula}</td>
                          <td>{beneficiary.telefono || '-'}</td>
                          <td>{beneficiary.municipio}</td>
                          <td>{beneficiary.email || '-'}</td>
                          <td>{beneficiary.miembros_familia || 1}</td>
                          <td className="actions-cell">
                            <button
                              className="btn btn-sm btn-info"
                              onClick={() => handleViewRecords(beneficiary)}
                              disabled={loading}
                            >
                              Ver Registros
                            </button>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => startEdit(beneficiary)}
                              disabled={loading}
                            >
                              Editar
                            </button>
                            <button
                              className="btn btn-sm btn-danger"
                              onClick={() => handleDelete(beneficiary.id, `${beneficiary.primer_nombre} ${beneficiary.primer_apellido}`)}
                              disabled={loading}
                            >
                              Eliminar
                            </button>
                          </td>
                        </>
                      )}
                    </tr>
                    ));
                  })()}
                </tbody>
              </table>
              
              {/* Controles de paginación */}
              {filteredBeneficiaries.length > 0 && (
                <div className="pagination">
                  <button 
                    className="btn btn-pagination"
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                  >
                    ← Anterior
                  </button>
                  <span className="pagination-info">
                    Página {currentPage} de {Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE)}
                  </span>
                  <button 
                    className="btn btn-pagination"
                    onClick={() => setCurrentPage(Math.min(Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE), currentPage + 1))}
                    disabled={currentPage === Math.ceil(filteredBeneficiaries.length / ITEMS_PER_PAGE)}
                  >
                    Siguiente →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="no-data">
              <p>No hay beneficiarios registrados {selectedMunicipality && `en ${selectedMunicipality}`}</p>
            </div>
          )}
        </>
      )}

      {/* Pestaña: Agregar Beneficiario */}
      {activeTab === 'add' && (
        <div className="form-section">
          <h2>Agregar Nuevo Beneficiario</h2>
          <form onSubmit={handleAddBeneficiary} className="beneficiary-form">
            <div className="form-group">
              <label htmlFor="cedula">Cédula *</label>
              <input
                type="text"
                id="cedula"
                name="cedula"
                value={newBeneficiaryForm.cedula}
                onChange={handleBeneficiaryChange}
                placeholder="Ej: 1234567890"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="primer_nombre">Primer Nombre *</label>
              <input
                type="text"
                id="primer_nombre"
                name="primer_nombre"
                value={newBeneficiaryForm.primer_nombre}
                onChange={handleBeneficiaryChange}
                placeholder="Ej: Juan"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="primer_apellido">Primer Apellido *</label>
              <input
                type="text"
                id="primer_apellido"
                name="primer_apellido"
                value={newBeneficiaryForm.primer_apellido}
                onChange={handleBeneficiaryChange}
                placeholder="Ej: Pérez"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="telefono">Teléfono</label>
              <input
                type="text"
                id="telefono"
                name="telefono"
                value={newBeneficiaryForm.telefono}
                onChange={handleBeneficiaryChange}
                placeholder="Ej: 3101234567"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={newBeneficiaryForm.email}
                onChange={handleBeneficiaryChange}
                placeholder="Ej: juan@example.com"
              />
            </div>

            <div className="form-group">
              <label htmlFor="municipio">Municipio</label>
              <select
                id="municipio"
                name="municipio"
                value={newBeneficiaryForm.municipio}
                onChange={handleBeneficiaryChange}
              >
                <option value="">Seleccionar municipio</option>
                {COLOMBIAN_MUNICIPALITIES.map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="direccion">Dirección</label>
              <input
                type="text"
                id="direccion"
                name="direccion"
                value={newBeneficiaryForm.direccion}
                onChange={handleBeneficiaryChange}
                placeholder="Ej: Calle 1 #2-3"
              />
            </div>

            <div className="form-group">
              <label htmlFor="miembros_familia">Miembros de Familia</label>
              <input
                type="number"
                id="miembros_familia"
                name="miembros_familia"
                value={newBeneficiaryForm.miembros_familia}
                onChange={handleBeneficiaryChange}
                min="1"
                placeholder="1"
              />
            </div>

            <div className="form-buttons">
              <button 
                type="submit" 
                className="btn btn-success"
                disabled={loading}
              >
                ✓ Agregar Beneficiario
              </button>
              <button 
                type="button" 
                className="btn btn-secondary"
                onClick={() => {
                  setActiveTab('list');
                  setNewBeneficiaryForm({
                    cedula: '',
                    primer_nombre: '',
                    primer_apellido: '',
                    telefono: '',
                    email: '',
                    direccion: '',
                    municipio: '',
                    miembros_familia: 1
                  });
                }}
                disabled={loading}
              >
                ✗ Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal para ver entregas */}
      {showDeliveriesModal && selectedBeneficiary && (
        <div className="modal-overlay" onClick={closeDeliveriesModal}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Entregas de {selectedBeneficiary.primer_nombre} {selectedBeneficiary.primer_apellido}</h2>
              <button className="close-button" onClick={closeDeliveriesModal}>✕</button>
            </div>
            <div className="modal-body">
              {beneficiaryDeliveries.length > 0 ? (
                <div className="table-responsive">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Tipo de Ayuda</th>
                        <th>Cantidad</th>
                        <th>Operador</th>
                        <th>Almacén</th>
                        <th>Fecha</th>
                      </tr>
                    </thead>
                    <tbody>
                      {beneficiaryDeliveries.map(delivery => (
                        <tr key={delivery.id}>
                          <td>{delivery.aid_type_name}</td>
                          <td>{delivery.cantidad}</td>
                          <td>{delivery.operator_name || 'Sistema'}</td>
                          <td>{delivery.ubicacion_almacen || '-'}</td>
                          <td>{new Date(delivery.fecha_entrega).toLocaleDateString('es-CO')}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No hay entregas registradas para este beneficiario</p>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={closeDeliveriesModal}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default BeneficiaryManagement;
