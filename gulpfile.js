const { src, dest, series, watch } = require("gulp");
const del = require("del");
const browserSync = require("browser-sync").create();
const fileInclude = require("gulp-file-include");
const sass = require("gulp-sass");
const rename = require("gulp-rename");
const autoPrefixer = require("gulp-autoprefixer");
const sourcemaps = require("gulp-sourcemaps");
const svgSprite = require("gulp-svg-sprite");
const htmlmin = require("gulp-htmlmin");
const imagemin = require("gulp-imagemin");
const ghPages = require("gulp-gh-pages");
const gutil = require("gulp-util");
const ftp = require("vinyl-ftp");

// Deploy вёрстки на gh-pages
function deploy() {
  return src("./dist/**/*").pipe(ghPages());
}

// Удаление папки dist
function clean() {
  return del(["dist/*"]);
}

// HTML файлы
function html() {
  return src("./src/*.html")
    .pipe(
      fileInclude({
        prefix: "@",
        basepath: "@file",
      })
    )
    .pipe(dest("./dist"))
    .pipe(browserSync.stream());
}

function htmlBuild() {
  return src("dist/**/*.html")
    .pipe(
      htmlmin({
        collapseWhitespace: true,
      })
    )
    .pipe(dest("dist"));
}

// Стили
function css() {
  return src("./src/sass/**/*.+(sass|scss)")
    .pipe(sourcemaps.init())
    .pipe(
      sass({
        outputStyle: "expanded",
      })
    )
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(
      autoPrefixer({
        overrideBrowserslist: ["last 10 version"],
        grid: true,
      })
    )
    .pipe(sourcemaps.write("."))
    .pipe(dest("./dist/css/"))
    .pipe(browserSync.stream());
}

function cssBuild() {
  return src("./src/sass/**/*.+(sass|scss)")
    .pipe(
      sass({
        outputStyle: "compressed",
      })
    )
    .pipe(
      rename({
        suffix: ".min",
      })
    )
    .pipe(
      autoPrefixer({
        overrideBrowserslist: ["last 10 version"],
        grid: true,
      })
    )
    .pipe(dest("./dist/css/"));
}

// Изображения
function img() {
  return src("./src/img/**/*").pipe(dest("./dist/img"));
}

function imgBuild() {
  return src("./src/img/**/*")
    .pipe(
      imagemin([
        imagemin.gifsicle({
          interlaced: true,
        }),
        imagemin.mozjpeg({
          quality: 75,
          progressive: true,
        }),
        imagemin.optipng({
          optimizationLevel: 5,
        }),
        imagemin.svgo({
          plugins: [
            {
              removeViewBox: true,
            },
            {
              cleanupIDs: false,
            },
          ],
        }),
      ])
    )
    .pipe(dest("./dist/img"));
}

// Svg sprite
function svgSprites() {
  return src("./src/img/svg/*.svg")
    .pipe(
      svgSprite({
        mode: {
          stack: {
            sprite: "../sprite.svg", // Sprite file name
          },
        },
      })
    )
    .pipe(dest("./dist/img"));
}

// Прочие ресурсы
function resources() {
  return src("./src/resources/**").pipe(dest("./dist"));
}

// Слежениe
function watching() {
  browserSync.init({
    server: {
      baseDir: "./dist",
    },
  });

  watch(["./src/*.html"], html);
  watch(["./src/chunk/*.html"], html);
  watch(["./src/sass/**/*.{sass,scss}"], css);
  watch(["./src/img/*.{jpg,jpeg,png,svg}"], img);
  watch(["./src/img/**/*.{jpg,jpeg,png}"], img);
  watch(["./src/img/svg/**.svg"], svgSprites);
  watch(["./src/resources/**"], resources);
}

// Деплой build версии на хостинг по FTP
function FtpDeploy() {
  let conn = ftp.create({
    host: "",
    user: "",
    password: "",
    parallel: 10,
    log: gutil.log,
  });

  let globs = ["dist/**"];

  return src(globs, {
    base: "./dist",
    buffer: false,
  })
    .pipe(conn.newer("/"))
    .pipe(conn.dest("/"));
}

exports.default = series(
  clean,
  html,
  css,
  img,
  svgSprites,
  resources,
  watching
);

exports.deploy = series(deploy);

exports.ftp = series(FtpDeploy);

exports.build = series(
  clean,
  html,
  cssBuild,
  svgSprites,
  resources,
  htmlBuild,
  imgBuild
);
