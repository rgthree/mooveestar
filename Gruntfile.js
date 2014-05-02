/*global module:false*/
module.exports = function(grunt) {

  var pkg,v;
  pkg = grunt.file.readJSON('package.json');
  v = pkg.version.split('+');
  pkg.version = (v[0] || '0.0.1')+'+'+(grunt.template.today("yyyymmdd"));

  var browsers = [
    { browserName: 'Firefox', platform: 'Linux', version: '28' },
    { browserName: 'Firefox', platform: 'Windows 7', version: '7' },
    { browserName: 'Chrome', platform: 'Windows 7' },
    { browserName: 'Internet Explorer', platform: 'Windows 8.1', version: '11' },
    { browserName: 'Internet Explorer', platform: 'Windows 8', version: '10' },
    { browserName: 'Internet Explorer', platform: 'Windows 7', version: '9' },
    { browserName: 'Internet Explorer', platform: 'Windows 7', version: '8' },
    { browserName: 'Safari', platform:'OS X 10.8', version:'6' },
    { browserName: 'Safari', platform:'OS X 10.9', version:'7' }
  ];

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

    'saucelabs-mocha': {
      all: {
        options: {
          urls: ['http://127.0.0.1:9999/test/index.html'],
          build: process.env.TRAVIS_JOB_ID,
          tunnelTimeout: 5,
          concurrency: 3,
          browsers: browsers,
          testname: 'MooVeeStar'
        }
      }
    },
    connect: {
      server: {
        options: { base:'', port:9999 }
      }
    },

  });

  // Loading grunt dependencies in our package.json
  for(var key in pkg.devDependencies){
    if(key.indexOf('grunt-') === 0)
      grunt.loadNpmTasks(key);
  }

  grunt.registerTask('build', ['jshint','mocha_phantomjs','uglify','concat','replace']);
  grunt.registerTask('test', ['jshint','mocha_phantomjs']);
  grunt.registerTask('default', ['build']);

  grunt.registerTask('sauce', ['jshint','connect','saucelabs-mocha']);

};
