var through = require('through2');
var concat = require('concat-stream');

var fileParser = require('./file-parser');

module.exports = function (callback) {
  
  var contentStream = through();
  
  contentStream.pipe(concat(function (blocks) {
    
    callback(null, blocks);
  }))
  .on('error', callback);
  
  return contentStream;
};