var main = require('./handlers/main.js');
var static = require('./handlers/static');
var search = require('./handlers/search');

module.exports = function (app) {
    app.get('/1', function (req, res) {
        res.send('Hello world');
    });
    app.get('/', main.home);
    app.get('/scoreline/location', main.location_line);
    app.get('/setGoal', main.setGoal);
    app.get('/doMatch', main.doMatch);
    app.get('/changeGoal', main.changeGoal);
    app.get('/resetGoal', main.resetGoal);
    app.get('/trend', main.trend);
    app.get('/trend/locationLine', main.trendLocationLine);
    app.get('/trend/locationLinePredict', main.trendLocationLinePredict);

    app.get('/service', static.service);
    app.get('/about', static.about);
    app.get('/feedback', static.feedback);

    app.get('/search', search.handleSearch);
    app.get('/search/location', search.searchLocationScore);
    app.get('/search/university', search.searchUniversityScore);
    app.get('/search/major', search.searchMajorScore);
};
