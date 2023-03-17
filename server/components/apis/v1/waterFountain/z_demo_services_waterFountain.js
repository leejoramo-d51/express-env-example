'use strict';

const
    data = require('./z_demo_waterFountain_smartsheet.json')


function getData(req, res) {
    res.json(data);
}

function getDataAttribute(req, res) {
    let id = req.params.id || undefined,
        result = {};

     if (id !== undefined && data.hasOwnProperty(id)) {
        result = data[id]
     }

     res.json(result);
}

module.exports = {
    getData: getData,
    getDataAttribute: getDataAttribute
};
