'use strict';

const apiRoute = require('./apis')
const utilityRoute = require('./utility')
const loginRoute = require('./auth')
const {checkAuth} = require('../../lib/middleware')


function init(server) {
    server.get('*', function (req, res, next) {
        console.log('Request was made to: ' + req.originalUrl);
        return next();
    });
    server.post('*', function (req, res, next) {
        console.log('Request was made to POST: ' + req.originalUrl);
        return next();
    });

/*     server.get('/', function (req, res) {
        res.redirect('/home');
    }); */

    server.use('/api', checkAuth([]), apiRoute);
    server.use('/utility', utilityRoute)
    server.use('/auth', loginRoute)


}

module.exports = {
    init: init
};