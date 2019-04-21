var syncMysql = require('sync-mysql');

var connection = new syncMysql({
    host: 'localhost',
    user: 'gktb',
    password: 'ggyy@GKTB101',
    port: '3306',
    database: 'GKTB'
});

var locations = [];

function getLocations() {
    if (locations.length == 0) {
        var sql = 'SELECT * FROM location ORDER BY location_order';
        const results = connection.query(sql);
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var location = {};
                location.name = results[i].location_name;
                location.code = results[i].location_code;
                location.order = results[i].location_order;
                locations.push(location);
            }
        }
    }
    return locations;
}

exports.getLocations = getLocations;
