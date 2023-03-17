/**
 *  logger functions
 *
 */

//TODO: add debug levels
//TODO: add logging to file option


/**
 * Configuration
 */

 // const config = require.main.require('./config')
 // const fs = require('fs')


 /**
  * Local Functions
  */

Date.prototype.toLocaleISOString = function() {
    const zOffsetMs = this.getTimezoneOffset() * 60 * 1000;
    const localTimeMs = this - zOffsetMs;
    const date = new Date(localTimeMs);
    const utcOffsetHr = this.getTimezoneOffset() / 60;
    const utcOffsetSign = utcOffsetHr <= 0 ? '+' : '-';
    const utcOffsetString = utcOffsetSign + (utcOffsetHr.toString.length == 1 ? `0${utcOffsetHr}` : `${utcOffsetHr}`) + ':00';
    return date.toISOString().replace('Z', utcOffsetString);
};


 /**
  * Exported Functions
  */


module.exports.log = function(message='', data='') {

    let output = new Date().toLocaleISOString()
    let indent = '    '
    output += ' -- '
    if (message !== '') {
        output += message
    }
    if (data !== '') {
        output += `\n${indent}`
        output += JSON.stringify(data, null, 4).split('\n').join('\n'+indent)
    }
    console.log(output)
}

module.exports.banner = function(message='') {
    let output = `--( ${message} )--`
    output = output.padEnd(79, '-')
    console.log(output)

}
