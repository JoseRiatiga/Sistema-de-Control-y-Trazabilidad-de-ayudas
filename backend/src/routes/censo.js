const express = require('express');
const { CensoController } = require('../controllers');
const { verifyToken, setCurrentUser } = require('../middleware/auth');

const router = express.Router();

// Todas las rutas de censo requieren autenticación
router.use(verifyToken, setCurrentUser);

// Crear beneficiario
router.post('/', CensoController.create);

// Obtener beneficiarios
router.get('/', CensoController.getAll);
router.get('/municipality/:municipality', CensoController.getByMunicipality);
router.get('/cedula/:cedula', CensoController.searchByIdentification);
router.get('/:id', CensoController.getById);

// Actualizar beneficiario
router.put('/:id', CensoController.update);

// Eliminar beneficiario
router.delete('/:id', CensoController.delete);

module.exports = router;
