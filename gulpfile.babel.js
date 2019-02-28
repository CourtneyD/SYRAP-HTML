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


const path = {
  base: {
    src: 'src',
    dest: 'dist'
  },
  sass: {
    src: 'src/scss/*.scss',
    dest: 'dist/css/',
    components: 'src/scss/components/*.scss'
  },
  css: {
    src: 'src/css/*.css,',
    dest: 'dist/css/'
  },
  scripts: {
    src: 'src/scripts/**/*.js',
    dest: 'assets/scripts/'
  },
  nunjucks: {
    src: 'src/templates/',
    dest: 'dist/',
    pages: 'src/pages/**/*.+(html|njk|nunjucks)'
  },
  fonts: {
    src: 'src/scripts/**/*.js',
    dest: 'assets/scripts/'
  }
};

exports.default = series(clean,sassCompile,cssCompile,nunjucksCompile,cssInject,liveServer);

export function clean() {
  return del([path.base.dest+'/**', '!'+path.base.dest], {force:true});
};

export function sassCompile() {
  var injectAppFiles = src([path.sass.components, '!'+path.sass.src], {read: false});
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
  return src(path.sass.src)
    .pipe(inject(injectAppFiles, injectAppOptions))
    .pipe(sass({
        outputStyle: 'nested',
        errLogToConsole: true,
        includePaths: ['./src/scss/vendors/bootstrap/','./node_modules/bootstrap/scss'],
    }).on('error', sass.logError))
    .pipe(dest(path.sass.dest));
}

export function cssCompile() {
  //investigate postcss to remove unused css and reduce impact of bootstrap
  return src(path.css.src)
    .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(dest(path.css.dest));
}

export function nunjucksCompile() {
  return src(path.nunjucks.pages)
    //.pipe(data(function(){
    //  return require('./app/data.json');
    //}))
    .pipe(nunjucks({
      path: [path.nunjucks.src]
    }))
    .pipe(dest(path.nunjucks.dest));
};

export function cssInject() {
  var injectFiles = src([path.base.dest+'/css/*.css']);
  var injectOptions = {
    addRootSlash: false,
    ignorePath: [path.base.src, path.base.dest]
  };
  return src(path.base.dest+'/*.html')
    .pipe(inject(injectFiles, injectOptions))
    .pipe(dest(path.base.dest));
}

export function liveServer(cb){
  browserSync.init({
    server: {
      baseDir: path.base.dest,
      index: "index.html",
      directory: false
    },
    notify: true
  });
  watch(path.base.dest+'/**/*', reload);
  cb();
}

function reload(cb) {
  browserSync.reload();
  cb();
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
