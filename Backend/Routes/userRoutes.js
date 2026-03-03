/**
 * Rutas de usuarios
 * Definicion endpoints para gestion de usuarios en el sistema
 * POST /api/users
 * GET /api/users
 * GET /api/users/:id
 * PUT /api/users/:id
 * DELETE /api/users/:id
 */

const express = require('express');
const router = express.Router();
const userController = require('../Controllers/userController');
const { verifyToken } = require('../middleware/authJwt');
const { checkRole } = require('../middleware/role');

// Revisión de problemas de autenticación y autorización

router.use((req, res, next) => {
    console.log("\n=== DIAGNOSTICO FR RUTA ===");
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
    console.log("Headers:", {
        "Authorization": req.headers.authorization ? "***" + req.headers.authorization.slice(8) : null,
        "x-access-token": req.headers
        ["x-access-token"] ? "***" + req.headers["x-access-token"].slice(8) : null,
        "user-agent": req.headers["user-agent"]
    });
    next();
});

// Rutas de usuario

router.post("/", verifyToken, 
    checkRole('admin, coordinador'), 
    userController.createUser);

router.get("/", verifyToken, 
    checkRole('admin, coordinador, auxiliar'), 
    userController.getAllUsers);

router.put("/", verifyToken, 
    checkRole('admin, coordinador, auxiliar'), 
    userController.updateUser);

router.delete("/", verifyToken, 
    checkRole('admin'), 
    userController.deleteUser);

module.exports = router;

  
  

  
