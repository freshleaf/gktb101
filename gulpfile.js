'use strict';

const gulp = require('gulp');
const {src} = require('gulp');
const eslint = require('gulp-eslint');
const mocha = require('gulp-mocha'); // https://github.com/sindresorhus/gulp-mocha

function alpha(cb) {
    console.log('alpha');
    cb();
}

function stresstest() {
    return gulp.src(['qa/tests-stress.js'], {read: false})
        .pipe(
            mocha({
                ui: 'tdd',
                reporter: 'spec'
            }));
}

function checkjs() {
    return src(['**/*.js', '!node_modules/**', '!public/**', '!qa/**'])
    // eslint() attaches the lint output to the "eslint" property
    // of the file object so it can be used by other modules.
        .pipe(eslint())
        // eslint.format() outputs the lint results to the console.
        // Alternatively use eslint.formatEach() (see Docs).
        .pipe(eslint.format())
        // To have the process exit with an error code (1) on
        // lint error, return the stream and pipe to failAfterError last.
        .pipe(eslint.failAfterError());
}

gulp.task(checkjs);
gulp.task(stresstest);
gulp.task('default', gulp.series(alpha, checkjs));