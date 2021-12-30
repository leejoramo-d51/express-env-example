'use strict';

const
    express = require('express'),
    dogService = require('./services_dogs');

let router = express.Router();

router.get('/', dogService.getDogs);
router.get('/:id', dogService.getDogWithId);

module.exports = router;