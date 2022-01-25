'use strict';

const
    express = require('express'),
    loginRoute = require('./login')


let router = express.Router()

router.post('/my', (req, res)=>{
    console.log('/auth/my')
    res.send('/auth/my yes')
})
router.post('/login',
           loginRoute.post_login)

module.exports = router



