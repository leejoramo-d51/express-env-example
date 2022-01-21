'use strict';

const
    express = require('express'),
    smartSheetRoute = require('./smartSheet'),
    dropDowns = require('./dropDown'),
    sheetAPI = require('../../../lib/smartsheet_sheet');

let router = express.Router();

router.get('/smartSheet/createSchema/:formName/:sheetId',
           smartSheetRoute.get_createSchema_formName_sheetId)
router.get('/smartSheet/listSheets',
            sheetAPI.get_listSheets)
router.get('/smartSheet/listOrganizationSheets',
            sheetAPI.get_listOrganizationSheets)
router.get('/smartSheet/dropDowns',
            dropDowns.get_dropDowns)
router.get('/smartSheet/dropDowns/update/:sheetId',
            dropDowns.get_dropDowns_updateOne)
router.get('/smartSheet/dropDowns/updateAll',
            dropDowns.get_dropDowns_updateAll)

module.exports = router;


