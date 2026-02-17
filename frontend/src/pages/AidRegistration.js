import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './AidRegistration.css';

function AidRegistration() {
  const [formData, setFormData] = useState({
    censado_id: '',
    aid_type_id: '',
    quantity: '',
    municipality: '',
    notes: ''
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
        aid_type_id: '',
        quantity: '',
        municipality: '',
        notes: ''
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
                  {c.first_name} {c.last_name} ({c.identification})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="aid_type_id">Tipo de Ayuda</label>
            <select
              id="aid_type_id"
              name="aid_type_id"
              value={formData.aid_type_id}
              onChange={handleChange}
              required
            >
              <option value="">Seleccionar tipo de ayuda</option>
              {aidTypes.map(a => (
                <option key={a.id} value={a.id}>
                  {a.name} ({a.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="quantity">Cantidad</label>
            <input
              type="number"
              id="quantity"
              name="quantity"
              value={formData.quantity}
              onChange={handleChange}
              required
              min="1"
            />
          </div>

          <div className="form-group">
            <label htmlFor="municipality">Municipio</label>
            <input
              type="text"
              id="municipality"
              name="municipality"
              value={formData.municipality}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">Observaciones</label>
            <textarea
              id="notes"
              name="notes"
              value={formData.notes}
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
