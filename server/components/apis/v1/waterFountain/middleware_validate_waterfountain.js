/**
 * :formName validate
 *
 * the validate forms
 *
 **/
 const {log, banner} =  require('../../../../../lib/logger')
 const validate = require('../../../../../lib/validate/validate_waterfountain')
const validationSuite = validate.validationSuite


 /**
  * validate
  */


module.exports.checkValidation = function checkValidation() {
    return function(req, res, next) {
        log('in checkValidation')

        log(req)

        const values = req.body
        const validation = validationSuite(values)
        const isValid = validation.errorCount === 0

        // stuff happens

        if (isValid) {
            log('in Programmers group gets all access')
            return next()

        } else {
            log('denied access')
            res.setHeader('Content-Type', 'application/json')
            res.send(JSON.stringify({
                "message": "not valid"
            }))
            return
        }

    }
}
