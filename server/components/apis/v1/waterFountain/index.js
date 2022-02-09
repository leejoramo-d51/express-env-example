'use strict';


const express = require('express')
const api_waterFountain = require('./services_waterfountain')
const z_demo_service_waterFountain = require('./z_demo_services_waterFountain')

const myroute = 'waterFountain'

let router = express.Router()

router.get('/', api_waterFountain.get_sheet)
router.get('/filter/:filterField/:filter', api_waterFountain.get_sheet)
router.get('/update/:rowId', api_waterFountain.get_row)
router.post(
    '/update',
    api_waterFountain.post_row)
router.get('/export', api_waterFountain.get_sheetExport)
router.get('/userAccess', api_waterFountain.get_userSheetAccess)


router.get('/fakeJSON', z_demo_service_waterFountain.getData)
router.get('/:id', z_demo_service_waterFountain.getDataAttribute)
router.get('/:id/:rowId', z_demo_service_waterFountain.getDataAttribute)


module.exports = router