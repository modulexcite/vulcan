module.exports = function(grunt) {

  // LOAD ALL GRUNT TASKS
  require('load-grunt-tasks')(grunt);

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),

    browserify: {
      production: {
        files: {
          'production/js/vulcan.js': ['app/js/vulcan.jsx']
        },
        options: {
          transform: ['reactify'],
          browserifyOptions: {
            debug: true,
            extensions: ['.js', '.jsx']
          }
        }
      }
    },

    uglify: {
      production: {
        options: {
          preserveComments: 'some'
        },
        files: [{
          expand: true,
          cwd: 'production/js',
          src: '**/*.js',
          dest: 'production/js'
        }]
      }
    },

    sass: {
      dist: {
        files: {
          'tmp/css/vulcan.css': 'app/scss/vulcan.scss',
          'tmp/css/demo.css': 'app/scss/demo.scss'
        }
      }
    },

    autoprefixer: {
      production: {
        expand: true,
        flatten: true,
        src: 'tmp/css/*.css',
        dest: 'production/css/'
      }
    },

    clean: ["tmp"],

    compress: {
      main: {
        options: {
          archive: 'chrome-extension.zip'
        },
        files: [
          {
            cwd: 'chrome-extension/',
            src: ['**/*'],
            expand: true
          }
        ]
      }
    },

    copy: {
      html: {
        files: [{
          expand: true,
          cwd: 'app/html',
          src: ['**/*.html'],
          dest: 'production'
        }]
      },
      bower: {
        files: [{
          expand: true,
          cwd: '.',
          src: ['bower_components/**/*'],
          dest: 'production'
        }]
      },
      images: {
        files: [{
          expand: true,
          cwd: 'app/images',
          src: ['**/*'],
          dest: 'production/images'
        }]
      },
      chrome: {
        files: [{
          expand: true,
          cwd: 'production',
          src: ['js/**/*.js', 'bower_components/**/*', 'css/vulcan.css', 'images/**/*.{png,jpg,gif}', '!images/promo/**/*', '!index.html'],
          dest: 'chrome-extension/panes'
        }]
      }
    },

    connect: {
      livereload: {
        options: {
          port: 8000,
          livereload: 35729, // change this to '0.0.0.0' to access the server from outside
          hostname: 'localhost',
          base: 'production',
          open: true
        }
      }
    },

    watch: {

      options: {
        debounceDelay: 250
      },

      sass: {
        files: ['app/scss/**/*.scss'],
        tasks: ['sass', 'autoprefixer', 'copy:chrome']
      },

      js: {
        files: ['app/js/**/*'],
        tasks: ['browserify', 'copy:chrome']
      },

      html: {
        files: ['app/html/**/*.html'],
        tasks: ['copy:html', 'copy:chrome']
      },

      livereload: {
        options: {
          livereload: '<%= connect.livereload.options.livereload %>'
        },
        files: [
          'app/scss/**/*.scss',
          'app/js/**/*',
          'app/html/**/*'
        ]
      }
    }
  });

  grunt.registerTask('build:production', ['sass', 'autoprefixer', 'browserify', 'uglify', 'copy:html', 'copy:bower', 'copy:images', 'copy:chrome', 'compress', 'clean']);
  grunt.registerTask('build:development', ['sass', 'autoprefixer', 'browserify', 'copy:html', 'copy:bower', 'copy:images', 'copy:chrome', 'clean']);

  //DEVELOPMENT FOR WEB PLATFORM
  grunt.registerTask('dev', ['build:development', 'connect', 'watch']);

  //DEFAULT TASK ($ grunt) builds app and chrome extention
  grunt.registerTask('default', ['build:production']);
};
