/**
 * the routes for displaying, filling out new forms, editing old forms
 *
 **/

const config = require('../config')
const { log, banner } = require('./logger')
// const sheet = require('./sheet')
const tools = require('./tools')

// Setup connection to smartsheet
const client = require('smartsheet')
// const { sheet } = require('smartsheet/lib/utils/constants')
const smartsheet = client.createClient(
    config.smartSheetClientConfig
)



/**
 * Routes
 */

module.exports.getSheetRows = async function (req, res, schema, action) {
    // this is the landing page for a form
    const formName = schema.formName
    banner('ROUTE/:formName ' + formName)

    let smartSheetAPIResult = undefined
    let options = undefined

    /**
     * get route permissions

        TODO: enable permission checks
        const requiredPermissionRoutes = req.session.requiredPermissionRoutes
        const grantedPermissionToRoutes = req.session.grantedPermissionToRoutes
    */
    const routePermissions = {
        required: [formName],
        granted: [formName]
    }
    let permissions = tools.getRoutePermissions(formName, routePermissions)

    /** Filters */
    let filter = req.params.filter ?? ''
    let filterField = req.params.filterField ?? ''


    /**
     * call smartsheet api to get sheet
     */

    if (action==='row') {
        // get individual row detail
        options = {
            sheetId: schema['sheetId'],
            rowId: req.params.rowId,
            queryParameters: {
                include: "writerInfo,rowPermalink,discussions",
                includeAll: true
            }
        }
        smartSheetAPIResult = await smartsheet.sheets.getRow(options)
            .catch(function (error) {
                log('error: get_row', error)
            })
    } else if (action==='sheet') {
        // get sheet detail and rows
        const options = {
            id: schema['sheetId']
        }
        smartSheetAPIResult = await smartsheet.sheets.getSheet(options)
            .catch(function (error) {
                log('error: get_formName', error)
            })
    }
    /* process returned data */
    let rows = []
    if (permissions.hasView) {
        let rowCount = 1
        if (smartSheetAPIResult.hasOwnProperty('rows')) {
            rowCount = smartSheetAPIResult.rows.length
        }
        for (let i = 0; i < rowCount; i++) {
            const rowConfig = {
                filter: filter,
                filterField: filterField
            }
            const row = tools.getRow(i, smartSheetAPIResult, schema, rowConfig)
            if (row){
                rows.push(row)
            }
        }
    }

    let page = {
        formName: formName,
        sheetId: schema['sheetId'],
        query: req.query,
        formFilter: filter,
        session: req.session,
        grantedPermissionToRoutes: routePermissions.granted,
        hasView: permissions.hasView,
        hasUpdate: permissions.hasUpdate,
        baseURL: config.baseURL,
        url: config.baseURL + '/' + formName,
        dateToday: tools.dateToday(),
        permalink: smartSheetAPIResult.permalink,
        // userFullName: req.session.userInfo.givenName + ' ' + req.session.userInfo.sn,
        // isProgrammer: req.session.isProgrammer,
        // hasUpdateDropDownsAccess: req.session.hasUpdateDropDownsAccess,
        // message: req.flash('info')
        rowData: rows,
        smartSheetAPIResult: smartSheetAPIResult
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(page))
}

