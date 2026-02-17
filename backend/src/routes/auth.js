const express = require('express');
const { AuthController } = require('../controllers');
const { verifyToken, setCurrentUser, verifyRole } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rutas protegidas
router.use(verifyToken, setCurrentUser);
router.get('/profile', AuthController.getProfile);
router.get('/users', AuthController.getAllUsers);

// Crear usuario (solo administrador)
router.post('/create-user', verifyRole(['administrador']), AuthController.register);

// Eliminar usuario (solo administrador)
router.delete('/delete-user/:id', verifyRole(['administrador']), AuthController.deleteUser);

module.exports = router;
