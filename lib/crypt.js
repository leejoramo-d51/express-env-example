/**
 * Load Module dependencies
 */

 const config = require('../config')
 const {log, banner} =  require('./logger')

 const crypto = require('crypto')
 const algorithm = 'aes-128-cbc'
 const args = process.argv
 const salt = config.crypt.SALT
 const vector = config.crypt.VECTOR

 function encrypt(text){
   const cipher = crypto.createCipheriv('aes-256-cbc',
     new Buffer.from(salt), new Buffer.from(vector))
   let crypted = cipher.update(text, 'utf8', 'hex')
   crypted += cipher.final('hex')
   return crypted
 }
 module.exports.encrypt = encrypt

 function decrypt(text){
   const decipher = crypto.createDecipheriv('aes-256-cbc',
     new Buffer.from(salt), new Buffer.from(vector))
   let dec = decipher.update(text, 'hex', 'utf8')
   dec += decipher.final('utf8')
   return dec
 }
 module.exports.decrypt = decrypt






 if (require.main === module) {
  banner('crypt.js via CLI.')
  log('you can run this as `./crypt.sj "My secret"` to encrypt your secrets')
  log()
  log("Text to encrypt:")
  log(args[2])
  log("Encrypted as:")
   encryptedText = encrypt(args[2])
  log(encryptedText)
   decryptedText = decrypt(encryptedText)
  log("Decrypted back:")
  log(decryptedText)

  banner('SQL_SECRET')
  let pw = process.env.SQL_SECRET
  log('c: '+pw)
   decryptedText = decrypt(pw)
  log('d: '+decryptedText)

  banner('SQL_SECRET_2')
   pw = process.env.SQL_SECRET_2
  log('c: '+pw)
   decryptedText = decrypt(pw)
  log('d: '+decryptedText)

  banner('SMARTSHEET_ACCESS_TOKEN')
   pw = process.env.SMARTSHEET_ACCESS_TOKEN
  log('c: '+pw)
   decryptedText = decrypt(pw)
  log('d: '+decryptedText)
  log('')

 }
