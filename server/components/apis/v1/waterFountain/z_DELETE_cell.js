module.exports.getSheetRow = async function (req, res, schema) {
    // this is the landing page for a form
    const formName = schema.formName
    banner('getSheetRow: ' + formName)

   /**
    * get route permissions

       TODO: enable permission checks
       const requiredPermissionRoutes = req.session.requiredPermissionRoutes
       const grantedPermissionToRoutes = req.session.grantedPermissionToRoutes
   */
   const routePermissions = {
       required: [formName],
       granted: [formName]
   }
   let permissions = tools.getRoutePermissions(formName, routePermissions)

   /** Filters */
    let filter = ''
    if ('filter' in req.query) {
        filter = req.query['filter']
    }


    /**
     * call smartsheet api to get sheet
     */
    console.log(req.params.rowId)
    const options = {
        sheetId: schema['sheetId'],
        rowId: req.params.rowId,
        queryParameters: {
            include: "writerInfo,rowPermalink,discussions",
            includeAll: true
        }
    }
    log('options', options)
    let sheetInfo = await smartsheet.sheets.getRow(options)
        .catch(function (error) {
            log('error: get_row', error)
        })

    /* process returned data */
    let rows = []
    // TODO: fix bad permisisons.
    if (permissions.hasView) {

            const rowConfig = {
                filter: filter
            }
            rows.push(tools.getRow(0, sheetInfo, schema, rowConfig))

    }

    let page = {
        formName: formName,
        sheetId: schema['sheetId'],
        query: req.query,
        formFilter: filter,
        session: req.session,
        grantedPermissionToRoutes: routePermissions.granted,
        hasView: permissions.hasView,
        hasUpdate: permissions.hasUpdate,
        baseURL: config.baseURL,
        url: config.baseURL + '/' + formName,
        dateToday: tools.dateToday(),
        // userFullName: req.session.userInfo.givenName + ' ' + req.session.userInfo.sn,
        // isProgrammer: req.session.isProgrammer,
        // hasUpdateDropDownsAccess: req.session.hasUpdateDropDownsAccess,
        // message: req.flash('info')
        rowData: rows
    }

    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(page))
}
