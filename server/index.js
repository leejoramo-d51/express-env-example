'use strict'

// external packages

const express = require('express')
const{ engine } = require('express-handlebars')
const bodyParser = require('body-parser')

// project packages

const config = require('../config')


module.exports = function() {
    let server = express()
    let create
    let start

    create = function() {
        let components = require('./components')

        // Server settings
        server.set('env', config.env)
        server.set('port', config.port)
        server.set('hostname', config.hostname)
        server.set('viewDir', config.viewDir)

        // Returns middleware that parses json
        server.use(bodyParser.json())

        // Set up components
        components.init(server)
    }

    start = function() {
        let hostname = server.get('hostname')
        let port = server.get('port')

        server.listen(port, function () {
            console.log('Express server listening on - http://' + hostname + ':' + port)
        })
    }

    return {
        create: create,
        start: start
    }
}
