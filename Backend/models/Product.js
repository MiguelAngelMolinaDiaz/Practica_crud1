/**
 * Modelo de Producto MONGODB
 * Define la estructura del producto
 * el producto depende de una subcategoria y subcategoria depende de una categoria
 * muchos productos pueden pertenecer a una subcategoria
 * tiene relacion un user para ver quien creo el producto
 * soporte de imagenes (array de url)
 * validacion de valores numericos (no negativos)
 */

const mongoose = require("mongoose");

// Campos de la tabla categoria

const productSchema = new mongoose.Schema({
    //nombre del producto unico y requerido
    name: {
        type: String,
        required: [ true, "El nombre es obligatorio" ],
        unique: true, // no pueden haber dos productos con el mismo nombre
        trim: true, //Eliminar espacios al inicio y al final
    },

    //Descripcion del producto - requerida
    description: {
        type: String,
        required: [ true, "la descripcion es requerida"],
        trim: true,
    },

     //Precio de unidades monetarias
     //No puede ser negativo
    price: {
        type: Number,
        required: [ true, "El precio es requerido"],
        min: [0, "El precio no puede ser negativo"],
    },

     //cantidad de stock
     //No puede ser negativo
    stock: {
        type: Number,
        required: [ true, "El stock es requerido"],
        min: [0, "El stock no puede ser negativo"],
    },

    //Categoria padre esta subcategoria pertenece a una categoria
    // relacion 1 - muchos una categoria puede tener muchas subcategorias
    //un producto pertenece a una subcategoria pero una subcategoria puede tener muchos productos relacion 1 a muchos

    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category", //Puede ser poblado con .populate("category")
        required: [true, "La categoria es requerida"],
    },

    subcategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Subcategory", //Puede ser poblado con .populate("subcategory")
        required: [true, "La subcategoria es requerida"],
    },

    //quien creo el producto
    // referencia de User no requerida
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", //Puede ser poblado para mostrar los usuarios
    },

    //Array de imagenes de productos (urls)
    images: [{
        type: String, // url de la imagen
    }],

    // Active desactiva el producto sin eliminarlo
    active: {
        type: Boolean,
        default: true,
    }
}, {
    timestamps: true, // agrega createdAt y updatedAt automaticamente
    versionKey: false, // No  incluir campos __v
});

/**
 * MIDDLEWARE PRE-SAVE
 * limpia indices duplicados
 * Mongodb a veces crea multiples indices con el mismo nombre
 * esto causa conflictos al intentar dropIndex o recrear indices
 * este middleware limpia los indices problematicos
 * Proceso
 * 1 obtiene una lista de todos los indices de la coleccion
 * 2 busca si existe un indice con el nombre name_1 (antiguo o duplicado)
 * si existe lo elimina antes de nuevas operaciones
 * ignora errores si el indice no existe
 * continua con el guardado normal
 * */

productSchema.post("save", async function(error, doc, next)
        // verificar si el error de mongodb por violacion de indice unico
        {
        if (error.name === "MongoServerError" && error.code === 11000) {
            return next(new Error("El nombre del producto ya existe"));
        }
        // pasa el error tal como es
        next(error);
});

    /** indice unico
    Mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name que ya exista
    aumenta la velocidad de las busquedas
    **/

    // Exportar el modelo
    module.exports = mongoose.model("Product", productSchema);