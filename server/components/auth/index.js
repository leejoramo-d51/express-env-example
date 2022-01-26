'use strict';


const express = require('express')
const loginRoute = require('./login')
const {checkAuth} = require('../../../lib/middleware')


let router = express.Router()

router.get('/my',
    checkAuth([]),
    (req, res)=>{
        console.log('/auth/my'),
        res.send('/auth/my yes')
    }
)
router.post('/login',
           loginRoute.post_login)

router.get('/logout',
           loginRoute.get_logout)

module.exports = router



