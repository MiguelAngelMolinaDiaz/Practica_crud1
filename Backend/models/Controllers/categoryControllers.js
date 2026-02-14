/**
 * Controlador de categorias
 * Maneja todas las operaciones (CRUD) relacionadas con categorias
 * */

const Category = require("../Schemas/categorySchema");

/**
 * Create:  crear nueva categoria
 * Post: /api/categories
 * Auth: bearer token requerido
 * Roles: Admin y coordinador
 * Body requerido:
 * name nombre de la categoria
 * description: descripcion de la categoria
 * retorna:
 * 201: categoria creada en MongoDB
 * 400: validar fallida o nombre duplicado
 * 500: Error en base de datos
 * */

exports.createCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        // Validacion de los campos de entrada
        if (!name || !typeof name === "string" || name.trim() ) {
            return res.status(400).json({
                success: false,
                message: "El nombre es obligatorio debe ser texto valido",
            });
        }

        if (!description || !typeof description === "string" || description.trim() ) {
            return res.status(400).json({
                success: false,
                message: "La descripción es obligatoria y debe ser texto válido",
            });
        }

        // Limpiar espacios en blanco
        const trimmedName = name.trim();
        const trimmedDesc = description.trim();

        //Verificar si ya existe una categoria con el mismo nombre
        const existingCategory = await Category.findOne({ name: trimmedName });
        if (existingCategory) {
            return res.status(400).json({
                success: false,
                message: "Ya existe una categoría con ese nombre",
            });
        }

        // Crear nueva categoria
        const newCategory = new Category({
            name: trimmedName,
            description: trimmedDesc,
        });

        await newCategory.save();

        return reds.status(201).json({
            success: true,
            message: "Categoría creada exitosamente",
            data: newCategory,
        });
    } catch (error) {
        console.error("Error en createCategory:", error);
        // Manejo de error de indice unico
        if (error.code === 11000) {
            return res.status(400).json({
                success: false,
                message: "Ya existe una categoría con ese nombre",
            });
        }

        // Error  generico del servidor
        res.status(500).json({
            success: false,
            message: "Error al crear la categoría",
            error: error.message,
        });
    }
};

/**
 * GET consultar listado de categorias
 * GET /api/categories
 * por defecto retorna solo las categorias activas
 * con includeInactive=true retorna todas las categorias incluyendo las inactivas
 * Ordena por desecendente por fecha de creación
 * retorna:
 * 200: lista de categorias
 * 500: error en base de datos
 */

exports.getCategories = async (req, res) => {
    try {
    // Por defecto solo las categorias activas
    // IncludeInactive=true permite ver desactivadas
    const includeInactive = req.query.includeInactive === "true";
    const activeFilter = includeInactive ? {} : { active: { $ne: true } };
    const categories = await Category.find(activeFilter).sort({ createdAt: -1 });
    res.status(200).json({
        success: true,
        data: categories,
    });
} catch (error) {
    console.error("Error en getCategories:", error);
    res.status(500).json({
        success: false,
        message: "Error al obtener las categorías",
        error: error.message,
    });
}
};
/**
 * READ Obtener una categoria especifica por ID
 * GET /api/categories/:id
 */

exports.getCategoryById = async (req, res) => {
    try {
    // Por defecto solo las categorias activas
    // IncludeInactive=true permite ver desactivadas
    const category = await Category.findById(req.params.id);
    if (!category) {
        return res.status(404).json({
            success: false,
            message: "Categoría no encontrada",
        });
    }
    res.status(200).json({
        success: true,
        data: category,
    });
} catch (error) {
    console.error("Error en getCategoryById:", error);
    res.status(500).json({
        success: false,
        message: "Error al obtener la categoría",
        error: error.message,
    });
}
};

/**
 * UPTADE Actualizar una categoria existente
 * PUT /api/categories/:id
 * Auth: Bearer token requerido
 * Roles: Admin y coordinador
 * Body:
 * name: Nuevo nombre de la categoria
 * description: Nueva descripcion de la categoria
 * Validaciones:
 * Si quiere solo actualizar el nombre, solo la descripcion o los dos
 * Retorna:
 * 200: categoria actualizada
 * 400: Validacion fallida o nombre duplicado
 * 404: categoria no encontrada
 * 500: error en base de datos
 */

exports.uptadeCategory = async (req, res) => {
    try {
        const { name, description } = req.body;
        const uptadeData = {};

        // Solo actualizar campos que fueron enviados
        if (name) {
            uptadeData.name = name.trim();

            // Verificar si el nuevo nombre ya existe en otra categoria
            const existingCategory = await Category.findOne({
                name: uptadeData.name,
                _id: { $ne: req.params.id }, // Aegurar que el nombre no sea el mismo id

            });
            if (existingCategory) {
                return res.status(400).json({
                    success: false,
                    message: "Este nombre ya existe",
                });
            }
        }

        if (description) {
            uptadeData.description = description.trim();
        }

        // Actualizar la categoria
        const updatedCategory = await Category.
        findByIdAndUpdate(
            req.params.id,
            uptadeData,
            { new: true, runsValidators: true }
        );

        if (!updatedCategory) {
            return res.status(404).json({
                success: false,
                message: "Categoria no encontrada",
            });
        }

        res.status(200).json({
            success: true,
            message: "Categoría actualizada exitosamente",
            data: updatedCategory,
        });
    } catch (error) {
        console.error("Error en uptadeCategory:", error);
        res.status(500).json({
            success: false,
            message: "Error al actualizar la categoría",
            error: error.message,
        });
    }
};

/**
 * Delete eliminar o desactivar una categoria
 * DELETE /api/categories/:id
 * Auth: Bearer token requerido
 * Roles: Admin y coordinador
 * Query param:
 * hardDelete=true elimina completamente la categoria de la base de datos
 * Default: Soft delete (solo desactivar)
 * SOFT DELETE: Marca la categoria como inactiva
 * Desactiva en cascada todas las subcategorias, productos relacionados
 * Al activar retorna todos los datos imcluyendo los inactivos
 * HARD DELETE: Elimina completamente la categoria de la base de datos
 * Elimina len cascada la categoria, subcategorias y productos relacionados
 * No se puede recuperar
 * Retorna:
 * 200: categoria eliminada o desactivada
 * 404: categoria no encontrada
 * 500: error en base de datos
 */

exports.deleteCategory = async (req, res) => {
    try {
        const SubCategory = require("../models/Product");
        const hardDelete = req.query.hardDelete === "true";

        // Buscar la categoria a eliminar
        const category = await Category.findById(req.params.id);
        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Categoría no encontrada",
            });
        }

        if (isHardDelete) {
            // Eliminar en cascada, subcategorias y productos relacionados
            // Paso 1 obtenemos IDs de todas las subcategorias relacionadas
            const subIds = (await SubCategory.find({
            category: req.params.id })).map((sub) => sub._id);

            // Paso 2 eliminar todos productos de esa categoria
            await Product.deleteMany({ category: req.params.id });

            // Paso 3 eliminar todos los productos de subcategorias de esta categoria
            await SubCategory.deleteMany({ subcategory:
            { $in: subIds } });

            //Paso 4 eliminar todas las subcategorias de esta categoria
            await SubCategory.deleteMany({ category: req.params.id });

            // Paso 5 eliminar la categoria
            await Category.findByIdAndDelete(req.params.id);
            res.status(200).json({
                success: true,
                message: "Categoría eliminada permanentemente y sus subcategorias y productos relacionados",
                data: {
                    category: category
                }
            });
        } else {
            // Soft delete: solo marcar como inactiva con cascada
            category.active = false;
            await category.save();

            // Desactivar todas las subcategorias relacionadas
            const subCategories = await SubCategory.updateMany(
                { category: req.params.id },
                { active: false }
            );

            // Desactivar todos los productos relacionados por la categoria y subcategoria
            const Products = await Product.updateMany(
                { category: req.params.id },
                { active: false }
            );

            res.status(200).json({
                success: true,
                message: "Categoría desactivada exitosamente y sus subcategorias y productos asociados",
                data: {
                    category: category,
                    subCategoriesDesactivated:
                    subCategories.modifiedCount,
                    productsDesactivated: Products.modifiedCount
                }
            });
        }
    } catch (error) {
        console.error("Error en deleteCategory:", error);
        res.status(500).json({
            success: false,
            message: "Error al desactivar la categoría",
            error: error.message,
        });
    }
};
