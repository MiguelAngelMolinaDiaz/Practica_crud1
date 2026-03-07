/** 
 * Archivo de indice de los modulos
 * Este archivo centraliza la importancia de los modelos a mongoose
 * Permite importar multiples modelos de forma concisa en otros archivos
*/

const User = require('./User');
const Product = require('./Product');
const Category = require('./Category');
const Subcategory = require('./Subcategory');

// Exportar todos los modelos

module.exports = {
    User,
    Product,
    Category,
    Subcategory
};