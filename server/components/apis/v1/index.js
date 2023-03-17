'use strict';

const
    express = require('express'),
    route_dogs = require('./dogs'),
    route_waterFountain = require('./waterFountain')


let router = express.Router();

router.use('/dogs', route_dogs);
router.use('/waterFountain', route_waterFountain);

module.exports = router;