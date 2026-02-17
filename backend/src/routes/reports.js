const express = require('express');
const { verifyToken, verifyRole, setCurrentUser } = require('../middleware/auth');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

// Todas las rutas de reportes requieren autenticación
router.use(verifyToken, setCurrentUser);

// Solo admins y auditores pueden generar reportes
router.use(verifyRole(['admin', 'auditor']));

// Reporte de entregas por municipio
router.get('/deliveries', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    
    let query = `
      SELECT
        ad.municipality,
        at.name as aid_type,
        COUNT(*) as total_deliveries,
        SUM(ad.quantity) as total_quantity,
        COUNT(DISTINCT ad.censado_id) as beneficiaries
      FROM aid_deliveries ad
      JOIN aid_types at ON ad.aid_type_id = at.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND ad.municipality = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (dateFrom) {
      query += ` AND ad.delivery_date >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ad.delivery_date <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' GROUP BY ad.municipality, at.name ORDER BY ad.municipality, at.name';
    
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
        i.municipality,
        at.name as aid_type,
        i.quantity,
        i.cost_per_unit,
        (i.quantity * i.cost_per_unit) as total_value
      FROM inventory i
      JOIN aid_types at ON i.aid_type_id = at.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND i.municipality = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' ORDER BY i.municipality, at.name';
    
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
        c.municipality,
        COUNT(*) as total_beneficiaries,
        SUM(c.family_members) as total_family_members,
        COUNT(DISTINCT d.censado_id) as assisted_beneficiaries
      FROM censados c
      LEFT JOIN aid_deliveries d ON c.id = d.censado_id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipality = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' GROUP BY c.municipality';
    
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
        c.municipality,
        COUNT(*) as total_alerts,
        COUNT(CASE WHEN da.alert_status = 'pending' THEN 1 END) as pending,
        COUNT(CASE WHEN da.alert_status = 'reviewed' THEN 1 END) as reviewed,
        COUNT(CASE WHEN da.alert_status = 'resolved' THEN 1 END) as resolved
      FROM duplicate_alerts da
      JOIN censados c ON da.censado_id = c.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipality = $${values.length + 1}`;
      values.push(municipality);
    }
    
    query += ' GROUP BY c.municipality';
    
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
        ad.municipality,
        COUNT(DISTINCT ad.censado_id) as total_beneficiaries,
        COUNT(*) as total_deliveries,
        SUM(ad.quantity) as total_items,
        u.name as operator_name,
        COUNT(CASE WHEN da.alert_status IS NOT NULL THEN 1 END) as alerts_generated,
        ad.delivery_date::DATE as delivery_date
      FROM aid_deliveries ad
      JOIN users u ON ad.operator_id = u.id
      LEFT JOIN duplicate_alerts da ON ad.censado_id = da.censado_id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND ad.municipality = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (dateFrom) {
      query += ` AND ad.delivery_date >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ad.delivery_date <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' GROUP BY ad.municipality, u.name, ad.delivery_date::DATE ORDER BY ad.delivery_date DESC';
    
    const result = await global.db.query(query, values);
    
    // Generar y guardar reporte
    const reportId = uuidv4();
    const reportQuery = `
      INSERT INTO reports (id, title, report_type, municipality, date_from, date_to, generated_by, data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;
    
    await global.db.query(reportQuery, [
      reportId,
      `Reporte para Entes de Control - ${municipality || 'Nacional'}`,
      'audit',
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
