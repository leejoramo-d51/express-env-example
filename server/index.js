'use strict'

// external packages

const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const flash = require('connect-flash')
const session = require('#lib/sessions')


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

        // use CORS

        server.use(cors())

        server.use(function(req, res, next) {
            res.header("Access-Control-Allow-Origin", "*")
            res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept")
            next()
        });

        // Returns middleware that parses json
        server.use(bodyParser.urlencoded({ extended: false }))
        server.use(bodyParser.json())

        // setup sessions
        server.use(session)

        // Flash Messages
        server.use(flash())
        server.use(function(req, res, next){
            res.locals.success_messages = req.flash('success_messages')
            res.locals.error_messages = req.flash('error_messages')
            res.locals.info_messages = req.flash('info_messages')
            next()
        });

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



