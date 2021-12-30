'use strict';

const
    express = require('express'),
    animalsRouter = require('./animals');

let router = express.Router();

router.use('/animals', animalsRouter);

module.exports = router;