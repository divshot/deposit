var through = require('through2');
var concat = require('concat-stream');

module.exports = function (callback) {
  
  var fileStream = through(function (chunk, enc, done) {
    
    done(null, chunk.toString() + '\n');
  });
  
  fileStream
    .on('error', callback)
    .pipe(concat(function (contents) {
      callback(null, contents.toString());
    }));
  
  return fileStream;
};