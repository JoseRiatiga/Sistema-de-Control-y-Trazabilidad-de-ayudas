const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token inválido' });
  }
};

// Middleware para verificar rol
const verifyRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ error: 'No tiene permisos para acceder a este recurso' });
    }
    next();
  };
};

// Middleware para logging de auditoría
const auditLog = async (action, tableName, recordId, oldValues = null, newValues = null) => {
  const query = `
    INSERT INTO audit_logs (id, action, table_name, record_id, user_id, old_values, new_values, timestamp)
    VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
  `;
  
  const values = [
    uuidv4(),
    action,
    tableName,
    recordId,
    global.currentUserId || null,
    oldValues ? JSON.stringify(oldValues) : null,
    newValues ? JSON.stringify(newValues) : null
  ];
  
  try {
    await global.db.query(query, values);
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

// Middleware para validar duplicidad de entregas
const checkDuplicateDelivery = async (req, res, next) => {
  const { censado_id, aid_type_id } = req.body;
  
  if (!censado_id || !aid_type_id) {
    return next();
  }
  
  try {
    const query = `
      SELECT * FROM aid_deliveries
      WHERE censado_id = $1 AND aid_type_id = $2
      AND delivery_date >= NOW() - INTERVAL '30 days'
    `;
    
    const result = await global.db.query(query, [censado_id, aid_type_id]);
    
    if (result.rows.length > 0) {
      // Crear alerta de duplicidad
      const alertQuery = `
        INSERT INTO duplicate_alerts (id, censado_id, aid_type_id, last_delivery_date, days_since_last_delivery)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const daysSince = Math.floor((Date.now() - new Date(result.rows[0].delivery_date).getTime()) / (1000 * 60 * 60 * 24));
      
      await global.db.query(alertQuery, [
        uuidv4(),
        censado_id,
        aid_type_id,
        result.rows[0].delivery_date,
        daysSince
      ]);
      
      res.locals.duplicateAlert = {
        message: 'Alerta: Este beneficiario ya recibió esta ayuda recientemente',
        lastDelivery: result.rows[0].delivery_date,
        daysSince: daysSince
      };
    }
    
    next();
  } catch (error) {
    console.error('Error checking duplicate delivery:', error);
    next();
  }
};

// Middleware para almacenar ID de usuario actual
const setCurrentUser = (req, res, next) => {
  global.currentUserId = req.userId;
  next();
};

module.exports = {
  verifyToken,
  verifyRole,
  auditLog,
  checkDuplicateDelivery,
  setCurrentUser
};
