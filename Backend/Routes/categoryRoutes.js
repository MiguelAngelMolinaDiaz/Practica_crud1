/**
 * Rutas de categorias:
 * Define los endpoints CRUD para la gestion de categorias
 * Las categorias son contenedores padres de subcategorias y productos
 * Endpoints:
 * POST api/categories/ - Crear nueva categoria
 * GET api/categories/ - Obtener todas las categorias
 * GET api/categories/:id - Obtener categoria por id
 * PUT api/categories/:id - Actualizar categoria por id
 * DELETE api/categories/:id - Eliminar categoria por id/desactivar
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../Controllers/categoryController');
const { verifyToken } = require('../middleswares/auth');
const { checkRole } = require('../middleswares/role');

// Rutas CRUD 
router.post("/", verifyToken,
checkRole(['admin', 'coordinador']), 
categoryController.createCategory
);

router.get("/", categoryController.getAllCategories);

router.get("/:id", categoryController.getCategoryById);

router.put("/:id", verifyToken, 
checkRole(['admin', 'coordinador']), 
categoryController.updateCategory
);

router.delete("/:id", verifyToken, 
checkRole(['admin']), 
categoryController.deleteCategory
);

module.exports = router;