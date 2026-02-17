const express = require('express');
const { verifyToken, verifyRole, setCurrentUser } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de auditoría requieren autenticación
router.use(verifyToken, setCurrentUser);

// Solo auditores y admins pueden ver auditoría
router.use(verifyRole(['admin', 'auditor']));

// Obtener alertas de duplicidad
router.get('/duplicate-alerts', async (req, res) => {
  try {
    const { municipality, status } = req.query;
    let query = `
      SELECT da.*, c.first_name, c.last_name, c.identification, at.name as aid_type_name
      FROM duplicate_alerts da
      JOIN censados c ON da.censado_id = c.id
      JOIN aid_types at ON da.aid_type_id = at.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipality = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (status) {
      query += ` AND da.alert_status = $${values.length + 1}`;
      values.push(status);
    }
    
    query += ' ORDER BY da.alert_date DESC';
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get duplicate alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener bit bitácora de entregas
router.get('/delivery-log', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    let query = `
      SELECT ad.*, c.first_name, c.last_name, u.name as operator_name, at.name as aid_type_name
      FROM aid_deliveries ad
      JOIN censados c ON ad.censado_id = c.id
      JOIN users u ON ad.operator_id = u.id
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
    
    query += ' ORDER BY ad.delivery_date DESC';
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get delivery log error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener bitácora de cambios
router.get('/change-log', async (req, res) => {
  try {
    const { userId, tableName, dateFrom, dateTo } = req.query;
    let query = `
      SELECT al.*, u.name as user_name
      FROM audit_logs al
      LEFT JOIN users u ON al.user_id = u.id
      WHERE 1=1
    `;
    const values = [];
    
    if (userId) {
      query += ` AND al.user_id = $${values.length + 1}`;
      values.push(userId);
    }
    
    if (tableName) {
      query += ` AND al.table_name = $${values.length + 1}`;
      values.push(tableName);
    }
    
    if (dateFrom) {
      query += ` AND al.timestamp >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND al.timestamp <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' ORDER BY al.timestamp DESC LIMIT 1000';
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get change log error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener resumen de auditoría
router.get('/summary', async (req, res) => {
  try {
    const { municipality } = req.query;
    
    // Alertas de duplicidad por municipio
    let municipalityFilter = '';
    const values = [];
    
    if (municipality) {
      municipalityFilter = `WHERE c.municipality = $${values.length + 1}`;
      values.push(municipality);
    }
    
    const summaryQuery = `
      SELECT
        COUNT(DISTINCT CASE WHEN da.alert_status = 'pending' THEN da.id END) as pending_alerts,
        COUNT(DISTINCT CASE WHEN da.alert_status = 'reviewed' THEN da.id END) as reviewed_alerts,
        COUNT(DISTINCT CASE WHEN da.alert_status = 'resolved' THEN da.id END) as resolved_alerts,
        (SELECT COUNT(*) FROM aid_deliveries ${municipalityFilter.replace('WHERE', 'WHERE')}) as total_deliveries,
        (SELECT COUNT(DISTINCT censado_id) FROM aid_deliveries ${municipalityFilter.replace('WHERE', 'WHERE')}) as beneficiaries_assisted
      FROM duplicate_alerts da
      JOIN censados c ON da.censado_id = c.id
      ${municipalityFilter}
    `;
    
    const result = await global.db.query(summaryQuery, values);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de alerta
router.patch('/duplicate-alerts/:id', verifyRole(['admin', 'auditor']), async (req, res) => {
  try {
    const { status, notes } = req.body;
    const query = `
      UPDATE duplicate_alerts
      SET alert_status = $1, reviewed_by = $2, reviewed_at = CURRENT_TIMESTAMP, notes = $3
      WHERE id = $4
      RETURNING *
    `;
    
    const result = await global.db.query(query, [status, req.userId, notes, req.params.id]);
    res.json({ message: 'Alerta actualizada', alert: result.rows[0] });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
