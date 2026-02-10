//Conexion a la base de datos

module.exports = {
    url:process.env.MONGODB_URI || 
    "mongodb://localhost:27017/mongodb-crud"
};

