const vest = require('vest')
const { test, enforce, optional} = require('vest')
// import isEmail from 'validator/es/lib/isEmail'
const validator = require('validator')

let isEmail = validator.isEmail
let isURL = validator.isURL
let isDate = validator.isDate
enforce.extend({ isEmail, isDate, isURL });

const validationSuite = vest.create('testForm', (formData) => {
	optional['Date', 'Notes']
	test('Bottle', 'Must select a Bottle', () => {
		enforce(formData.Bottle)
			.isNotEmpty()
	})
	test('Email', 'Must be a valid email', () => {
		enforce(formData.Email)
			.isEmail()
	})
	test('Email', ' Must end with @joramo.com', () => {
		enforce(formData.Email.toLowerCase())
			.endsWith('@joramo.com')
	})
	test('Liters', 'Wrong Number', () => {
		enforce(formData.Liters)
			.equals("43")
	})
	test('Date', 'If Provided, must be a valid date', () => {
		enforce(formData.Date)
			.isDate()
	})
	test('URL', 'Must be a valid URL with HTTP(S)', () => {
		enforce(formData.URL)
			.isURL()
	})

})

module.exports.validationSuite = validationSuite