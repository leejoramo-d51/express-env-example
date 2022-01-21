'use strict';

const globalConfig = require('../../config/formMakerV2.json')
require('dotenv').config()



const hostname = '192.168.56.20'
const port = 3003
const appPath = '/'
const baseURL = `http://${hostname}:${port}${appPath}`
let localConfig = {
    hostname: hostname,
    port: port,
    appPath: appPath,
    baseURL: baseURL,
    ...globalConfig


}

module.exports = localConfig;
