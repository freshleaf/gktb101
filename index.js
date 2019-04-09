var express = require('express');
var app = express();

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

app.set('port', process.env.PORT || 6666);

// router
require('./routes.js')(app);

app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

app.use(function (req, res) {
    res.status(500);
    res.render('500');
});

app.listen(app.get('port'), function () {
    console.log('Express started on hostname:' +
        app.get('port') + '; press Ctrl-C to terminate.');
});