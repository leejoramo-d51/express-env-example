/*
 * formMaker
 * routes to automatically sets up a form based on a SmartSheet
 */

const config = require.main.require('./config'),
      basePath = process.cwd(),
      {log, banner} =  require.main.require('./lib/logger')
      sheet = require.main.require('./lib/sheet'),
      tools = require.main.require('./lib/tools'),
      fs = require('fs'),
      client = require('smartsheet'),
      smartsheet = client.createClient(
        config.smartSheetClientConfig
      )


/**
 * Routes
 */


module.exports.get_formMaker_formName_sheetId = function (req, res) {
    log('ROUTE/getFormMaker')
    // given a formName and SmartSheet sheetId
    // pull the meta data from SmartSheet and generate
    // a generic form definition as a JSON file and a generic Jade/Pug template

    const formName = req.params['formName']

    // the "includeAll" option forces this to return all columns,
    // and not to paginate the results
    const options = {
        sheetId : req.params['sheetId'],
        queryParameters: {
            includeAll: true,
            include: 'objectValue',
            level: 2
        }
    }

    log(formName)
    log(options)
    log(__dirname)
    log()

    // Don't overwrite an existing configuration file
    // return error messages instead

    if (fs.existsSync(`${basePath}/new/${formName}.json`)
        || fs.existsSync(`${basePath}/new/${formName}.pug` )) {
        log('ERROR: form exists, do not over write, ' + formName)
        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.write('<h1>A configruation and/or view file for "'+formName+'" already exists</h1>' +
                  '<p>Config file not overwritten.</p><p>If you really want to rerun this initial setup, please delete the following files:</p>' +
                  '<ul><li>'+
                  './formConfig/'+formName+'.json'+
                  '</li><li>'+
                  './views/'+formName+'.pug'+
                  '</li></ul>'
                  )
        res.end()

    } else {
        log('create new form '+ formName)
        // no configuration file found. Let's create one
        smartsheet.sheets.getColumns(options)
            .then(function(data) {
                // got meta data from SmartSheet
                // generate form definition JSON and template
                const columns = sheet.getColumnMetaData(data)
                const fieldsJSON = tools.buildFormConfig(columns.raw.data)
                tools.displayData(res, fieldsJSON,
                    '// automatic formConfig',
                    '// form config generated from SmartSheet data and saved to:'+
                    '<ul><li>'+
                    './formConfig/'+formName+'.json'+
                    '</li><li>'+
                    './views/'+formName+'.pug'+
                    '</li></ul>'
                    )
                fs.writeFile(`${basePath}/new/${formName}.json`, fieldsJSON, function(err) {
                    if(err) {
                        banner('Failed to write file json')
                        return log(err)
                    }
                    log('./formConfig/'+formName+'.json  was saved!')
                })
                const pugTemplate = tools.buildFormSvelte(columns.nameToId)
                fs.writeFile(`${basePath}/new/${formName}.part.html`, pugTemplate, function(err) {
                    if(err) {
                        banner('Failed to write file pug')
                        return log(err)
                    }
                    log('./views/'+formName+'.pug was saved!')
                })
            })
            .catch(function (error) {
                log('error: smartsheet.sheets.getColumns', error)
            })
    }

}

