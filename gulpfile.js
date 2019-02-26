const { dest, series, parallel, src, watch } = require('gulp');

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

//nunjucks HTML templating
const nunjucks = require('gulp-nunjucks-render');

//Utility plugins
const del = require('del');
const rename = require('gulp-rename');
const inject = require('gulp-inject');
const data = require('gulp-data');

//Browser plugins
const browserSync = require('browser-sync').create();

//paths??
const appSrc = 'src';
const appDest = 'dist';

exports.default = series(deleteDist,sassCompile,cssCompile,nunjucksCompile,cssInject);

exports.clean = deleteDist;
exports.compileSASS = sassCompile;
exports.compileCSS = cssCompile;
exports.compileNunjucks = nunjucksCompile;
exports.injectCSS = cssInject;

//exports.compileHTML = HTMLCompile;
//exports.compileCSS = cssCompile;
exports.compressImage = imageCompress;


//entirely remove the generated application distribution folder and its contents
function deleteDist() {
  return del([appDest+'/**', '!'+appDest], {force:true});
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
  cb();
}

function reload(cb) {
  browserSync.reload();
  cb();
}

function nunjucksCompile() {
  return src(appSrc+'/pages/**/*.+(html|njk|nunjucks)')
    //.pipe(data(function(){
    //  return require('./app/data.json');
    //}))
    .pipe(nunjucks({
      path: [appSrc+'/templates/']
    }))
    .pipe(dest(appDest+'/'));
};

function cssInject() {
  var injectFiles = src([appDest+'/css/*.css']);
  var injectOptions = {
    addRootSlash: false,
    ignorePath: [appSrc, appDest]
  };
  return src(appDest+'/*.html')
    .pipe(inject(injectFiles, injectOptions))
    .pipe(dest(appDest+'/'));
}

function sassCompile() {
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
  return src(appSrc+'/scss/app.scss')
    .pipe(inject(injectAppFiles, injectAppOptions))
    .pipe(sass({
        outputStyle: 'nested',
        errLogToConsole: true,
        includePaths: ['./src/scss/vendors/bootstrap/','./node_modules/bootstrap/scss'],
    }).on('error', sass.logError))
    .pipe(dest(appSrc+"/css/"));
}

function cssCompile() {
  //investigate postcss to remove unused css and reduce impact of bootstrap
  return src(appSrc+'/css/app.css')
    .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(appDest+'/css/'));
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
