/**
 *  formMaker Tools functions
 *
 */

// external packages

// project packages

const config = require.main.require('./config')
const { log, banner } = require.main.require('./lib/logger.js')


/**
 * Local Functions
 */

const makeFormJSON = function (config) {
    banner('FUNCTION:tools.makeFormJSON')
    // takes a JSON formFields configuration and builds a form object
    let form = {}
    for (let index in config) {
        let field = {}

        let item = config[index]
        let widgetConfig = null
        if (item.widgetConfig) {
            widgetConfig = item.widgetConfig
            delete item.widgetConfig
        }

        if (item.widgetType == 'text') {
            field.widget = widgets.text(widgetConfig)
        } else if (item.widgetType == 'checkbox') {
            field.widget = widgets.checkbox(widgetConfig)
        } else if (item.widgetType == 'textarea') {
            field.widget = widgets.textarea(widgetConfig)
        } else if (item.widgetType == 'date') {
            field.widget = widgets.date(widgetConfig)
        } else if (item.widgetType == 'select') {
            field.widget = widgets.select(widgetConfig)
        } else if (item.widgetType == 'number') {
            field.widget = widgets.number(widgetConfig)
        } else if (item.widgetType == 'time') {
            field.widget = widgets.time(widgetConfig)
        } else if (item.widgetType == 'radio') {
            field.widget = widgets.radio(widgetConfig)
        } else if (item.widgetType == 'telephone') {
            field.widget = widgets.telephone(widgetConfig)
        } else if (item.widgetType == 'email') {
            field.widget = widgets.email(widgetConfig)
        } else if (item.widgetType == 'hidden') {
            field.widget = widgets.hidden(widgetConfig)
        } else if (item.widgetType == 'template') {

            // load the template configuration
            let templateText = './templates_md/' + item.file
            // templateText = md.render(templateText)
            field.templateText = templateText
        } else {
            log('not found item.widget: ' + item.widgetType)
        }
        delete item.widgetType

        if (item.validators) {
            fields.validators = []
            if (item.validators.indexOf('integer') > -1) {
                fields.validators.push(validators.integer())
                item.validators.splice(item.validators.indexOf('integer'), 1)
            }
            if (item.validators.indexOf('email') > -1) {
                fields.validators.push(validators.email())
                item.validators.splice(item.validators.indexOf('email'), 1)
            }
            if (item.validators.length > 0) {
                log('unused validators ' + item.validators)
            }
            if (item.validators) {
                delete item.validators
            }
        }
        field = Object.assign(field, item)
        form[index] = fields.string(field)
    }
    return form
}


/**
 * Exported Functions
 */


module.exports.createForm = function (formName, itemRowNumbers = [0], userInfo = {}) {
    banner('FUNCTION:tools.createForm')
    // returns the form object from a fieldsJSON that has been read from the file system
    // also deals with dynamically added fields/rows as listed in itemRowNumbers

    // formname = for the JSON file to load

    // itemRowNumbers = if form has dynamically added items/rows they will be listed here

    // load the form configuration
    let fieldsText = fs.readFileSync(
        './formConfig/' + formName + '.json', 'utf8'
    )


    // Pre-fill fields
    // Fields can be setup to be pre-populated with:
    //    * the logged in users name, employee id, or email
    //    * todays date

    let today = new Date()
    let dd = today.getDate()

    let todayValue = getTodayFormValue()

    fieldsText = fieldsText
        .replace('__userFullName__', userInfo.givenName + ' ' + userInfo.sn)
        .replace('__userEmployeeNumber__', userInfo.employeeNumber)
        .replace('__worksiteNumber__', userInfo.WORKSITE)
        .replace('__userEmail__', userInfo.mail)
        .replace('__dateToday__', todayValue)

    const fieldsJSON = JSON.parse(fieldsText)


    // process dynamically added items
    if (itemRowNumbers != [0]) {

        // in the fieldsJSON, fieldNames ending in '~0' can be dynamically added
        // with new values in place the of the '0'

        // these fields do not need to be a straight sequence.

        // these fields do not need to inlcude the '~0' fields. Since '~0' is in the defintion
        // provied by fieldsJSON they will need to be removed if not provied in itemRowNumbers

        let hasZero = false     // assume that there is no '~0' fields
        let keys = Object.keys(fieldsJSON)
        itemRowNumbers.forEach(function (rowNumber) {
            // if the rowNumber is '0' set hasZero to true
            if (rowNumber == 0) { hasZero = true }
            // iterate over the fieldsJSON and add the dynmaic fields
            for (let i = 0; i < keys.length; i++) {
                let myRegex = /(.+)~([0-9]+$)/
                const key = keys[i]
                if (fieldsJSON.hasOwnProperty(key)) {
                    const newKey = key.replace(myRegex, '$1~' + rowNumber)
                    const newName = key.replace(myRegex, '$1')
                    fieldsJSON[newKey] = Object.assign({}, fieldsJSON[key])
                    fieldsJSON[newKey]['name'] = newName
                }
            }
        })
        // if hasZero still is false, we didn't find items '0', so
        // iterate over fieldsJSON to remove them.
        if (hasZero == false) {
            for (let i = 0; i < keys.length; i++) {
                const myRegex = /(.+)~([0-9]+$)/
                const key = keys[i]
                if (myRegex.test(key)) {
                    delete fieldsJSON[key]
                }
            }
        }
    }

    // create a form object using the fieldsJSON defintion
    const formFields = makeFormJSON(fieldsJSON)
    return formFields
}

module.exports.buildFormConfig = function (params, data) {
    banner('tools.buildFormConfig')
    log('data', data)
    // Using a sheets meta data pulled from SmartSheet
    // create a form configuration file that we can
    // edit and enhance
    const columns = sheet.getColumnMetaData(data)
    banner('got columns')
    log('columns', columns)
    log('params', params)
    let fieldArray = columns.raw.data
    let fieldsSchema = {
        'sheetId': params.sheetId,
        'formName': params.formName,
        'formTitle': params.formName,
        'idToName': columns.idToName,
        'nameToId': columns.nameToId
    }
    fields = {}
    const fieldCount = fieldArray.length
    log('fieldCount', fieldCount)

    for (let i = 0; i < fieldCount; i++) {
        log(i)
        const item = fieldArray[i]
        const thisField = {
            label: item.title,
            help: '',
            smartsheetId: fieldArray[i].id,
            widgetType: 'text',
            errorLocation: 'after',
            required: true
        }
        if (i === 0) {
            thisField['autofocus'] = true
        }

        if (item.type == 'CHECKBOX') {
            thisField['widgetType'] = 'checkbox'
            thisField['value'] = 'true'
        }
        else if (item.type == 'CONTACT_LIST') {
            thisField['widgetType'] = 'email'
        }
        else if (item.type == 'MULTI_CONTACT_LIST') {
            thisField['widgetType'] = 'email'
        }
        else if (item.type == 'DATE') {
            thisField['widgetType'] = 'date'
        }
        else if (item.type == 'DATETIME') {
            // ToDo: do we need? SmartSheet does not suport DATETIME
        }
        else if (item.type == 'PICKLIST') {
            // widget also has 'options' which added below
            thisField['widgetType'] = 'select'
        }
        else if (item.type == 'TEXT_NUMBER') {
            if (item.title.match(/number/i)) {
                thisField['widgetType'] = 'number'
                thisField['widgetConfig'] = { pattern: '[0-9]*' }
                thisField['validators'] = ['integer']
            } else if (item.title.match(/(phone|fax)/i)) {
                thisField['widgetType'] = 'telephone'
            } else if (item.title.match(/(email)/i)) {
                thisField['widgetType'] = 'email'
            } else if (item.title.match(/(amount|amt)/i)) {
                thisField['widgetType'] = 'number'
                thisField['widgetConfig'] = {
                    pattern: '[0-9]*',
                    min: 0,
                    max: 100000,
                    step: 0.01,
                    classes: ['sum'],
                }
            } else {
                thisField['widgetType'] = 'text'
            }
        } else {
            log('item.type not found: ${item.type} -------------------------------')
        }
        if ('options' in item) {
            thisField['choices'] = {}
            const optionCount = item.options.length
            for (let j = 0; j < optionCount; j++) {
                const thisChoice = item.options[j]
                thisField['choices'][thisChoice] = thisChoice
            }
        }
        if ('formula' in item) {
            thisField['value'] = 'No Value: Use Formula'
            thisField['formula'] = item['formula']
        }
        fields[item['title']] = thisField
    }

    fieldsSchema['fields'] = fields
    banner('end buildFormConfig')
    log('', fieldsSchema)
    return fieldsSchema

}

module.exports.displayData = function (res, data, title = '', description = '') {
    banner('FUNCTION:tools.displayData')
    // a quick way to log to the console and return results to the browser
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write('<h1>' + title + '</h1>')
    res.write('<p>' + description + '</p>')
    res.end('<pre>' + data + '</pre>')
}

module.exports.displayDataJson = function (res, data, title = '', description = '') {
    banner('FUNCTION:tools.displayDataJson')
    // a quick way to log to the console and return results to the browser

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write('<h1>' + title + '</h1>')
    res.write('<p>' + description + '</p>')
    res.end('<pre>' + JSON.stringify(data, null, 4) + '</pre>')


}

module.exports.displayDataRaw = function (res, data, title = '', description = '') {
    banner('FUNCTION:tools.displayDataRaw')
    // a quick way to log to the console and return results to the browser

    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.write('<h1>' + title + '</h1>')
    res.write('<p>' + description + '</p>')
    res.end(data)


}



module.exports.buildFormSvelte = function (data) {
    banner('FUNCTION:tools.buildFormSvelte')
    log('data', data)
    // saves a generic svelte template template which can be edited
    // to customize
    let s = ''
    let template = `
        <Row>
            <Column>
                <Field name='%fieldName%'>
            </Column>
        </Row>
     `
    for (let key in data.fields) {
        s += template.replace('%fieldName%', key)
    }
    log('buildFormSvelte result', s)
    return s
}

module.exports.getTemplateName = function (formName) {
    // tests to see if there exists a view template for the formName
    // if not we will use the default template
    if (fs.existsSync('./views/' + formName + '.pug')) {
        return formName
    } else {
        return 'default'
    }
}

module.exports.dateToday = function () {
    let local = new Date()
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset())
    return local.toJSON().slice(0, 10)
}


let getTodayFormValue = function () {
    let today = new Date()
    let dd = today.getDate()

    let mm = today.getMonth() + 1
    const yyyy = today.getFullYear()
    if (dd < 10) {
        dd = `0${dd}`
    }

    if (mm < 10) {
        mm = `0${mm}`
    }
    todayValue = `${yyyy}-${mm}-${dd}`
    return todayValue
}
module.exports.getTodayFormValue = getTodayFormValue

module.exports.getBoilerPlate = function (nameToValue, fileName) {
    log(`function: BoilerPlate: ${fileName}`)
    let nameNoSpacesToValue = {}
    nameNoSpacesToValue.d = {}
    for (let key in nameToValue) {
        nameNoSpacesToValue.d[key.split(' ').join('_')] = nameToValue[key]
    }
    for (let key in nameToValue) {
        fileName = fileName.replace(`{${key}}`, nameToValue[key])

    }

    log(`template fileName: ${fileName}`)
    let template = fs.readFileSync(
        fileName, 'utf8'
    )

    // add HIGHLIGHT when pattern is {{d["variable"]}}
    // no HIGHLIGHT when pattern is {{-d["variable"]-}}
    // NOTE: used to use a space ' ' and not a dash '-' to avoid highlight
    //       spaces still work, and can be passed straight to nunjucks,
    //       but proved to be easy to remove while "tidying up"
    template = template.replace(/{{d/g, '::HIGHLIGHT::{{d')
    template = template.replace(/\]}}/g, ']}}::/HIGHLIGHT::')
    // remove '-' to hand template over to nunjucks
    template = template.replace(/{{-d/g, '{{d')
    template = template.replace(/\]-}}/g, ']}}')

    // log('-- md template values ----------')
    // log(JSON.stringify(nameNoSpacesToValue, null, 4))
    // log(JSON.stringify(req.query))
    log('--------------------------------')

    template = nunjucks.renderString(template, nameNoSpacesToValue)

    // log('#######################################')
    // log(template)
    // log('#######################################')

    // Left  Guillemet (the << symbol) \u00AB
    // Right Guillemet (the >> symbol) \u00BB
    template = template.replace(/\u00AB-/g, '<mark>')
    template = template.replace(/\u00AB/g, '<mark class="block">')
    template = template.replace(/::HIGHLIGHT_DIV::/g, '<mark class="block">')
    template = template.replace(/\u00BB/g, '</mark>')
    template = template.replace(/::\/HIGHLIGHT_DIV::/g, '</mark>')
    template = template.replace(/::HIGHLIGHT::/g, '<mark>')
    template = template.replace(/::\/HIGHLIGHT::/g, '</mark>')
    template = md.render(template)
    // log(page.BoilerPlate)
    // log('--function---------------------------------------------')
    return [template, fileName]
}

/**
 * Returns object of route permissions
 * @param {string} formName short name of the route
 * @parma {Object} routePermissions object containing arrays for routes
 *        required and granted permissions
 */
module.exports.getRoutePermissions = function (formName, routePermissions) {
    const viewRoute = '/' + formName + '/view/[0-9]+'
    let hasView = false
    if (routePermissions.required.includes(viewRoute)) {
        if (routePermissions.granted.includes(viewRoute)) {
            hasView = true
        }
    } else {

        hasView = true
    }
    // TODO: `updateRoute` not used here
    const updateRoute = '/' + formName + '/update/[0-9]+'
    let hasUpdate = false
    if (routePermissions.required.includes(updateRoute)) {
        if (routePermissions.granted.includes(updateRoute)) {
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


module.exports.getRow = function (item, sheetInfo, schema, configRow = {}) {
    banner('tools.getRow')
    let cells = []
    let rowId = undefined
    if (sheetInfo.hasOwnProperty('rows')) {
        cells = sheetInfo.rows[item].cells
        rowId = sheetInfo.rows[item].id
    } else if (sheetInfo.hasOwnProperty('cells')) {
        cells = sheetInfo.cells
        rowId = sheetInfo.id
    }
    let filter = configRow.filter ?? ''
    let filterField = configRow.filterField ?? ''

    const usedColumns = Object.keys(schema.idToName)
    let row = {}
    for (cellPostion in cells) {

        const cell = cells[cellPostion]
        const columnId = `${cell.columnId}`
        if (usedColumns.includes(columnId)) {
            if ('value' in cell) {
                const cellName = schema.idToName[cell.columnId]
                const cellValue = cell.value
                row[cellName] = cellValue
                if ('displayValue' in cell && cell.value != cell.displayValue) {
                    row['displayValue__' + cellName] = cell.displayValue
                }
                if ('hyperlink' in cell && 'url' in cell.hyperlink) {
                    row['linkValue__' + cellName] = cell.hyperlink.url
                }
            }
            row['rowId'] = rowId
        }
    }

    // filter
    if (filter != ''
        && filterField !== ''
        && schema.nameToId.hasOwnProperty(filterField)
        && row.hasOwnProperty(filterField)
        && filter === row[filterField]
    ) {
        banner('filter')
        log('filter', filter)
        return
    }


    return row

}