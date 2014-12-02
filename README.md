# gather

Gather resources and inject them into your html pages

## Install

```
npm install gather --save
```

## Usage

```js
var fs = require('fs');
var http = require('http');
var gather = require('gather');

var gatherer = gather({
  injectors: {
    fetch: require('gather-fetch'),
    env: function (options, done) {
      
      // Do some stuff
      done();
    }
  }
});

http.createServer(function (req, res) {

  fs.createReadStream('/path/to/some/file.html')
    .pipe(gatherer)
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
  
  <!-- inject:fetch http://some.site.com/page timeout=5 assign=bob -->
  <h1>Default Content</h1>
  <p>This is what it looks like if the data doesn’t get fetched (or gets fetched with an error).</p>
  <!-- endinject -->

</body>
</html>

```

## API

### gather([options])

* `options`
  * `injectors` - Decorator to add custom injections made available in your html document. See [Injectors Documentation](#injectors).

### gather.file(filepath[, options, function (err, contents) {}])

Parse and inject a file. By default, the function returns a stream. You may also provide a callback and it will be called and return the parsed file contents.

* `filepath` - The path to the file to parse and inject.
* `options` - Options similar to running [`gather(options)`](#gatheroptions)

## Injectors

Injectors are used to put dynamic content into the html as static content. Injectors are basically plugins that exports a function:

```js
module.exports = function (options, done) {

});
```

The injector function recieves 2 parameters:

* `options` - This is an object map of the options in the commented markup. If the html had `<!-- inject:fetch http://some.site.com/page timeout=5 assign=bob -->`, the options would be
  * `timeout: 5`
  * `assign: bob`
* `done` - This callback gets called with these values - `done(err, content)`. The content will be injected and replace the commented markup

## Run Test

```
npm install
npm test
```
