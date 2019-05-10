var express = require('express');
var app = express();
var credentials = require('./credentials.js');

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

app.set('port', process.env.PORT || 80);
// cookie
app.use(require('cookie-parser')(credentials.cookieSecret));
app.use(require('express-session')({
    resave: false,
    saveUninitialized: false,
    secret: credentials.cookieSecret,
    cookie:{
        maxAge:7*24*1000*60*60 // default session expiration is 1 week
    },
}));
// session
app.use(function(req, res, next){
    res.locals.goal = req.session.goal;
    next();
});

// use domains for better error handling
app.use(function (req, res, next) {
    // create a domain for this request
    var domain = require('domain').create();
    // handle errors on this domain
    domain.on('error', function (err) {
        console.error('DOMAIN ERROR CAUGHT\n', err.stack);
        try {
            // failsafe shutdown in 5 seconds
            setTimeout(function () {
                console.error('Failsafe shutdown.');
                process.exit(1);
            }, 5000);

            // disconnect from the cluster
            var worker = require('cluster').worker;
            if (worker) worker.disconnect();

            // stop taking new requests
            server.close();

            try {
                // attempt to use Express error route
                next(err);
            } catch (error) {
                // if Express error route failed, try
                // plain Node response
                console.error('Express error mechanism failed.\n', error.stack);
                res.statusCode = 500;
                res.setHeader('Content-Type', 'text/plain');
                res.end('Server error.');
            }
        } catch (error) {
            console.error('Unable to send 500 response.\n', error.stack);
        }
    });

    // add the request and response objects to the domain
    domain.add(req);
    domain.add(res);

    // execute the rest of the request chain in the domain
    domain.run(next);
});

// logging
switch (app.get('env')) {
    case 'development':
        // compact, colorful dev logging
        app.use(require('morgan')('dev'));
        break;
    case 'production':
        // module 'express-logger' supports daily log rotation
        app.use(require('express-logger')({path: __dirname + '/logs/requests.log'}));
        break;
}

// static folder
app.use(express.static(__dirname + '/public'));

// define test
app.use(function (req, res, next) {
    res.locals.showTests = app.get('env') !== 'production' &&
        req.query.test === '1';
    next();
});

// router
require('./routes.js')(app);

// TODO
// api
// require('./apis.js')(app);

app.use(function (req, res) {
    res.status(404);
    res.render('404');
});

app.use(function (err, req, res) {
    console.error(err.stack);
    res.status(500);
    res.render('500');
});

var server;

function startServer() {
    // NODE_ENV=production node gktb101.js
    server = app.listen(app.get('port'), function () {
        var host = server.address().address;
        var port = server.address().port;

        console.log('env: %s, start http://%s:%s, press Ctrl+C to cancel', app.get('env'), host, port);
    });
}

if (require.main === module) {
    // application run directly; start app server
    startServer();
} else {
    // application imported as a module via "require": export function to create server
    module.exports = startServer;
}