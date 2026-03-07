// Conexion con la DB
module.exports = {
  url:process.env.MONGODB_URI || "mongodb://localhost:27017/crud-mongo"
};