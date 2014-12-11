# deposit ![NPM Version](https://img.shields.io/npm/v/deposit.svg?style=flat-square) ![Build Status](https://img.shields.io/travis/divshot/deposit/master.svg?style=flat-square) 

Gather resources and inject them into your html pages

## Install

```
npm install deposit --save
```

## Usage

```js
var fs = require('fs');
var http = require('http');
var deposit = require('deposit');

var d = deposit();

// Set up injectors
d.injector('fetch', require('deposit-fetch'));
d.injector('env', function (options, done) {
  
  // Do stuff
  
  done();
});

http.createServer(function (req, res) {

  fs.createReadStream('/path/to/some/file.html')
    .pipe(d)
    .pipe(res);

}).listen(3000);
```

Sample HTML file

```html

<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  
  <!-- inject:env -->
  <script>window.__env = {};</script>
  <!-- endinject -->

</head>
<body>
  
  <!-- inject:fetch url=http://some.site.com/page timeout=5 assign=bob -->
  <h1>Default Content</h1>
  <p>This is what it looks like if the data doesn’t get fetched (or gets fetched with an error).</p>
  <!-- endinject -->

</body>
</html>

```

## API

### deposit([options])

* `options`

### d.injector(name, function (options, done) {})

* `name` - The name of the inejctor. This is the name you will use in your html document. Only slug-valid names are allowed (i.e. `fetch`, `custom-injector`, etc).

### d.tree([filepath, function (err, contents) {}])

Parse and inject a file. By default, the function returns a stream. You may also provide a callback and it will be called and return the parsed file contents. This method also has a streaming interface.

* `filepath` - The path to the file to parse and inject.

### d.blockTree([filepath, function (err blocks) {}])

Parse the given html file and return an object representation of the parseable blocks. This method also has a streaming interface.

* `filepath` - The path to the file to parse and inject.

## Injectors

Injectors are used to put dynamic content into the html as static content. Injectors are basically plugins that exports a function:

```js
module.exports = function (options, done) {

});
```

The injector function recieves 2 parameters:

* `options` - This is an object map of the options in the commented markup. If the html had `<!-- inject:fetch url=http://some.site.com/page timeout=5 assign=bob -->`, the options would be
  * `url: http://some.site.com/page`
  * `timeout: 5`
  * `assign: bob`
* `done` - This callback gets called with these values - `done(err, content)`. The content will be injected and replace the commented markup

## Run Test

```
npm install
npm test
```
