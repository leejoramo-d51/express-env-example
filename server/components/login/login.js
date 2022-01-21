/**
 * login ROUTES
 *
 */

 const config = require('../../../config')
 const {log, banner} =  require('../../../lib/logger')
 const tools = require('../../../lib/tools')
 const sheet = require('../../../lib/sheet')


 var sheet = require('../sheet')
 var authenticate = require('../authenticate')
 var getSubsbyID = require('../importDataIFAS_id').getStaffSubsSiteAndManager


 // Setup connection to smartsheet
 const client = require('smartsheet')
 const smartsheet = client.createClient(
         config.smartSheetClientConfig
       )


 let page = {}

 /*
  * login pages
  */






 exports.post_login = async function (req, res) {
     logger.debug('---> route: post_login')
     // if we where redirected here, there should be a `url` paramenter on the
     // query string that we will want to redirect to upon successful authentication
     // save that as the destinationURL. If no `url` exists, redirect to the baseURL
     var destinationURL = req.query.url?req.query.url:config.baseURL
     var username = ''

     if ('username' in req.body) {
         username = req.body.username.toLowerCase()
         username = username.replace('@d51schools.org', '')

     }
     var password = ''
     if ('password' in req.body) {
         password = req.body.password
     }

     let routePermissions = sheet.routePermissionsRead()

     // logger.debug(JSON.stringify(routePermissions, null, 4))

     authenticate.authenticate(username, password, function(user) {
         if (user.hasOwnProperty('error')) {
             if (user.error.hasOwnProperty('errno')) {
                 if (user.error.errno === 'ENOTFOUND') {
                     logger.debug('Error on Authentication - can you access the AD server?')
                     req.flash('warn', 'Error: could not access Authentication Active Directory Server')
                 } else if (user.error.errno === 'LDAP_INVALID_CREDENTIALS') {
                     logger.debug('Error on Authentication - LDAP_INVALID_CREDENTIALS')
                     req.flash('warn', '<h6>Please try your username and password again</h6><p>Use your short username. For example, if your email address is <b><i>Betty.Example@d51schools.org</i></b>, your username is likely in the form <b><i>bexample</i></b>')
                 } else {
                     logger.debug('Error on Authentication - see log for error message')
                     req.flash('warn', '<h6>Please try your username and password again</h6><p>Use your short username. if your email address is <b><i>Betty.Example@d51schools.org</i></b>, your username is likely in the form <b><i>bexample</i></b>')
                 }
             } else {
                 req.flash('warn', '<h6>Please try your username and password again</h6><p>Use your short username. if your email address is <b><i>Betty.Example@d51schools.org</i></b>, your username is likely in the form <b><i>bexample</i></b>')
             }
             res.redirect(config.baseURL+'/login')
         } else if (user) {
             logger.info(`userInfo: ${JSON.stringify(user.userInfo,null, 4)}`)
             logger.debug(`username: ${user.username}`)
             logger.debug(`usergroups: ${user.userGroups}`)
             // logger.debug()
             let username = user.username
             let userGroups = user.userGroups
             let userInfo = user.userInfo
             req.session.username = username
             req.session.userGroups = userGroups
             req.session.userInfo = userInfo
             req.session.authenticated = true
             req.session.locationAndManager = user.locationAndManager
             // user is member of Programmers group
             // this makes user a superuser with access to everything.
             var isProgrammer = userGroups.includes('Programmers')
             req.session.isProgrammer = isProgrammer
             var isStudent = userGroups.includes('Students')
             req.session.isStudent = isStudent
             req.session.computerName = config.computerName




             var grantedPermissionToRoutes = []
             var requriedPermissionRoutes = []
             var rowsLength = routePermissions.rows.length
             var rowData
             var routeName
             for (var i = 0; i < rowsLength; i++) {
                 var isAllowedIndividual = false
                 var isMemberOfAllowedGroups = false
                 rowData = routePermissions.rows[i]['cells']
                 routeName = rowData[0]['value']
                 routeGroupCell = rowData[1]['value']
                 routeUsersCell = rowData[2]['value']

                 if (routeUsersCell) {
                     var routeUsers = routeUsersCell.split(/[,] */)
                     isAllowedIndividual = routeUsers.includes(username)
                     if (isAllowedIndividual || isProgrammer) {
                         grantedPermissionToRoutes.push(routeName)
                     }
                 }

                 if (routeGroupCell) {
                     var routeGroups = routeGroupCell.split(/[,] */)
                     isMemberOfAllowedGroups = routeGroups.some(val => userGroups.includes(val))
                 }

                 requriedPermissionRoutes.push(routeName)

                 if (isAllowedIndividual || isMemberOfAllowedGroups ) {
                     grantedPermissionToRoutes.push(routeName)
                 }
             }


             // routes requiring specific permission
             req.session.requriedPermissionRoutes = requriedPermissionRoutes

             // all routes users has explicit permission
             // with duplicates removed
             req.session.grantedPermissionToRoutes = [...new Set(grantedPermissionToRoutes)]

             // user is a member of the Staff group
             // this is the minimum permission to access the site
             var isMemberOfStaff = userGroups.includes('Staff')
             req.session.isMemberOfStaff = isMemberOfStaff

             // user has access to updateDropDowns
             var hasUpdateDropDownsAccess = grantedPermissionToRoutes.includes('/updateDropDowns')
             req.session.hasUpdateDropDownsAccess = hasUpdateDropDownsAccess

             // force session save: express did not always save
             // sessions on post requests from Chrome
             // (worked in firefox). Forced save and delay in
             // redirect fixed issue
             req.session.save()
             setTimeout(function() {
                 res.redirect(destinationURL)}, 10)


         } else {
             logger.debug('login failure')
             req.flash('info', 'Updated 1 Sheet')
             res.redirect(config.baseURL+'/login')
         }
     })
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





