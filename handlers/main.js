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

exports.home = function (req, res) {
    res.render('home');
};

exports.about = function (req, res) {
    openConnection();
    var sql = 'SELECT * FROM location ORDER BY location_order';
    var result;
    connection.query(sql, 13, function(err, results) {
        if (err) {
            console.log('[SELECT ERROR] - ', err.message);
        }
        if (results) {
            result = results[0].location_name;
        }
        res.render('about', {location: result});
    });
    closeConnection();
};