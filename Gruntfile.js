/*global module:false*/
module.exports = function(grunt) {

  var pkg,v;
  pkg = grunt.file.readJSON('package.json');
  v = pkg.version.split('+');
  pkg.version = (v[0] || '0.0.1')+'+'+(grunt.template.today("yyyymmdd"));

  grunt.initConfig({

    pkg: pkg, // the package file to use

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
        banner: '// > <%= pkg.name %> v<%= pkg.version %> - <%= pkg.homepage %>\n'+
                '// > by <%= pkg.author.name %> <<%= pkg.author.email %>> <%= pkg.author.url %>\n'+
                '// > <%= pkg.name %> may be freely distributed under the <%= pkg.license %> license.\n\n'
      },
      source: {
        src: ['src/<%= pkg.name.toLowerCase() %>.js'],
        dest: 'src/<%= pkg.name.toLowerCase() %>.js',
      },
      min: {
        src: ['<%= pkg.name.toLowerCase() %>-min.js'],
        dest: '<%= pkg.name.toLowerCase() %>-min.js',
      }
    },

    replace: {
      main: {
        src: ['bower.json', 'package.json'],
        overwrite: true,
        replacements: [
          { from:/"version":\s*".*?"/g, to:'"version": "<%= pkg.version %>"'}
        ]
      }
    },


  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-concat');
  grunt.loadNpmTasks('grunt-mocha-phantomjs');
  grunt.loadNpmTasks('grunt-text-replace');

  grunt.registerTask('build', ['jshint','mocha_phantomjs','uglify','concat','replace']);
  grunt.registerTask('test', ['jshint','mocha_phantomjs']);
  grunt.registerTask('default', ['build']);

};
