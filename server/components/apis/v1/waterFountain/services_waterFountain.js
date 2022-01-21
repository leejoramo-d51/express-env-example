/**
 * :formName Routes
 *
 * the routes for displaying, filling out new forms, editing old forms
 *
 **/

const sheet = require('../../../../../lib/smartsheet_sheet')

const schema = require('./schema_waterfountain.json')

/**
 * Routes
 */

module.exports.get_sheet = async function getSheet (req, res) {
    const action = 'sheet'
    sheet.get_SheetRows(req, res, schema, action)
}

module.exports.get_row = async function getRow (req, res) {
    const action = 'row'
    sheet.get_SheetRows(req, res, schema, action)
}

module.exports.get_sheetExport = async function sheetExport (req, res) {
    sheet.get_sheetExport(req, res, schema)
}

module.exports.get_userSheetAccess = async function sheetExport (req, res) {
    sheet.get_userSheetAccess(req, res, schema)
}