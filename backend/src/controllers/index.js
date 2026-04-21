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
      const { logLogin, getClientIP } = require('../utils/auditLogger');
      
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
      
      // Registrar login en auditoría
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'desconocido';
      await logLogin(global.db, user.id, email, clientIP, userAgent);
      
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

  static async logout(req, res) {
    try {
      const { logLogout, getClientIP } = require('../utils/auditLogger');
      
      // Registrar logout en auditoría
      const clientIP = getClientIP(req);
      const userAgent = req.headers['user-agent'] || 'desconocido';
      await logLogout(global.db, req.userId, clientIP, userAgent);

      return res.json({
        message: 'Logout exitoso',
        success: true
      });
    } catch (error) {
      console.error('Logout error:', error);
      // Aunque falle el logging, el logout sigue siendo válido
      return res.json({
        message: 'Logout exitoso',
        success: true
      });
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

  static async updateProfile(req, res) {
    try {
      const { nombre, telefono, direccion } = req.body;
      const userId = req.userId;

      // Validar que al menos un campo esté presente
      if (!nombre && !telefono && !direccion) {
        return res.status(400).json({ error: 'Debe proporcionar al menos un campo para actualizar' });
      }

      // Preparar datos para actualizar
      const updateData = {};
      if (nombre) updateData.nombre = nombre;
      if (telefono) updateData.telefono = telefono;
      if (direccion) updateData.direccion = direccion;

      // Actualizar usuario
      const updatedUser = await User.update(userId, updateData);

      return res.json({
        mensaje: 'Perfil actualizado correctamente',
        user: {
          id: updatedUser.id,
          nombre: updatedUser.nombre,
          email: updatedUser.email,
          rol: updatedUser.rol,
          telefono: updatedUser.telefono,
          direccion: updatedUser.direccion
        }
      });
    } catch (error) {
      console.error('Update profile error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async changePassword(req, res) {
    try {
      const { passwordActual, passwordNueva } = req.body;
      const userId = req.userId;

      // Validar campos requeridos
      if (!passwordActual || !passwordNueva) {
        return res.status(400).json({ error: 'Contraseña actual y nueva requeridas' });
      }

      // Validar longitud mínima
      if (passwordNueva.length < 6) {
        return res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      }

      // Obtener usuario actual
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Verificar contraseña actual
      const passwordMatch = (passwordActual === user.contraseña_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'La contraseña actual es incorrecta' });
      }

      // Actualizar contraseña
      await User.update(userId, { contraseña_hash: passwordNueva });

      return res.json({
        mensaje: 'Contraseña cambiada correctamente'
      });
    } catch (error) {
      console.error('Change password error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getSessions(req, res) {
    try {
      const userId = req.userId;
      // Para este proyecto, devolvemos sesiones simuladas
      // En producción, esto vendría de una tabla de sesiones en BD
      const sessions = [
        {
          dispositivo: 'web',
          ubicacion: 'Navegador - Sistema Ayudas',
          ultimoAcceso: new Date(),
          actual: true
        }
      ];
      return res.json(sessions);
    } catch (error) {
      console.error('Get sessions error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getStatistics(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Calcular días activo
      const diasActivo = user.creado_en ? 
        Math.floor((new Date() - new Date(user.creado_en)) / (1000 * 60 * 60 * 24)) : 0;

      const stats = {
        diasActivo,
        // Las siguientes estadísticas se pueden poblaren análisis reales desde BD
        ayudasRegistradas: 0,
        beneficiariosRegistrados: 0,
        auditoriasRealizadas: 0,
        usuariosCreados: 0,
        ayudasTotales: 0
      };

      return res.json(stats);
    } catch (error) {
      console.error('Get statistics error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async requestDeletion(req, res) {
    try {
      const userId = req.userId;
      const user = await User.findById(userId);
      
      if (!user) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }

      // Marcar usuario para eliminación (soft delete)
      await User.update(userId, { activo: false });

      return res.json({
        mensaje: 'Solicitud de eliminación de cuenta procesada. Tu cuenta ha sido desactivada.'
      });
    } catch (error) {
      console.error('Request deletion error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Censo (Beneficiarios)
class CensoController {
  static async create(req, res) {
    try {
      const { Censado } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const censado = await Censado.create(req.body);
      
      const context = {
        tipo: 'Nuevo beneficiario',
        cedula: censado.cedula,
        nombre_completo: `${censado.primer_nombre} ${censado.primer_apellido}`,
        municipio: censado.municipio
      };
      
      await auditLog('CREAR', 'censados', censado.id, null, censado, req, context);
      
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

  static async update(req, res) {
    try {
      const { Censado } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const { id } = req.params;
      
      const oldCensado = await Censado.findById(id);
      if (!oldCensado) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }
      
      const censado = await Censado.update(id, req.body);
      
      // Detectar qué cambios específicos se hicieron
      const changesSummary = [];
      for (const field of Object.keys(req.body)) {
        if (oldCensado[field] !== req.body[field]) {
          changesSummary.push(`${field}: ${oldCensado[field]} → ${req.body[field]}`);
        }
      }
      
      const context = {
        tipo_operacion: 'Actualizar beneficiario',
        descripcion_detallada: `Se actualizó la información del beneficiario ${oldCensado.cedula}`,
        datos_identificacion: {
          cedula: censado.cedula,
          nombre_completo: `${censado.primer_nombre} ${censado.primer_apellido}`
        },
        campos_modificados: Object.keys(req.body),
        resumen_cambios: changesSummary,
        municipio_anterior: oldCensado.municipio,
        municipio_nuevo: censado.municipio
      };
      
      await auditLog('EDITAR', 'censados', id, oldCensado, censado, req, context);
      
      return res.json({ message: 'Beneficiario actualizado', censado });
    } catch (error) {
      console.error('Update censado error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { Censado } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const { id } = req.params;
      
      const censado = await Censado.findById(id);
      if (!censado) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }
      
      const deletedCensado = await Censado.delete(id);
      
      const context = {
        tipo_operacion: 'Eliminar beneficiario',
        descripcion_detallada: `Se eliminó el registro del beneficiario ${censado.cedula}`,
        datos_eliminados: {
          cedula: censado.cedula,
          nombre_completo: `${censado.primer_nombre} ${censado.primer_apellido}`,
          municipio: censado.municipio,
          email: censado.email,
          telefono: censado.telefono
        },
        razon_eliminacion: 'Eliminación de registro'
      };
      
      await auditLog('ELIMINAR', 'censados', id, censado, null, req, context);
      
      return res.json({ message: 'Beneficiario eliminado', censado: deletedCensado });
    } catch (error) {
      console.error('Delete censado error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Tipos de Ayuda
class AidTypeController {
  static async create(req, res) {
    try {
      const { AidType } = require('../models');
      const { auditLog } = require('../middleware/auth');
      
      const aidType = await AidType.create(req.body);
      
      const context = {
        tipo: 'Creación de nuevo tipo de ayuda',
        nombre: aidType.nombre,
        unidad: aidType.unidad
      };
      
      await auditLog('CREAR', 'tipos_ayuda', aidType.id, null, aidType, req, context);
      
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

  static async update(req, res) {
    try {
      const { AidType } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const { id } = req.params;
      const { nombre, descripcion, unidad } = req.body;

      if (!nombre) {
        return res.status(400).json({ error: 'El nombre del tipo de ayuda es requerido' });
      }
      
      // Obtener valores antiguos
      const oldAidType = await AidType.findById(id);
      if (!oldAidType) {
        return res.status(404).json({ error: 'Tipo de ayuda no encontrado' });
      }

      const result = await AidType.update(id, { nombre, descripcion, unidad });
      
      if (!result) {
        return res.status(404).json({ error: 'Tipo de ayuda no encontrado' });
      }
      
      const context = {
        tipo: 'Actualización de tipo de ayuda',
        nombre_nuevo: result.nombre,
        campos_modificados: Object.keys(req.body).join(', ')
      };
      
      await auditLog('EDITAR', 'tipos_ayuda', id, oldAidType, result, req, context);

      return res.json({ message: 'Tipo de ayuda actualizado', aidType: result });
    } catch (error) {
      console.error('Update aid type error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { AidType } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const { id } = req.params;
      
      // Obtener datos antes de eliminar
      const aidType = await AidType.findById(id);
      if (!aidType) {
        return res.status(404).json({ error: 'Tipo de ayuda no encontrado' });
      }

      // Verificar que no haya inventario o entregas asociadas
      const { Inventory, AidDelivery } = require('../models');
      const inventory = await Inventory.getByAidType(id);
      
      if (inventory && inventory.length > 0) {
        return res.status(400).json({ error: 'No se puede eliminar este tipo de ayuda porque hay inventario asociado' });
      }

      const deliveries = await AidDelivery.getByAidType(id);
      if (deliveries && deliveries.length > 0) {
        return res.status(400).json({ error: 'No se puede eliminar este tipo de ayuda porque hay entregas registradas' });
      }

      const result = await AidType.delete(id);
      
      if (!result) {
        return res.status(404).json({ error: 'Tipo de ayuda no encontrado' });
      }
      
      const context = {
        tipo: 'Eliminación de tipo de ayuda',
        nombre: aidType.nombre,
        unidad: aidType.unidad
      };
      
      await auditLog('ELIMINAR', 'tipos_ayuda', id, aidType, null, req, context);

      return res.json({ message: 'Tipo de ayuda eliminado correctamente' });
    } catch (error) {
      console.error('Delete aid type error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Entregas de Ayuda
class AidDeliveryController {
  static async create(req, res) {
    try {
      const { AidDelivery, Censado, Inventory } = require('../models');
      const { auditLog } = require('../middleware/auth');
      
      const { censado_id, tipo_ayuda_id, cantidad } = req.body;
      const isDuplicate = !!res.locals.duplicateAlert;

      // 1. Obtener datos del beneficiario
      const beneficiary = await Censado.findById(censado_id);
      if (!beneficiary) {
        return res.status(404).json({ error: 'Beneficiario no encontrado' });
      }

      // 2. Verificar disponibilidad en inventario del municipio específico
      const inventory = await Inventory.getByAidTypeAndMunicipality(tipo_ayuda_id, beneficiary.municipio);
      
      if (!inventory && !isDuplicate) {
        return res.status(400).json({ 
          error: `No hay inventario del producto en ${beneficiary.municipio}. Verifique la disponibilidad en ese municipio.`,
          disponible: 0,
          municipio: beneficiary.municipio
        });
      }

      if (inventory && inventory.cantidad < cantidad && !isDuplicate) {
        return res.status(400).json({ 
          error: `Cantidad insuficiente. Disponible: ${inventory.cantidad}, Solicitado: ${cantidad} en ${beneficiary.municipio}`,
          disponible: inventory.cantidad,
          solicitado: cantidad,
          municipio: beneficiary.municipio
        });
      }

      // 3. Crear la entrega
      const deliveryData = {
        ...req.body,
        operador_id: req.userId,
        municipio: beneficiary.municipio
      };
      
      const delivery = await AidDelivery.create(deliveryData);

      // 4. Restar del inventario solo si NO es duplicado
      let inventoryUpdated = null;
      if (!isDuplicate && inventory) {
        inventoryUpdated = await Inventory.decreaseQuantity(inventory.id, cantidad);
        
        if (!inventoryUpdated) {
          // Si falla la actualización, eliminar la entrega creada
          await AidDelivery.delete(delivery.id);
          return res.status(500).json({ 
            error: 'Error al actualizar inventario. Entrega cancelada.' 
          });
        }
      }

      // 5. Registrar en auditoría
      await auditLog('CREAR', 'entregas_ayuda', delivery.id, null, delivery);
      
      console.log(`\n✓ Entrega registrada - Duplicado: ${isDuplicate} | Inventario deducido: ${!isDuplicate}`);
      
      return res.status(201).json({
        message: isDuplicate 
          ? 'Ayuda registrada pero NO descontada del inventario (Alerta de duplicidad)' 
          : 'Ayuda entregada y descontada del inventario exitosamente',
        delivery,
        inventoryUpdated: inventoryUpdated ? {
          cantidadAnterior: inventory.cantidad,
          cantidadNueva: inventoryUpdated.cantidad
        } : {
          cantidadAnterior: inventory?.cantidad || 0,
          cantidadNueva: inventory?.cantidad || 0,
          razon: 'No se desinventorió (Alerta de duplicidad)'
        },
        duplicateAlert: res.locals.duplicateAlert || null
      });
    } catch (error) {
      console.error('Create aid delivery error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async checkInventoryAvailability(req, res) {
    try {
      const { Inventory } = require('../models');
      const { aidTypeId, municipality } = req.params;

      console.log('🔍 Verificando inventario:');
      console.log('  aidTypeId:', aidTypeId, `(tipo: ${typeof aidTypeId})`);
      console.log('  municipality:', municipality, `(tipo: ${typeof municipality})`);

      const inventory = await Inventory.getByAidTypeAndMunicipality(aidTypeId, municipality);
      
      console.log('  Resultado de búsqueda:', inventory);

      if (!inventory) {
        console.log('  ❌ No se encontró inventario');
        return res.json({
          disponible: false,
          cantidad: 0,
          municipio: municipality,
          mensaje: `No hay inventario disponible en ${municipality}`
        });
      }

      console.log('  ✓ Inventario encontrado:', {
        cantidad: inventory.cantidad,
        ubicacion: inventory.ubicacion_almacen
      });

      return res.json({
        disponible: inventory.cantidad > 0,
        cantidad: inventory.cantidad,
        municipio: municipality,
        ubicacion: inventory.ubicacion_almacen,
        mensaje: `Disponible: ${inventory.cantidad} unidades en ${inventory.ubicacion_almacen}`
      });
    } catch (error) {
      console.error('Check inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async getByBeneficiary(req, res) {
    try {
      const { AidDelivery } = require('../models');
      const censadoId = req.params.censado_id;
      
      console.log('▶ getByBeneficiary llamado');
      console.log('  censado_id recibido:', censadoId);
      console.log('  tipo:', typeof censadoId);
      
      const deliveries = await AidDelivery.getByBeneficiary(censadoId);
      
      console.log('  entregas encontradas:', deliveries.length);
      if (deliveries.length > 0) {
        console.log('  primera entrega:', deliveries[0]);
      }
      
      return res.json(deliveries);
    } catch (error) {
      console.error('❌ Get deliveries error:', error);
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

  static async delete(req, res) {
    try {
      const { AidDelivery } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const fs = require('fs');
      const path = require('path');
      
      // Obtener información de la entrega antes de eliminarla
      const deliveryQuery = `SELECT * FROM entregas_ayuda WHERE id = $1`;
      const deliveryResult = await global.db.query(deliveryQuery, [req.params.id]);
      
      if (deliveryResult.rows.length === 0) {
        return res.status(404).json({ error: 'Entrega no encontrada' });
      }

      const delivery = deliveryResult.rows[0];
      
      // Obtener y eliminar comprobantes asociados
      const getReceiptsQuery = `
        SELECT id FROM comprobantes_entrega 
        WHERE entrega_id = $1
      `;
      const receiptsResult = await global.db.query(getReceiptsQuery, [req.params.id]);
      
      // Eliminar comprobantes y sus PDFs
      for (const receipt of receiptsResult.rows) {
        // Eliminar archivo PDF si existe
        const receiptDir = path.join(__dirname, '../../receipts');
        const pdfPath = path.join(receiptDir, `${receipt.id}.pdf`);
        
        if (fs.existsSync(pdfPath)) {
          try {
            fs.unlinkSync(pdfPath);
            console.log(`PDF eliminado: ${pdfPath}`);
          } catch (fileErr) {
            console.warn(`No se pudo eliminar PDF: ${pdfPath}`, fileErr.message);
          }
        }
        
        // Eliminar registro de comprobante
        const deleteReceiptQuery = `DELETE FROM comprobantes_entrega WHERE id = $1`;
        await global.db.query(deleteReceiptQuery, [receipt.id]);
      }
      
      // Eliminar la entrega
      const deleted = await AidDelivery.delete(req.params.id);
      
      // Registrar en auditoría
      await auditLog('ELIMINAR', 'entregas_ayuda', req.params.id, deleted, null);
      
      return res.json({ 
        message: 'Entrega, comprobantes y PDF eliminados correctamente',
        delivery: deleted,
        receiptsDeleted: receiptsResult.rows.length
      });
    } catch (error) {
      console.error('Delete delivery error:', error);
      return res.status(500).json({ error: error.message });
    }
  }
}

// Controlador de Inventario
class InventoryController {
  static async create(req, res) {
    try {
      const { Inventory, AidType } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const result = await Inventory.create(req.body);
      
      const aidType = await AidType.findById(result.tipo_ayuda_id);
      
      const action = result.isUpdate ? 'EDITAR' : 'CREAR';
      const context = {
        tipo_operacion: result.isUpdate ? 'Actualizar cantidad de inventario' : 'Crear nuevo item de inventario',
        descripcion_detallada: result.isUpdate 
          ? `Se actualizó la cantidad del producto ${aidType?.nombre || 'desconocido'} en ${result.municipio}`
          : `Se registró un nuevo item de inventario para ${aidType?.nombre || 'desconocido'}`,
        datos_principales: {
          producto: aidType?.nombre || 'Desconocido',
          unidad_medida: aidType?.unidad || 'Desconocida',
          cantidad: result.cantidad,
          estado: result.estado,
          municipio: result.municipio,
          ubicacion_almacen: result.ubicacion_almacen
        },
        datos_adicionales: {
          lote: result.lote || 'Sin lote',
          fecha_caducidad: result.fecha_caducidad || 'No aplica',
          observaciones: result.observaciones || 'Sin observaciones'
        },
        operacion_tipo: result.isUpdate ? 'Actualización' : 'Creación'
      };
      
      await auditLog(action, 'inventario', result.id, null, {
        tipo_ayuda_id: result.tipo_ayuda_id,
        cantidad: result.cantidad,
        fecha_caducidad: result.fecha_caducidad,
        lote: result.lote,
        estado: result.estado,
        municipio: result.municipio,
        ubicacion_almacen: result.ubicacion_almacen,
        observaciones: result.observaciones
      }, req, context);
      
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
          fecha_caducidad: result.fecha_caducidad,
          lote: result.lote,
          estado: result.estado,
          municipio: result.municipio,
          ubicacion_almacen: result.ubicacion_almacen,
          observaciones: result.observaciones
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
      const { Inventory, AidType } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const inventoryId = req.params.id;
      
      const query = `SELECT * FROM inventario WHERE id = $1`;
      const oldResult = await global.db.query(query, [inventoryId]);
      const oldInventory = oldResult.rows[0];
      
      if (!oldInventory) {
        return res.status(404).json({ error: 'Inventario no encontrado' });
      }
      
      const { cantidad, fecha_caducidad, lote, estado, municipio, ubicacion_almacen, observaciones } = req.body;
      const inventory = await Inventory.update(inventoryId, {
        cantidad,
        fecha_caducidad,
        lote,
        estado,
        municipio,
        ubicacion_almacen,
        observaciones
      });
      
      const aidType = await AidType.findById(inventory.tipo_ayuda_id);
      
      const context = {
        tipo: 'Actualización de inventario',
        tipo_ayuda: aidType?.nombre || 'Desconocido',
        campos_modificados: Object.keys(req.body).join(', '),
        cantidad_anterior: oldInventory.cantidad,
        cantidad_nueva: inventory.cantidad,
        municipio: inventory.municipio
      };
      
      await auditLog('EDITAR', 'inventario', inventoryId, oldInventory, inventory, req, context);
      
      return res.json({ message: 'Inventario actualizado correctamente', inventory });
    } catch (error) {
      console.error('Update inventory error:', error);
      return res.status(500).json({ error: error.message });
    }
  }

  static async delete(req, res) {
    try {
      const { Inventory, AidType } = require('../models');
      const { auditLog } = require('../middleware/auth');
      const inventoryId = req.params.id;
      
      const query = `SELECT * FROM inventario WHERE id = $1`;
      const oldResult = await global.db.query(query, [inventoryId]);
      const oldInventory = oldResult.rows[0];
      
      if (!oldInventory) {
        return res.status(404).json({ error: 'Inventario no encontrado' });
      }
      
      const aidType = await AidType.findById(oldInventory.tipo_ayuda_id);
      
      const deletedInventory = await Inventory.delete(inventoryId);
      
      const context = {
        tipo: 'Eliminación de item de inventario',
        tipo_ayuda: aidType?.nombre || 'Desconocido',
        cantidad_eliminada: oldInventory.cantidad,
        lote: oldInventory.lote,
        municipio: oldInventory.municipio,
        estado: oldInventory.estado
      };
      
      await auditLog('ELIMINAR', 'inventario', inventoryId, oldInventory, null, req, context);
      
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
