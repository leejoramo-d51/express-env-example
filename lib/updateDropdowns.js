// const fetch = require("node-fetch")
const config = require('./config')
const logger = config.logger
const client = require('smartsheet')
const Database = require('better-sqlite3');
const papa = require("papaparse")
require('dotenv').config()

const smartsheet = client.createClient(
    config.smartSheetClientConfig
)

const dropdownSheets = {
    'location': '824489438144388',
    'software': '5661822436042628',
    'mentors': '8664983492945796',
    'newhires': '3608848134104964',
    'positions':'7008946041972612'
}

const allowedOwners = [
    "lee.joramo@d51schools.org",
    "smartsheet.api@d51schools.org",
    "deanna.vandermeer@d51schools.org"
]

const dropdownTypes = ['PICKLIST', 'CONTACT_LIST']

const minLogLevel = 4

let updateCodesUsed = []

// basic logging
function prettyLog(toLog, logLevel=0) {
    if (logLevel > minLogLevel) {
        logger.debug(JSON.stringify(toLog, null, 4))
    }
}

function sqlLogger(toLog) {
    //logger.debug('~SQL~~~~~~~~~~~~~~~~')
    //logger.debug(toLog)
    //logger.debug('~//~~~~~~~~~~~~~~~~~')
}



function getKeyByValue(object, value) {
    return Object.keys(object).find(key => object[key] === value);
  }

function sqlCleanColumnName (str) {
    return str.replace(/[\W_]+/gm, "_").toLowerCase()
}

function hasAllowedOwner(sheetOwner) {
    return (allowedOwners.indexOf(sheetOwner) > -1)
}

function sheetNameHasUpdateMarker(s) {
    // sheet names that end with # will be checked for update tags
    let reUpdateMarker = /.+[#]/g
    return reUpdateMarker.test(s)
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



let data = {}

//NOTES: used in runUpdateAll
async function getCurrentUser(data) {
    // get the user that is associated with the apiKey
    const response = await smartsheet.users.getCurrentUser()
    data['currentUser'] = await response
    return data
}

//NOTES: used in setupDropdownDatabase
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
    stmt = db.prepare(sql)


    dbResponse = await stmt.run()
    sql = `INSERT INTO "${sheetName}"(${tableColumnsNames.join(', ')}) VALUES (${sqlParameters})`
    const insert = db.prepare(sql)
    const insertMany = db.transaction((rows) => {
        for (const row of rows) {
            if (row.length == tableColumnCount) {
                //logger.debug(`${sheetName} ${row.length}, ${tableColumnCount}`)
                //logger.debug(row)
                insert.run(row)

            } else {
                // logger.debug(row)
            }
        }
    })
    dropDownData.data.shift()
    // logger.debug(JSON.stringify(dropDownData.data, null, 4))
    insertMany(dropDownData.data)





    sql = `SELECT * FROM ${sheetName}`
    sqlPrepared  = db.prepare(sql)
    dbResponse = await sqlPrepared.all()

    let endTableSetup = new Date()
    logger.debug(`end ${sheetName} seutp : ${Math.abs(endTableSetup - startTableSetup)}`)

    return true
}


module.exports.setupDropdownDatabase = setupDropdownDatabase
//NOTES: used in runUpdateAll, runUpdateOne
async function setupDropdownDatabase(db) {

    let tablesToUpdate = []
    for (const [sheetName, sheetId] of Object.entries(dropdownSheets)) {
        tablesToUpdate.push({
            sheetName: sheetName,
            sheetId: sheetId
        })
    }
    const promises = tablesToUpdate.map(sheet => setupTable(db, sheet.sheetName, sheet.sheetId))
    await Promise.all(promises).then(function(values) {
        // logger.debug(JSON.stringify(values, null, 4))
        // logger.debug('----setupDropdownDatabase')
    })
    return true
}

//NOTES: used in updateDropdowns
async function getPickList(db, table, search=null) {
    try {
        if (search == null) {
            // get all dropdown options for this table
            logger.debug(`>>>>>>>>>>> getPickList search: ${search} is null`)
            sql = `SELECT DISTINCT dropdown from ${table} ORDER BY sortorder, dropdown`
        } else {
            // get only dropdown options that meet search criteria
            logger.debug(`>>>>>>>>>>> getPickList search: ${search}`)
            sql = `SELECT DISTINCT dropdown FROM ${table} WHERE search LIKE '%~${search}%' ORDER BY sortorder, dropdown`
        }
        // logger.debug(sql)
        sqlPrepared = db.prepare(sql)
        dbResponse = await sqlPrepared.all()
        let dropdownArray = []
        for (let i = 0, iMax = dbResponse.length; i < iMax; i++) {
            dropdownArray.push(dbResponse[i]['dropdown'])
        }
        // logger.debug(JSON.stringify(dropdownArray, null, 4))
        return dropdownArray
    } catch(err) {
        logger.error(`Error getPickList: ${err}`)
        return null
    }
}

//NOTES: used in updateDropdowns
async function getContactList(db, table, search=null) {
    try {

        // get all dropdown options for this table
        if (search == null) {
            logger.debug(`>>>>>>>>>>> getContactList search: ${search} is null`)
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
            logger.debug(`>>>>>>>>>>> search: ${search} `)
            // get only dropdown options that meet search criteria
            sql = `SELECT DISTINCT name, email FROM ${table} WHERE search LIKE '%~${search}%' ORDER BY sortorder, name`
        }
        // logger.debug(sql)
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
        // logger.debug(JSON.stringify(dropdownArray, null, 4))
        return dropdownArray
    } catch(err) {
        logger.error(`Error getContactList: ${err}`)
        return null
    }
}

//NOTES: used in runUpdateAll
async function getListOrganizationSheets(data) {
    // get ALL of the sheets for all users in the organizations
    // smartsheet account.
    // the "includeAll" option forces this to return all sheets,
    // and not to paginate the results
    options = {
        queryParameters: {
            includeAll: true
        }
    }
    const response = await smartsheet.
    sheets.listOrganizationSheets(options)
    data['orgSheets'] = await response
    return data
}

//NOTES: used in updateDropDowns
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

//NOTES: used in runUpdateAll
async function loopOrganizationSheets(db, data) {
    for (let i = 0, iMax = data.orgSheets.data.length; i < iMax; i++) {
        thisSheet = data.orgSheets.data[i]
        if ( hasAllowedOwner(thisSheet.owner) && sheetNameHasUpdateMarker(thisSheet.name)) {
            await updateDropdowns(db, thisSheet.id, thisSheet.owner)
        }
    }
    return data
}

//NOTES: used in runUpdateOne, runUpdateUser, runUpdateAll
async function updateDropdowns(db, sheetId, owner) {
    // either there is NO owner restriction in place or
    // this sheet is owned by the restrictToOwnerEmail
    const columns = await getSheetColumns(sheetId, owner)
    // logger.debug('$$$$')
    // prettyLog(columns, 5)
    for (let j = 0, jMax = columns.data.length; j < jMax; j++) {
        column = columns.data[j]

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


                        logger.error(`fail ${sheetId}`)

                        logger.error(JSON.stringify(error, null, 4))
                        logger.error(JSON.stringify(dropdownArray, null, 4))

                    })
                }
            }
        } else {
            // prettyLog(`not the correct type: ${column.type}`, 5)
            continue

        }
    }
}

module.exports.runUpdateAll = runUpdateAll
async function runUpdateAll() {
    // open database in memory
    // const db = new Database(config.dropdownStorage, { verbose: sqlLogger });

    const db = new Database(config.dropdownStorage);

    // const usersData = await getUsers(data)
    const dropdownData = await setupDropdownDatabase(db)
    const currentUserData = await getCurrentUser(data)
    const listOrgSheetsData = await getListOrganizationSheets(currentUserData)
    const loopOrgSheetsData = await loopOrganizationSheets(db, listOrgSheetsData)

    // close the database connection

    const dbClosed = await db.close((err) => {
        if (err) {

            return console.error(err.message);
        }
        logger.debug('Close the database connection.');
    });

}


module.exports.runUpdateOne = runUpdateOne
async function runUpdateOne(sheetId, owner) {

    const db = new Database(config.dropdownStorage);
    // const usersData = await getUsers(data)
    await setupDropdownDatabase(db)
    let startOneUpdate = new Date()
    await updateDropdowns(db, sheetId, owner)
    let endOneUpdate = new Date()
    logger.debug(`oneUpdate ${dropdownSheets[sheetId]} total : ${Math.abs(endOneUpdate - startOneUpdate)}`)

    // close the database connection
    const dbClosed = await db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        logger.debug('Close the database connection.');
    })
    return 1
}


module.exports.runUpdateUser = runUpdateUser
async function runUpdateUser(sheetId, owner) {
    // logger.debug('function - runUpdateUser')
    let startOneUpdate = new Date()
    const db = new Database(config.dropdownStorage)
    await updateDropdowns(db, sheetId, owner)

    // close the database connection
    const dbClosed = await db.close((err) => {
        if (err) {
            return console.error(err.message);
        }
        logger.debug('Close the database connection.');
    })
    let endOneUpdate = new Date()

    logger.debug(`oneUpdate ${sheetId} total : ${Math.abs(endOneUpdate - startOneUpdate)}`)
    return 1
}


if (require.main === module) {
    runUpdateAll()
        .then(data => prettyLog(data))
        .then(data => logger.debug('thank you!'))
        .catch(err => logger.error(err))
        .finally(function () {
            const uniqueCodesUsed = [... new Set(updateCodesUsed)]
            logger.debug(JSON.stringify(uniqueCodesUsed, null, 4))
        })

} else {
    prettyLog('updateMenu required as a module');
}