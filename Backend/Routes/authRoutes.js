/**
 * Rutas de autenticación
 * Define los endpoints relativos a autenticacion de usuarios
 * POST /api/auth/signin: Registro de nuevo usuario
 */

const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authControllers');
const verifySignUp = require('../middleswares/verifySignUp');
const { verifyToken } = require('../middleswares/authJwt');
const { checkRole } = require('../middleswares/role');

// Rutas de autenticación
// Requiere email - usuario y password
router.post("/signin", authController.signin);
router.post("/signup",
    verifyToken,
    checkRole('admin'),
    verifySignUp.checkDuplicateUsernameOrEmail,
    verifySignUp.checkRolesExisted,
    authController.signup
);
module.exports = router;


