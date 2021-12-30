'use strict';

const
    express = require('express'),
    dogsRoute = require('./dogs');

let router = express.Router();

router.use('/dogs', dogsRoute);

module.exports = router;