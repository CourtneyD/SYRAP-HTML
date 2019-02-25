"use strict";

const { dest, series, parallel, src, watch } = require('gulp');

//nunjucks HTML templating
const nunjucksRender  = nunjucksRender = require('gulp-nunjucks-render');

//CSS plugins
const autoprefixer = require('gulp-autoprefixer');
const cleanCSS = require('gulp-clean-css');
const sass = require('gulp-sass');

//JS plugins
const concat = require('gulp-concat');
const uglify = require('gulp-uglify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');

//Image plugins
const imagemin = require('gulp-imagemin');

//Utility plugins
const del = require('del');
const rename = require('gulp-rename');
const inject = require('gulp-inject');

//Browser plugins
const browserSync = require('browser-sync').create();

//paths??
const appSrc = 'src';
const appDest = 'dist';


//entirely remove the generated application distribution folder and its contents
function deleteDist(cb) {
  del([appDest]);
  cb()
};


function liveServer(cb){
  browserSync.init({
    server: {
      baseDir: appDest,
      index: "index.html",
      directory: false
    },
    notify: true
  });
  watch(appDest+'/**/*', reload);
  cb()
}

exports.default = series(buildAssets,HTMLCompile,liveServer);
exports.resetBuild = deleteDist;
exports.compileAssets = buildAssets;
exports.compileHTML = HTMLCompile;
exports.compileCSS = cssCompile;
exports.compressImage = imageCompress;

function reload(done) {
  browserSync.reload();
  done();
}

//HTML compilation {inject,pipe}
function HTMLCompile(cb) {
  var injectFiles = src([appDest+'/css/*.css']);
  var injectOptions = {
    addRootSlash: false,
    ignorePath: [appSrc, appDest]
  };
  src(appSrc+'/index.html')
    .pipe(inject(injectFiles, injectOptions))
    .pipe(dest(appDest+'/'))
  cb()
}

//CSS compilation {inject,sass,prefix,rename,min,pipe}
function cssCompile(cb) {
  var injectAppFiles = src([appSrc+'/scss/components/*.scss', '!'+appSrc+'/scss/app.scss'], {read: false});
  function transformFilepath(filepath) {
    return '@import "' + filepath + '";';
  }
  var injectAppOptions = {
    transform: transformFilepath,
    starttag: '// inject:scss',
    endtag: '// endinject',
    addRootSlash: false
  };
  //investigate postcss to remove unused css and reduce impact of bootstrap
  src(appSrc+'/scss/app.scss')
    .pipe(inject(injectAppFiles, injectAppOptions))
    .pipe(sass({
        outputStyle: 'nested',
        errLogToConsole: true,
        includePaths: ['./src/scss/vendors/bootstrap/','./node_modules/bootstrap/scss'],
    }).on('error', sass.logError))
    .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(dest(appSrc+"/css/"))
    .pipe(rename({ suffix: '.min' }))
    .pipe(cleanCSS())
    .pipe(dest(appDest+'/css/'))
  cb()
}


function buildAssets(cb){
  series(deleteDist,cssCompile);
  cb()
}

function imageCompress(cb){
  src('./img/*')
    .pipe(imagemin([
      imagemin.gifsicle({interlaced: true}),
      imagemin.jpegtran({progressive: true}),
      imagemin.optipng({optimizationLevel: 5}),
      imagemin.svgo({
        plugins: [
          {removeViewBox: true},
          {cleanupIDs: false}
        ]
      })
    ]))
    .pipe(dest('./dist/img'));
  cb()
}
