/**
 * Week 02 routes — a route is method + path, never the path alone.
 * One line each: no logic lives here.
 */
const express = require('express');
const basic = require('../controllers/pages/basicController');

const router = express.Router();

router.get('/ok', basic.ok);
router.get('/hello', basic.hello);
router.get('/hello/:name', basic.helloName);
router.get('/sum/:a/:b', basic.sum);

module.exports = router;
