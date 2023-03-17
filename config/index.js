const global = require('./global')
const local = require('../../config/formMaker_local.js')

module.exports = {
    ...global,
    ...local
}
