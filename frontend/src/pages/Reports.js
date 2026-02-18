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

  const downloadReport = async () => {
    try {
      // Mapeo de tipos de reporte a nombres en español
      const reportTypeNames = {
        deliveries: 'Entregas',
        inventory: 'Inventario',
        beneficiaries: 'Beneficiarios',
        'duplicate-alerts': 'Alertas de Duplicidad',
        'control-entities': 'Entes de Control'
      };

      // Mapeo de nombres de columnas a títulos profesionales
      const columnMapping = {
        municipio: 'Municipio',
        aid_type: 'Tipo de Ayuda',
        aid_type_name: 'Tipo de Ayuda',
        nombre: 'Tipo de Ayuda',
        cantidad: 'Cantidad',
        costo_unitario: 'Costo Unitario',
        total_valor: 'Valor Total',
        total_value: 'Valor Total',
        primer_nombre: 'Primer Nombre',
        primer_apellido: 'Primer Apellido',
        cedula: 'Cédula',
        identification: 'Cédula',
        fecha_entrega: 'Fecha de Entrega',
        delivery_date: 'Fecha de Entrega',
        operator_name: 'Operador',
        operador_id: 'Operador',
        dia: 'Día',
        mes: 'Mes',
        año: 'Año',
        total_entregas: 'Total de Entregas',
        total_deliveries: 'Total de Entregas',
        total_beneficiarios: 'Total de Beneficiarios',
        total_beneficiaries: 'Total de Beneficiarios',
        dias_desde_ultima_entrega: 'Días Desde Última Entrega',
        total_quantity: 'Cantidad Total',
        cantidad_total: 'Cantidad Total',
        beneficiaries: 'Beneficiarios',
        assisted_beneficiaries: 'Beneficiarios Asistidos',
        total_family_members: 'Total Miembros Familia',
        total_alerts: 'Total Alertas',
        pending: 'Pendientes',
        reviewed: 'Revisadas',
        resolved: 'Resueltas',
        total_items: 'Total Items',
        alerts_generated: 'Alertas Generadas',
        id: 'ID',
        email: 'Email',
        creado_en: 'Creado En',
        actualizado_en: 'Actualizado En',
        estado: 'Estado',
        estado_alerta: 'Estado Alerta',
        notas: 'Notas',
        censado_id: 'ID Beneficiario',
        tipo_ayuda_id: 'ID Tipo de Ayuda'
      };

      // Obtener headers originales y mapearlos
      const originalHeaders = Object.keys(reportData[0] || {});
      const displayHeaders = originalHeaders.map(h => columnMapping[h] || translateColumnName(h));

      // Crear CSV con BOM para UTF-8 (para que Excel reconozca acentos)
      const header = '\uFEFF' + displayHeaders.map(h => `"${h}"`).join(',');
      
      const rows = reportData.map(row =>
        originalHeaders.map(header => {
          let value = row[header] || '';
          
          // Formatear fechas
          if ((header.includes('fecha') || header.includes('date')) && value) {
            value = new Date(value).toLocaleDateString('es-ES');
          }
          
          // Formatear números con decimales
          if ((header.includes('costo') || header.includes('valor') || header.includes('total')) && !isNaN(value) && value !== '') {
            value = parseFloat(value).toFixed(2);
          }
          
          return `"${value}"`;
        }).join(',')
      );

      const csv = [header, ...rows].join('\n');

      // Crear blob con encoding UTF-8
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      
      const reportName = reportTypeNames[reportType] || reportType;
      const date = new Date().toISOString().split('T')[0];
      
      link.setAttribute('href', url);
      link.setAttribute('download', `Reporte_${reportName}_${date}.csv`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
            <button className="btn btn-success" onClick={downloadReport}>
              Descargar CSV
            </button>
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
