'use strict';

require('dotenv').config()

let localConfig = {
    hostname: '192.168.56.20',
    port: 3003,
    viewDir: './app/views',
    smartSheetClientConfig: {
        accessToken: '9m6mla2jttb974ydhimyixegmp',
        baseUrl: 'https://api.smartsheet.com/2.0/'
    }

};

module.exports = localConfig;
