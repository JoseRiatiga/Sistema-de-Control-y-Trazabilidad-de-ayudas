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
      SELECT da.*, c.primer_nombre, c.primer_apellido, c.cedula, at.nombre as aid_type_name
      FROM alertas_duplicidad da
      JOIN censados c ON da.censado_id = c.id
      JOIN tipos_ayuda at ON da.tipo_ayuda_id = at.id
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

// Actualizar estado de alerta
router.patch('/duplicate-alerts/:id', verifyRole(['administrador', 'auditor']), async (req, res) => {
  try {
    const { status, razon, notas } = req.body;
    const alertId = req.params.id;
    
    // Obtener la alerta actual para acceso a tipo_ayuda_id y censado_id
    const alertQuery = `SELECT * FROM alertas_duplicidad WHERE id = $1`;
    const alertResult = await global.db.query(alertQuery, [alertId]);
    
    if (alertResult.rows.length === 0) {
      return res.status(404).json({ error: 'Alerta no encontrada' });
    }
    
    const alert = alertResult.rows[0];
    let finalStatus = status;
    let inventarioDeducido = false;
    let mensaje = 'Alerta actualizada';
    
    // Si es una resolución con razón "Caso válido", verificar stock
    if (status === 'resuelta' && razon && razon.includes('Caso válido')) {
      // Obtener el municipio del censado
      const censadoQuery = `SELECT municipio FROM censados WHERE id = $1`;
      const censadoResult = await global.db.query(censadoQuery, [alert.censado_id]);
      const municipio = censadoResult.rows[0].municipio;
      
      // Verificar stock disponible
      const inventoryQuery = `
        SELECT id, cantidad FROM inventario 
        WHERE tipo_ayuda_id = $1 AND municipio = $2 
        ORDER BY recibido_en ASC
        LIMIT 1
      `;
      const inventoryResult = await global.db.query(inventoryQuery, [alert.tipo_ayuda_id, municipio]);
      
      if (inventoryResult.rows.length === 0 || inventoryResult.rows[0].cantidad <= 0) {
        // No hay stock disponible - mantener en "revisada"
        finalStatus = 'revisada';
        mensaje = 'Alerta revisada. Sin stock disponible para descontar del inventario. Estado: REVISADA (aún requiere acción)';
      } else {
        // Hay stock - descontar del inventario
        const inventoryId = inventoryResult.rows[0].id;
        
        // Actualizar inventario (descontar 1 unidad)
        const updateInventoryQuery = `
          UPDATE inventario 
          SET cantidad = cantidad - 1, actualizado_en = CURRENT_TIMESTAMP
          WHERE id = $1
          RETURNING cantidad
        `;
        await global.db.query(updateInventoryQuery, [inventoryId]);
        
        // Crear registro de entrega asociado
        const deliveryQuery = `
          INSERT INTO entregas_ayuda (censado_id, tipo_ayuda_id, cantidad, operador_id, municipio, notas, inventario_deducido)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `;
        await global.db.query(deliveryQuery, [
          alert.censado_id,
          alert.tipo_ayuda_id,
          1,
          req.userId,
          municipio,
          `Entrega automática por resolución de alerta de duplicidad - Razón: ${razon}`,
          true
        ]);
        
        inventarioDeducido = true;
        mensaje = 'Alerta resuelta. Stock deducido del inventario. Estado: RESUELTA';
      }
    }
    
    // Actualizar la alerta
    const updateQuery = `
      UPDATE alertas_duplicidad
      SET estado_alerta = $1, revisada_por = $2, revisada_en = CURRENT_TIMESTAMP, razon_resolucion = $3, notas = $4
      WHERE id = $5
      RETURNING *
    `;
    
    const result = await global.db.query(updateQuery, [finalStatus, req.userId, razon, notas, alertId]);
    res.json({ 
      message: mensaje, 
      alert: result.rows[0],
      inventarioDeducido: inventarioDeducido 
    });
  } catch (error) {
    console.error('Update alert error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
