'use strict';

const
    express = require('express'),
    v1Route = require('./v1');
   // v2Route = require('./v2');

let router = express.Router();

router.use('/v1', v1Route);
// router.use('/v2', v2Route);

module.exports = router;