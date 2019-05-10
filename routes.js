var main = require('./handlers/main.js');
var static = require('./handlers/static');

module.exports = function (app) {
    app.get('/1', function (req, res) {
        res.send('Hello world');
    });
    app.get('/', main.home);
    app.get('/test', main.test);
    app.get('/scoreline/location', main.location_line);
    app.get('/setGoal', main.setGoal);
    app.get('/doMatch', main.doMatch);
    app.get('/changeGoal', main.changeGoal);

    app.get('/service', static.service);
    app.get('/about', static.about);
    app.get('/feedback', static.feedback);
};
