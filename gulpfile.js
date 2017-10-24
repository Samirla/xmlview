'use strict';

const stream = require('stream');
const gulp = require('gulp');
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const postcss = require('gulp-postcss');
const inlineImport = require('postcss-import');
const inlineUrl = require('postcss-url');
const autoprefixer = require('autoprefixer');

const production = process.env.NODE_ENV === 'production';
const postcssPlugins = [
	inlineImport(), 
	autoprefixer({ browsers: '> 5%'}),
	inlineUrl({ url: 'inline' })

];
const outChrome = './dist/chrome';

const coreFiles = [
	'lib/underscore.js',
	'lib/js-signals.js',
	'signals.js',
	'utils.js',
	'dom.js',
	'settings.js',
	'renderer.js',
	'search.js',
	'search_ui.js',
	'dnd.js',
	'outline.js',
	'outline_ui.js',
	'controller.js',
	'selection-notifier.js',
	'clipboard.js'
];

gulp.task('chrome', ['chrome:js', 'chrome:css', 'chrome:assets']);

gulp.task('chrome:js', () => {
	return gulp.src(coreFiles.concat('sizzle.js'), { cwd: './src' })
		.pipe(concat('xv.js'))
		.pipe(production ? uglify() : pass())
		.pipe(gulp.dest(outChrome))
});

gulp.task('chrome:css', () => {
	return gulp.src('./css/xv.css')
		.pipe(postcss(postcssPlugins))
		.pipe(gulp.dest(outChrome));
});

gulp.task('chrome:assets', () => {
	return gulp.src(['./extensions/chrome/**', './src/dnd_feedback.js'])
		.pipe(gulp.dest(outChrome));
});

gulp.task('watch', ['chrome'], () => {
	gulp.watch(['./src/**', './css/**', './extensions/chrome/**'], ['chrome']);
});

gulp.task('default', ['chrome']);

function pass() {
	return new stream.PassThrough({ objectMode: true });
}
