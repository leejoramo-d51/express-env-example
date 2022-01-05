
/**
 *  SmartSheet API functions
 */

 const {log, banner} = require.main.require('./lib/logger')

// load needed async.js
const async = require('async')

const fs = require('fs');

// load uuid
const { v4: uuidv4} = require('uuid')

/**
 * Configuration
 */

const config = require.main.require('./config')
const baseURL = config.baseURL

// Setup connection to smartsheet
const client = require('smartsheet')  // install via: npm install smartsheet
const smartsheet = client.createClient(
    config.smartSheetClientConfig
)



/**
 * Functions
 */


/**
 *  Create view link
 *  Insert a link back to the formMaker view of the sheet row into the row
 *  We can't do this at the time of creation of the row, because the rowId
 *  is not yet known.
 *
 *  This is only used in sheets that require this functionality as specified in the
 *  ./formConfig/FORM.json file with a field with as defined as:
 *
 *     "View": {
 *        "widgetType": "text",
 *        "errorAfterField": true,
 *        "required": false,
 *        "viewForm": true
 *    },
 *
 * */
module.exports.updateLink = async function(sheetId, columnId, rowId, linkType, formName, rawLink = false ) {
    log('FUNCTION.sheet.updateLink')
    // Examples of parameter values
    // rowId = 6764853564073860
    // sheetName = 'athleticsTravel'
    // sheetId = 5025400171587460
    // columnId = 7229602323031940
    let url = baseURL+'/'+formName+'/'+linkType+'/'+rowId
    if (rawLink) {
        linkType = url
    }

    var row = [
        {
            'id': rowId,
            'cells': [
                {
                    'columnId': columnId,
                    'value': linkType,
                    'hyperlink': {'url': url }
                }
            ]
        }
    ]
    // Set options
    var options = {
        sheetId: sheetId,
        body: row
    }
    // Update rows in sheet
    log('~ smartsheet.sheets.updateRow(options)')
    return smartsheet.sheets.updateRow(options)
}

module.exports.updateUUID = async function(sheetId, columnId, rowId) {
    log('FUNCTION.sheet.updateUUID')
    // Examples of parameter values
    // rowId = 6764853564073860
    // sheetName = 'athleticsTravel'
    // sheetId = 5025400171587460
    // columnId = 7229602323031940

    var row = [
        {
            'id': rowId,
            'cells': [
                {
                    'columnId': columnId,
                    'value': uuidv4()
                }
            ]
        }
    ]
    // log('\\UUID\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\\')
    // log(`row: ${JSON.stringify(row, null, 4)}`)

    // Set options
    var options = {
        sheetId: sheetId,
        body: row
    }
    // log(`options: ${JSON.stringify(options, null, 4)}`)
    // Update rows in sheet
    log('~ smartsheet.sheets.updateRow(options)')
    return smartsheet.sheets.updateRow(options)
}

/**
 *  Create Initial Comment
 *
 *  An Initial Comment is saved in a row cell, and as the first comment on the Row
 *
 *  This is only used in sheets that require this functionality as specified in the
 *  ./formConfig/FORM.json file with a field with as defined as:
 *
 *     "Initial Comment": {
 *        "widgetType": "text",
 *        "errorAfterField": true,
 *        "required": false,
 *        "commentForm": true
 *    },
 *
 * */
module.exports.createInitialComment = async function(sheetId, rowId, comment ) {
    log('FUNCTION.sheet.createInitialComment')
    // Examples of parameter values
    // rowId = 6764853564073860
    // sheetId = 5025400171587460
    // comment = 'Please consider my request'

    // Set options
    var options = {
        sheetId: sheetId,
        rowId: rowId,
        body: {
            "comment": {
                "text": comment
            }
        }
    }
    // Update rows in sheet
    log('~ smartsheet.sheets.createRowDiscussion(options)')
    return smartsheet.sheets.createRowDiscussion(options)
}

/**
 *  Create Attachment
 *
 *  An attachment is saved on a row
 *
 *  This is only used in sheets that require this functionality
 *
 *  Unlike most of the other functionality of formMaker in which fields are
 *  defined in ./formConfig/FORM.json, this is setup by including a file
 *  upload field directly in the pug template:
 *
 *  input(type="file" name="fileupload" value="fileupload" id="fileupload")
 *
 *  this is because the file upload is actually handled by its own middleware
 *  for the express.js route.
 *
 *  The above "fileupload" is a required naming convention
 *
 * */
module.exports.createAttachment = async function(sheetId, rowId, fileInfo ) {
    log('FUNCTION.sheet.createAttachment')
    // Examples of parameter values
    // rowId = 6764853564073860
    // sheetId = 5025400171587460
    // fileInfo = {
    //           "fieldname": "fileupload",
    //           "originalname": "test.pdf",
    //           "encoding": "7bit",
    //           "mimetype": "application/pdf",
    //           "destination": "./public/upload/",
    //           "filename": "fileupload-1584127002379-test.pdf",
    //           "path": "public/upload/fileupload-1584127002379-test.pdf",
    //           "size": 312145
    //           }


    // Set options
    let path = `${config.basePath}${fileInfo.path}`
    // log(path)
    let options = {
        sheetId: sheetId,
        rowId: rowId,
        fileSize: fileInfo.size,
        mimeType: "application/pdf",
        fileName: fileInfo.originalname,
        path: path
    }
    // log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
    // log(JSON.stringify(options, null, 4))
    // log('@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@')
    // Update rows in sheet
    log('~ smartsheet.sheets.addRowFileAttachment(options)')
    let saved = await smartsheet.sheets.addRowFileAttachment(options)
    return saved
}


/* Save or Update to SmartSheet */
module.exports.save = async function(sheetId, formData, columns, updateRowId = '', parentId = '', saveFile = false) {
    log('FUNCTION:sheet.save')
    // saves OR updates a row to smartsheet
    // if updateRowId is set, it will update the row instead of creating a new
    // if parentId is set, the row will be added as a child of the parentId
    function makeCells(formData, colMap) {
        var cellData = []
        var arrayLength = formData.length
        for (var i = 0; i < arrayLength; i++) {
            let useCell = false
            var data = formData[i]
            var cell = {}
/*             if (!colMap.hasOwnProperty(data.colMap)) {
                log('colMap does not have ')
                log(data.colMap)
                continue
            } else {
                log('colMap does have ')
            } */
            cell['columnId'] = parseInt(colMap[data.columnId])
            if (!cell['columnId'])  {
                 /*
                   if the cell doesn't have a columnId, it was defined
                   in our formConf .json file but not found as a column
                   in SmartSheet.

                   This could be due to:

                   * Column Name was changed in SmartSheet. We need to fix this

                   * This is a Cell that configures the form operation and
                     is not a SmartSheet column
                */
                continue
            }

            // cells values can be set to either a data value
            // or to a formula that calculates the value
            if (formData[i].hasOwnProperty('formula')) {
                // this is a formula
                if (formData[i].formula !== '') {
                    cell['formula'] = formData[i].formula
                    useCell = true
                }
            } else {
                // this is a data value
                if (formData[i].value == '') {
                    continue
                } else {
                    cell['value'] = formData[i].value
                    useCell = true
                }
                // data values can additionally have a display value that is different
                // from the data value, or a URL hyperlink
                if (formData[i].hasOwnProperty('displayValue')) {
                    if (formData[i].displayValue !== '') {
                        cell['displayValue'] = formData[i].displayValue
                        useCell = true
                    }

                } else if (formData[i].hasOwnProperty('hyperlink')) {
                    if (formData[i].hyperlink !== '') {
                        cell['hyperlink'] = formData[i].hyperlink
                        useCell = true
                    }
                }
            }
            // SmartSheet allows for 'strict' enforcement of valid data
            // this can cause errors. We will validate data using other means.
            // There are more cases were we want to be able to force this programmatically
            // so we will default to turning off SmartSheets enforcement here
            cell['strict'] = false

            if ( useCell ) {

                // log(JSON.stringify(cell, null, 4))
                cellData.push(cell)
            }
        }
        return cellData
    }
    // Get sheet
    var cellsData = makeCells(formData, columns['nameToId'])
    var rowOptions = {}
    rowOptions['sheetId'] = sheetId

    // Make API call to Create or Update the row
    if (updateRowId == '') {
        // Create a Row
        if (parentId == '') {
            // This is a regular row. NOT a Child.
            rowOptions['body'] =  [{'toTop': true, 'cells': cellsData }]
        } else {
            // This is a Child row. It will be grouped with a Parent row
            rowOptions['body'] =  [{'parentId': parentId, 'toBottom': true, 'cells': cellsData }]
        }
        // here now
        log('~ smartsheet.sheets.addRows(rowOptions)')
        // log(JSON.stringify(rowOptions, null, 4))

        if (saveFile) {
            log('---- save the file')
            let data = JSON.stringify(rowOptions, null, 4)
            fs.writeFileSync(`./data_submissions/${uuidv4()}.json`, data)
            return
        } else {
            log('---- send to smartsheet api')
            return smartsheet.sheets.addRows(rowOptions)
        }
    } else {
        // Update existing row
        rowOptions['body'] =   [{'id': updateRowId, 'cells': cellsData }]
        // log('in sheet.save rowOptions: ' + JSON.stringify(rowOptions, null, 4))
        log('in sheet.save rowOptions: ')
        log(JSON.stringify(rowOptions, null, 4))
        log('~ smartsheet.sheets.updateRow(rowOptions)')
        return smartsheet.sheets.updateRow(rowOptions)
    }
}

module.exports.getRows = async function(sheetId) {
    // get all rows of the sheet
    var options = {
        id: sheetId
    }
    log('~ smartsheet.sheets.getSheet(options)')
    return smartsheet.sheets.getSheet(options)
}

module.exports.search = function(sheetId, query='') {
    // get all rows that match the search query
    var options = {
        sheetId: sheetId,
    }
    if (query != '') {
        options['queryParameters'] = {
            query: query
        }
    }
    log('~ smartsheet.search.searchSheet(options)')
    return smartsheet.search.searchSheet(options)
}

var getRow = function(sheetId, rowId) {
    // gets a specific row from a smartsheet
    var options = {
        sheetId: sheetId,
        rowId: rowId,
        queryParameters: {
            include: "writerInfo,rowPermalink,discussions",
            includeAll: true
        }
    }
    log('~ smartsheet.sheets.getRow(options)')
    return smartsheet.sheets.getRow(options)
}

module.exports.getRow = getRow

async function getRowAndComments(sheetId, rowId) {
    // gets a specific row from a smartsheet
    var options = {
        sheetId: sheetId,
        rowId: rowId,
        queryParameters: {
            include: "writerInfo,rowPermalink,discussions,comments,attachements",
            includeAll: true
        }
    }
    log('~ smartsheet.sheets.getRow(options)')
    let data = await smartsheet.sheets.getRow(options)
    log('~ smartsheet.sheets.getRowDiscussions(options)')
    data.comments = await smartsheet.sheets.getRowDiscussions(options)

    // log(JSON.stringify(comments, null, 4))
    return data
}
module.exports.getRowAndComments = getRowAndComments


var getColumnMetaData = function(data) {
    // setup column name to id mappings
    var columns = {
        raw: {},       // raw meta-data for columns as returned by SmartSheets
        nameToId: {},  // maps column name to id
        idToName: {}   // maps column id to name
    }
    columns['raw'] = data
    var arrayLength = data.data.length
    var item
    for (var i = 0; i < arrayLength; i++) {
        item = data.data[i]
        columns['nameToId'][item.title] = item.id
        columns['idToName'][item.id] = item.title
        if ('primary' in item && item.primary) {
            columns.primaryId = item.id
        }
    }
    banner('getColumnMetaData')
    log(JSON.stringify(columns, null, 4))
    return columns

}
module.exports.getColumnMetaData = getColumnMetaData



module.exports.setPrimaryColumn = function(formName, value='abc123') {
    // get all rows that match the search query
    sheetId = config.sheetId[formName]
    var options = {
        sheetId: sheetId
    }

    options['queryParameters'] = {
        query: 'NeedsTitle'
    }

    async.waterfall([
        function(callback) {
            // request any rows that have the have query matches
            log('~ smartsheet.search.searchSheet(options)')
            smartsheet.search.searchSheet(options)
            .then(function(data) {
                callback(null, {searchResults: data})
            })
            .catch(function(error) {
                callback(error)
            })
        },
        function(myData, callback) {
            // if the query had no results raise and console.error
            // if there are results collect the rowIds and continue
            var error = null
            var rowIds = []
            results = myData.searchResults.results
            if (results.length == 0) {
                error = 'No Rows Found'
            } else {
                for (var i=0; i < results.length; i++ ) {
                    rowId = results[i]['objectId']
                    rowIds.push(rowId)
                }
            }
            myData.rowIds = rowIds
            callback(error, myData)
        },
        function(myData, callback) {
            // gather meta data of sheet columns
            log('~ smartsheet.sheets.getColumns({sheetId : sheetId})')
            smartsheet.sheets.getColumns({sheetId : sheetId})
            .then(function(data) {
                // log(JSON.stringify(data, null, 4))
                let columns = getColumnMetaData(data)
                // log(JSON.stringify(columns, null, 4))
                myData.primaryId =  columns['primaryId']
                myData.titleFormulaId = columns['nameToId']['Primary Column Formula']
                callback(null, myData)
            })
            .catch(function(error) {
                callback(error)
            })
        },
        function(myData, callback) {
            // use the rowId's that match the search criteria
            // use api calls to fetch the value of each rows 'Primary Column Formula'
            // build an array that will be used to update each rows Primary column
            let rowIds = myData.rowIds
            async.concat(rowIds, function(thisRowId, callback) {
                getRow(sheetId, thisRowId)
                .then (function(data) {
                    for (var j=0; j < data.cells.length; j++) {
                        cell = data.cells[j]
                        if (cell.columnId == myData.titleFormulaId) {
                            // log('  this is it!')
                            callback(null, {
                                'id': thisRowId,
                                'cells': [
                                    {
                                        'columnId': myData.primaryId,
                                        'value': cell.value
                                    }
                                ]
                            })
                        }
                    }
                })

            }, function(error, rows) {
                myData.rowsToUpdate = rows
                callback(null, myData)
            })

        },
        function(myData, callback) {
            // use the array we built to update the rowId's primary columns.
            var options = {
                sheetId: sheetId,
                body: myData.rowsToUpdate
            }
            log('~ smartsheet.sheets.updateRow(options)')
            smartsheet.sheets.updateRow(options)
            .then(function(data) {
                myData.finalResults = data
                callback(null, myData)
            })
            .catch(function(error) {
                callback(error)
            })
        },
    ], function(error, myData) {
        // done! report any errors or do other clean up work.
        log('ran setPrimaryColumn for '+ formName )
    })

}


module.exports.userSheetAccess = async function(formName, userEmail) {

    let sheetId = config.sheetId[formName]
    let options = {
        id: sheetId,
        assumeUser: userEmail,                   // `${req.session.userInfo.mail}`,
        queryParameters: {
          includeAll: true
        }
      }
    let accessLevel = 'NoAccess'
    // log(`${formName}/userAccess`)
    log('~ smartsheet.sheets.getSheet(options)')
    await smartsheet.sheets.getSheet(options)
      .then(function(sheetInfo) {
        accessLevel = sheetInfo.userPermissions.summaryPermissions
        // log(JSON.stringify(accessLevel, null, 4))

      })
      .catch(function(error) {
        accessLevel = `${error.message} - ${error.statusCode}:${error.errorCode}`


      })
      return accessLevel
}



module.exports.routePermissions = async function() {
    log('sheet.routePermissions')
    var options = {
        id: config.routePermissionsSheetId
    }
    // TODO setup caching
    log('~ sheet.routePermissions')
    let perms = await smartsheet.sheets.getSheet(options)
    let data = perms
    return data

}

module.exports.routePermissionsSave = async function() {
    log('sheet.routePermissionsSave')
    var options = {
        id: config.routePermissionsSheetId
    }
    // TODO setup caching

    let raw = await smartsheet.sheets.getSheet(options)
    let data = JSON.stringify(raw, null, 4)
    fs.writeFileSync('./data/routePermissions.json', data)
    log('saved ./data/routePermissions.json')


}

module.exports.routePermissionsRead =  function() {
    log('sheet.routePermissionsRead')
    let raw = fs.readFileSync('./data/routePermissions.json')
    let data = JSON.parse(raw)
    return data


}

module.exports.submitJSONtoSmartSheet =  function() {
    log('sheet.submitJSONtoSmartSheet')
    let submission = {
        "sheetId": 8040335361238916,
        "body": []
    }
    let files = fs.readdirSync('./data_submissions/');

    if (files.length === 0) {
        log('no records found to submit to smartsheet')
    } else {
        for (const file of files) {
            let raw = fs.readFileSync(`./data_submissions/${file}`)
            let data = JSON.parse(raw)
            submission.body.push(data.body[0])
        }
        log(JSON.stringify(submission, null, 4))
        log(`records to submit to smartsheet: ${files.length}`)
        smartsheet.sheets.addRows(submission)
            .then(function(newRows) {
                for (const file of files) {
                    try {
                        fs.unlinkSync(`./data_submissions/${file}`)
                    } catch(error) {
                        log(error)
                    }
                }

            })
            .catch(function(error) {
                log(error);
            });
    }

}




