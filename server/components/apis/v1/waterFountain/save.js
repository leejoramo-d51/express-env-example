/**
 * :formName Routes
 *
 * the routes for displaying, filling out new forms, editing old forms
 *
 **/

const schema = require('./schema_waterfountain.json')

const config = require('../../../../../config')
const { log, banner } = require('../../../../../lib/logger')
const sheet = require('../../../../../lib/sheet')
const tools = require('../../../../../lib/tools')
// const fs = require('fs')

// Setup connection to smartsheet
const client = require('smartsheet')
const smartsheet = client.createClient(
    config.smartSheetClientConfig
)

const usedColumns = Object.keys(schema.idToName)

/**
 * get route permissions
 */

/*
    TODO: enable permission checks
    const requriedPermissionRoutes = req.session.requriedPermissionRoutes
    const grantedPermissionToRoutes = req.session.grantedPermissionToRoutes
*/
const requriedPermissionRoutes = ['waterFountain']
const grantedPermissionToRoutes = ['waterFountain']

function getRoutePermissions(formName) {
    const viewRoute = '/' + formName + '/view/[0-9]+'
    let hasView = false
    if (requriedPermissionRoutes.includes(viewRoute)) {
        if (grantedPermissionToRoutes.includes(viewRoute)) {
            hasView = true
        }
    } else {

        hasView = true
    }
    // TODO: `updateRoute` not used here
    const updateRoute = '/' + formName + '/update/[0-9]+'
    let hasUpdate = false
    if (requriedPermissionRoutes.includes(updateRoute)) {
        if (grantedPermissionToRoutes.includes(updateRoute)) {
            hasUpdate = true
        }
    } else {
        hasUpdate = true
    }

    return {
        viewRoute: viewRoute,
        hasView: hasView,
        updateRoute: updateRoute,
        hasUpdate: hasUpdate
    }
}

/**
 * Routes
 */

module.exports.get_formName = async function (req, res) {
    // this is the landing page for a form
    // const formName = req.params['formName']
    const formName = req.baseUrl.split('/').pop()
    banner('ROUTE/:formName ' + formName)
    let formFilter = undefined
    if ('formFilter' in req.params) {
        formFilter = req.params['formFilter']
        log('FILTER: ' + formFilter)
        log(JSON.stringify(req.params, null, 4))
    } else {
        formFilter = ''
    }

    let permissions = getRoutePermissions(formName)

    /**
     * call smartsheet api to get sheet
     */
    const options = {
        id: schema['sheetId']
    }
    let sheetInfo = await smartsheet.sheets.getSheet(options)
        .catch(function (error) {
            log('error: get_formName', error)
        })

    /* process returned data */
    let rowData = []
    if (permissions.hasView) {
        for (item in sheetInfo.rows) {
            let cellNameValue = {}
            for (cellPostion in sheetInfo.rows[item].cells) {
                const cell = sheetInfo.rows[item].cells[cellPostion]
                const columnId = `${cell.columnId}`
                if (usedColumns.includes(columnId)) {
                    if ('value' in cell) {
                        const cellName = schema.idToName[cell.columnId]
                        const cellValue = cell.value
                        cellNameValue[cellName] = cellValue
                        if ('displayValue' in cell && cell.value != cell.displayValue) {
                            cellNameValue['displayValue__' + cellName] = cell.displayValue
                        }
                        if ('hyperlink' in cell && 'url' in cell.hyperlink) {
                            cellNameValue['linkValue__' + cellName] = cell.hyperlink.url
                        }

                    }
                    cellNameValue['id'] = sheetInfo.rows[item].id

                }
            }
            if (cellNameValue.school != null) {
                if (formFilter != "" && formFilter.toLowerCase() != cellNameValue.school.toLowerCase()) {
                    continue
                }
            }
            rowData.push(cellNameValue)
        }
    }

    let page = {
        query: req.query,
        grantedPermissionToRoutes: grantedPermissionToRoutes,
        rowData: rowData,
        hasView: permissions.hasView,
        hasUpdate: permissions.hasUpdate,
        formName: formName,
        sheetId: schema['sheetId'],
        formFilter: formFilter,
        baseURL: config.baseURL,
        url: config.baseURL + '/' + formName,
        formFilter: formFilter,
        dateToday: tools.dateToday(),
        session: req.session,
        // userFullName: req.session.userInfo.givenName + ' ' + req.session.userInfo.sn,
        // isProgrammer: req.session.isProgrammer,
        // hasUpdateDropDownsAccess: req.session.hasUpdateDropDownsAccess,
        // message: req.flash('info')
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(page))
}

