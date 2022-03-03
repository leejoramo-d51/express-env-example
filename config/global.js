// These settings should be common between environments

const global = {
    "activeDirectory": {
        "domain": "mesa.k12.co.us",
        "NetBIOS_domain": "MESA",
        "AD_url": "ldap://chief.mesa.k12.co.us",
        "AD_baseDN": "dc=mesa,dc=k12,dc=co,dc=us"
    },
    // sqlite database for sessions
    "sessionDb": {
        "database": null,
        "username": null,
        "password": null,
        "sequelizeParams": {
            "dialect": "sqlite",
            "storage": "./sqliteDB/sessionStore.sqlite",
            "logging": false
        }
    },
    "sqlite": {
        "dropdownStorage": "./sqliteDB/dropdown.sqlite"
    },
    // smartsheets that contain dropdown colums
    "dropdownSheets": {
        "location": "824489438144388",
        "mentors": "8664983492945796",
        "newhires": "3608848134104964",
        "positions":"7008946041972612"
    },
    "dropdownTypes": [
        "PICKLIST",
        "CONTACT_LIST"
    ],
    "smartSheetAPI": {
        "accessToken": "",
        "baseUrl": "https://api.smartsheet.com/2.0/"
    },
    "routePermissionsSheetId": "318706682226564",
    /** id Authentication based routes -----------------------------------
     * these routes use only a provided Employee ID number to allow access
     * (most routes require AD username and password)
     */
    idAuthRoutes: ['covidScreeningSubs'],
}
module.exports = global