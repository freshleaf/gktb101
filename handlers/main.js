var mysql = require('mysql');
var connection;
const static = require('../lib/static.js');

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

exports.home = function (req, res) {
    res.render('home');
};

exports.test = function (req, res) {
    openConnection();
    var sql = 'SELECT * FROM location ORDER BY location_order';

    connection.query(sql, function (err, results) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
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
        res.render('test', {location: locationList, myLocations: static.getLocations()});
    });
    closeConnection();
};

exports.location_line = function (req, res) {
    var code = req.query.location;
    var whereCondition = null;
    if (code) {
        whereCondition = "WHERE location_batch_line.registration_location_code = ? ";
    }

    openConnection();
    var sql = 'SELECT * FROM location_batch_line left join location ' +
        'on location_batch_line.registration_location_code = location.location_code ';
    if (whereCondition) {
        sql = sql + whereCondition;
    }
    sql = sql + 'ORDER BY year DESC';

    connection.query(sql, code, function (err, results) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
        }
        var scorelineList = [];
        if (results) {
            for (var i = 0; i < results.length; i++) {
                var scoreline = {};
                scoreline.year = results[i].year;
                scoreline.no = i + 1;
                scoreline.location = results[i].location_name;
                scoreline.student_type = results[i].student_type;
                scoreline.batch = results[i].batch;
                scoreline.socre = results[i].score_line;
                scorelineList.push(scoreline)
            }
        }
        res.render('score_line_location', {location: static.getLocations(), scoreline: scorelineList});
    });
    closeConnection();
};
