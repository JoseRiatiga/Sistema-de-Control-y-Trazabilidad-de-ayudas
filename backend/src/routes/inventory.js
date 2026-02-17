const express = require('express');
const { InventoryController } = require('../controllers');
const { verifyToken, verifyRole, setCurrentUser } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken, setCurrentUser);

// Crear inventario (solo admin)
router.post('/', verifyRole(['admin']), InventoryController.create);

// Obtener inventarios
router.get('/', InventoryController.getAll);
router.get('/municipality/:municipality', InventoryController.getByMunicipality);

// Actualizar cantidad (solo admin)
router.patch('/:id', verifyRole(['admin']), InventoryController.updateQuantity);

module.exports = router;
