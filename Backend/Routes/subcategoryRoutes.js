/**
 * Rutas de subcategorias:
 * Define los endpoints CRUD para la gestion de subcategorias
 * Las subcategorias son contenedores padres de categorias y padres de productos
 * Endpoints:
 * POST api/subcategories/ - Crear nueva subcategoria 
 * GET api/subcategories/ - Obtener todas las subcategorias
 * GET api/subcategories/:id - Obtener subcategoria por id
 * PUT api/subcategories/:id - Actualizar subcategoria por id
 * DELETE api/subcategories/:id - Eliminar subcategoria por id/desactivar
 */

const express = require('express');
const router = express.Router();
const subcategoryController = require('../Controllers/subcategoryController');
const { check } = require('express-validator');
const { verifyToken } = require('../middleswares/auth');
const { checkRole } = require('../middleswares/role');
const validateSubcategory = [
    check('name')
        .notEmpty().isEmpty()
        .withMessage('El nombre es obligatorio'),

    check('description')
        .notEmpty().isEmpty()
        .withMessage('La descripción es obligatoria'),

        check('category')
        .notEmpty().isEmpty()
        .withMessage('La categoría es obligatoria'),
]

// Rutas CRUD 
router.post("/", 
verifyToken,
checkRole(['admin', 'coordinador']),
validateSubcategory, 
subcategoryController.createSubcategory
);

router.get("/", 
    verifyToken,
     subcategoryController.getAllSubcategories);

router.get("/:id", verifyToken,
     subcategoryController.getSubcategoryById);

router.put("/:id", 
verifyToken, 
checkRole(['admin', 'coordinador']), 
validateSubcategory,
subcategoryController.updateSubcategory
);

router.delete("/:id",
verifyToken, 
checkRole(['admin']), 
subcategoryController.deleteSubcategory
);

module.exports = router;