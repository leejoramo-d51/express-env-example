/**
 * login ROUTES
 *
 */

const config = require('../../../config')
const { log, banner } = require('#lib/logger')
const tools = require('#lib/tools')
const sqlQuery = require('#lib/sqlQuery')

const activeDirectory = require('activedirectory')
const fs = require('fs')

const routePermissionsFile = './cache/routePermissions2.json'

/*
const sheet = require('#lib/sheet')
const sheet = require('../sheet')
const authenticate = require('../authenticate')
const getSubsbyID = require('../importDataIFAS_id').getStaffSubsSiteAndManager


// Setup connection to smartsheet
const client = require('smartsheet')
const smartsheet = client.createClient(
        tools.smartSheetClientConfig()
      )

*/


function authenticateUser(ad, username, password) {
    return new Promise((resolve, reject) => {
        ad.authenticate(username, password, function (err, results) {
            if (err) {
                reject(err)
            }
            resolve(results)
        })
    })
}

function findUser(ad, username) {
    return new Promise((resolve, reject) => {
        ad.findUser(username, function (err, user) {
            if (err) {
                reject(err)
            } else if (user === undefined) {
                reject({ "error": `username not found: ${username}` })
            }
            resolve(user)
        })
    })
}
function getGroupMembershipForUser(ad, username) {
    return new Promise((resolve, reject) => {
        ad.getGroupMembershipForUser(username, function (err, groups) {
            if (err) {
                reject(err)
            } else if (groups === undefined) {
                reject({ "error": `groups not found for username: ${username}` })
            }
            resolve(groups)
        })
    })
}

/**
 * Gets a users location and manager based on userid
 * @param {object} user
 */
async function addLocationAndManager(user) {
    // the full set of possible data fields
    let data =
    {
        "WORKSITE": "",
        "LONG_DESC": "",
        "ManagerID": "",
        "ManagerLName": "",
        "ManagerFName": "",
        "ManagerEmail": "",
        "ManagerUsername": ""
    }


    // need to fake data for some types of users, such as
    // charter schools and students
    if (user.userGroups.includes('VIS')) {
        data =
        {
            "WORKSITE": "595",
            "LONG_DESC": "Mesa Valley Community School",
            "ManagerID": "999999"
        }

    } else if (user.userGroups.includes('JRE')) {
        data =
        {
            "WORKSITE": "496",
            "LONG_DESC": "Juniper Ridge",
            "ManagerID": "999999"
        }

    } else if (user.userGroups.includes('Students')) {
        data =
        {
            "employeeNumber": "STUDENT",
            "WORKSITE": "9222",
            "LONG_DESC": "Student",
            "ManagerID": "92222"
        }

    } else {
        const sqlResponse =  await sqlQuery.getStaffSiteAndManager(user.userInfo.employeeNumber)
        if (sqlResponse.length === 0) {
            // no data for user found in IFAS
            // mostly works like subs without regular
            // assigment. Give them a faked worksite
            data =
                {
                    "WORKSITE": "9111",
                    "LONG_DESC": "No Permanent Worksite"
                }

            user.userGroups.push('SubsSmartsheet')
        } else {
            data = sqlResponse[0]
        }
    }

    user.userInfo = {
        ...user.userInfo,
        ...data
    }
    return user
}


function addRoutePermissions(user) {
    const raw = fs.readFileSync(routePermissionsFile)
    const data = JSON.parse(raw)


    let grantedPermissionToRoutes = []
    let requriedPermissionRoutes = []


    const rowsLength = data.rows.length
    for (let i = 0; i < rowsLength; i++) {
        let isAllowedIndividual = false
        let isMemberOfAllowedGroups = false
        const rowData = data.rows[i]['cells']
        const routeName = rowData[0]['value']
        routeGroupCell = rowData[1]['value']
        routeUsersCell = rowData[2]['value']

        if (routeUsersCell) {
            const routeUsers = routeUsersCell.split(/[,] */)
            isAllowedIndividual = routeUsers.includes(user.username)
            if (isAllowedIndividual || user.isProgrammer) {
                grantedPermissionToRoutes.push(routeName)
            }
        }

        if (routeGroupCell) {
            const routeGroups = routeGroupCell.split(/[,] */)
            isMemberOfAllowedGroups = routeGroups.some(val => user.userGroups.includes(val))
        }

        requriedPermissionRoutes.push(routeName)

        if (isAllowedIndividual || isMemberOfAllowedGroups ) {
            grantedPermissionToRoutes.push(routeName)
        }
    }
    user.requriedPermissionRoutes = [... new Set(requriedPermissionRoutes)]
    user.grantedPermissionToRoutes = [...new Set(grantedPermissionToRoutes)]
    return user
}

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
    const destinationURL = req.query.url ? req.query.url : config.baseURL
    let username = ''

    if ('username' in req.body) {
        username = req.body.username.toLowerCase()
        username = username.replace('@d51schools.org', '')
    }
    const password = req.body.password ?? ''

    let options = {
        url: config.activeDirectory.AD_url,
        baseDN: config.activeDirectory.AD_baseDN,
        username: username + '@' + config.activeDirectory.domain,
        password: password,
        attributes: {
            user: ['givenName', 'sn', 'cn', 'mail', 'employeeNumber']
        }
    }
    const ad = new activeDirectory(options)
    let user = {
        computerName: config.SERVERNAME,
        username: username,
        authenticated: false
    }
    try {
        const authenticated = await authenticateUser(ad, options.username, password)
        const userInfo = await findUser(ad, username)
        //TODO: test role based users 'travel' for error getting groups
        const adGroups = await getGroupMembershipForUser(ad, username)
        user = {
            ...user,
            "authenticated": authenticated,
            "userInfo": userInfo,
            "adGroups": adGroups
        }
    } catch (err) {
        // Login had an error, end and return
        res.setHeader('Content-Type', 'application/json')
        res.send(JSON.stringify({
            "login": "invalid - AD error",
            "error": err
        }))
        return
    }
    if (!user.authenticated) {
        // Login was not valid, end and return
        res.setHeader('Content-Type', 'application/json')
        res.send(JSON.stringify(user))
        return
    }
    // build a list of the groups Common Names
    var userGroups = []
    for (var i = 0; i < user.adGroups.length; i++) {
        var groupName = user.adGroups[i]['cn']
        userGroups.push(groupName)
    }

    // force 'special' users to be members of Staff
    // some 'role' based users do not have membership in 'Staff' or any
    // other useful groups to identify them.
    if (username == 'travel') {
        // The 'travel' user is an non-person role account.
        // Therefore it does not have an HR record to grant the it 'Staff' status
        // Treat it as a member of 'Staff'
        userGroups.push('Staff')
    }
    user["userGroups"] = userGroups

    // get additional user info: manager, location
    // this is pulled from BPlus/IFAS
    user = await addLocationAndManager(user)
    // students will be blocked from most access
    user["isStudent"] = user.userGroups.includes('Students')
    // 'Staff' is the minimum permission to normal access
    user["isMemberOfStaff"] = user.userGroups.includes('Staff')
    // 'Programmer' will default to super user access
    user["isProgrammer"] = user.userGroups.includes('Programmers')
    user = addRoutePermissions(user)
    // user has access to updateDropDowns
    user["hasUpdateDropDownsAccess"] = user.grantedPermissionToRoutes.includes('/updateDropDowns')

    req.session.user = user

    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(user))
    return
}

exports.get_logout = async function (req, res) {
    banner('route : logout')
    let username = 'NO SESSION'
    try {
        username = req.session.user.username
    } catch (error) {
        log(`No Logout: No User was authenticated`)
        res.setHeader('Content-Type', 'application/json')
        res.send(JSON.stringify({
            "message": `No Logout: No User was authenticated`
        }))
        return
    }

    req.session.destroy(function (err) {
        if (err) {
            log('Logout Error: ' + err)
        } else {
            log(`user has logged out: ${username}`)
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify({
                "message": `user has logged out: ${username}`
            }))
            return
        }
    })
}

exports.get_notAuthorized = function (req, res) {
    // if we where redirected here, there should be a `url` paramenter on the
    // query string that we will want to redirect to upon successful authentication
    // save that as the destinationURL. If no `url` exists, redirect to the baseURL
    let templateName = tools.getTemplateName('notAuthorized')

    let page = JSON.parse(JSON.stringify(config.page))
    page['url'] = config.baseURL

    res.render(templateName, {
        title: 'Not Authorized',
        username: req.session.username,
        page: page
    })
}

exports.get_user = async function (req, res) {
    banner('route: get_user')

    const user = req.session.user

    res.setHeader('Content-Type', 'application/json')
    res.send(JSON.stringify(user))
    return
}