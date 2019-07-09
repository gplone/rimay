/**
 * Module dependencies
 */

const del = require('del')
const gulp = require('gulp')
const cssnano = require('cssnano')
const mqpacker = require('css-mqpacker')
const autoprefixer = require('autoprefixer')
const gulpLoadPlugins = require('gulp-load-plugins')

const { name, version, homepage, author, license } = require('./package')

// loade all gulp plugins
const $ = gulpLoadPlugins()

// environment
const isProduction = process.argv.includes('--production') || process.env.NODE_ENV === 'production'

// build comments
const comments = `/*!
 * ${name} v${version}
 * Copyright ${new Date().getFullYear()} ${author.name} <${author.email}> (${author.url})
 * Licensed under ${license}
 */`

/**
 * Private tasks
 */

const clean = () => {
  return del(['assets'])
}

const style = () => {
  return gulp.src('src/scss/*.scss')
    .pipe($.plumber())
    .pipe($.if(!isProduction, $.sourcemaps.init()))
    .pipe($.sass({ outputStyle: 'expanded' }).on('error', $.sass.logError))
    .pipe($.if(isProduction, $.postcss([ autoprefixer(), mqpacker(), cssnano() ])))
    .pipe($.if(isProduction, $.header(comments)))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('assets/styles'))
    .pipe($.livereload())
}

const script = () => {
  return gulp.src('src/js/*.js')
    .pipe($.plumber())
    .pipe($.if(!isProduction, $.sourcemaps.init()))
    .pipe($.babel({ presets: [ '@babel/env' ] }))
    .pipe($.if(isProduction, $.uglify()))
    .pipe($.if(isProduction, $.header(comments)))
    .pipe($.if(!isProduction, $.sourcemaps.write()))
    .pipe(gulp.dest('assets/scripts'))
    .pipe($.livereload())
}

const image = () => {
  return gulp.src('src/img/**/*.*')
    .pipe($.plumber())
    .pipe($.if(isProduction, $.imagemin()))
    .pipe(gulp.dest('assets/images'))
    .pipe($.livereload())
}

const archive = () => {
  const source = [
    'assets/**',
    'locales/*.json',
    '**/*.hbs', '!node_modules/**',
    'LICENSE',
    'package.json',
    'README.md'
  ]

  return gulp.src(source, { base: '.' })
    .pipe($.plumber())
    // .pipe($.zip(`${name}-v${version}.zip`))
    .pipe($.zip(`${name}.zip`))
    .pipe(gulp.dest('.'))
}

const watch = () => {
  $.livereload.listen()
  gulp.watch('src/scss/**', style)
  gulp.watch('src/js/**', script)
  gulp.watch('src/img/**/*.*', image)
  gulp.watch('**/*.hbs').on('change', p => $.livereload.changed(p))
}

const compile = gulp.parallel(style, script, image)

/**
 * Public tasks
 */

const build = gulp.series(clean, compile)

const release = gulp.series(build, archive)

const develop = gulp.series(build, watch)

module.exports = { build, release, develop }
