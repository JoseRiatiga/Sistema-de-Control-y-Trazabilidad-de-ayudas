const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Controlador de Autenticación
class AuthController {
  static async register(req, res) {
    try {
      const { nombre, email, password, rol, telefono, municipio } = req.body;
      
      // Validar campos requeridos
      if (!nombre || !email || !password || !rol) {
        return res.status(400).json({ error: 'Campos requeridos: nombre, email, password, rol' });
      }
      
      // Validar que el rol sea válido
      const validRoles = ['administrador', 'operador', 'auditor'];
      if (!validRoles.includes(rol)) {
        return res.status(400).json({ error: 'Rol inválido. Debe ser: administrador, operador, auditor' });
      }
      
      // Verificar si el usuario ya existe
      const existingUser = await User.findByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'El email ya está registrado' });
      }
      
      // Crear usuario (sin hashear contraseña para proyecto universitario)
      const user = await User.create({
        nombre,
        email,
        contraseña_hash: password,
        rol,
        telefono,
        municipio
      });
      
      return res.status(201).json({
        message: 'Usuario creado exitosamente',
        user
      });
    } catch (error) {
      console.error('Register error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async login(req, res) {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña requeridos' });
      }
      
      // Buscar usuario
      const user = await User.findByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
      
      // Verificar contraseña (sin hashear para proyecto universitario)
      const passwordMatch = (password === user.contraseña_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      }
      
      // Generar JWT
      const token = jwt.sign(
        { id: user.id, email: user.email, rol: user.rol },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRATION || '7d' }
      );
      
      return res.json({
        message: 'Login exitoso',
        token,
        user: {
          id: user.id,
          nombre: user.nombre,
          email: user.email,
          rol: user.rol,
          municipio: user.municipio
        }
      });
    } catch (error) {
      console.error('Login error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getProfile(req, res) {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      return res.json(user);
    } catch (error) {
      console.error('Get profile error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAllUsers(req, res) {
    try {
      const { role, municipality } = req.query;
      const users = await User.getAll({ role, municipality });
      return res.json(users);
    } catch (error) {
      console.error('Get all users error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async deleteUser(req, res) {
    try {
      const userId = req.params.id;
      
      // No permitir que un usuario se elimine a sí mismo
      if (userId === req.userId) {
        return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
      }
      
      const deletedUser = await User.delete(userId);
      return res.json({ 
        message: 'Usuario eliminado correctamente',
        deletedUser 
      });
    } catch (error) {
      console.error('Delete user error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Censo (Beneficiarios)
class CensoController {
  static async create(req, res) {
    try {
      const { Censado } = require('../models');
      const censado = await Censado.create(req.body);
      return res.status(201).json({ message: 'Beneficiario registrado', censado });
    } catch (error) {
      console.error('Create censado error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getById(req, res) {
    try {
      const { Censado } = require('../models');
      const censado = await Censado.findById(req.params.id);
      if (!censado) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }
      return res.json(censado);
    } catch (error) {
      console.error('Get censado error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getByMunicipality(req, res) {
    try {
      const { Censado } = require('../models');
      const censados = await Censado.getByMunicipality(req.params.municipality);
      return res.json(censados);
    } catch (error) {
      console.error('Get censados by municipality error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { Censado } = require('../models');
      const { limit = 100, offset = 0 } = req.query;
      const censados = await Censado.getAll(parseInt(limit), parseInt(offset));
      return res.json(censados);
    } catch (error) {
      console.error('Get all censados error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async searchByIdentification(req, res) {
    try {
      const { Censado } = require('../models');
      const { cedula } = req.params;
      const censado = await Censado.findByCedula(cedula);
      
      if (!censado) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }
      
      return res.json(censado);
    } catch (error) {
      console.error('Search censado error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Tipos de Ayuda
class AidTypeController {
  static async create(req, res) {
    try {
      const { AidType } = require('../models');
      const aidType = await AidType.create(req.body);
      return res.status(201).json({ message: 'Tipo de ayuda creado', aidType });
    } catch (error) {
      console.error('Create aid type error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { AidType } = require('../models');
      const aidTypes = await AidType.getAll();
      return res.json(aidTypes);
    } catch (error) {
      console.error('Get aid types error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Entregas de Ayuda
class AidDeliveryController {
  static async create(req, res) {
    try {
      const { AidDelivery } = require('../models');
      const { auditLog } = require('../middleware/auth');
      
      const deliveryData = {
        ...req.body,
        operador_id: req.userId
      };
      
      const delivery = await AidDelivery.create(deliveryData);
      
      // Registrar en auditoría
      await auditLog('CREAR', 'entregas_ayuda', delivery.id, null, delivery);
      
      return res.status(201).json({
        message: 'Ayuda entregada exitosamente',
        delivery,
        duplicateAlert: res.locals.duplicateAlert || null
      });
    } catch (error) {
      console.error('Create aid delivery error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getByBeneficiary(req, res) {
    try {
      const { AidDelivery } = require('../models');
      const deliveries = await AidDelivery.getByBeneficiary(req.params.censado_id);
      return res.json(deliveries);
    } catch (error) {
      console.error('Get deliveries error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getByMunicipality(req, res) {
    try {
      const { AidDelivery } = require('../models');
      const { dateFrom, dateTo } = req.query;
      const deliveries = await AidDelivery.getByMunicipality(
        req.params.municipality,
        dateFrom,
        dateTo
      );
      return res.json(deliveries);
    } catch (error) {
      console.error('Get deliveries by municipality error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { AidDelivery } = require('../models');
      const { limit = 100, offset = 0 } = req.query;
      const deliveries = await AidDelivery.getAll(parseInt(limit), parseInt(offset));
      return res.json(deliveries);
    } catch (error) {
      console.error('Get all deliveries error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Inventario
class InventoryController {
  static async create(req, res) {
    try {
      const { Inventory } = require('../models');
      const result = await Inventory.create(req.body);
      
      const statusCode = result.isUpdate ? 200 : 201;
      const message = result.isUpdate 
        ? 'Cantidad de inventario actualizada (item existente encontrado)'
        : 'Nuevo item de inventario creado';
      
      return res.status(statusCode).json({ 
        message,
        isUpdate: result.isUpdate,
        inventory: {
          id: result.id,
          tipo_ayuda_id: result.tipo_ayuda_id,
          cantidad: result.cantidad,
          costo_unitario: result.costo_unitario,
          municipio: result.municipio,
          ubicacion_almacen: result.ubicacion_almacen
        }
      });
    } catch (error) {
      console.error('Create inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getByMunicipality(req, res) {
    try {
      const { Inventory } = require('../models');
      const inventory = await Inventory.getByMunicipality(req.params.municipality);
      return res.json(inventory);
    } catch (error) {
      console.error('Get inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getAll(req, res) {
    try {
      const { Inventory } = require('../models');
      const inventory = await Inventory.getAll();
      return res.json(inventory);
    } catch (error) {
      console.error('Get all inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async updateQuantity(req, res) {
    try {
      const { Inventory } = require('../models');
      const { quantity } = req.body;
      const inventory = await Inventory.updateQuantity(req.params.id, quantity);
      return res.json({ message: 'Inventario actualizado', inventory });
    } catch (error) {
      console.error('Update inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async update(req, res) {
    try {
      const { Inventory } = require('../models');
      const { cantidad, costo_unitario, municipio, ubicacion_almacen } = req.body;
      const inventory = await Inventory.update(req.params.id, {
        cantidad,
        costo_unitario,
        municipio,
        ubicacion_almacen
      });
      return res.json({ message: 'Inventario actualizado correctamente', inventory });
    } catch (error) {
      console.error('Update inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { Inventory } = require('../models');
      const deletedInventory = await Inventory.delete(req.params.id);
      return res.json({ 
        message: 'Inventario eliminado correctamente', 
        deletedInventory 
      });
    } catch (error) {
      console.error('Delete inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

module.exports = {
  AuthController,
  CensoController,
  AidTypeController,
  AidDeliveryController,
  InventoryController
};
