/*
 * library for smartsheet dropdown menu updates
 */

const config = require('../config')
const {log, banner} =  require('./logger')
const tools = require('./tools')
const client = require('smartsheet')
const Database = require('better-sqlite3')
const papa = require("papaparse")

const smartsheet = client.createClient(
        tools.smartSheetClientConfig()
      )
//TODO: setup permissions
//TODO: const currentUserEmail = req.session.userInfo.mail
const currentUserEmail = 'lee.joramo@d51schools.org'
//TODO: const hasUpdateDropDownsAccess = req.session.hasUpdateDropDownsAccess
const hasUpdateDropDownsAccess = true


function sheetNameHasUpdateMarker(sheetName) {
    // sheet names that end with # will be checked for update tags
    let regex = /.+ #/g
    return regex.test(sheetName)
}

function extractUpdateCode(s) {
    // given a string a regex will find if it has an update instruction in the format
    // #update(CODE_SUBCODE)
    // where "CODE" is the type of update for example "Location"
    // and "SUBCODE" is and optional modifier such as 'edu' or 'adm"
    let reUpdate = /#update[(]([a-z0-9]+)(_([a-z0-9]+))?[)]/g
    let arr = reUpdate.exec(s.toLowerCase())
    let updateCodes = null
    if (arr) {
        updateCodes = [arr[1], arr[3]]
    }
    return updateCodes
}

function sqlCleanColumnName (str) {
    return str.replace(/[\W_]+/gm, "_").toLowerCase()
}

async function setupTable(db, sheetName, sheetId) {
    let startTableSetup = new Date()


    // Set options
    var options = {
        id: sheetId // Id of Sheet
    };

    // Get sheet
    const response = await smartsheet.sheets.getSheetAsCSV(options)
    const dropDownData = papa.parse(response, {
        header: false
    })
    const tableColumnsNames = dropDownData.data[0].map(x => sqlCleanColumnName(x))
    const tableColumnsCreate = tableColumnsNames.join(' TEXT, ')+' TEXT'
    const sqlParameters = '?, '.repeat(tableColumnsNames.length).slice(0, -2)
    const tableColumnCount = tableColumnsNames.length

    let sql = `DROP TABLE IF EXISTS ${sheetName}`
    let stmt = db.prepare(sql)
    let dbResponse = await stmt.run()

    sql = `CREATE TABLE ${sheetName}( ${tableColumnsCreate} )`
    log(sql)
    stmt = db.prepare(sql)


    dbResponse = await stmt.run()
    sql = `INSERT INTO "${sheetName}"(${tableColumnsNames.join(', ')}) VALUES (${sqlParameters})`
    const insert = db.prepare(sql)
    const insertMany = db.transaction((rows) => {
        for (const row of rows) {
            if (row.length == tableColumnCount) {
                insert.run(row)
            } else {
                // log(row)
            }
        }
    })
    dropDownData.data.shift()
    insertMany(dropDownData.data)

    sql = `SELECT * FROM ${sheetName}`
    sqlPrepared  = db.prepare(sql)
    dbResponse = await sqlPrepared.all()

    let endTableSetup = new Date()
    log(`${sheetName} setup time: ${Math.abs(endTableSetup - startTableSetup)}`)

    return true
}


async function setupDropdownDatabase(db) {
    let tablesToUpdate = []
    for (const [sheetName, sheetId] of Object.entries(config.dropdownSheets)) {
        tablesToUpdate.push({
            sheetName: sheetName,
            sheetId: sheetId
        })
    }
    const promises = tablesToUpdate.map(
        sheet => setupTable(
            db, sheet.sheetName, sheet.sheetId
        )
    )
    await Promise.all(promises).then(function(values) {
        // log(JSON.stringify(values, null, 4))
    })
    return true
}

async function getPickList(db, table, search=null) {
    try {
        if (search == null) {
            // get all dropdown options for this table
            sql = `SELECT DISTINCT dropdown from ${table} ORDER BY sortorder, dropdown`
        } else {
            // get only dropdown options that meet search criteria
            sql = `SELECT DISTINCT dropdown FROM ${table} WHERE search LIKE '%~${search}%' ORDER BY sortorder, dropdown`
        }
        sqlPrepared = db.prepare(sql)
        dbResponse = await sqlPrepared.all()
        let dropdownArray = []
        for (let i = 0, iMax = dbResponse.length; i < iMax; i++) {
            dropdownArray.push(dbResponse[i]['dropdown'])
        }
        return dropdownArray
    } catch(err) {
        log(`Error getPickList: ${err}`)
        return null
    }
}

async function getContactList(db, table, search=null) {
    try {

        // get all dropdown options for this table
        if (search == null) {
            // get all dropdown options for this table
            sql = `
                SELECT DISTINCT name, email
                FROM ${table}
                WHERE name IS NOT NULL
                  AND email IS NOT NULL
                  AND name <> ''
                  AND email <> ''
                ORDER BY sortorder, name`
        } else {
            // get only dropdown options that meet search criteria
            sql = `SELECT DISTINCT name, email FROM ${table} WHERE search LIKE '%~${search}%' ORDER BY sortorder, name`
        }
        sqlPrepared = db.prepare(sql)
        dbResponse = await sqlPrepared.all()
        let dropdownArray = []
        for (let i = 0, iMax = dbResponse.length; i < iMax; i++) {
            contactPerson = {
                "name": dbResponse[i]['name'],
                "email": dbResponse[i]['email']
            }
            dropdownArray.push(contactPerson)
        }
        return dropdownArray
    } catch(err) {
        log(`Error getContactList: ${err}`)
        return null
    }
}


module.exports.listSheetsWithDropDowns = async function (req, res) {
    // landing page for updating smartsheet dropdowns
    const formName = 'listSheetsWithDropDowns'
    banner(formName)
    const options = {
        assumeUser: currentUserEmail,
        queryParameters: {
          includeAll: true
        }
      };
    const result = await smartsheet.sheets.listSheets(options)
    .catch(function(error) {
        log(error);
        return error
    });

    let updateableSheets = []
    for (sheetIndex in result.data) {
        const currentSheet = result.data[sheetIndex]
        if (currentSheet.accessLevel == 'VIEWER') {
            continue
        }
        if (sheetNameHasUpdateMarker(currentSheet.name)) {
            updateableSheets.push(currentSheet)
        }
    }

    updateableSheets.sort(
        (a,b) => (b.modifiedAt > a.modifiedAt)
        ? 1 : ((a.modifiedAt > b.modifiedAt)
        ? -1 : 0)
    )

    // set non-default page values

    const data = {
        formName: formName,
        hasView: true,
        url: config.baseURL+'/'+formName,
        query: req.query,
        dateToday: tools.dateToday(),
        hasUpdateDropDownsAccess: hasUpdateDropDownsAccess,
        sheets: updateableSheets,
        //TODO: probably do not need to send 'session' and 'locals'
        session: req.session,
        locals: res.locals
        // TODO: not sure these are needed
        // TODO: grantedPermissionToRoutes: req.session.grantedPermissionToRoutes,

    }
    return data


}

async function getSheetColumns(sheetId, owner) {
    // get the meta data for the sheets columns
    const options = {
        assumeUser: `${owner}`,
        sheetId: sheetId
    }
    const response = await smartsheet.sheets.getColumns(options)
    const columns = await response
    return columns
}

async function updateDropdowns(db, sheetId, owner) {
    // either there is NO owner restriction in place or
    // this sheet is owned by the restrictToOwnerEmail
    const columns = await getSheetColumns(sheetId, owner)
    let updateCodesUsed = []
    for (let j = 0, jMax = columns.data.length; j < jMax; j++) {
        column = columns.data[j]
        const dropdownTypes = config.dropdownTypes
        if (dropdownTypes.includes(column.type)) {

            if ('description' in column) {
                // check to see if the description contains a update tag
                let toUpdate = extractUpdateCode(column.description)
                if (toUpdate) {
                    updateCodesUsed.push(toUpdate[0])
/*                     if (!data.sheetColumnUpdates[sheetId]) {
                        data.sheetColumnUpdates[sheetId] = columns
                    } */
                    const table = toUpdate[0]
                    const options = {
                        sheetId: sheetId,
                        columnId: column.id,
                        assumeUser: `${owner}`,
                        body: {
                            type: column.type,
                        }
                    }

                    const search = toUpdate[1]
                    let dropdownArray = null

                    // there are two types of lists PICKLIST and CONTACT_LIST
                    // CONTACT_LIST's contain a persons name and email
                    if (column.type == 'PICKLIST') {
                        dropdownArray = await getPickList(db, table, search)
                        options.body.options = dropdownArray
                    } else if (column.type == 'CONTACT_LIST') {
                        dropdownArray = await getContactList(db, table, search)
                        options.body.contactOptions = dropdownArray
                    }
                    if (dropdownArray == null) {
                        continue
                    }
                    column['optionsNew'] = dropdownArray
                    //logger.debug('now updateColumn')
                    //logger.debug(JSON.stringify(options, null, 4))
                    smartsheet.sheets.updateColumn(options)
                    .then((value) => {
                        flash.req('success_messages', `updated ${column.id}`)
                        // logger.debug('success')
                        // logger.debug(JSON.stringify(value, null, 4))
                    })
                    .catch((error) => {
                        /* FIXME: catch bad email error and report to user

                            Appears to user that update was successful
                            Actually fails to update

                            Error returned:
                                {
                                    "statusCode": 400,
                                    "errorCode": 1156,
                                    "message": "Invalid email",
                                    "refId": "14dy6949r0uxq"
                                }

                            Example bad email - a **space** in the domain name:
                                {
                                    "name": "Robyn Carmine",
                                    "email": "robyn.carmine@d51 schools.org"
                                },

                        */

                        log(`fail ${sheetId}`)
                        log(JSON.stringify(error, null, 4))
                        log(JSON.stringify(dropdownArray, null, 4))

                    })
                }
            }
        } else {
            // log(`not the correct type: ${column.type}`)
            continue

        }
    }
}



module.exports.runUpdateOne = async function (sheetId, owner) {
    const db = new Database(config.sqlite.dropdownStorage)
    await setupDropdownDatabase(db)
    await updateDropdowns(db, sheetId, owner)
    const dbClosed = await db.close((err) => {
        if (err) {
            log(console.error(err.message))
        }
        log('Close the database connection.');
    })

    return {
        'count': 1
    }
}



module.exports.runUpdateAll =  async function (req, res) {
    // update all dropdowns for current user
    //TODO: remove failover to 'lee.joramo'
    // const currentUser = req.session.userInfo.mail
    const currentUser = 'lee.joramo@d51schools.org'
    const db = new Database(config.sqlite.dropdownStorage)
    await setupDropdownDatabase(db)
    let options = {
        assumeUser: currentUser,
        queryParameters: {
            includeAll: true
        }
    }
    const sheetList = await smartsheet.sheets.listSheets(options)
    async function updateSheets(sheetList) {
        let sheetsIdsToUpdate = []
        for (sheetIndex in sheetList.data) {
            const currentSheet = sheetList.data[sheetIndex]
            const sheetName = currentSheet.name
            const hasOwnerAccess = ['OWNER'].includes(currentSheet.accessLevel)
            const hasUpdateMarker = sheetNameHasUpdateMarker(sheetName)
            if (hasOwnerAccess && hasUpdateMarker) {
                //TODO: remove 'chicken' filter
                if (sheetName.toLowerCase().includes('chicken')) {
                    sheetsIdsToUpdate.push([currentSheet.id])
                }
            }
        }
        const promises = sheetsIdsToUpdate.map(sheetId => updateDropdowns(db, sheetId, currentUser))
        await Promise.all(promises).then(function(values) {})
        return {
            'count': promises.length
        }
    }

    let updateCount = await updateSheets(sheetList)
    req.flash('success_messages', `Updated ${updateCount} sheets`)
    // close the database connection
    const dbClosed = await db.close((err) => {
        if (err) {
            return console.error(err.message)
        }
    })

}