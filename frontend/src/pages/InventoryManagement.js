import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './InventoryManagement.css';

function InventoryManagement() {
  const [inventory, setInventory] = useState([]);
  const [municipality, setMunicipality] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchInventory();
  }, [municipality]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
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
  };

  const calculateTotalValue = () => {
    return inventory.reduce((total, item) => {
      const value = (item.quantity || 0) * (item.cost_per_unit || 0);
      return total + value;
    }, 0);
  };

  const getUniqueМunicipalities = () => {
    const municipalities = new Set(inventory.map(item => item.municipality));
    return Array.from(municipalities);
  };

  return (
    <div className="container inventory-management">
      <h1>Gestión de Inventario</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <div className="filter-section">
          <label htmlFor="municipality">Filtrar por Municipio:</label>
          <select
            id="municipality"
            value={municipality}
            onChange={(e) => setMunicipality(e.target.value)}
          >
            <option value="">Todos los Municipios</option>
            {getUniqueМunicipalities().map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
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
                        <td>{item.municipality}</td>
                        <td>{item.aid_type_name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unit}</td>
                        <td>${item.cost_per_unit?.toFixed(2) || '0.00'}</td>
                        <td>${(item.quantity * item.cost_per_unit).toFixed(2)}</td>
                        <td>{item.warehouse_location}</td>
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
