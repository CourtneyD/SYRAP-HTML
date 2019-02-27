import  {series,parallel,src,dest,watch} from 'gulp';

//CSS plugins
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import sass from 'gulp-sass';

//JS plugins
import concat from 'gulp-concat';
import uglify from 'gulp-uglify';
import browserify from 'browserify';
import source from 'vinyl-source-stream';
import buffer from 'vinyl-buffer';

//Image plugins
import imagemin from 'gulp-imagemin';

//nunjucks HTML templating
import nunjucks from 'gulp-nunjucks-render';

//Utility plugins
import del from 'del';
import rename from 'gulp-rename';
import inject from 'gulp-inject';
import data from 'gulp-data';

//Browser plugins
import browserSync from 'browser-sync';


//paths??
const appSrc = 'src';
const appDest = 'dist';

const paths = {
  sass: {
    src: 'src/styles/**/*.less',
    dest: 'assets/styles/'
  },
  css: {
    src: 'src/scripts/**/*.js',
    dest: 'assets/scripts/'
  },
  scripts: {
    src: 'src/scripts/**/*.js',
    dest: 'assets/scripts/'
  },
  fonts: {
    src: 'src/scripts/**/*.js',
    dest: 'assets/scripts/'
  },
  nunjucks: {
    src: 'src/scripts/**/*.js',
    dest: 'assets/scripts/'
  }
};

exports.default = series(deleteDist,sassCompile,cssCompile,nunjucksCompile,cssInject,liveServer);

exports.clean = deleteDist;
exports.compileSASS = sassCompile;
exports.compileCSS = cssCompile;
exports.compileNunjucks = nunjucksCompile;
exports.injectCSS = cssInject;

exports.compressImage = imageCompress;


//entirely remove the generated application distribution folder and its contents
export function deleteDist() {
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

function jsCompile(){
  //return src(appSrc+)
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
