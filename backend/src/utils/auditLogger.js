/**
 * Utilidad para registrar eventos en la bitácora de auditoría
 * Registra todas las acciones importantes del sistema
 */

const logAuditEvent = async (db, {
  accion,
  nombre_tabla,
  id_registro,
  usuario_id,
  valores_antiguos,
  valores_nuevos,
  municipio,
  direccion_ip,
  agente_usuario,
  detalles_adicionales
}) => {
  try {
    const query = `
      INSERT INTO bitacora_auditoria 
      (accion, nombre_tabla, id_registro, usuario_id, valores_antiguos, valores_nuevos, municipio, direccion_ip, agente_usuario)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id
    `;

    const values = [
      accion,
      nombre_tabla,
      id_registro || null,
      usuario_id || null,
      valores_antiguos ? JSON.stringify(valores_antiguos) : null,
      valores_nuevos ? JSON.stringify(valores_nuevos) : null,
      municipio || null,
      direccion_ip || null,
      agente_usuario || null
    ];

    const result = await db.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Error registrando evento de auditoría:', error);
    // No lanzar error para no interrumpir la operación principal
    return null;
  }
};

/**
 * Registra un evento de LOGIN
 */
const logLogin = async (db, userId, userEmail, direccion_ip, agente_usuario) => {
  return logAuditEvent(db, {
    accion: 'LOGIN',
    nombre_tabla: 'sesiones_usuarios',
    id_registro: userId,
    usuario_id: userId,
    valores_nuevos: { email: userEmail, timestamp: new Date().toISOString() },
    direccion_ip,
    agente_usuario
  });
};

/**
 * Registra un evento de LOGOUT
 */
const logLogout = async (db, userId, direccion_ip, agente_usuario) => {
  return logAuditEvent(db, {
    accion: 'LOGOUT',
    nombre_tabla: 'sesiones_usuarios',
    id_registro: userId,
    usuario_id: userId,
    valores_nuevos: { timestamp: new Date().toISOString() },
    direccion_ip,
    agente_usuario
  });
};

/**
 * Registra un cambio en datos (CREATE, UPDATE, DELETE)
 */
const logDataChange = async (db, {
  accion,
  nombre_tabla,
  id_registro,
  usuario_id,
  valores_antiguos,
  valores_nuevos,
  municipio,
  direccion_ip,
  agente_usuario
}) => {
  return logAuditEvent(db, {
    accion,
    nombre_tabla,
    id_registro,
    usuario_id,
    valores_antiguos,
    valores_nuevos,
    municipio,
    direccion_ip,
    agente_usuario
  });
};

/**
 * Extrae IP del cliente desde req
 */
const getClientIP = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',')[0] ||
    req.headers['x-real-ip'] ||
    req.connection.remoteAddress ||
    'desconocida'
  );
};

module.exports = {
  logAuditEvent,
  logLogin,
  logLogout,
  logDataChange,
  getClientIP
};
