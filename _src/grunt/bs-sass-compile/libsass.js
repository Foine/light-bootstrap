// Compile Bootstrap with [libsass][1] using [grunt-sass][2]
// [1]: https://github.com/sass/libsass
// [2]: https://github.com/sindresorhus/grunt-sass
module.exports = function configureLibsass(grunt) {
  grunt.config.merge({
    sass: {
      options: {
        includePaths: ['scss'],
        precision: 6,
        sourceComments: false,
        sourceMap: true,
        outputStyle: 'expanded'
      },
      core: {
        files: {
          '../common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.styles_name %>.css': 'scss/<%= pkg.current_theme %>.scss'
        }
      },
    }
  });
  grunt.loadNpmTasks('grunt-sass');
};
