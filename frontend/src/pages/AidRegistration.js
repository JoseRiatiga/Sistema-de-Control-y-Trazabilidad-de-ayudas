import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
import './AidRegistration.css';

function AidRegistration() {
  const [formData, setFormData] = useState({
    censado_id: '',
    tipo_ayuda_id: '',
    cantidad: '',
    municipio: '',
    notas: ''
  });

  const [censados, setCensados] = useState([]);
  const [aidTypes, setAidTypes] = useState([]);
  const [duplicateAlert, setDuplicateAlert] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [censadosRes, aidTypesRes] = await Promise.all([
        axios.get('http://localhost:5000/api/censo', { headers }),
        axios.get('http://localhost:5000/api/aids/types', { headers })
      ]);

      setCensados(censadosRes.data);
      setAidTypes(aidTypesRes.data);
    } catch (err) {
      setError('Error cargando datos');
      console.error(err);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    setDuplicateAlert(null);

    try {
      const response = await axios.post(
        'http://localhost:5000/api/aids/delivery',
        formData,
        { headers }
      );

      setMessage('Ayuda registrada exitosamente');
      setDuplicateAlert(response.data.duplicateAlert);
      
      // Limpiar formulario
      setFormData({
        censado_id: '',
        tipo_ayuda_id: '',
        cantidad: '',
        municipio: '',
        notas: ''
      });

      setTimeout(() => setMessage(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar ayuda');
    } finally {
      setLoading(false);
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

      <div className="card">
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="censado_id">Beneficiario</label>
            <select
              id="censado_id"
              name="censado_id"
              value={formData.censado_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar beneficiario</option>
              {censados.map(c => (
                <option key={c.id} value={c.id}>
                  {c.primer_nombre} {c.primer_apellido} ({c.cedula})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="aid_type_id">Tipo de Ayuda</label>
            <select
              id="tipo_ayuda_id"
              name="tipo_ayuda_id"
              value={formData.tipo_ayuda_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar tipo de ayuda</option>
              {aidTypes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.nombre} ({a.unidad})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="cantidad">Cantidad</label>
            <input
              type="number"
              id="cantidad"
              name="cantidad"
              value={formData.cantidad}
              onChange={handleChange}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="municipio">Municipio</label>
            <select
              id="municipio"
              name="municipio"
              value={formData.municipio}
              onChange={handleChange}
              required
            >
              <option value="">-- Seleccionar municipio --</option>
              {COLOMBIAN_MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="notas">Observaciones</label>
            <textarea
              id="notas"
              name="notas"
              value={formData.notas}
              onChange={handleChange}
              placeholder="Observaciones adicionales..."
            ></textarea>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading}>
            {loading ? 'Registrando...' : 'Registrar Ayuda'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AidRegistration;
