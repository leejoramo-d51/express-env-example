'use strict';

require('dotenv').config()

let localConfig = {
    hostname: '192.168.56.20',
    port: 3003,
    viewDir: './app/views',
    smartSheetClientConfig: {

        baseUrl: 'https://api.smartsheet.com/2.0/'
    }


}
localConfig.baseURL = `http://${localConfig.host}/formMakerApp`

module.exports = localConfig;
