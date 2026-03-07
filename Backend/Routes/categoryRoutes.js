/**
 * Rutas de categorias
 * define los endpoints CRUD para la gestion de categorias
 * las categorias son contenedores padres de subcategorias y productos
 * endpoints:
 * POST /api/categories crea una nueva categoria
 * GET /api/categories obtiene todas las categorias
 * GET /api/categories/:id obtiene una categoria por id
 * PUT /api/categories/:id actualiza una categoria por id
 * DELETE /api/categories/:id elimina una categoria / desactivar
 */

const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { verifyToken } = require('../middleswares/authJwt');
const { checkRole } = require('../middleswares/role');
// Rutas CRUD

router.post('/',
    verifyToken,
    checkRole(['admin','coordinador', 'auxiliar']),
    categoryController.createCategory
);

router.get('/', 
    verifyToken,
    categoryController.getCategories
);
router.get('/:id', 
    verifyToken,
    categoryController.getCategoryById
);

router.put('/:id',
    verifyToken,
    checkRole(['admin','coordinador']),
    categoryController.updateCategory
);

router.delete('/:id',
    verifyToken,
    checkRole(['admin']),
    categoryController.deleteCategory
);

module.exports = router;