const gulp = require('gulp');
const less = require('gulp-less');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const browserSync = require('browser-sync').create();
const rename = require('gulp-rename');
const nunjucksRender = require('gulp-nunjucks-render');
const data = require('gulp-data');
const fs = require('fs');
const del = require('del');

gulp.task('clean-html', function () {
    return del([
        'output/*.html'
    ]);
});

gulp.task('less', done => {
    gulp.src([
            'app/less/*.less',
            // 'node_modules/normalize.css/normalize.css', 
            // 'node_modules/bootstrap-less-port/dist/css/bootstrap-grid.css'
        ])
        .pipe(sourcemaps.init())
        .pipe(less())
        .pipe(autoprefixer())
        .pipe(sourcemaps.write())
        .pipe(gulp.dest('output/css'))
        .pipe(browserSync.stream())

        done();
});

gulp.task('vendor', done => {
    gulp.src('vendor/**')
        .pipe(gulp.dest('output'))

        done()
});

gulp.task('js', done => {
    gulp.src('app/**/*.js')
        .pipe(gulp.dest('output'))

        done()
});

gulp.task('images', done => {
    gulp.src('app/**/*.{gif,jpg,png,svg}')
        .pipe(gulp.dest('output'))

        done()
});

gulp.task('nunjucks', function() {
    // Gets .html and .nunjucks files in pages
    return gulp.src('app/pages/**/*.+(html|nunjucks)')
        // Renders template with nunjucks
        .pipe(nunjucksRender({
            path: ['app/templates/']
        }))
        // output files in app folder
        .pipe(gulp.dest('app'))
});

gulp.task('readJSON', done => {

    const global_config = JSON.parse(fs.readFileSync('./gulp_config.json'));
    for (site of global_config) {
        processSite(site);
    }

    done();
});

function processSite(siteData) {

    for (page of siteData.pages) {
        createPage(page, siteData.templates_folder, siteData.common_json, siteData.dest_folder);
    }
    
}

function createPage(pageData, templatesSource, commonJson, outputDirectory) {

    return gulp.src(pageData.page)
        .pipe(getData(pageData.data, commonJson))
        .pipe(nunjucksRender({
            path: [templatesSource],
            data: pageData.data
        }))
        .pipe(rename(pageData.output_name))
        .pipe(gulp.dest(outputDirectory))
        .pipe(browserSync.stream())
        
}

function getData(pageFile, commonFile) {   
    const pageData = JSON.parse(fs.readFileSync(pageFile));    
    const commonData = JSON.parse(fs.readFileSync(commonFile));

    return data({
        PAGE: pageData,
        COMMON: commonData
    });
}

gulp.task('watch', function () {
    browserSync.init({
        server: 'output'
    });

    gulp.watch('app/json/*.+(js|json)', gulp.series(['clean-html', 'readJSON']));
    gulp.watch('app/pages/*.nunjucks', gulp.series(['clean-html', 'readJSON']));
    gulp.watch('app/templates/**/*.nunjucks', gulp.series(['clean-html', 'readJSON']));
    gulp.watch('vendor', gulp.series('vendor'));
    gulp.watch('app/**/*.{gif,jpg,png,svg}', gulp.series('images'));
    gulp.watch('app/less/**/*.less', gulp.series('less'));
    gulp.watch('app/js/**/*.js', gulp.series('js'));
    gulp.watch('./output').on('change', browserSync.reload);
});

gulp.task('default', gulp.parallel(
    'vendor',
    'less',
    'js',
    'images',
    'clean-html',
    'readJSON'
));
