/*global module:false*/
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), // the package file to use
    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    },
    mocha_phantomjs: {
      all: ['test/**/*.html']
    },
    uglify: {
      build: {
        src: 'src/<%= pkg.name.toLowerCase() %>.js',
        dest: '<%= pkg.name.toLowerCase() %>-min.js'
      }
    },
    concat: {
      options: {
        stripBanners: { block:false, line:true },        
        banner: '// <%= pkg.name %> v<%= pkg.version %> #<%= grunt.template.today("yyyymmdd") %> - <%= pkg.homepage %>\n'+
                '// by <%= pkg.author.name %> <<%= pkg.author.email %>>\n'+
                '// <%= pkg.name %> may be freely distributed under the <%= pkg.license %> license.\n\n'
      },
      source: {
        src: ['src/<%= pkg.name.toLowerCase() %>.js'],
        dest: 'src/<%= pkg.name.toLowerCase() %>.js',
      },
      min: {
        src: ['<%= pkg.name.toLowerCase() %>-min.js'],
        dest: '<%= pkg.name.toLowerCase() %>-min.js',
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  grunt.registerTask('default', ['jshint','mocha_phantomjs','uglify','concat']);
  grunt.registerTask('test', ['mocha_phantomjs']);

};
