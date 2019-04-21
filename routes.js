var main = require('./handlers/main.js');

module.exports = function (app) {
    app.get('/1', function (req, res) {
        res.send('Hello world');
    });
    app.get('/', main.home);
    app.get('/about', main.about);
    app.get('/scoreline/location', main.location_line);
};
