'use strict';

const
    express = require('express'),
    loginRoute = require('./login'),


let router = express.Router();

router.post('/login',
           login.post_login)

module.exports = router;


