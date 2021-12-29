'use strict';

const
    express = require('express'),
    { engine } = require('express-handlebars'),
    bodyParser = require('body-parser');

module.exports = function() {
    let server = express(),
        create,
        start;

    create = function(config) {
        let components = require('./components');

        // Server settings
        server.set('env', config.env);
        server.set('port', config.port);
        server.set('hostname', config.hostname);
        server.set('viewDir', config.viewDir);

        // Returns middleware that parses json
        server.use(bodyParser.json());


        // Set up components
        components.init(server);
    };

    start = function() {
        let hostname = server.get('hostname'),
            port = server.get('port');

        server.listen(port, function () {
            console.log('Express server listening on - http://' + hostname + ':' + port);
        });
    };

    return {
        create: create,
        start: start
    };
};
