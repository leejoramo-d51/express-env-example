'use strict';

const apiRoute = require('./apis')
const utilityRoute = require('./utility')
// const loginRoute = require('./login')

function init(server) {
    server.get('*', function (req, res, next) {
        console.log('Request was made to: ' + req.originalUrl);
        return next();
    });

/*     server.get('/', function (req, res) {
        res.redirect('/home');
    }); */

    server.use('/api', apiRoute);
    server.use('/utility', utilityRoute)
   // server.use('/login', loginRoute)

}

module.exports = {
    init: init
};