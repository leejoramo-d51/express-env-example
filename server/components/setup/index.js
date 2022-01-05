'use strict';

const
    express = require('express'),
    smartSheetRoute = require('./smartSheet');
   // v2Route = require('./v2');

let router = express.Router();

router.get('/smartSheet/:formName/:sheetId', smartSheetRoute.get_formMaker_formName_sheetId);
// router.use('/v2', v2Route);

module.exports = router;


