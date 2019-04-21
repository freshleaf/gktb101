var mysql = require('mysql');
var connection;

function openConnection() {
    connection = mysql.createConnection({
        host: 'localhost',
        user: 'gktb',
        password: 'ggyy@GKTB101',
        port: '3306',
        database: 'GKTB'
    });
    connection.connect();
}
function closeConnection() {
    connection.end();
}

module.exports = function (app) {
    app.use('/api/location', function (req, res) {
        openConnection();
        var sql = 'SELECT * FROM location ORDER BY location_order';

        connection.query(sql, function (err, results) {
            if (err) {
                console.log('[SELECT ERROR] - ', err.message);
                res.statusCode = 503;
                res.send({
                    result: 'error',
                    err: err.code
                });
                return;
            }
            var locationList = [];
            if (results) {
                for (var i = 0; i < results.length; i++) {
                    var location = {};
                    location.name = results[i].location_name;
                    location.code = results[i].location_code;
                    location.order = results[i].location_order;
                    locationList.push(location);
                }
            }
            res.json(locationList.map(function (a) {
                return {
                    name: a.name,
                    code: a.code,
                    order: a.order,
                };
            }));
        });
        closeConnection();
    });

};