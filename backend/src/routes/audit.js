const express = require('express');
const { verifyToken, verifyRole, setCurrentUser } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de auditoría requieren autenticación
router.use(verifyToken, setCurrentUser);

// Solo auditores y admins pueden ver auditoría
router.use(verifyRole(['administrador', 'auditor']));

// Obtener alertas de duplicidad
router.get('/duplicate-alerts', async (req, res) => {
  try {
    const { municipality, status } = req.query;
    let query = `
      SELECT da.*, c.primer_nombre, c.primer_apellido, c.cedula, at.nombre as aid_type_name, 
             da.razon_resolucion, da.notas, u.nombre as revisada_por_nombre
      FROM alertas_duplicidad da
      JOIN censados c ON da.censado_id = c.id
      JOIN tipos_ayuda at ON da.tipo_ayuda_id = at.id
      LEFT JOIN usuarios u ON da.revisada_por = u.id
      WHERE 1=1
    `;
    const values = [];
    
    if (municipality) {
      query += ` AND c.municipio = $${values.length + 1}`;
      values.push(municipality);
    }
    
    if (status) {
      query += ` AND da.estado_alerta = $${values.length + 1}`;
      values.push(status);
    }
    
    query += ' ORDER BY da.fecha_alerta DESC';
    const result = await global.db.query(query, values);
    res.json(result.rows);
  } catch (error) {
    console.error('Get duplicate alerts error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener bitácora de entregas
router.get('/delivery-log', async (req, res) => {
  try {
    const { municipality, dateFrom, dateTo } = req.query;
    let query = `
      SELECT ea.*, c.primer_nombre, c.primer_apellido, u.nombre as operator_name, at.nombre as aid_type_name
      FROM entregas_ayuda ea
      JOIN censados c ON ea.censado_id = c.id
      JOIN usuarios u ON ea.operador_id = u.id
      JOIN tipos_ayuda at ON ea.tipo_ayuda_id = at.id
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
    
    query += ' ORDER BY ea.fecha_entrega DESC';
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
      SELECT ba.*, u.nombre as user_name
      FROM bitacora_auditoria ba
      LEFT JOIN usuarios u ON ba.usuario_id = u.id
      WHERE 1=1
    `;
    const values = [];
    
    if (userId) {
      query += ` AND ba.usuario_id = $${values.length + 1}`;
      values.push(userId);
    }
    
    if (tableName) {
      query += ` AND ba.nombre_tabla = $${values.length + 1}`;
      values.push(tableName);
    }
    
    if (dateFrom) {
      query += ` AND ba.fecha >= $${values.length + 1}`;
      values.push(dateFrom);
    }
    
    if (dateTo) {
      query += ` AND ba.fecha <= $${values.length + 1}`;
      values.push(dateTo);
    }
    
    query += ' ORDER BY ba.fecha DESC LIMIT 1000';
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

// Eliminar alerta de duplicidad (solo administrador)
router.delete('/duplicate-alerts/:id', verifyRole(['administrador']), async (req, res) => {
  try {
    const alertId = req.params.id;
    
    // Verificar que la alerta existe
    const checkQuery = `SELECT id FROM alertas_duplicidad WHERE id = $1`;
    const checkResult = await global.db.query(checkQuery, [alertId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    
    // Eliminar la alerta
    const deleteQuery = `DELETE FROM alertas_duplicidad WHERE id = $1`;
    await global.db.query(deleteQuery, [alertId]);
    
    res.json({ 
      message: '✓ Alerta de duplicidad eliminada correctamente',
      deletedAlertId: alertId
    });
  } catch (error) {
    console.error('Delete alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Actualizar estado de alerta de duplicidad
router.patch('/duplicate-alerts/:id', verifyRole(['administrador', 'auditor']), async (req, res) => {
  try {
    const alertId = req.params.id;
    const { status, razon, notas } = req.body;
    const userId = req.userId;

    console.log('📝 [PATCH /duplicate-alerts/:id] Actualizando alerta:');
    console.log('   Alert ID:', alertId);
    console.log('   Status:', status);
    console.log('   User ID:', userId);

    // Validar que el estado sea válido
    const validStates = ['pendiente', 'revisada', 'resuelta'];
    if (!validStates.includes(status)) {
      return res.status(400).json({ error: `Estado inválido. Debe ser uno de: ${validStates.join(', ')}` });
    }

    // Obtener la alerta actual para la bitácora
    const getAlertQuery = `SELECT * FROM alertas_duplicidad WHERE id = $1`;
    const alertResult = await global.db.query(getAlertQuery, [alertId]);
    
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }

    const oldAlert = alertResult.rows[0];

    // Actualizar la alerta
    const updateQuery = `
      UPDATE alertas_duplicidad 
      SET estado_alerta = $1, 
          revisada_por = $2, 
          revisada_en = CURRENT_TIMESTAMP,
          razon_resolucion = $3,
          notas = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const updateResult = await global.db.query(updateQuery, [
      status,
      userId,
      razon || null,
      notas || null,
      alertId
    ]);

    const updatedAlert = updateResult.rows[0];

    console.log('   ✓ Alerta actualizada correctamente');

    // Registrar en bitácora de auditoría
    const auditQuery = `
      INSERT INTO bitacora_auditoria (accion, nombre_tabla, id_registro, usuario_id, valores_antiguos, valores_nuevos)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;
    
    await global.db.query(auditQuery, [
      'UPDATE',
      'alertas_duplicidad',
      alertId,
      userId,
      JSON.stringify(oldAlert),
      JSON.stringify(updatedAlert)
    ]);

    res.json({
      message: '✓ Alerta actualizada correctamente',
      alert: updatedAlert
    });
  } catch (error) {
    console.error('❌ Update alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
