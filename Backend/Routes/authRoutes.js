/**
 * Rutas de autenticación
 * Define los endpoints relativos a autenticacion de usuarios
 * POST /api/auth/signin: Registro de nuevo usuario
 */

const express = require('express');
const router = express.Router();
const authController = require('../Controllers/authControllers');
const { verifySingUp } = require('../middlewares');
const {verifyToken} = require('../middleware/authJwt');
const { checkRole } = require('../middleware/role');

// Rutas de autenticación
// Requiere email - usuario y password
router.post("/signin", authController.signin);
router.post("/signup",
    verifyToken,
    checkRole('admin'),
    verifySingUp.checkDuplicateUsernameOrEmail,
    verifySingUp.checkRolesExisted,
    authController.signup
);
module.exports = router;


