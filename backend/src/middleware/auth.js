const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// Middleware para verificar JWT
const verifyToken = (req, res, next) => {
  console.log('\n🔐 Verificando token...');
  console.log('   Headers recibidos:', Object.keys(req.headers));
  console.log('   Authorization header:', req.headers.authorization);
  
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    console.log('   ❌ Token no proporcionado');
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  
  console.log('   ✓ Token encontrado:', token.substring(0, 20) + '...');
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    req.user = decoded; // Guardar el objeto decodificado completo
    // Accept both 'role' (English) and 'rol' (Spanish) from JWT
    req.userRole = decoded.role || decoded.rol;
    console.log('   ✓ Token verificado. User ID:', req.userId);
    next();
  } catch (error) {
    console.log('   ❌ Token inválido:', error.message);
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

// Middleware para logging de auditoría - versión mejorada
const auditLog = async (action, tableName, recordId, oldValues = null, newValues = null, req = null, additionalContext = null) => {
  const query = `
    INSERT INTO bitacora_auditoria (id, accion, nombre_tabla, id_registro, usuario_id, valores_antiguos, valores_nuevos, municipio, direccion_ip, agente_usuario, fecha)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, CURRENT_TIMESTAMP)
  `;
  
  // Extraer IP del cliente
  const getClientIP = (req) => {
    if (!req) return null;
    return req.headers['x-forwarded-for']?.split(',')[0].trim() ||
           req.headers['x-real-ip'] ||
           req.connection.remoteAddress ||
           req.socket.remoteAddress ||
           null;
  };
  
  const clientIP = getClientIP(req);
  const userAgent = req?.headers['user-agent'] || null;
  
  // Obtener municipio del usuario actual
  let userMunicipio = null;
  if (global.currentUserId) {
    try {
      const userQuery = 'SELECT municipio FROM usuarios WHERE id = $1';
      const userResult = await global.db.query(userQuery, [global.currentUserId]);
      if (userResult.rows.length > 0) {
        userMunicipio = userResult.rows[0].municipio;
      }
    } catch (error) {
      console.error('Error fetching user municipio:', error.message);
    }
  }
  
  // Enriquecer valores con contexto adicional
  let enrichedNewValues = newValues ? { ...newValues } : null;
  let enrichedOldValues = oldValues ? { ...oldValues } : null;
  
  if (additionalContext) {
    if (enrichedNewValues) {
      enrichedNewValues._contexto = additionalContext;
    } else if (enrichedOldValues) {
      enrichedOldValues._contexto = additionalContext;
    }
  }
  
  const values = [
    uuidv4(),
    action,
    tableName,
    recordId,
    global.currentUserId || null,
    enrichedOldValues ? JSON.stringify(enrichedOldValues) : null,
    enrichedNewValues ? JSON.stringify(enrichedNewValues) : null,
    userMunicipio,
    clientIP,
    userAgent
  ];
  
  try {
    await global.db.query(query, values);
    console.log(`✓ Auditoría registrada: ${action} en ${tableName} (IP: ${clientIP})`);
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};


// Middleware para validar duplicidad de entregas
const checkDuplicateDelivery = async (req, res, next) => {
  const { censado_id, tipo_ayuda_id } = req.body;
  
  console.log('🔍 [checkDuplicateDelivery] Verificando duplicados:');
  console.log('   censado_id:', censado_id);
  console.log('   tipo_ayuda_id:', tipo_ayuda_id);
  
  if (!censado_id || !tipo_ayuda_id) {
    console.log('   ⚠️ Falta censado_id o tipo_ayuda_id, saltando verificación');
    return next();
  }
  
  try {
    const query = `
      SELECT * FROM entregas_ayuda
      WHERE censado_id = $1 AND tipo_ayuda_id = $2
      AND fecha_entrega >= NOW() - INTERVAL '30 days'
    `;
    
    const result = await global.db.query(query, [censado_id, tipo_ayuda_id]);
    
    console.log('   Entregas anteriores encontradas:', result.rows.length);
    
    if (result.rows.length > 0) {
      console.log('   ✓ DUPLICADO DETECTADO - Creando alerta');
      // Crear alerta de duplicidad
      const alertQuery = `
        INSERT INTO alertas_duplicidad (censado_id, tipo_ayuda_id, fecha_ultima_entrega, dias_desde_ultima_entrega, estado_alerta)
        VALUES ($1, $2, $3, $4, $5)
      `;
      
      const daysSince = Math.floor((Date.now() - new Date(result.rows[0].fecha_entrega).getTime()) / (1000 * 60 * 60 * 24));
      
      await global.db.query(alertQuery, [
        censado_id,
        tipo_ayuda_id,
        result.rows[0].fecha_entrega,
        daysSince,
        'pendiente'
      ]);
      
      console.log('   ✓ Alerta creada correctamente');
      
      res.locals.duplicateAlert = {
        message: 'Alerta: Este beneficiario ya recibió esta ayuda recientemente',
        lastDelivery: result.rows[0].fecha_entrega,
        daysSince: daysSince
      };
    } else {
      console.log('   ✓ No hay entregas previas - Primera vez');
    }
    
    next();
  } catch (error) {
    console.error('❌ Error checking duplicate delivery:', error.message);
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
