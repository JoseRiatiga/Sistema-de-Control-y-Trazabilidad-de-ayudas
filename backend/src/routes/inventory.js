const express = require('express');
const { InventoryController } = require('../controllers');
const { verifyToken, verifyRole, setCurrentUser } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken, setCurrentUser);

// Crear inventario (solo admin)
router.post('/', verifyRole(['administrador']), InventoryController.create);

// Obtener inventarios
router.get('/municipality/:municipality', InventoryController.getByMunicipality);
router.get('/', InventoryController.getAll);

// Actualizar cantidad (solo admin)
router.patch('/:id', verifyRole(['administrador']), InventoryController.updateQuantity);

// Actualizar inventario completo (solo admin)
router.put('/:id', verifyRole(['administrador']), InventoryController.update);

// Eliminar inventario (solo admin)
router.delete('/:id', verifyRole(['administrador']), InventoryController.delete);

module.exports = router;
