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
      SELECT ea.*, ta.nombre as aid_type_name, c.primer_nombre, c.primer_apellido
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN censados c ON ea.censado_id = c.id
      WHERE ea.censado_id = $1
      ORDER BY ea.fecha_entrega DESC
    `;
    const result = await global.db.query(query, [censado_id]);
    return result.rows;
  }

  static async getByMunicipality(municipio, dateFrom = null, dateTo = null) {
    let query = `
      SELECT ea.*, ta.nombre as aid_type_name, c.primer_nombre, c.primer_apellido, u.nombre as operator_name
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN censados c ON ea.censado_id = c.id
      JOIN usuarios u ON ea.operador_id = u.id
      WHERE ea.municipio = $1
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
      SELECT ea.*, ta.nombre as aid_type_name, c.primer_nombre, c.primer_apellido
      FROM entregas_ayuda ea
      JOIN tipos_ayuda ta ON ea.tipo_ayuda_id = ta.id
      JOIN censados c ON ea.censado_id = c.id
      ORDER BY ea.fecha_entrega DESC
      LIMIT $1 OFFSET $2
    `;
    const result = await global.db.query(query, [limit, offset]);
    return result.rows;
  }
}

// Modelo para Inventario
class Inventory {
  static async create(inventoryData) {
    const id = uuidv4();
    const query = `
      INSERT INTO inventario (id, tipo_ayuda_id, cantidad, costo_unitario, municipio, ubicacion_almacen)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      id,
      inventoryData.tipo_ayuda_id,
      inventoryData.cantidad,
      inventoryData.costo_unitario,
      inventoryData.municipio,
      inventoryData.ubicacion_almacen
    ];
    
    const result = await global.db.query(query, values);
    return result.rows[0];
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
}

module.exports = { User, Censado, AidType, AidDelivery, Inventory };
