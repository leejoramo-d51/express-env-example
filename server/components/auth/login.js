/**
 * login ROUTES
 *
 */

 const config = require('../../../config')
 const {log, banner} =  require('../../../lib/logger')
 const tools = require('../../../lib/tools')

 /*
 const sheet = require('../../../lib/sheet')
 const sheet = require('../sheet')
 const authenticate = require('../authenticate')
 const getSubsbyID = require('../importDataIFAS_id').getStaffSubsSiteAndManager


 // Setup connection to smartsheet
 const client = require('smartsheet')
 const smartsheet = client.createClient(
         tools.smartSheetClientConfig()
       )

 */
 let page = {}

 /*
  * login pages
  */

exports.post_test = async function (req, res) {
    banner('test ZIP')
    res.setHeader('Content-Type', 'application/json')
    res.send('hello')
}

 exports.post_login = async function (req, res) {
     banner('route: post_login')
     // if we where redirected here, there should be a `url` paramenter on the
     // query string that we will want to redirect to upon successful authentication
     // save that as the destinationURL. If no `url` exists, redirect to the baseURL
     const destinationURL = req.query.url?req.query.url:config.baseURL
     let username = ''

     if ('username' in req.body) {
         username = req.body.username.toLowerCase()
         username = username.replace('@d51schools.org', '')

     }
     const password = req.body.password ?? ''
     const result = {
         username: username,
         password: password,
         requestData: tools.requestData(req)
     }

     res.setHeader('Content-Type', 'application/json')
     res.send(JSON.stringify(result))
}

 exports.get_logout = function (req, res) {
     req.session.destroy(function(err) {
         if(err) {
           logger.debug('Logout Error: ' + err)
         } else {
           res.redirect(config.baseURL)
         }
     })
 }

 exports.get_notAuthorized = function (req, res) {
     // if we where redirected here, there should be a `url` paramenter on the
     // query string that we will want to redirect to upon successful authentication
     // save that as the destinationURL. If no `url` exists, redirect to the baseURL
     let templateName = tools.getTemplateName('notAuthorized')

     page = JSON.parse(JSON.stringify(config.page))
     page['url'] = config.baseURL

     res.render(templateName, {
         title: 'Not Authorized',
         username: req.session.username,
         page: page
     })
 }

