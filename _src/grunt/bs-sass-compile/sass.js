// Compile Bootstrap with [Ruby Sass][1] using [grunt-contrib-sass][2]
// [1]: https://github.com/sass/sass
// [2]: https://github.com/gruntjs/grunt-contrib-sass
module.exports = function configureRubySass(grunt) {
  var options = {
    loadPath: ['scss'],
    precision: 6,
    sourcemap: 'auto',
    style: 'expanded',
    trace: true,
    bundleExec: true
  };
  grunt.config.merge({
    sass: {
      core: {
        options: options,
        files: {
          '../common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.styles_name %>.css': 'scss/<%= pkg.current_theme %>.scss'
        }
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-sass');
};
