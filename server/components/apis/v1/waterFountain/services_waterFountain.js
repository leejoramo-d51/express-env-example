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
    sheet.get_SheetRows(req, res, schema, 'sheet')
}

module.exports.get_row = async function getRow (req, res) {
    sheet.get_SheetRows(req, res, schema, 'row')
}

module.exports.post_row = async function postRow (req, res) {
    sheet.post_row(req, res, schema)
}

module.exports.get_sheetExport = async function sheetExport (req, res) {
    sheet.get_sheetExport(req, res, schema)
}

module.exports.get_userSheetAccess = async function sheetExport (req, res) {
    sheet.get_userSheetAccess(req, res, schema)
}