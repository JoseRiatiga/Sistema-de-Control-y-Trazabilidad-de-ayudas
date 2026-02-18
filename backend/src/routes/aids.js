const express = require('express');
const { AidTypeController, AidDeliveryController } = require('../controllers');
const { verifyToken, verifyRole, setCurrentUser, checkDuplicateDelivery } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(verifyToken, setCurrentUser);

// Rutas para tipos de ayuda (solo admin y operador)
router.post('/types', verifyRole(['administrador']), AidTypeController.create);
router.get('/types', AidTypeController.getAll);

// Rutas para entregas (operadores y admins)
// IMPORTANTE: Poner rutas más específicas ANTES que las genéricas
router.get('/inventory-check/:aidTypeId/:municipality', AidDeliveryController.checkInventoryAvailability);
router.post('/delivery', verifyRole(['administrador', 'operador']), checkDuplicateDelivery, AidDeliveryController.create);
router.get('/delivery', AidDeliveryController.getAll);
router.get('/delivery/beneficiary/:censado_id', AidDeliveryController.getByBeneficiary);
router.get('/delivery/municipality/:municipality', AidDeliveryController.getByMunicipality);
router.delete('/delivery/:id', verifyRole(['administrador', 'operador']), AidDeliveryController.delete);

module.exports = router;
