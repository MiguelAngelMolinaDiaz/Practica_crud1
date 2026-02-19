/** 
 * Controlador de categorias 
 * maneja todas las operaciones (CRUD) relacionadas con categorias
 * 
*/

const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
/**
 * Create: crear nueva categoria
 * POST /api/Categories
 * Auth Bearer token requerido
 * Roles: admin y coordinador
 * body requerido:
 * name nombre de la categoria
 * description: descripcion de la categoria
 * retorna:
 * 201: categoria creada en MongoDB
 * 400: validacion fallida o nombre duplicado
 * 500: Error en base de datos
 */

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        // Validacion de los campos de entrada
        if (!name || typeof name !== 'string' || name.trim()) {
            return res.status(400).json({
                success: false,
                message: 'El modelo es obligatorio y debe ser texto valido'
            });
        }

        if (!description || typeof description !== 'string' || description.trim()) {
            return res.status(400).json({
                success: false,
                message: 'La description es obligatorioa y debe ser texto valido'
            });
        }

        // Limpiar espacios en blanco
        const trimmedName = name.trim();
        const trimmedDesc = description.trim();

        // Verificar si ya existe una categoria con el mismo nombre
        const existingCategory = await Category.findOne({ name: trimmedName });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoria con ese nombre'
            });
        }

        // Crear nueva categoria 
        const newCategory = new Category({
            name: trimmedName,
            description: trimmedDesc
        });

        await newCategory.save();

        res.status(201).json({
            success: true,
            message: 'Categoria creada exitosamente',
            data: newCategory
        });
    } catch (error) {
        console.error('Error en createCategory:', error);
        // Manejo de errores de indice unico
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: 'Ya existe una categoria con ese nombre'
            });
        }

        // Error generico del servidor
        res.status(500).json({
            success: false,
            message: 'Error al crear categoria',
            error: error.message
        });
    }
};

/**
 * GET consultar listado de categorias
 * GET /api/categories
 * por defecto retorna solo las categorias activas
 * con includeInactive=true retorna todas las categorias incluyendo las inactivas
 * Ordena por desendente por fecha de creacion
 * retorna:
 * 200: lista de categorias
 * 500: error de base de datos
 */

exports.getCategories = async (req, res) => {
    try {
        // Por defecto solo las categorias activas
        // IncludeInactive=true permite ver desactivadas
        const includeInactive = req.query.includeInactive === 'true';
        const activeFilter = includeInactive ? {} : {
            active: { $ne: false }
        };

        const categories = await Category.find(activeFilter).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            data: categories
        });
    } catch (error) {
        console.error('Error en getCategorias', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categorias'
        })
    }
};

/**
 * READ Obtener una categoria especifica por id
 * GET /api/Categories/:id
 */

exports.getCategoryById = async (req, res) => {
    try {
        // Por defecto solo las categorias activas
        // IncludeInactive=true permite ver desactivadas
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }
        res.status(200).json({
            success: true,
            data: category
        });
    } catch (error) {
        console.error('Error en getCategoryById', error);
        res.status(500).json({
            success: false,
            message: 'Error al obtener categoria',
            error: error.message
        })
    }
};

/**
 * UPDATE Actualizar categoria existente
 * PUT /api/categories/:id
 * Auth Bearer token requerido
 * roles: admin y coordinador
 * body
 * name: Nuevo nombre de la categoria
 * description: nueva description
 * validaciones
 * si quiere solo actualiza el nombre solo la descripcion o los dos
 * Retorna:
 * 200: categoria actualizada
 * 400: Nombre duplicado
 * 404: Categoria no encontrada
 * 500: error de base de datos
 */
exports.updateCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const updateData = {};

        // Solo actualizar campos que fueron enviados
        if (name) {
            updateData.name = name.trim();
            // Verificar si el nuevo nombre ya existe en otra categoria
            const existing = await Category.findOne({
                name: updateData.name,
                _id: { $ne: req.params.id } // Asegurar que el nombre no sea el mismo id
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Este nombre ya existe'
                });
            }
        }

        if (description) {
            updateData.description = description.trim();
        }

        // Actualizar la categoria en la base de datos
        const updateCategory = await Category.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updateCategory) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }

        res.status(200).json({
            success: true,
            message: 'Categoria actualizada exitosamente',
            data: updateCategory
        });
    } catch (error) {
        console.error('Error en updateCategory', error);
        res.status(500).json({
            success: false,
            message: 'Error al actualizar la categoria',
            error: error.message
        });
    }
};

/**
 * Delete eliminar o desactivar una categoria
 * DELETE /api/categories/:id
 * Auth Bearer token requerido
 * roles: admin
 * query param:
 * hardDelete=true elimina permanentemente de la base de datos
 * Default: Soft delete (solo desactivar)
 * SOFT Delete: marca la categoria como inactiva 
 * Desactiva en cascada todas las subcategorias, productos relacionados
 * Al activar retorna todos los datos incluyendo los inactivos
 * 
 * HARD Delete: elimina permanetemente la categoria de la base de datos
 * elimina en cascad la categoria, subcategorias y productos relacionados
 * No su puede recuperar
 * 
 * Retorna:
 * 200: Categoria eliminada o desactivada
 * 404: Categoria no encontrada
 * 500: Error de base de datos
 */

exports.deleteCategory = async (req, res) => {
    try {
        const SubCategory = require('../models/Subcategory');
        const Product = require('../models/Product');
        const isHardDelete = req.query.hardDelete === 'true';

        // Buscar la categoria a eliminar
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: 'Categoria no encontrada'
            });
        }
        if (isHardDelete) {
            // Eliminar en cascada subcategorias y productos relacionados
            // Paso 1 obtener IDs de todas las subcategorias relacionadas
            const subIds = (await SubCategory.find({ category: req.params.id })).map(s => s._id);
            // Paso 2 eliminar todos productos de categoria
            await Product.deleteMany({ category: req.params.id });
            // Paso 3 eliminar todos los productos de las subcategorias de esta categoria
            await Product.deleteMany({ subcategory: { $in: subIds } });
            // Paso 4 eliminar todas las subcategorias de esta categoria
            await SubCategory.deleteMany({ category: req.params.id });
            // Paso 5 eliminar la categoria misma
            await Category.findByIdAndDelete(req.params.id);

            res.status(200).json({
                success: true,
                message: 'Categoria eliminada permanentemente y sus subcategorias y productos relacionados',
                data: {
                    category: category
                }
            });
        } else {
            // Soft delete solo marcar como inactivo con cascada
            category.active = false;
            await category.save();

            // Desactivar todas las subcategorias relacionadas 
            const subcategories = await SubCategory.updateMany(
                { category: req.params.id },
                { active: false }
            );

            // Desactivar todos los productos relacionados por categoria y subcategoria
            const products = await Product.updateMany(
                { category: req.params.id },
                { active: false }
            );

            res.status(200).json({
                success: true,
                message: 'Categoria desactivada exitosamente y sus subcategorias y productos asociados',
                data: {
                    category: category,
                    subcategoriesDeactivated: subcategories.modifiedCount,
                    productsDeactivated: products.modifiedCount
                }
            });
        }
    } catch (error) {
        console.error('Error en deleteCategory:', error);
        res.status(500),json({
            success: false,
            message:'Error al desactivar la categoria',
            error: error.message
        });
    }
};