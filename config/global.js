// These settings should be common between environments

const global = {
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
}
module.exports = global