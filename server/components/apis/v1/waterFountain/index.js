'use strict';


const express = require('express')
const service_waterFountain = require('./services_waterFountain')
const api_smartsheet = require('./save')

let router = express.Router();

router.get('/', api_smartsheet.get_formName);
router.get('/fakeJSON', service_waterFountain.getData);
router.get('/:id', service_waterFountain.getDataAttribute);


module.exports = router;