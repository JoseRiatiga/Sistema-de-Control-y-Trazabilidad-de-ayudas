import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import './BeneficiaryManagement.css';

function BeneficiaryManagement() {
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [filteredBeneficiaries, setFilteredBeneficiaries] = useState([]);
  const [selectedMunicipality, setSelectedMunicipality] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});

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

  const handleFilterChange = (e) => {
    const municipality = e.target.value;
    setSelectedMunicipality(municipality);

    if (municipality === '') {
      setFilteredBeneficiaries(beneficiaries);
    } else {
      const filtered = beneficiaries.filter(b => b.municipio === municipality);
      setFilteredBeneficiaries(filtered);
    }
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

  return (
    <div className="container beneficiary-management">
      <h1>📋 Gestión de Beneficiarios</h1>

      {message && <div className="alert alert-success">{message}</div>}
      {error && <div className="alert alert-danger">{error}</div>}

      {/* Filtro por municipio */}
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
              {filteredBeneficiaries.map(beneficiary => (
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
                      <td>
                        <button
                          className="btn btn-sm btn-primary"
                          onClick={() => startEdit(beneficiary)}
                          disabled={loading}
                        >
                          ✏️ Editar
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(beneficiary.id, `${beneficiary.primer_nombre} ${beneficiary.primer_apellido}`)}
                          disabled={loading}
                        >
                          🗑️ Eliminar
                        </button>
                      </td>
                    </>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="no-data">
          <p>No hay beneficiarios registrados {selectedMunicipality && `en ${selectedMunicipality}`}</p>
        </div>
      )}
    </div>
  );
}

export default BeneficiaryManagement;
