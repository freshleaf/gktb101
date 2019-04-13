var loadtest = require('loadtest');
var expect = require('chai').expect;

suite('Stress tests', function () {
    test('Homepage should handle 50 requests in under a second', function (done) {
        var options = {
            url: 'http://localhost:80',
            concurrency: 4,
            maxRequests: 50,
        };
        loadtest.loadTest(options, function (err, result) {
            expect(!err);
            expect(result.totalTimeSeconds < 1);
            done();
        });
    });
});

// mocha -u tdd -R spec qa/tests-stress.js 2>/dev/null