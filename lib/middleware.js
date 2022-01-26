'use strict'

/**
 * This middleware ensures access is authenticated against Active Directory (AD)
 *
 *   * To access all users must be a member of 'Staff'
 *   * Additional permissions are granted to routes via SmartSheets
 *       https://app.smartsheet.com/sheets/3g3f33Q7R3J8Hw8vMMmx5H5MQh7Wpj5cCG5V3J21?view=grid
 *   * Members of 'Programmers' group can access everyting, and some extra routes and features
 *
 * All of site users authentication info has already been stored in their session variable
 *
 */


 const config = require('../config')
 const {log, banner} =  require('./logger')


var checkAuth = function(requiredGroups) {
    return function(req, res, next) {
        log('in checkAuth')

        let formName = req.params['formName'] ?? ''

        // Staff is **ALWAYS** a required group
        // requiredGroups.push('Staff')

        // route uses ID authentication
        // ID auth was for COVID forms for staff who only had a employee id,
        // and did not have a username/email
        var isIdAuthRoute = config.idAuthRoutes.includes(formName) ?? false


        // get user info from session, if not in session redirect to login
        let username = ''
        let userGroups = []
        let grantedPermissionToRoutes = []
        let requriedPermissionRoutes = []
        let authenticated = false
        let fullUrl = config.baseURL + req.originalUrl
        try {
            const user = req.session.user
            username = user.username
            userGroups = user.userGroups
            grantedPermissionToRoutes = user.grantedPermissionToRoutes
            requriedPermissionRoutes = user.requriedPermissionRoutes
            authenticated = user.authenticated
        } catch (error) {
            const err = `${error}`
            log('user values not in session errror: ' + err)
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify({
                "message": "not authenticated",
                "error": err
            }))
            return
        }
        if (!authenticated && isIdAuthRoute) {
            log('not logged in - ask for Employee ID ')
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify({
                "message": "not logged in - ask for Employee ID",
                "url": fullUrl
            }))
            return
        } else if (!authenticated) {
            log('not logged in')
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify({
                "message": "not logged in",
                "url": fullUrl
            }))
            return
        }

        let currentPath = req.originalUrl

        // Must be member of requiredGroups
        var isMemberOfRequiredGroups = requiredGroups.every(val => userGroups.includes(val))

        // members of Programmers are always allowed provided they are in the requiredGroups
        var isProgrammer = userGroups.includes('Programmers')

        // get routes this user has permission
        var hasPermissionToRoute = false
        for (var i  = 0; i < grantedPermissionToRoutes.length; i++) {
            let re = new RegExp('.*'+grantedPermissionToRoutes[i]+'$')
            if ( currentPath.match(re)) {
                hasPermissionToRoute = true
                break
            }
        }

        // does the current route require permission
        // and does the user have those permissions?

        var routeRequiresPermision = false

        for (var i = 0; i < requriedPermissionRoutes.length; i++) {
            let re = new RegExp('.*'+requriedPermissionRoutes[i]+'$')
            if ( currentPath.match(re)) {
                routeRequiresPermision = true
                break
            }
        }

        if (!isMemberOfRequiredGroups) {
            // Not member of required group, such as 'Staff'
            // so deny access (even programmers must be members of staff)
            log('denied access - not member of Staff')
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify({
                "message": "denied access - not member of Staff",
                "url": fullUrl
            }))
            return
        } else if (isProgrammer) {
            log('in Programmers group gets all access')
            return next()
        } else if (hasPermissionToRoute) {
            log('hasPermissionToRoute ' + currentPath)
            return next()

        } else if (routeRequiresPermision == false) {
            // this route doesn't require special permissions
            return next()
        } else {
            log('denied access')
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify({
                "message": "denied access",
                "url": fullUrl
            }))
            return
        }

    }
}
module.exports.checkAuth = checkAuth

/*
var checkRowId = function(routeAction='view') {
    return function(req, res, next) {
        let currentPath = req.route.path
        let fullUrl = config.baseURL + req.originalUrl
        let formName = req.params['formName']
        let rowId = req.params['rowId']
        let smartSheetRowIDregex = /^\d{1,16}$/
        let isSmartSheetRowID = smartSheetRowIDregex.test(rowId)

        if (isSmartSheetRowID) {
            return next()
        } else {
            log('try search: '+rowId)
            sheet.search(config.sheetId[formName], rowId)
                .then(function (data) {
                    let rowId = data['results'][0]['objectId']
                    let newUrl = `${config.baseURL}/${formName}/${routeAction}/${rowId}`
                    log(`newUrl : ${newUrl}`)
                    res.redirect(newUrl)
                })
                .catch(function (error) {
                    log('checkAuth error: \n' + error)
                })
            // res.redirect(config.baseURL+'/auth/notAuthorized')
        }
    }
}
module.exports.checkRowId = checkRowId
 */
