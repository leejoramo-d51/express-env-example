/**
 * the routes for displaying, filling out new forms, editing old forms
 *
 **/

const fs = require('fs')

const config = require('../config')
const { log, banner } = require('./logger')
const tools = require('./tools')

// Setup connection to smartsheet
const client = require('smartsheet')
// const { sheet } = require('smartsheet/lib/utils/constants')
const smartsheet = client.createClient(
    tools.smartSheetClientConfig()
)



/**
 * GET rows of sheets
 */

module.exports.get_SheetRows = async function (req, res, schema, action) {
    // this is the landing page for a form
    const formName = schema.formName
    banner('getSheetRows ' + formName)

    let result = undefined
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
        result = await smartsheet.sheets.getRow(options)
            .catch(function (error) {
                log('error: get_row', error)
            })
    } else if (action==='sheet') {
        // get sheet detail and rows
        const options = {
            id: schema['sheetId']
        }
        result = await smartsheet.sheets.getSheet(options)
            .catch(function (error) {
                log('error: get_formName', error)
            })
    }
    /* process returned data */
    let rows = []
    if (permissions.hasView) {
        let rowCount = 1
        if (result.hasOwnProperty('rows')) {
            rowCount = result.rows.length
        }
        for (let i = 0; i < rowCount; i++) {
            const rowConfig = {
                filter: filter,
                filterField: filterField
            }
            const row = tools.getRow(i, result, schema, rowConfig)
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
        permalink: result.permalink,
        // userFullName: req.session.userInfo.givenName + ' ' + req.session.userInfo.sn,
        // isProgrammer: req.session.isProgrammer,
        // hasUpdateDropDownsAccess: req.session.hasUpdateDropDownsAccess,
        rowData: rows,
        result: result
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(page))
}

/*
 * GET listSheets
 */

// sheets current users can access
//TODO: I believe the "current user" is ALWAYS the API call "smartsheet.api" user, so this lists all sheets that have been shared to the API Robot
module.exports.get_listSheets = async function(req, res) {
    banner('get_listSheets')
    const options = {
        queryParameters: {
          includeAll: true
        }
      };
    let result = await smartsheet.sheets.listSheets(options)
        .catch(function(error) {
            log(error)
        })
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
}

module.exports.routePermissionsSave = async function(req, res) {
    banner('routePermissionsSave')
    var options = {
        id: config.routePermissionsSheetId
    }

    const raw = await smartsheet.sheets.getSheet(options)
    const data = JSON.stringify(raw, null, 4)
    fs.writeFileSync('./cache/routePermissions2.json', data)
    res.setHeader('Content-Type', 'application/json')
    res.end(data)


}

// all sheets in organization. REQUIRES ADMIN
module.exports.get_listOrganizationSheets = async function(req, res) {
    banner('get_listOrganizationSheets')
    const options = {
        queryParameters: {
          includeAll: true
        }
      };
    let result = await smartsheet.sheets.listOrganizationSheets(options)
        .catch(function(error) {
            log(error)
        })
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
}

module.exports.get_sheetExport = async function (req, res, schema) {
    // this is the landing page for a form
    const formName = schema.formName
    const sheetId = schema.sheetId
    banner(`get_sheetExport ${formName}`)

    // Set options
    var options = {
        id: sheetId,
        include: [
                  "attachments",
                  "crossSheetReferences",
                  "discussions",
                  "filters",
                  "filterDefinitions",
                  "format",
                  "ganttConfig",
                  "objectValue",
                  "ownerInfo",
                  "summary"
                ],
        level: 1

    }
    // Get sheet
    let result = await smartsheet.sheets.getSheet(options)
        .catch(function (error) {
            logger.error('get_formName_export error: \n' + error)
        })
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify(result))

}

module.exports.get_userSheetAccess = async function(req, res, schema) {
    const formName = schema.formName
    const sheetId = schema.sheetId
    //TODO: use Session `${req.session.userInfo.mail}`
    const userEmail = 'lee.joramo@d51schools.org'
    const options = {
        id: sheetId,
        assumeUser: userEmail,
        queryParameters: {
          includeAll: true
        }
      }

    let result = await smartsheet.sheets.getSheet(options)

      .catch(function(error) {
        // const accessLevel = 'NoAccess'
        // accessLevel = `${error.message} - ${error.statusCode}:${error.errorCode}`
        // res.send(accessLevel)
      });

    const accessLevel = result.userPermissions
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(accessLevel))
}

/**
 * POST row to sheet
 */
module.exports.post_row = async function(req, res, schema) {
    //NOTES: in additon to `body`, `data` can also contain `params` and `query`
    //TODO: should we deal with params and query here too?
    let data = tools.requestData(req).body
    let rowId = data.rowId
    delete data.rowId
    const fieldsConfig = schema.fields
    let formArray = []
    let key
    for (key in data) {
        // skip `displayValue__` and `linkValue__`
        // these are meta data for other fields and will be bound to them below
        if (key.indexOf('displayValue__') > -1) {
            continue
        }
        if (key.indexOf('linkValue__') > -1) {
            continue
        }

        if (fieldsConfig[key].widgetType == 'checkbox') {
            if ([1, true, 'true', 'on'].includes(form.data[key])) {
                data[key] = true
            } else {
                data[key] = false
            }
        }
        if (data[key] instanceof Array) {
            data[key] = data[key].join(', ')
        }
        let cell = {
            'columnId': fieldsConfig[key].smartsheetId}
        if (fieldsConfig[key].hasOwnProperty('formula')) {
            cell['formula'] = fieldsConfig[key].formula
        } else if (data.hasOwnProperty('displayValue__'+key)) {
            cell['value'] = data[key]
            cell['displayValue'] = data['displayValue__'+key]
        } else if (data.hasOwnProperty('linkValue__'+key)) {
            cell['value'] = data[key]
            if (data['linkValue__'+key] != '') {
            cell['hyperlink'] = {'url': data['linkValue__'+key] }
            }
        } else if (fieldsConfig[key].hasOwnProperty('viewForm')) {
            cell['value'] = ''
            formHasViewLink = key
        } else if (fieldsConfig[key].hasOwnProperty('urlForm')) {
            cell['value'] = ''
            formHasUrlLink = key
        } else {
            cell['value'] = data[key]
        }

        formArray.push(cell)
    }



//    const rowOptions = {
//        type: 'POST',
//        path: req._parsedOriginalUrl.path,
//        reqDate: data,
//        formArray: formArray,
//        schema: schema
//    }

    const rowOptions = {
        sheetId: schema.sheetId,
        body: [{
            id: rowId,
            cells: formArray
        }]
    }
    log(rowOptions)

    let result = await smartsheet.sheets.updateRow(rowOptions)
        .catch(function (error) {
            log('error: get_formName', error)
        })

    log(result)
    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify(result))
}
