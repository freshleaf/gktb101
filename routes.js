var main = require('./handlers/main.js');
var static = require('./handlers/static');

module.exports = function (app) {
    app.get('/1', function (req, res) {
        res.send('Hello world');
    });
    app.get('/', main.home);
    app.get('/test', main.test);
    app.get('/scoreline/location', main.location_line);

    app.get('/service', static.service);
    app.get('/about', static.about);
};
