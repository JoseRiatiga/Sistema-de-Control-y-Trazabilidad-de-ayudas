const express = require('express');
const { verifyToken, verifyRole, setCurrentUser } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Todas las rutas de reportes requieren autenticación
router.use(verifyToken, setCurrentUser);

// Solo admins y auditores pueden generar reportes
router.use(verifyRole(['administrador', 'auditor']));

// Reporte de entregas por municipio
router.get('/deliveries', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    
    let query = `
      SELECT
        ea.municipio,
        ta.nombre as aid_type,
        COUNT(*) as total_deliveries,
        SUM(ea.cantidad) as total_quantity,
        COUNT(DISTINCT ea.censado_id) as beneficiaries
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND ea.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (dateFrom) {
      query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' GROUP BY ea.municipio, ta.nombre ORDER BY ea.municipio, ta.nombre';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Deliveries report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de inventario
router.get('/inventory', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    let query = `
      SELECT
        i.municipio,
        ta.nombre as aid_type,
        i.cantidad,
        i.costo_unitario,
        (i.cantidad * i.costo_unitario) as total_value
      FROM inventario i
      JOIN tipos_ayuda ta ON i.tipo_ayuda_id = ta.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND i.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' ORDER BY i.municipio, ta.nombre';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Inventory report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de beneficiarios por municipio
router.get('/beneficiaries', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    let query = `
      SELECT
        c.municipio,
        COUNT(*) as total_beneficiaries,
        SUM(c.miembros_familia) as total_family_members,
        COUNT(DISTINCT d.censado_id) as assisted_beneficiaries
      FROM censados c
      LEFT JOIN entregas_ayuda d ON c.id = d.censado_id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' GROUP BY c.municipio';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Beneficiaries report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte de alertas de duplicidad
router.get('/duplicate-alerts', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    let query = `
      SELECT
        c.municipio,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN da.estado = 'pendiente' THEN 1 END) as pending,
        COUNT(CASE WHEN da.estado = 'revisado' THEN 1 END) as reviewed,
        COUNT(CASE WHEN da.estado = 'resuelto' THEN 1 END) as resolved
      FROM alertas_duplicidad da
      JOIN censados c ON da.censado_id = c.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' GROUP BY c.municipio';
    
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Duplicate alerts report error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Reporte para entes de control
router.get('/control-entities', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    
    let query = `
      SELECT
        ea.municipio,
        COUNT(DISTINCT ea.censado_id) as total_beneficiaries,
        COUNT(*) as total_deliveries,
        SUM(ea.cantidad) as total_items,
        u.nombre as operator_name,
        COUNT(CASE WHEN da.id IS NOT NULL THEN 1 END) as alerts_generated,
        ea.fecha_entrega::DATE as delivery_date
      FROM entregas_ayuda ea
      JOIN usuarios u ON ea.operador_id = u.id
      LEFT JOIN alertas_duplicidad da ON ea.censado_id = da.censado_id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND ea.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (dateFrom) {
      query += ` AND ea.fecha_entrega >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ea.fecha_entrega <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' GROUP BY ea.municipio, u.nombre, ea.fecha_entrega::DATE ORDER BY ea.fecha_entrega DESC';
    
    const result = await global.db.query(query, values);
    
    // Generar y guardar reporte
    const reportId = uuidv4();
    const reportQuery = `
      INSERT INTO reportes (id, titulo, tipo_reporte, municipio, fecha_desde, fecha_hasta, generado_por, datos)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    await global.db.query(reportQuery, [
      reportId,
      `Reporte para Entes de Control - ${municipality || 'Nacional'}`,
      'auditoria',
      municipality,
      dateFrom,
      dateTo,
      req.userId,
      JSON.stringify(result.rows)
    ]);
    
    res.json({
      reportId,
      data: result.rows,
      generatedAt: new Date()
    });
  } catch (error) {
    console.error('Control entities report error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
