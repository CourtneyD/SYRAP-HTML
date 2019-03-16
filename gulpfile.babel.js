'use strict';

import  {series,parallel,src,dest,watch,lastRun} from 'gulp';

//CSS plugins
import autoprefixer from 'gulp-autoprefixer';
import cleanCSS from 'gulp-clean-css';
import sass from 'gulp-sass';

//JS plugins
import buffer from 'vinyl-buffer';
import browserify from 'browserify';
import concat from 'gulp-concat';
import source from 'vinyl-source-stream';
import uglify from 'gulp-uglify';
import sourcemaps from 'gulp-sourcemaps';
import watchify from 'watchify';

//Image plugins
import imagemin from 'gulp-imagemin';

//nunjucks HTML templating
import nunjucks from 'gulp-nunjucks-render';

//Utility plugins
import del from 'del';
import inject from 'gulp-inject';
import rename from 'gulp-rename';

//Browser plugins
import browserSync from 'browser-sync';


const path = {
  base: {
    src: 'src',
    dest: 'dist'
  },
  sass: {
    src: 'src/scss/*.scss',
    dest: 'src/css/',
    components: 'src/scss/components/*.scss',
    vendors: 'src/scss/vendors/'
  },
  css: {
    src: 'src/css/*.css',
    dest: 'dist/css/'
  },
  scripts: {
    src: 'src/js/app.js',
    dest: 'dist/js/'
  },
  nunjucks: {
    src: 'src/templates/',
    dest: 'dist/',
    pages: 'src/pages/**/*.+(html|njk|nunjucks)'
  },
  node: {
    src: './node_modules/'
  }
};

exports.default = series(clean,sassCompile,cssCompile,nunjucksCompile,jsCompile,liveServer);

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
  return src(path.sass.src)
    .pipe(inject(injectAppFiles, injectAppOptions))
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sass({
        outputStyle: 'nested',
        errLogToConsole: true,
        includePaths: [
                        //path.node.src+'@fortawesome/fontawesome-free/scss',
                        path.sass.vendors+'bootstrap/',
                        path.node.src+'bootstrap/scss'
                      ],
    }).on('error', sass.logError))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(path.sass.dest));
}

export function cssCompile() {
  return src(path.css.src, { since: lastRun(cssCompile) })
  .pipe(sourcemaps.init({loadMaps: true}))
  .pipe(autoprefixer({
      browsers: ['last 10 versions'],
      cascade: false
    }))
    .pipe(cleanCSS())
    .pipe(rename({ suffix: '.min' }))
    .pipe(sourcemaps.write('.'))
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

export function assetInject() {
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
  watch('src/scss/**/*.scss', series(sassCompile, cssCompile, reload));
  watch(['src/templates/**/*.njk','src/pages/**/*.njk'], series(nunjucksCompile, reload));
  watch('src/js/**/*.js', series(jsCompile, reload));
  cb();
}

function reload(cb) {
  browserSync.reload();
  cb();
}

export function jsCompile(){
  var bundle = browserify({
    entries: [path.scripts.src],
    debug: true
  });
  return bundle.bundle()
    .pipe(source('app.min.js'))
    .pipe(buffer())
    .pipe(uglify())
    .pipe(sourcemaps.init({loadMaps: true}))
    .pipe(sourcemaps.write('./maps'))
    .pipe(dest(path.scripts.dest));
}

export function fontCompile(){
  return src('node_modules/@fontawesome/fontawesome-free/webfonts/*')
  .pipe(gulp.dest(path.base.dest+'/fonts/'));
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
