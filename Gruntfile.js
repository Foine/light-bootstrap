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

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('package.json'),
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
        src: [
          'common_public/theme/<%= pkg.current_theme %>/javascript/<%= pkg.name %>_src.js'
        ],
        dest: 'common_public/theme/<%= pkg.current_theme %>/javascript/<%= pkg.name %>.js'
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
        dest: 'common_public/theme/<%= pkg.current_theme %>/javascript/<%= pkg.name %>.min.js'
      }
    },

    less: {
      compileCore: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>.css.map',
          sourceMapFilename: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>.css.map'
        },
        src: 'less/<%= pkg.name %>_<%= pkg.current_theme %>.less',
        dest: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>.css'
      },
      compileTheme: {
        options: {
          strictMath: true,
          sourceMap: true,
          outputSourceFiles: true,
          sourceMapURL: '<%= pkg.name %>-theme.css.map',
          sourceMapFilename: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>-theme.css.map'
        },
        src: 'less/theme_<%= pkg.current_theme %>.less',
        dest: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>-theme.css'
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
        src: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>.css'
      },
      theme: {
        options: {
          map: true
        },
        src: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>-theme.css'
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
        src: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>.css',
        dest: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>.min.css'
      },
      minifyTheme: {
        src: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>-theme.css',
        dest: 'common_public/theme/<%= pkg.current_theme %>/style/<%= pkg.name %>-theme.min.css'
      }
    },

    csscomb: {
      options: {
        config: 'bootstrap/less/.csscomb.json'
      },
      dist: {
        expand: true,
        cwd: 'common_public/theme/<%= pkg.current_theme %>/style/',
        src: ['*.css', '!*.min.css'],
        dest: 'common_public/theme/<%= pkg.current_theme %>/style/'
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
    }

  });


  // These plugins provide necessary tasks.
  require('load-grunt-tasks')(grunt, { scope: 'devDependencies' });
  require('time-grunt')(grunt);

  // JS distribution task.
  grunt.registerTask('ideoPortal', ['less', 'cssmin', 'concat', 'uglify']);

  // JS distribution task.
  grunt.registerTask('dist-js', ['concat', 'uglify:core', 'commonjs']);

  // CSS distribution task.
  grunt.registerTask('less-compile', ['less:compileCore', 'less:compileTheme']);
  grunt.registerTask('dist-css', ['less-compile', 'autoprefixer:core', 'autoprefixer:theme', 'csscomb:dist', 'cssmin:minifyCore', 'cssmin:minifyTheme']);

  // Full distribution task.
  grunt.registerTask('dist', ['clean:dist', 'dist-css', 'dist-js']);

  // Default task.
  grunt.registerTask('default', ['clean:dist']);

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
