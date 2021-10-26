const gulp = require("gulp");
const autoprefixer = require("gulp-autoprefixer");
const babel = require("gulp-babel");
const cleancss = require("gulp-clean-css");
const terser = require("gulp-terser");

function css() {
  return gulp.src("source-raw/css/*.css")
    .pipe(autoprefixer())
    .pipe(cleancss())
    .pipe(gulp.dest("source/css"));
}

function js() {
  return gulp.src("source-raw/js/*.js")
    .pipe(babel({
      presets: ["@babel/preset-env"]
    }))
    .pipe(terser())
    .pipe(gulp.dest("source/js"));
}

exports.default = gulp.parallel(css, js);
