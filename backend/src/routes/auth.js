const express = require('express');
const { AuthController } = require('../controllers');
const { verifyToken, setCurrentUser } = require('../middleware/auth');

const router = express.Router();

// Rutas públicas
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Rutas protegidas
router.use(verifyToken, setCurrentUser);
router.get('/profile', AuthController.getProfile);
router.get('/users', AuthController.getAllUsers);

module.exports = router;
