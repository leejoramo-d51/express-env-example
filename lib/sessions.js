const session = require('express-session')
const Sequelize = require('sequelize')
const SequelizeStore = require('connect-session-sequelize')(session.Store)
const config = require('../config')


//TODO: how are sessions expired?
const sequelizeSessionDB = new Sequelize(
    config.sessionDb.database,
    config.sessionDb.username,
    config.sessionDb.password,
    config.sessionDb.sequelizeParams
)

const mySessionStore = new SequelizeStore({
    db: sequelizeSessionDB
})

// make sure that Session tables are in place
mySessionStore.sync()

module.exports = session({
    secret: config.secret.session,
    resave: false,
    saveUninitialized: true,
    store: mySessionStore,
    cookie: {
       // secure: true // requires HTTPS connection
    }
});