/*global module:false*/
module.exports = function(grunt) {

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'), // the package file to use
    jshint: {
      all: ['Gruntfile.js', 'src/**/*.js', 'test/**/*.js']
    },
    uglify: {
      options: {
        banner: '//  <%= pkg.name %> <%= pkg.version %>.<%= grunt.template.today("yyyymmdd") %> <%= pkg.homepage %>\n'+
                '//  by <%= pkg.author %>\n\n'
      },
      build: {
        src: 'src/<%= pkg.name.toLowerCase() %>.js',
        dest: '<%= pkg.name.toLowerCase() %>-min.js'
      }
    },
    mocha_phantomjs: {
      all: ['test/**/*.html']
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');

  // Default task(s).
  grunt.registerTask('default', ['jshint','mocha_phantomjs','uglify']);

};
