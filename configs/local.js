'use strict';

require('dotenv').config()

let localConfig = {
    hostname: '192.168.56.20',
    port: 3003,
    viewDir: './app/views',
    smartSheet_api: process.env.SMARTSHEET_ACCESS_TOKEN,
    smartSheet_url: 'https://api.smartsheet.com/2.0/'

};

module.exports = localConfig;
