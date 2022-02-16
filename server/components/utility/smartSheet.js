/*
 * formMaker
 * routes to automatically sets up a form based on a SmartSheet
 */

const config = require('../../../config')
const basePath = process.cwd()
const {log, banner} =  require('../../../lib/logger')
// TODO: remove require 'lib/sheet'
// TODO: const sheet = require('../../../lib/sheet')
const tools = require('../../../lib/tools')
const fs = require('fs')
const client = require('smartsheet')
const smartsheet = client.createClient(
        tools.smartSheetClientConfig()
      )


/**
 * Routes
 */


module.exports.get_createSchema_formName_sheetId =  function (req, res) {
    banner('ROUTE get_createSchema_formName_sheetId')
    // given a formName and SmartSheet sheetId
    // pull the meta data from SmartSheet and generate
    // a form schema as a JSON file and a generic HTML template

    const formName = req.params.formName
    const sheetId = req.params.sheetId

    const params = {
        formName: formName,
        sheetId: sheetId
    }

    // the "includeAll" option forces this to return all columns,
    // and not to paginate the results
    const options = {
        sheetId : sheetId,
        queryParameters: {
            includeAll: true,
            include: 'objectValue',
            level: 2
        }
    }
    // JSON file contains the Schema and supporting data structures
    // to be used for API route schema and frontend svelte store
    const fileSpecJSON = `${basePath}/new/${formName}.json`
    // HTML file contains a starting template to using in the front
    // end svelte form
    const fileSpecHTML = `${basePath}/new/${formName}.html`



    if (fs.existsSync(fileSpecJSON)
        || fs.existsSync(fileSpecHTML )) {
        // Don't overwrite an existing configuration file
        // return error messages instead
        log('ERROR: form exists, do not over write, ' + formName)
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write(`
                  <h1>A configruation and/or view file for "${formName}" already exists</h1>
                  <p>Config file not overwritten.</p>
                  <p>If you really want to rerun this initial setup, please delete the following files:</p>
                  <ul><li>
                    ${fileSpecJSON}
                  </li><li>
                    ${fileSpecHTML}
                  </li></ul>
                  <p>You can also rerun this with a different 'formName'<p>`)
        res.end()

    } else {
        log('create new form '+ formName)
        // no configuration file found. Let's create one
        smartsheet.sheets.getColumns(options)
            .then(async function(data) {
                // got meta data from SmartSheet
                // generate form definition JSON and template
                banner('lets build it')
                const fieldsSchema =  await tools.buildFormConfig(params, data)
                const fieldsSchemaJSON = JSON.stringify(fieldsSchema, null, 4)
                tools.displayData(res, fieldsSchemaJSON,
                    'automatic formConfig saved to:',
                    `${fileSpecJSON}<br>${fileSpecHTML}`
                    )
                fs.writeFile(fileSpecJSON, fieldsSchemaJSON, function(err) {
                    if(err) {
                        banner('Failed to write file json')
                        return log(err)
                    }
                    log(`${fileSpecHTML}  was saved!`)
                })
                const template = await tools.buildFormSvelte(fieldsSchema)
                fs.writeFile(fileSpecHTML, template, function(err) {
                    if(err) {
                        banner('Failed to write file pug')
                        return log(err)
                    }
                    log(`${fileSpecHTML} was saved!`)
                })
            })
            .catch(function (error) {
                log('error: get_createSchema_formName_sheetId - smartsheet.sheets.getColumns', error)
            })
    }

}

