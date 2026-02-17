import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './Reports.css';

function Reports() {
  const [reportType, setReportType] = useState('deliveries');
  const [municipality, setMunicipality] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const generateReport = async () => {
    try {
      setLoading(true);
      setError('');

      const url = `http://localhost:5000/api/reports/${reportType}`;
      const params = {};

      if (municipality) params.municipality = municipality;
      if (dateFrom) params.dateFrom = dateFrom;
      if (dateTo) params.dateTo = dateTo;

      const response = await axios.get(url, { headers, params });
      setReportData(response.data);
    } catch (err) {
      setError('Error generando reporte');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = async () => {
    try {
      // Crear CSV
      const headers_csv = Object.keys(reportData[0] || {});
      const csv = [
        headers_csv.join(','),
        ...reportData.map(row => 
          headers_csv.map(header => JSON.stringify(row[header] || '')).join(',')
        )
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte_${reportType}_${new Date().toISOString()}.csv`;
      a.click();
    } catch (err) {
      console.error('Error descargando reporte:', err);
    }
  };

  return (
    <div className="container reports">
      <h1>Reportes</h1>

      {error && <div className="alert alert-danger">{error}</div>}

      <div className="card">
        <h2>Configurar Reporte</h2>
        
        <div className="report-filters">
          <div className="form-group">
            <label htmlFor="reportType">Tipo de Reporte</label>
            <select
              id="reportType"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="deliveries">Entregas por Municipio</option>
              <option value="inventory">Inventario</option>
              <option value="beneficiaries">Beneficiarios</option>
              <option value="duplicate-alerts">Alertas de Duplicidad</option>
              <option value="control-entities">Reporte para Entes de Control</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="municipality">Municipio</label>
            <input
              type="text"
              id="municipality"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              placeholder="Dejar en blanco para todos"
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateFrom">Fecha Desde</label>
            <input
              type="date"
              id="dateFrom"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="dateTo">Fecha Hasta</label>
            <input
              type="date"
              id="dateTo"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <button className="btn btn-primary" onClick={generateReport} disabled={loading}>
          {loading ? 'Generando...' : 'Generar Reporte'}
        </button>
      </div>

      {reportData.length > 0 && (
        <div className="card">
          <div className="report-header">
            <h2>Resultados del Reporte</h2>
            <button className="btn btn-success" onClick={downloadReport}>
              Descargar CSV
            </button>
          </div>

          <table className="table">
            <thead>
              <tr>
                {Object.keys(reportData[0]).map(key => (
                  <th key={key}>{key}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reportData.map((row, idx) => (
                <tr key={idx}>
                  {Object.values(row).map((val, i) => (
                    <td key={i}>{typeof val === 'object' ? JSON.stringify(val) : val}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Reports;
