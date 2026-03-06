/**
 * Rutas de productos
 * define los endpoints CRUD para la gestion de productos
 * los productos son contenedores hijos de categorias
 * endpoints:
 * POST /api/products crea un nuevo producto
 * GET /api/products obtiene todos los productos
 * GET /api/products/:id obtiene un producto por id
 * PUT /api/products/:id actualiza un producto por id
 * DELETE /api/products/:id elimina un producto / desactivar
 */

const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const { check } = require('express-validator');
const { verifyToken } = require('../middleswares/authJwt');
const { checkRole } = require('../middleswares/role');

const validateProduct = [
    check('name')
        .not().isEmpty()
        .withmessage('El nombre es obligatorio'),
    
    check('description')
        .not().isEmpty()
        .withmessage('La descripcion es obligatoria'),
    
    check('price')
        .not().isEmpty()
        .withmessage('El precio es obligatorio'),

    check('stock')
        .not().isEmpty()
        .withmessage('El stock es obligatorio'),

    check('subcategory')
        .not().isEmpty()
        .withmessage('La subcategoria es obligatoria'),

    check('category')
        .not().isEmpty()
        .withmessage('La categoria es obligatoria'),
]

// Rutas CRUD

router.post('/',
    verifyToken,
    checkRole('admin','coordinador', 'auxiliar'),
    validateProduct,
    productController.createProduct
);

router.get('/',
    verifyToken,
    productController.getProducts);
router.get('/:id', verifyToken, productController.getProductById);

router.put('/:id',
    verifyToken,
    checkRole('admin','coordinador'),
    validateProduct,
    productController.updateProduct
);

router.delete('/:id',
    verifyToken,
    checkRole('admin'),
    productController.deleteProduct
);

module.exports = router;