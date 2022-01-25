'use strict'

/**
 * authentication
 * functions to authenticate against AD
 * used by the 'login' route
 */

 const config = require.main.require('./config')
 const { log, banner } = require.main.require('./lib/log')
 const ActiveDirectory = require('activedirectory')
 const sqlQuery = require('./sqlQuery')

// load needed async.js
var async = require('async')


function performAuthentication(username, password, callback) {
    banner('FUNCTION:authenticate.performAuthentication')
    var domainUsername = username + '@' + config.domain
    log('domainUsername : '+ domainUsername)
    let adOptions = {
        url: config.AD_url,
        baseDN: config.AD_baseDN,
        username: username  + '@' + config.domain,
        password: password,
        attributes: {
            user: [ 'givenName', 'sn', 'cn', 'mail', 'employeeNumber' ]
          }
    }

    let ad = new ActiveDirectory(adOptions)
    let userInfo = {}
    ad.authenticate(domainUsername, password, function(err, auth) {
        if (err) {
            log(`Error with AD authentication: domainUser: ${domainUsername}`)
            log(JSON.stringify(err, null, 4))
            callback({error: err})

        } else if (auth) {
            // log('Got Auth')
            ad.findUser(username, function(err, user) {
                if (err) {
                  log('ERROR: ' +JSON.stringify(err));
                  return;
                }

                if (! user) log('User: ' + username + ' not found.');
                else userInfo = user;
                // log('userInfo:'+ user)
              });

            ad.getGroupMembershipForUser(username, function(err, groups) {
                if (err) {
                    log('getting the groups error')
                    log('ERROR: ' +JSON.stringify(err))
                    return
                }
                if (! groups) {
                    log('User: ' + username + ' not found.')
                    return
                } else {
                    // log('in getGroupMembershipForUser')
                // got groups, build a list of the groups Common Names, and return
                    var userGroups = []
                    for (var i = 0; i < groups.length; i++) {
                        var groupName = groups[i]['cn']
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
                    let locationAndManager = async function(id) {
                        let data = [
                            {
                                "WORKSITE": "",
                                "LONG_DESC": "",
                                "ManagerID": "",
                                "ManagerLName": "",
                                "ManagerFName": "",
                                "ManagerEmail": "",
                                "ManagerUsername": ""
                            }
                        ]
                        if (userGroups.includes('VIS')) {
                            data = [
                                {
                                    "WORKSITE": "595",
                                    "LONG_DESC": "Mesa Valley Community School",
                                    "ManagerID": "999999"
                                }
                            ]
                        } else if (userGroups.includes('JRE')) {
                            data = [
                                {
                                    "WORKSITE": "496",
                                    "LONG_DESC": "Juniper Ridge",
                                    "ManagerID": "999999"
                                }
                            ]
                        } else if (userGroups.includes('Students')) {
                            data = [
                                {
                                    "employeeNumber": "STUDENT",
                                    "WORKSITE": "9222",
                                    "LONG_DESC": "Student",
                                    "ManagerID": "92222"
                                }
                            ]
                        } else {
                            // log('get sql getStaffSiteAndManager')
                            data =  await sqlQuery.getStaffSiteAndManager(id)
                            // log('got sql length: '+ data.length)
                            if (data.length === 0) {
                                // no data for user found in IFAS
                                // mostly works like subs without regular
                                // assigment. Give them a faked worksite
                                data = [
                                    {
                                        "WORKSITE": "9111",
                                        "LONG_DESC": "No Permanent Worksite"
                                    }
                                ]
                                userGroups.push('SubsSmartsheet')
                            }
                            let data2 = await sqlQuery.getStaffBuilding(id)
                            log('###############################')
                            // log(JSON.stringify(data2, null, 4))
                            log('###############################')
                        }
                        // log(data)
                        // log('user: "'+ username +'" belongs to groups: "'+userGroups+'"')
                        let user = {
                            username: username,
                            userGroups: userGroups,
                            userInfo: {...userInfo, ...data[0]}

                        }
                        // log('end getGroupMembershipForUser')
                        callback(user)
                    }
                    locationAndManager(userInfo.employeeNumber)
                }
            })
        }
    })

}
exports.authenticate = function(username, password, origin, callback) {
    log('FUNCTION:authenticate.authenticate')
    performAuthentication(username, password, origin, function(username) {
        callback(username)
    })

}

