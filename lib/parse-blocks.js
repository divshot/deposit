var through = require('through2');
var concat = require('concat-stream');
var filter = require('through2-filter');

var parser = require('./parser');

module.exports = function parseBlocks (callback) {
  
  var contentStream = through();
  callback = callback || function () {};
  
  contentStream
    .pipe(parser.fileContentTree())
    .pipe(filter.obj(function (chunk) {
      
      return chunk.type === 'block';
    }))
    .pipe(through.obj(function (block, enc, done) {
      
      done(null, block.content);
    }))
    .pipe(concat({object: true}, function (blocks) {
      
      callback(null, blocks);
    }))
    .on('error', callback);
  
  return contentStream;
};