'use strict';

const
    express = require('express'),
    smartSheetRoute = require('./smartSheet'),
    dropDowns = require('./dropDown'),
    sheetAPI = require('#lib/smartsheet_sheet'),
    {checkAuth} = require('#lib/middleware')

let router = express.Router();

router.get('/smartSheet/createSchema/:formName/:sheetId',
            checkAuth([]),
            smartSheetRoute.get_createSchema_formName_sheetId)
router.get('/smartSheet/listSheets',
            checkAuth([]),
            sheetAPI.get_listSheets)
router.get('/smartSheet/routePermissionsSave',
            checkAuth([]),
            sheetAPI.routePermissionsSave)
router.get('/smartSheet/listOrganizationSheets',
            checkAuth([]),
            sheetAPI.get_listOrganizationSheets)
router.get('/smartSheet/dropDowns',
            checkAuth([]),
            dropDowns.get_dropDowns)
router.get('/smartSheet/dropDowns/update/:sheetId',
            checkAuth([]),
            dropDowns.get_dropDowns_updateOne)
router.get('/smartSheet/dropDowns/updateAll',
            checkAuth([]),
            dropDowns.get_dropDowns_updateAll)

module.exports = router;


