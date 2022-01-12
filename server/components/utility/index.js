'use strict';

const
    express = require('express'),
    smartSheetRoute = require('./smartSheet'),
    sheetAPI = require('../../../lib/sheet_api');

let router = express.Router();

router.get('/smartSheet/createSchema/:formName/:sheetId', smartSheetRoute.get_createSchema_formName_sheetId)
router.get('/smartSheet/listSheets', sheetAPI.get_listSheets)
router.get('/smartSheet/listOrganizationSheets', sheetAPI.get_listOrganizationSheets)

module.exports = router;


