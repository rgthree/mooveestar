![MooVeeStar](http://rgthree.github.io/mooveestar/media/logo.png)
==========

MooVeeStar is a MV* Framework built ontop of MooTools. It has been based off other MVC Frameworks such as Backbone.js and Epitome.


## Documentation

See the documentation at [http://rgthree.github.io/mooveestar/](http://rgthree.github.io/mooveestar/)


## Source

- The minified file of MooVeeStar is at /[mooveestar-min.js](mooveestar-min.js)
- The full source file of MooVeeStar is at /[src/mooveestar.js](src/mooveestar.js)


## Development

MooVeeStar uses grunt to automate linting, testing and compressing.

1. [Fork the MooVeeStar repo](https://help.github.com/articles/fork-a-repo)
2. Clone your fork to your local machine

        $ git clone git@github.com:<your_username>/mooveestar.git

2. Install the development dependencies

        $ cd mooveestar
        $ npm install
        
3. Make your changes in `src/mooveestar.js`
4. Add/modify your tests in `test/tests/test.js`
5. Run grunt to lint, test and compress your work

        $ grunt 
        
6. If all goes well, commit with a thought out message
7. If you have contributions, send a [pull request](https://help.github.com/articles/using-pull-requests)


## Breaking Changelog

**0.1.1+20140423**

- [Private] We will now use `<template>` tags and their shadowDom. This means we only store the fragment now, and do not _need_ to parse an HTML string. Now, templates may not strip comments & whitespace and only store a `DocumentFragment` under the template data's `fragment` key (removing the `markup` and `dom` keys respectively).
