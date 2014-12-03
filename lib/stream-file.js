var fs = require('fs');
var split = require('split');

module.exports = function streamFile (filepath) {
  
  return fs.createReadStream(filepath)
    .pipe(split());
};