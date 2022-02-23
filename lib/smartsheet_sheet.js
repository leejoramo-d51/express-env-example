/**
 * the routes for displaying, filling out new forms, editing old forms
 *
 **/

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

 module.exports.get_Schema = async function (req, res, schema) {
    const formName = schema.formName
    banner('getSchema ' + formName)
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(schema))
}

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

let updateLink = async function(sheetId, columnId, rowId, formName, rawLink = false ) {
    banner('FUNCTION.sheet.updateLink')
    // Examples of parameter values
    // rowId = 6764853564073860
    // sheetName = 'athleticsTravel'
    // sheetId = 5025400171587460
    // columnId = 7229602323031940
    let url = config.baseURL+'/'+formName+'/view/'+rowId
    // linkName is the visable text in the cell. If `rawLink === true`
    // display the actual URL
    let linkName = 'view'
    if (rawLink) {
        linkName = url
    }

    const row = [
        {
            'id': rowId,
            'cells': [
                {
                    'columnId': columnId,
                    'value': linkName,
                    'hyperlink': {'url': url }
                }
            ]
        }
    ]
    const options = {
        sheetId: sheetId,
        body: row
    }

    return await smartsheet.sheets.updateRow(options)
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
    banner('post_row')
    //NOTES: in additon to `body`, `data` can also contain `params` and `query`
    //TODO: should we deal with params and query here too?
    //TODO: server side validation
    let data = tools.requestData(req).body
    const rowId = data.rowId ?? ''
    delete data.rowId
    const parentId = data.rowParentId ?? ''
    delete data.rowParentId
    let returnCode = ''
    const sheetId = schema.sheetId
    let fields = schema.fields
    let rowOptions = {
        sheetId: sheetId
    }
    let urlView = ''
    let urlRaw = ''
    let cellsData = []

    let key
    // BUG: should be looping over schema !!!!!
    for (key in data) {
        // skip `__displayValue` and `__hyperlink`
        // these are meta data for other fields and will be bound to them below
        if (key.indexOf('__displayValue') > -1) {
            continue
        }
        if (key.indexOf('__hyperlink') > -1) {
            continue
        }

        // security checks for writing to smartsheet from public submissions
        let value
        if (fields.hasOwnProperty(key)) {
            if (fields[key].security.includes('write')) {
                value = data[key]
            } else {
                log(`schema.fields does not allow write for key: ${key}`)
                continue
            }
        } else {
            log(`schema.fields does not have key: ${key}`)
            contine
        }


        if (fields[key].widgetType == 'checkbox') {
            if ([1, true, 'true', 'on'].includes(value)) {
                value = true
            } else {
                value = false
            }
        }
        if (value instanceof Array) {
            value = value.join(', ')
        }
        let cell = {
            'columnId': schema.nameToId[key]}
        if (fields[key].hasOwnProperty('formula')) {
            cell['formula'] = fields[key].formula
        } else if (data.hasOwnProperty(key+'__displayValue')) {
            cell['value'] = value
            cell['displayValue'] = data[key+'__displayValue']
        } else if (data.hasOwnProperty(key+'__hyperlink')) {
            cell['value'] = value
            // TODO: smartsheet cells have independent value *and* link
            // Note: defaulting to making these the same but there maybe other use cases
            if (data[key+'__hyperlink'] != '') {
                cell['hyperlink'] = {'url': value }
            }
        } else if (fields[key].hasOwnProperty('urlView')) {
            cell['value'] = ''
            urlView = key
        } else if (fields[key].hasOwnProperty('urlRaw')) {
            cell['value'] = ''
            urlRaw = schema.nameToId[key]
        } else {
            cell['value'] = value
        }
        cell['strict'] = false

        cellsData.push(cell)
    }


    // Make API call to Create or Update the row
    if (rowId === '') {
        // Create a Row
        if (parentId === '') {
            // This is a regular row. NOT a Child.
            rowOptions['body'] =  [{'toTop': true, 'cells': cellsData }]
        } else {
            // TODO: Test creating row attached to parent
            // This is a Child row. It will be grouped with a Parent row
            rowOptions['body'] =  [{'parentId': parentId, 'toBottom': true, 'cells': cellsData }]
        }

        if (schema.saveFile) {
            //TODO: Test saving file
            //TODO: Test reading file and submitting to smartsheet
            log('---- save the file')
            let data = JSON.stringify(rowOptions, null, 4)
            fs.writeFileSync(`./submissions/${uuidv4()}.json`, data)
            return
        } else {
            // send to smartsheet api
            returnCode = await smartsheet.sheets.addRows(rowOptions)
        }
    } else {
        // Update existing row
        rowOptions['body'] =   [{'id': rowId, 'cells': cellsData }]

        log('in sheet.save rowOptions: ')
        log(JSON.stringify(rowOptions, null, 4))
        log('~ smartsheet.sheets.updateRow(rowOptions)')
        returnCode = await smartsheet.sheets.updateRow(rowOptions)
    }
    if (urlView !== '')  {
        const columnId = urlView
        await updateLink(sheetId, columnId, rowId, schema.formName, rawLink = false )
    }
    if (urlRaw !== '')  {
        const columnId = urlRaw
        await updateLink(sheetId, columnId, rowId, schema.formName, rawLink = true )
    }
    const result = {
        type: 'POST',
        path: req._parsedOriginalUrl.path,
        reqDate: data,
        cellsData: cellsData,
        schema: schema,
        returnCode: returnCode
    }


    console.log(data)
    res.setHeader('Content-Type', 'application/json')

    res.end(JSON.stringify(result))
}