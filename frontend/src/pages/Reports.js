import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { COLOMBIAN_MUNICIPALITIES } from '../utils/municipalities';
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

  // Traducir nombres de columnas del inglés al español
  const translateColumnName = (columnName) => {
    const translations = {
      'municipio': 'Municipio',
      'aid_type': 'Tipo de Ayuda',
      'nombre': 'Tipo de Ayuda',
      'total_deliveries': 'Total de Entregas',
      'total_quantity': 'Cantidad Total',
      'cantidad_total': 'Cantidad Total',
      'cantidad': 'Cantidad',
      'costo_unitario': 'Costo Unitario',
      'total_value': 'Valor Total',
      'beneficiaries': 'Beneficiarios',
      'assisted_beneficiaries': 'Beneficiarios Asistidos',
      'total_beneficiaries': 'Total Beneficiarios',
      'total_family_members': 'Total Miembros Familia',
      'total_alerts': 'Total Alertas',
      'pending': 'Pendientes',
      'reviewed': 'Revisadas',
      'resolved': 'Resueltas',
      'operator_name': 'Nombre Operador',
      'total_items': 'Total Items',
      'alerts_generated': 'Alertas Generadas',
      'delivery_date': 'Fecha Entrega',
      'fecha_entrega': 'Fecha de Entrega',
      'operador_id': 'ID Operador',
      'censado_id': 'ID Beneficiario',
      'tipo_ayuda_id': 'ID Tipo de Ayuda',
      'id': 'ID',
      'email': 'Email',
      'creado_en': 'Creado En',
      'actualizado_en': 'Actualizado En',
      'estado': 'Estado',
      'estado_alerta': 'Estado Alerta',
      'notas': 'Notas'
    };
    return translations[columnName] || columnName.replace(/_/g, ' ').toUpperCase();
  };

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

  const downloadExcel = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      
      if (municipality) params.append('municipality', municipality);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const url = `http://localhost:5000/api/reports/excel/download/${reportType}?${params.toString()}`;
      
      const response = await axios.get(url, { 
        headers,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const link = document.createElement('a');
      const href = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `Reporte_${reportType}_${date}.xlsx`;

      link.setAttribute('href', href);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

      setLoading(false);
    } catch (err) {
      setError('No se pudo descargar el Excel. Verifica que existan datos.');
      console.error(err);
      setLoading(false);
    }
  };

  const downloadCsv = async () => {
    try {
      setLoading(true);
      setError('');

      const params = new URLSearchParams();
      
      if (municipality) params.append('municipality', municipality);
      if (dateFrom) params.append('dateFrom', dateFrom);
      if (dateTo) params.append('dateTo', dateTo);

      const url = `http://localhost:5000/api/reports/csv/download/${reportType}?${params.toString()}`;
      
      const response = await axios.get(url, { 
        headers,
        responseType: 'blob'
      });

      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const href = URL.createObjectURL(blob);
      
      const date = new Date().toISOString().split('T')[0];
      const filename = `Reporte_${reportType}_${date}.csv`;

      link.setAttribute('href', href);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(href);

      setLoading(false);
    } catch (err) {
      setError('No se pudo descargar el CSV. Verifica que existan datos.');
      console.error(err);
      setLoading(false);
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
              <option value="deliveries">Entregas Detalladas</option>
              <option value="deliveries_by_municipality">Entregas por Municipio</option>
              <option value="inventory">Inventario</option>
              <option value="beneficiaries">Beneficiarios</option>
              <option value="duplicate_alerts">Alertas de Duplicidad</option>
              <option value="audit_log">Bitácora de Auditoría</option>
              <option value="control-entities">Entes de Control</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="municipality">Municipio</label>
            <select
              id="municipality"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
            >
              <option value="">-- Seleccionar municipio --</option>
              {COLOMBIAN_MUNICIPALITIES.map((mun) => (
                <option key={mun} value={mun}>{mun}</option>
              ))}
            </select>
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
            <div style={{ display: 'flex', gap: '10px' }}>
              <button className="btn btn-success" onClick={downloadExcel} disabled={loading}>
                {loading ? 'Descargando...' : 'Descargar Excel'}
              </button>
              <button className="btn btn-info" onClick={downloadCsv} disabled={loading}>
                {loading ? 'Descargando...' : 'Descargar CSV'}
              </button>
            </div>
          </div>

          <table className="table">
            <thead>
              <tr>
                {Object.keys(reportData[0]).map(key => (
                  <th key={key}>{translateColumnName(key)}</th>
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

      {!loading && reportData.length === 0 && (
        <div className="card">
          <p style={{ textAlign: 'center', color: '#666', padding: '20px' }}>
            No hay reporte para mostrar
          </p>
        </div>
      )}
    </div>
  );
}

export default Reports;
