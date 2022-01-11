/**
 * :formName Routes
 *
 * the routes for displaying, filling out new forms, editing old forms
 *
 **/

const sheet_api = require('../../../../../lib/sheet_api')

const schema = require('./schema_waterfountain.json')

/**
 * Routes
 */

module.exports.get_sheet = async function getSheet (req, res) {
    const action = 'sheet'
    sheet_api.getSheetRows(req, res, schema, action)
}

module.exports.get_row = async function getRow (req, res) {
    const action = 'row'
    sheet_api.getSheetRows(req, res, schema, action)
}

