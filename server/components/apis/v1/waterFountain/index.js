'use strict';

const
    express = require('express'),
    service_waterFountain = require('./services_waterFountain');

let router = express.Router();

router.get('/', service_waterFountain.getData);
router.get('/:id', service_waterFountain.getDataAttribute);

module.exports = router;