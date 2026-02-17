const { v4: uuidv4 } = require('uuid');

// Modelo para Usuarios
class User {
  static async create(userData) {
    const id = uuidv4();
    const query = `
      INSERT INTO users (id, name, email, password_hash, role, phone, municipality)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, name, email, role, phone, municipality, created_at
    `;
    const values = [id, userData.name, userData.email, userData.password_hash, userData.role, userData.phone, userData.municipality];
    
    try {
      const result = await global.db.query(query, values);
      return result.rows[0];
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = $1 AND active = true';
    const result = await global.db.query(query, [email]);
    return result.rows[0];
  }

  static async findById(id) {
    const query = 'SELECT id, name, email, role, phone, municipality FROM users WHERE id = $1 AND active = true';
    const result = await global.db.query(query, [id]);
    return result.rows[0];
  }

  static async getAll(filters = {}) {
    let query = 'SELECT id, name, email, role, phone, municipality, created_at FROM users WHERE active = true';
    const values = [];
    
    if (filters.role) {
      query += ` AND role = $${values.length + 1}`;
      values.push(filters.role);
    }
    
    if (filters.municipality) {
      query += ` AND municipality = $${values.length + 1}`;
      values.push(filters.municipality);
    }
    
    query += ' ORDER BY created_at DESC';
    const result = await global.db.query(query, values);
    return result.rows;
  }
}

// Modelo para Censados (Beneficiarios)
class Censado {
  static async create(censoData) {
    const id = uuidv4();
    const query = `
      INSERT INTO censados (id, identification, first_name, last_name, phone, email, address, municipality, latitude, longitude, family_members)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING id, identification, first_name, last_name, phone, email, address, municipality, family_members
    `;
    const values = [
      id,
      censoData.identification,
      censoData.first_name,
      censoData.last_name,
      censoData.phone,
      censoData.email,
      censoData.address,
      censoData.municipality,
      censoData.latitude,
      censoData.longitude,
      censoData.family_members || 1
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

  static async findByIdentification(identification) {
    const query = 'SELECT * FROM censados WHERE identification = $1';
    const result = await global.db.query(query, [identification]);
    return result.rows[0];
  }

  static async getByMunicipality(municipality) {
    const query = 'SELECT * FROM censados WHERE municipality = $1 ORDER BY first_name, last_name';
    const result = await global.db.query(query, [municipality]);
    return result.rows;
  }

  static async getAll(limit = 100, offset = 0) {
    const query = 'SELECT * FROM censados ORDER BY municipality, first_name LIMIT $1 OFFSET $2';
    const result = await global.db.query(query, [limit, offset]);
    return result.rows;
  }
}

// Modelo para Tipos de Ayuda
class AidType {
  static async create(aidTypeData) {
    const id = uuidv4();
    const query = `
      INSERT INTO aid_types (id, name, description, unit)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;
    const values = [id, aidTypeData.name, aidTypeData.description, aidTypeData.unit];
    
    const result = await global.db.query(query, values);
    return result.rows[0];
  }

  static async getAll() {
    const query = 'SELECT * FROM aid_types ORDER BY name';
    const result = await global.db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const query = 'SELECT * FROM aid_types WHERE id = $1';
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
      INSERT INTO aid_deliveries (id, censado_id, aid_type_id, quantity, operator_id, municipality, notes, receipt_number)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    const values = [
      id,
      deliveryData.censado_id,
      deliveryData.aid_type_id,
      deliveryData.quantity,
      deliveryData.operator_id,
      deliveryData.municipality,
      deliveryData.notes,
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
      SELECT ad.*, at.name as aid_type_name, c.first_name, c.last_name
      FROM aid_deliveries ad
      JOIN aid_types at ON ad.aid_type_id = at.id
      JOIN censados c ON ad.censado_id = c.id
      WHERE ad.censado_id = $1
      ORDER BY ad.delivery_date DESC
    `;
    const result = await global.db.query(query, [censado_id]);
    return result.rows;
  }

  static async getByMunicipality(municipality, dateFrom = null, dateTo = null) {
    let query = `
      SELECT ad.*, at.name as aid_type_name, c.first_name, c.last_name, u.name as operator_name
      FROM aid_deliveries ad
      JOIN aid_types at ON ad.aid_type_id = at.id
      JOIN censados c ON ad.censado_id = c.id
      JOIN users u ON ad.operator_id = u.id
      WHERE ad.municipality = $1
    `;
    const values = [municipality];
    
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
    return result.rows;
  }

  static async getAll(limit = 100, offset = 0) {
    const query = `
      SELECT ad.*, at.name as aid_type_name, c.first_name, c.last_name
      FROM aid_deliveries ad
      JOIN aid_types at ON ad.aid_type_id = at.id
      JOIN censados c ON ad.censado_id = c.id
      ORDER BY ad.delivery_date DESC
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
      INSERT INTO inventory (id, aid_type_id, quantity, cost_per_unit, municipality, warehouse_location)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    const values = [
      id,
      inventoryData.aid_type_id,
      inventoryData.quantity,
      inventoryData.cost_per_unit,
      inventoryData.municipality,
      inventoryData.warehouse_location
    ];
    
    const result = await global.db.query(query, values);
    return result.rows[0];
  }

  static async updateQuantity(inventoryId, quantity) {
    const query = `
      UPDATE inventory
      SET quantity = $2, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `;
    const result = await global.db.query(query, [inventoryId, quantity]);
    return result.rows[0];
  }

  static async getByMunicipality(municipality) {
    const query = `
      SELECT i.*, at.name as aid_type_name, at.unit
      FROM inventory i
      JOIN aid_types at ON i.aid_type_id = at.id
      WHERE i.municipality = $1
      ORDER BY at.name
    `;
    const result = await global.db.query(query, [municipality]);
    return result.rows;
  }

  static async getAll() {
    const query = `
      SELECT i.*, at.name as aid_type_name, at.unit
      FROM inventory i
      JOIN aid_types at ON i.aid_type_id = at.id
      ORDER BY i.municipality, at.name
    `;
    const result = await global.db.query(query);
    return result.rows;
  }
}

module.exports = { User, Censado, AidType, AidDelivery, Inventory };
