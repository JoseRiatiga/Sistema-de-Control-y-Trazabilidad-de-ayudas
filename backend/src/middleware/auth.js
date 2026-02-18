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
    // Accept both 'role' (English) and 'rol' (Spanish) from JWT
    req.userRole = decoded.role || decoded.rol;
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
    INSERT INTO bitacora_auditoria (id, accion, nombre_tabla, id_registro, usuario_id, valores_antiguos, valores_nuevos, fecha)
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
  const { censado_id, tipo_ayuda_id } = req.body;
  
  if (!censado_id || !tipo_ayuda_id) {
    return next();
  }
  
  try {
    const query = `
      SELECT * FROM entregas_ayuda
      WHERE censado_id = $1 AND tipo_ayuda_id = $2
      AND fecha_entrega >= NOW() - INTERVAL '30 days'
    `;
    
    const result = await global.db.query(query, [censado_id, tipo_ayuda_id]);
    
    if (result.rows.length > 0) {
      // Crear alerta de duplicidad
      const alertQuery = `
        INSERT INTO alertas_duplicidad (id, censado_id, tipo_ayuda_id, ultima_entrega, dias_desde, estado_alerta)
        VALUES ($1, $2, $3, $4, $5, $6)
      `;
      
      const daysSince = Math.floor((Date.now() - new Date(result.rows[0].fecha_entrega).getTime()) / (1000 * 60 * 60 * 24));
      
      await global.db.query(alertQuery, [
        uuidv4(),
        censado_id,
        tipo_ayuda_id,
        result.rows[0].fecha_entrega,
        daysSince,
        'pending'
      ]);
      
      res.locals.duplicateAlert = {
        message: 'Alerta: Este beneficiario ya recibió esta ayuda recientemente',
        lastDelivery: result.rows[0].fecha_entrega,
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
