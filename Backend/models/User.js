// modelo de usuario 
/* define la estructura de base de datos para los
usuarios 
encripta la contraseña
manejo de roles, (admin, coordinador, auxiliar)
*/

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

// Estructura de la base de datos para los usuarios
const userShema = new mongoose.Schema({
// EL nombre de usuario debe ser unico para toda la base de datos
username: {
    type: String,
    required: true,
    unique: true,
    trim: true, // elimina espacios en blanco al inicio y al final
},
    //Email debe ser unico valido en minusculas

    email: {
        type: String,
        required: true,
        unique: true,
        lowercase: true, // CONVIERTE A MINUSCULAS
        trim: true, // ELIMINA ESPACIOS 
        match:[/\S+@\S+\.\S+/, "El correo no es valido"]// valida el patron de email
    },

    // Contraseña - requerida, minimo 10 caracteres
    password: {
        type: String,
        required: true,
        minlength: 6,
        select: false // no incluir en resultados por defecto
    },

    // Rol del usuario restringe valores especificos
    role: {
        type: String,
        enum: [ "admin", "coordinador", "auxiliar"], //solo estos
        default: "auxiliar" //por defecto, los nuevos usuarios son auxiliar
    },

    // usuarios activos
    active: {
        type: Boolean,
        default: true //nuevos usuarios son activos por defecto
    },
},  {
        timestamps: true, // agrega CreatedAt y UpdatedAt automaticamente
        versionKey: false // no incluir _v en el control de versiones de mongoose
});


// Middleware para encriptar la contraseña antes de guardar el usuario
userShema.pre("save", async function (next) {
    // SI EL PASSWORD NO FUE MODIFICADO NO ENCRIPTAMOS DE NUEVO
    if (!this.isModified("password")) return next();
    try {
        // generar un slat con complejidad de 10 rondas
        // mayor numero de rondas = mas seguro es pero mas lento
        const slat = await bcrypt.genSalt(10);
        
        // Encriptar la contraseña usando el slat generado
        this.password = await bcrypt.hash(this.password, slat);
        
        //continuar con el guardado normal 
        next();
    } catch (error) {
        // si hay error en encriptacioin pasar el error al siguiente middleware
        next(error);
    }
});

// crear y exportar el modulo de usuario
module.exports = mongoose.model("User", userShema);