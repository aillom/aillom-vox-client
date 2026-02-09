const { src, dest } = require('gulp');
const path = require('path');

function copyIcons() {
    return src('nodes/**/*.svg')
        .pipe(dest('dist/nodes'));
}

exports['build:icons'] = copyIcons;
exports.default = copyIcons;
