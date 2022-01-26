/*

# sql notes


 */

/**
 * Configuration
 */

 const config = require('../config')
 const { log, banner } = require('./logger')
 const {decrypt} = require('./crypt')
 const Database = require('better-sqlite3')

 const mssql = require('mssql')

 log('Start sqlQuery')

 const sqlConfig = {
     user: 'joramo',
     password: decrypt(config.secret.mssql_2),
     server: 'BPLUS71DB.mesa.k12.co.us',
     database: 'ifas',
     domain: 'mesa.k12.co.us',
     requestTimeout: 300000,
     "options": {
         "encrypt": false,
         "enableArithAbort": false
     }
 }

 async function SQLQuery(sqlConfig, query) {
     try {
         const pool = await new mssql.ConnectionPool(sqlConfig).connect();
         const result = await pool.request().query(query);
         pool.close();
         let data = result.recordset
         return data
     } catch (e) {
         log(JSON.stringify(e))
         return Promise.reject([]);
     }
 }

 module.exports.getStaffSiteAndManager = getStaffSiteAndManager
 async function getStaffSiteAndManager(id) {

     let query = `
         SELECT
              RTRIM(ISNULL(WORKSITE, '')) as WORKSITE
             ,RTRIM(ISNULL(LONG_DESC, '')) as LONG_DESC
             ,RTRIM(ISNULL(ManagerID, '')) as ManagerID
             ,RTRIM(ISNULL(ManagerLName, '')) as ManagerLName
             ,RTRIM(ISNULL(ManagerFName, '')) as ManagerFName
             ,RTRIM(ISNULL(ManagerEmail, '')) as ManagerEmail
             ,RTRIM(ISNULL(ManagerUsername, '')) as ManagerUsername
         FROM [ifas].[SS].[staff]
         WHERE ID = '${id}'

         `.trim()

     const data = await SQLQuery(sqlConfig, query)
     return data
 }


 let getStaffBuilding = async function(id) {
     banner('function - getStaffBuilding')
     const db = new Database(config.staffBuildingStorage);
     sql = `
         SELECT
             TRIM(LastName)
             ,TRIM("Employee ID")
             ,TRIM("JobTitle")
             ,TRIM("Building")
             ,TRIM("BuildingName")
         FROM staffBuilding
         WHERE 'Employee ID' = '${id}'
     `.trim()
     // sql = `SELECT * FROM staffBuilding`.trim()
     try {
         log(sql)
         sqlPrepared = db.prepare(sql)
         dbResponse = await sqlPrepared.all()
         log(JSON.stringify(dbResponse, null, 4))
         return dbResponse
     } catch(err) {
         log(`Error getStaffBuilding: ${err}`)
         return null
     }
 }
 module.exports.getStaffBuilding = getStaffBuilding

 if (require.main === module) {
     getStaffSiteAndManager('22736')
         .then(data => log(data))
         .catch(err => log(err))


 }