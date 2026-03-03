/**
 * Rutas de estadísticas
 * Define el endopoint para obtener las estadísticas generales del sistema.
 */

const express = require('express');
const router = express.Router();
const {getStatistics} = require('../Controllers/statisticsController');

// Get/api/statistics obtiene las estadísticas del sistema

router.get('/', getStatistics);

module.exports = router;