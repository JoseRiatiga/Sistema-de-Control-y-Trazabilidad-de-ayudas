const { v4: uuidv4 } = require('uuid');

// Modelo para Usuarios
class User {
  static async create(userData) {
    const id = uuidv4();
    const query = `
      INSERT INTO usuarios (id, nombre, email, contraseña_hash, rol, telefono, municipio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, nombre, email, rol, telefono, municipio, creado_en
    `;
    const values = [id, userData.nombre, userData.email, userData.contraseña_hash, userData.rol, userData.telefono, userData.municipio];
    
    try {
      const result = await global.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM usuarios WHERE email = $1 AND activo = true';
    const result = await global.db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, nombre, email, rol, telefono, municipio FROM usuarios WHERE id = $1 AND activo = true';
    const result = await global.db.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = 'SELECT id, nombre, email, rol, telefono, municipio, creado_en FROM usuarios WHERE activo = true';
    const values = [];
    
    if (filters.rol) {
      query += ` AND rol = $${values.length + 1}`;
      values.push(filters.rol);
    }
    
    if (filters.municipio) {
      query += ` AND municipio = $${values.length + 1}`;
      values.push(filters.municipio);
    }
    
    query += ' ORDER BY creado_en DESC';
    const result = await global.db.query(query, values);
    return result.rows;
  }

  static async delete(id) {
    // Soft delete: marcar como inactivo en lugar de eliminar físicamente
    const query = `
      UPDATE usuarios
      SET activo = false, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1 AND rol != 'administrador'
      RETURNING id, nombre, email, rol
    `;
    const result = await global.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Usuario no encontrado o no puede ser eliminado');
    }
    
    return result.rows[0];
  }
}

// Modelo para Censados (Beneficiarios)
class Censado {
  static async create(censoData) {
    const id = uuidv4();
    const query = `
      INSERT INTO censados (id, cedula, primer_nombre, primer_apellido, telefono, email, direccion, municipio, latitud, longitud, miembros_familia)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, cedula, primer_nombre, primer_apellido, telefono, email, direccion, municipio, miembros_familia
    `;
    const values = [
      id,
      censoData.cedula,
      censoData.primer_nombre,
      censoData.primer_apellido,
      censoData.telefono,
      censoData.email,
      censoData.direccion,
      censoData.municipio,
      censoData.latitud,
      censoData.longitud,
      censoData.miembros_familia || 1
    ];
    
    try {
      const result = await global.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating censado: ${error.message}`);
    }
  }

  static async findById(id) {
    const query = 'SELECT * FROM censados WHERE id = $1';
    const result = await global.db.query(query, [id]);
    return result.rows[0];
  }

  static async findByCedula(cedula) {
    const query = 'SELECT * FROM censados WHERE cedula = $1';
    const result = await global.db.query(query, [cedula]);
    return result.rows[0];
  }

  static async getByMunicipality(municipio) {
    const query = 'SELECT * FROM censados WHERE municipio = $1 ORDER BY primer_nombre, primer_apellido';
    const result = await global.db.query(query, [municipio]);
    return result.rows;
  }

  static async getAll(limit = 100, offset = 0) {
    const query = 'SELECT * FROM censados ORDER BY municipio, primer_nombre LIMIT $1 OFFSET $2';
    const result = await global.db.query(query, [limit, offset]);
    return result.rows;
  }

  static async update(id, censoData) {
    const query = `
      UPDATE censados 
      SET cedula = COALESCE($2, cedula),
          primer_nombre = COALESCE($3, primer_nombre),
          primer_apellido = COALESCE($4, primer_apellido),
          telefono = COALESCE($5, telefono),
          email = COALESCE($6, email),
          direccion = COALESCE($7, direccion),
          municipio = COALESCE($8, municipio),
          latitud = COALESCE($9, latitud),
          longitud = COALESCE($10, longitud),
          miembros_familia = COALESCE($11, miembros_familia),
          actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const values = [
      id,
      censoData.cedula,
      censoData.primer_nombre,
      censoData.primer_apellido,
      censoData.telefono,
      censoData.email,
      censoData.direccion,
      censoData.municipio,
      censoData.latitud,
      censoData.longitud,
      censoData.miembros_familia
    ];

    try {
      const result = await global.db.query(query, values);
      if (result.rows.length === 0) {
        throw new Error('Beneficiario no encontrado');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error updating censado: ${error.message}`);
    }
  }

  static async delete(id) {
    const query = 'DELETE FROM censados WHERE id = $1 RETURNING *';
    try {
      const result = await global.db.query(query, [id]);
      if (result.rows.length === 0) {
        throw new Error('Beneficiario no encontrado');
      }
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error deleting censado: ${error.message}`);
    }
  }
}

// Modelo para Tipos de Ayuda
class AidType {
  static async create(aidTypeData) {
    const id = uuidv4();
    const query = `
      INSERT INTO tipos_ayuda (id, nombre, descripcion, unidad)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [id, aidTypeData.nombre, aidTypeData.descripcion, aidTypeData.unidad];
    
    const result = await global.db.query(query, values);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM tipos_ayuda ORDER BY nombre';
    const result = await global.db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM tipos_ayuda WHERE id = $1';
    const result = await global.db.query(query, [id]);
    return result.rows[0];
  }
}

// Modelo para Entregas de Ayuda
class AidDelivery {
  static async create(deliveryData) {
    const id = uuidv4();
    const receiptNumber = `REC-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const query = `
      INSERT INTO entregas_ayuda (id, censado_id, tipo_ayuda_id, cantidad, operador_id, municipio, notas, numero_comprobante)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      id,
      deliveryData.censado_id,
      deliveryData.tipo_ayuda_id,
      deliveryData.cantidad,
      deliveryData.operador_id,
      deliveryData.municipio,
      deliveryData.notas,
      receiptNumber
    ];
    
    try {
      const result = await global.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating aid delivery: ${error.message}`);
    }
  }

  static async getByBeneficiary(censado_id) {
    const query = `
      SELECT ea.*, ta.nombre as aid_type_name, c.primer_nombre, c.primer_apellido, c.cedula, u.nombre as operator_name, i.ubicacion_almacen, c.municipio
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN censados c ON ea.censado_id = c.id
      LEFT JOIN usuarios u ON ea.operador_id = u.id
      LEFT JOIN inventario i ON ea.tipo_ayuda_id = i.tipo_ayuda_id AND c.municipio = i.municipio
      WHERE ea.censado_id = $1
      ORDER BY ea.fecha_entrega DESC
    `;
    
    console.log('  [Model] ejecutando query con censado_id:', censado_id);
    const result = await global.db.query(query, [censado_id]);
    console.log('  [Model] query completada, filas:', result.rows.length);
    
    return result.rows;
  }

  static async getByMunicipality(municipio, dateFrom = null, dateTo = null) {
    let query = `
      SELECT ea.*, ta.nombre as aid_type_name, c.primer_nombre, c.primer_apellido, c.cedula, u.nombre as operator_name, i.ubicacion_almacen, c.municipio
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN censados c ON ea.censado_id = c.id
      JOIN usuarios u ON ea.operador_id = u.id
      LEFT JOIN inventario i ON ea.tipo_ayuda_id = i.tipo_ayuda_id AND c.municipio = i.municipio
      WHERE c.municipio = $1
    `;
    const values = [municipio];
    
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
    return result.rows;
  }

  static async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT 
        ea.id,
        ea.censado_id,
        ea.fecha_entrega,
        ea.cantidad as cantidad_entregada,
        ea.numero_comprobante,
        ta.nombre as aid_type_name,
        c.primer_nombre,
        c.primer_apellido,
        c.cedula,
        c.municipio as municipio_beneficiario,
        u.nombre as operator_name,
        i.municipio as municipio_almacen,
        i.ubicacion_almacen,
        i.cantidad as cantidad_disponible,
        ea.notas
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN censados c ON ea.censado_id = c.id
      JOIN usuarios u ON ea.operador_id = u.id
      LEFT JOIN inventario i ON ea.tipo_ayuda_id = i.tipo_ayuda_id AND c.municipio = i.municipio
      ORDER BY ea.fecha_entrega DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await global.db.query(query, [limit, offset]);
    return result.rows;
  }

  static async delete(id) {
    const query = `
      DELETE FROM entregas_ayuda
      WHERE id = $1
      RETURNING *
    `;
    const result = await global.db.query(query, [id]);
    
    if (result.rows.length === 0) {
      throw new Error('Entrega no encontrada');
    }
    
    return result.rows[0];
  }
}

// Modelo para Inventario
class Inventory {
  static async create(inventoryData) {
    // Primero verificar si existe un item similar (mismo tipo, municipio y costo)
    // Nota: No se considera ubicacion_almacen para evitar duplicados
    const findQuery = `
      SELECT id, cantidad FROM inventario
      WHERE tipo_ayuda_id = $1 
      AND municipio = $2 
      AND costo_unitario = $3
      LIMIT 1
    `;
    
    const findValues = [
      inventoryData.tipo_ayuda_id,
      inventoryData.municipio,
      inventoryData.costo_unitario
    ];
    
    const existingResult = await global.db.query(findQuery, findValues);
    
    // Si existe, actualizar la cantidad sumando
    if (existingResult.rows.length > 0) {
      const existingId = existingResult.rows[0].id;
      const existingQuantity = existingResult.rows[0].cantidad;
      const newQuantity = existingQuantity + parseInt(inventoryData.cantidad);
      
      const updateQuery = `
        UPDATE inventario
        SET cantidad = $2, actualizado_en = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;
      
      const result = await global.db.query(updateQuery, [existingId, newQuantity]);
      return { ...result.rows[0], isUpdate: true, message: `Cantidad actualizada de ${existingQuantity} a ${newQuantity}` };
    }
    
    // Si no existe, crear uno nuevo
    const id = uuidv4();
    const createQuery = `
      INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const createValues = [
      id,
      inventoryData.tipo_ayuda_id,
      inventoryData.cantidad,
      inventoryData.costo_unitario,
      inventoryData.municipio,
      inventoryData.ubicacion_almacen
    ];
    
    const result = await global.db.query(createQuery, createValues);
    return { ...result.rows[0], isUpdate: false, message: 'Nuevo item de inventario creado' };
  }

  static async getByAidTypeAndMunicipality(tipo_ayuda_id, municipio) {
    const query = `
      SELECT i.* 
      FROM inventario i
      WHERE i.tipo_ayuda_id = $1 
      AND i.municipio = $2
      LIMIT 1
    `;
    console.log('  [Inventory Query]');
    console.log('    tipo_ayuda_id:', tipo_ayuda_id);
    console.log('    municipio:', municipio);
    
    const result = await global.db.query(query, [tipo_ayuda_id, municipio]);
    
    console.log('    Filas encontradas:', result.rows.length);
    if (result.rows.length > 0) {
      console.log('    ID:', result.rows[0].id);
      console.log('    Cantidad:', result.rows[0].cantidad);
      console.log('    Ubicación:', result.rows[0].ubicacion_almacen);
    }
    
    return result.rows[0] || null;
  }

  static async decreaseQuantity(inventoryId, cantidadARestar) {
    const query = `
      UPDATE inventario
      SET cantidad = cantidad - $2, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1 AND cantidad >= $2
      RETURNING *
    `;
    const result = await global.db.query(query, [inventoryId, cantidadARestar]);
    return result.rows[0] || null;
  }

  static async updateQuantity(inventoryId, cantidad) {
    const query = `
      UPDATE inventario
      SET cantidad = $2, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await global.db.query(query, [inventoryId, cantidad]);
    return result.rows[0];
  }

  static async getByMunicipality(municipio) {
    const query = `
      SELECT i.*, ta.nombre as aid_type_name, ta.unidad
      FROM inventario i
      JOIN tipos_ayuda ta ON i.tipo_ayuda_id = ta.id
      WHERE i.municipio = $1
      ORDER BY ta.nombre
    `;
    const result = await global.db.query(query, [municipio]);
    return result.rows;
  }

  static async getAll() {
    const query = `
      SELECT i.*, ta.nombre as aid_type_name, ta.unidad
      FROM inventario i
      JOIN tipos_ayuda ta ON i.tipo_ayuda_id = ta.id
      ORDER BY i.municipio, ta.nombre
    `;
    const result = await global.db.query(query);
    return result.rows;
  }

  static async update(inventoryId, { cantidad, costo_unitario, municipio, ubicacion_almacen }) {
    const query = `
      UPDATE inventario
      SET cantidad = $2, costo_unitario = $3, municipio = $4, ubicacion_almacen = $5, actualizado_en = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await global.db.query(query, [inventoryId, cantidad, costo_unitario, municipio, ubicacion_almacen]);
    if (result.rows.length === 0) {
      throw new Error('Inventario no encontrado');
    }
    return result.rows[0];
  }

  static async delete(inventoryId) {
    const query = `
      DELETE FROM inventario
      WHERE id = $1
      RETURNING id, cantidad, municipio
    `;
    const result = await global.db.query(query, [inventoryId]);
    if (result.rows.length === 0) {
      throw new Error('Inventario no encontrado');
    }
    return result.rows[0];
  }
}

module.exports = { User, Censado, AidType, AidDelivery, Inventory };
