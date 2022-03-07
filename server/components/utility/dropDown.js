/*
 * updateDropDowns
 * used to update Smartsheets dropdown lists
 */

const config = require('../../../config')
const {log, banner} =  require('#lib/logger')
const tools = require('#lib/tools')
const dropDown = require('#lib/smartsheet_dropDown')
const client = require('smartsheet')
const smartsheet = client.createClient(
        tools.smartSheetClientConfig()
      )

//TODO: const hasUpdateDropDownsAccess = req.session.hasUpdateDropDownsAccess
const hasUpdateDropDownsAccess = true

/**
 * Routes
 */


 module.exports.get_dropDowns = async function (req, res) {
    // landing page for updating smartsheet dropdowns
    let result = await dropDown.listSheetsWithDropDowns(req, res)
    result.requestData = tools.requestData(req)
    res.setHeader('Content-Type', 'application/json')
    res.send(result)
}


module.exports.get_dropDowns_updateOne = async function (req, res) {
    const sheetId = req.params['sheetId']
    //TODO: remove failover to 'lee.joramo'
    // const owner = req.session.userInfo.mail
    const owner = 'lee.joramo@d51schools.org'
    let result = await dropDown.runUpdateOne(sheetId, owner)
        .catch(function (error) {
            log('error_messages: An error occured.')

        })
    req.flash('success_messages', 'hens on parade')
    result = getMessages(result, req)

    res.setHeader('Content-Type', 'application/json')
    res.send(result)
}


module.exports.get_dropDowns_updateAll = async function (req, res) {
    const result = await dropDown.runUpdateAll(req, res)
        .catch(function (error) {
            log('error_messages: An error occured.')
        })
    req.flash('success_messages', 'Maud!')
    res.redirect(config.baseURL+'utility/smartsheet/dropdowns')
}

function getMessages(data, req) {
    data['messages'] = {
        success: req.flash('success_messages'),
        error: req.flash('error_messages'),
        info: req.flash('info_messages')

    }
    return data
}