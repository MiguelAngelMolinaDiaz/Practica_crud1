/**
 * Modelo de Subcategoria MONGODB
 * Define la estructura de la subcategoria
 * la subcategoria depende de una categoria
 * muchos productos pueden pertenecer a una subcategoria
 * muchas subcategorias dependen de una sola categoria
 */

const mongoose = require("mongoose");

// Campos de la tabla categoria

const subcategorySchema = new mongoose.Schema({
    //nombre de la subcategoria unico y requerido
    name: {
        type: String,
        required: [ true, "El nombre de la subcategoria es obligatorio" ],
        unique: true, // no pueden haber dos subcategorias con el mismo nombre
        trim: true, //Eliminar espacios al inicio y al final
    },

    //Descripcion de la subcategoria - requerida
    description: {
        type: String,
        required: [ true, "la descripcion es requerida"],
        trim: true,
    },

    //Categoria padre esta subcategoria pertenece a una cayegoria
    // relacion 1 - muchos una categoria puede tener muchas subcategorias

    category: {
        type: mongooseSchema.Types.ObjectId,
        ref: "Category", //Puede ser poblado con .populate("category")
        required: [true, "La categoria es requerida"],
    },

    // Active desactiva la subcategoria sin eliminarla
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

subcategorySchema.post("save", async function(error, doc, next)
        // verificar si el error de mongodb por violacion de indice unico
        {
        if (error.name === "MongoServerError" && error.code === 11000) {
            next(new Error("ya existe la subcategoria con ese nombre"));
        } else {
            //pasa el erro tal como es
            next(error);
        }
});

    /** indice unico
    Mongo rechazara cualquier intento de insertar o actualizar un documento con un valor de name que ya exista
    aumenta la velocidad de las busquedas
    **/

    subcategorySchema.index({ name: 1 }, {
        unique: true,
        name: "name_1"// nombre explicito para evitar conflictos
    });

    // Epoxrtar el modelo
    module.exports = mongoose.model("Subcategory", subcategorySchema);