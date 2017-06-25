var gulp = require('gulp');
var gulpLoadPlugins = require('gulp-load-plugins');
var $ = gulpLoadPlugins();
var del = require('del');
var vinylPaths = require('vinyl-paths');
// var csslint = require('gulp-csslint');

var REPORT_DIR = 'reports/';
var ESLINT_FILE_NAME = 'eslint-checkstyle.xml';
var CSSLINT_FILE_NAME = 'csslint-checkstyle.xml';
var HTMLHINT_FILE_NAME = 'htmlhint-checkstyle.xml';

gulp.task('eslint', function () {
  var fs = require('fs');
  gulp.src('app/scripts/*.js')
    .pipe($.eslint('.eslintrc'))
    .pipe($.eslint.format('checkstyle', fs.createWriteStream(REPORT_DIR + ESLINT_FILE_NAME)));
});

gulp.task('csslint',
  $.shell.task('csslint --format=checkstyle-xml app/styles > ' + REPORT_DIR + CSSLINT_FILE_NAME)
);

process.env.HTMLHINT_CHECKSTYLE_FILE = REPORT_DIR + HTMLHINT_FILE_NAME;
gulp.task('htmlhint', function () {
  gulp.src('app/*.html')
    .pipe($.htmlhint('.htmlhintrc'))
    .pipe($.htmlhint.reporter('gulp-htmlhint-checkstyle-file-reporter'))
    .pipe(gulp.dest(REPORT_DIR + '.tmp'))
    .on('end', function () {
      gulp.src(REPORT_DIR + '*.tmp.*')
        .pipe(vinylPaths(del))
        .pipe($.concat(HTMLHINT_FILE_NAME))
        .pipe($.header('<?xml version="1.0" encoding="utf-8"?>\n<checkstyle version="4.3">\n'))
        .pipe($.footer('\n</checkstyle>'))
        .pipe(gulp.dest(REPORT_DIR))
        .on('end', function () {
          del([REPORT_DIR + '.tmp']);
        });
    });
});

gulp.task('lint', ['eslint', 'csslint', 'htmlhint'], function () {
  gulp.src(REPORT_DIR + '*.xml')
    .pipe($.prettyData({ type: 'prettify' }))
    .pipe(gulp.dest(REPORT_DIR));
});

gulp.task('lint:clean', function () {
  return del([REPORT_DIR + '*.*']);
});

gulp.task('lint:default', ['lint:clean'], function () {
  gulp.start('lint');
});

// Initialize
var argv = require('minimist')(process.argv.slice(2));
var browserSync = require('browser-sync');
var changed = require('gulp-changed');
var concat = require('gulp-concat');
var flatten = require('gulp-flatten');
var gulpif = require('gulp-if');
var imagemin = require('gulp-imagemin');
var jshint = require('gulp-jshint');
var lazypipe = require('lazypipe');
var less = require('gulp-less');
var merge = require('merge-stream');
var please = require('gulp-pleeease');
var plumber = require('gulp-plumber');
var rev = require('gulp-rev');
var runSequence = require('run-sequence');
var sass = require('gulp-sass');
var sourcemaps = require('gulp-sourcemaps');
var uglify = require('gulp-uglify');
var babel = require('gulp-babel');
var manifest = require('asset-builder')('./manifest.json');
var manifest_bable = require('asset-builder')('./manifest_babel.json');
var ngAnnotate = require('gulp-ng-annotate');

var path = manifest.paths;
var config = manifest.config || {};
var globs = manifest.globs;
var project = manifest.getProjectGlobs();
var enabled = {
  comment: !argv.production,
  rev: argv.production,
  maps: !argv.production,
  failStyleTask: argv.production
};
var revManifest = path.dist + 'assets.json';

// Closures
// Tasks to build css
var cssTasks = function (filename) {
  return lazypipe()
    .pipe(function () {
      return gulpif(!enabled.failStyleTask, plumber());
    })
    .pipe(function () {
      return gulpif(enabled.maps, sourcemaps.init());
    })
    .pipe(function () {
      return gulpif('*.less', less());
    })
    .pipe(function () {
      return gulpif('*.scss', sass({
        outputStyle: 'nested',
        precision: 10,
        includePaths: ['.'],
        errLogToConsole: !enabled.failStyleTask
      }));
    })
    .pipe(concat, filename)
    .pipe(please, {
      'autoprefixer': { 'browsers': ['last 2 versions', 'ie 8', 'ie 9', 'android 2.3', 'android 4', 'opera 12'] },
      'filters': true,
      'rem': false,
      'opacity': true,
      'pseudoElements': false,
      'minifier': true,
      'mqpacker': true
    })
    .pipe(function () {
      return gulpif(enabled.rev, rev());
    })
    .pipe(function () {
      return gulpif(enabled.maps, sourcemaps.write('.'));
    })();
};

// Tasks to build js
var jsTasks = function (filename) {
  return lazypipe()
    .pipe(function () {
      return gulpif(enabled.maps, sourcemaps.init());
    })
    .pipe(concat, filename)
    .pipe(function () {
      return gulpif(enabled.rev, rev());
    })
    .pipe(function () {
      return gulpif(enabled.maps, sourcemaps.write('.'));
    })();
};

var jsTasks_babel = function (filename) {
  return lazypipe()
    .pipe(function () {
      return gulpif(enabled.maps, sourcemaps.init());
    })
    .pipe(babel)
    .pipe(concat, filename)
    .pipe(ngAnnotate)
    .pipe(function () {
      return gulpif(enabled.comment, uglify({ preserveComments: 'some' }), uglify());
    })
    .pipe(function () {
      return gulpif(enabled.rev, rev());
    })
    .pipe(function () {
      return gulpif(enabled.maps, sourcemaps.write('.'));
    })();
};

// Tasks to write revision
var writeToManifest = function (directory) {
  return lazypipe()
    .pipe(gulp.dest, path.dist + directory)
    .pipe(browserSync.stream, { match: '**/*.{js,css}' })
    .pipe(rev.manifest, revManifest, {
      base: path.dist,
      merge: true
    })
    .pipe(gulp.dest, path.dist)();
};

// Main Tasks
// `gulp styles` or `gulp --production styles`
gulp.task('styles', ['wiredep'], function () {
  var merged = merge();
  manifest.forEachDependency('css', function (dep) {
    var cssTasksInstance = cssTasks(dep.name);
    if (!enabled.failStyleTask) {
      cssTasksInstance.on('error', function (err) {
        console.error(err.message);
        this.emit('end');
      });
    }
    merged.add(gulp.src(dep.globs, { base: 'styles' })
      .pipe(cssTasksInstance));
  });
  return merged
    .pipe(writeToManifest('styles'));
});

// `gulp scripts` or `gulp --production scripts`
gulp.task('scripts', ['jshint'], function () {
  var merged = merge();
  manifest.forEachDependency('js', function (dep) {
    merged.add(
      gulp.src(dep.globs, { base: 'scripts' })
        .pipe(jsTasks(dep.name))
    );
  });
  return merged
    .pipe(writeToManifest('scripts'));
});

gulp.task('scripts_babel', ['jshint'], function () {
  var merged = merge();
  manifest_bable.forEachDependency('js', function (dep) {
    merged.add(
      gulp.src(dep.globs, { base: 'scripts' })
        .pipe(jsTasks_babel(dep.name))
    );
  });
  return merged
    .pipe(writeToManifest('scripts'));
});

// `gulp fonts`
gulp.task('fonts', function () {
  return gulp.src(globs.fonts)
    .pipe(flatten())
    .pipe(gulp.dest(path.dist + 'fonts'))
    .pipe(browserSync.stream());
});

// `gulp html`
gulp.task('html', function () {
  return gulp.src(path.source + '*.html')
    .pipe(flatten())
    .pipe(gulp.dest(path.dist))
    .pipe(browserSync.stream());
});

gulp.task('inject', function() {
  return gulp
    .src('dist/index.html')
    .pipe($.inject(gulp.src(['dist/**/*.js', 'dist/**/*.css']), {
      relative: true // no need for the './src/client' part
    }))
    .pipe(gulp.dest('dist')); // output the index.html
});

// `gulp images`
gulp.task('images', function () {
  return gulp.src(globs.images)
    .pipe(imagemin({
      progressive: true,
      interlaced: true,
      svgoPlugins: [{ removeUnknownsAndDefaults: false }]
    }))
    .pipe(gulp.dest(path.dist + 'images'))
    .pipe(browserSync.stream());
});

// `gulp jshint`
gulp.task('jshint', function () {
  return gulp.src([
    'bower.json', 'gulpfile.js'
  ].concat(project.js))
    .pipe(jshint())
    .pipe(jshint.reporter('jshint-stylish'))
    .pipe(jshint.reporter('fail'));
});

// `gulp clean`
gulp.task('clean', require('del').bind(null, [path.dist]));

// `gulp watch` or `gulp --production watch`
var url = require('url');
var proxy = require('proxy-middleware');
gulp.task('serve', function () {
  var proxyOptions = url.parse('http://localhost:3000/api');
  proxyOptions.route = '/api';
  // requests to `/api/x/y/z` are proxied to `http://localhost:3000/secret-api`

  browserSync({
    open: false,
    port: 3000,
    server: {
      baseDir: "dist",
      middleware: [proxy(proxyOptions)]
    }
  });
  gulp.watch([path.source + 'styles/**/*'], ['styles']);
  gulp.watch([path.source + 'scripts/**/*'], ['jshint', 'scripts_babel', 'htmlInject']);
  gulp.watch([path.source + 'fonts/**/*'], ['fonts']);
  gulp.watch([path.source + 'images/**/*'], ['images']);
  gulp.watch([path.source + '*.html'], ['htmlInject']);
  gulp.watch(['bower.json', 'manifest.json'], ['build']);
});

// `gulp build` of `gulp --production build`
gulp.task('htmlInject', function (callback) {
  runSequence(
    'html',
    'inject',
    callback);
});

// `gulp build` of `gulp --production build`
gulp.task('build', function (callback) {
  runSequence(
    'lint',
    'styles',
    'scripts',
    'scripts_babel',
    'htmlInject',
    ['fonts', 'images'],
    callback);
});

// `gulp wiredep`
gulp.task('wiredep', function () {
  var wiredep = require('wiredep').stream;
  return gulp.src(project.css)
    .pipe(wiredep())
    .pipe(changed(path.source + 'styles', {
      hasChanged: changed.compareSha1Digest
    }))
    .pipe(gulp.dest(path.source + 'styles'));
});

// `gulp` or `gulp --production`
gulp.task('default', ['lint:clean', 'clean'], function () {
  gulp.start('build');
});