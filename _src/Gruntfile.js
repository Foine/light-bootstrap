/*!
 * Based on Bootstrap's Gruntfile
 */

module.exports = function (grunt) {
  'use strict';

  // Force use of Unix newlines
  grunt.util.linefeed = '\n';

  RegExp.quote = function (string) {
    return string.replace(/[-\\^$*+?.()|[\]{}]/g, '\\$&');
  };

  var fs = require('fs');
  var path = require('path');
  var npmShrinkwrap = require('npm-shrinkwrap');
  var configBridge = grunt.file.readJSON('bootstrap/grunt/configBridge.json', { encoding: 'utf8' });

  var pkg = grunt.file.readJSON('package.json');
  var theme = grunt.file.readJSON('theme.json');

  var theme_path = '../common_public/theme/'+pkg.current_theme;
  var js_files = theme[pkg.current_theme].js_dependencies.concat([theme_path+'/javascript/'+pkg.name+'_src.js']);


  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: pkg,
    theme: theme,
    js_files: js_files,
    jqueryCheck: configBridge.config.jqueryCheck.join('\n'),
    jqueryVersionCheck: configBridge.config.jqueryVersionCheck.join('\n'),

    // Task configuration.
    clean: {
      dist: 'dist',
      docs: 'docs/dist'
    },

    concat: {
      options: {
        banner: '<%= banner %>\n<%= jqueryCheck %>\n<%= jqueryVersionCheck %>',
        stripBanners: false
      },
      bootstrap: {
        src: js_files,
        dest: theme_path+'/javascript/<%= pkg.name %>.js'
      }
    },

    uglify: {
      options: {
        compress: {
          warnings: false
        },
        mangle: true,
        preserveComments: 'some'
      },
      core: {
        src: '<%= concat.bootstrap.dest %>',
        dest: theme_path+'/javascript/<%= pkg.name %>.min.js'
      }
    },

    less: {
      compileCore: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>.css.map',
          sourceMapFilename: theme_path+'/style/<%= pkg.name %>.css.map'
        },
        src: 'less/<%= pkg.name %>_<%= pkg.current_theme %>.less',
        dest: theme_path+'/style/<%= pkg.name %>.css'
      }
    },

    autoprefixer: {
      options: {
        browsers: configBridge.config.autoprefixerBrowsers
      },
      core: {
        options: {
          map: true
        },
        src: theme_path+'/style/<%= pkg.name %>.css'
      }
    },

    cssmin: {
      options: {
        // TODO: disable `zeroUnits` optimization once clean-css 3.2 is released
        //    and then simplify the fix for https://github.com/twbs/bootstrap/issues/14837 accordingly
        compatibility: 'ie8',
        keepSpecialComments: '*',
        sourceMap: true,
        advanced: false
      },
      minifyCore: {
        src: theme_path+'/style/<%= pkg.name %>.css',
        dest: theme_path+'/style/<%= pkg.name %>.min.css'
      }
    },

    watch: {
      src: {
        files: '<%= concat.bootstrap.src %>',
        tasks: ['concat']
      },
      less: {
        files: 'less/**/*.less',
        tasks: 'less'
      }
    },

    exec: {
      npmUpdate: {
        command: 'npm update'
      }
    },

    bless: {
      css: {
        options: {
          cacheBuster: false,
          compress: true
        },
        files: {
          '<%= theme_path %>/style/ie9.css': '<%= less.compileCore.dest %>'
        }
      }
    }

  });


  // These plugins provide necessary tasks.
  require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });
  require('time-grunt')(grunt);

  // CSS distribution task.
  grunt.registerTask('less-compile', ['less:compileCore', 'bless', 'cssmin']);

  // JS distribution task.
  grunt.registerTask('js-compile', ['concat', 'uglify']);

  // CSS + JS distribution task
  grunt.registerTask('ideoPortal', ['less-compile', 'js-compile']);

  // Default task.
  grunt.registerTask('default', ['watch']);

  // Task for updating the cached npm packages used by the Travis build (which are controlled by test-infra/npm-shrinkwrap.json).
  // This task should be run and the updated file should be committed whenever Bootstrap's dependencies change.
  grunt.registerTask('update-shrinkwrap', ['exec:npmUpdate', '_update-shrinkwrap']);
  grunt.registerTask('_update-shrinkwrap', function () {
    var done = this.async();
    npmShrinkwrap({ dev: true, dirname: __dirname }, function (err) {
      if (err) {
        grunt.fail.warn(err);
      }
      var dest = 'test-infra/npm-shrinkwrap.json';
      fs.renameSync('npm-shrinkwrap.json', dest);
      grunt.log.writeln('File ' + dest.cyan + ' updated.');
      done();
    });
  });
};
