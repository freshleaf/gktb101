var express = require('express');
var app = express();
app.set('port', process.env.PORT || 10010);

var handlebars = require('express-handlebars').create({
    defaultLayout: 'main',
    helpers: {
        section: function (name, options) {
            if (!this._sections) this._sections = {};
            this._sections[name] = options.fn(this);
            return null;
        }
    }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

// router
require('./routes.js')(app);

app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

app.use(function (req, res) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

var server = app.listen(app.get('port'), function () {
    var host = server.address().address
    var port = server.address().port

    console.log("start http://%s:%s, press Ctrl+C to cancel", host, port)
});