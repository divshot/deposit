var pumpify = require('pumpify');
var concat = require('concat-stream');
var filter = require('through2-filter');
var map = require('through2-map');

var parser = require('./parser');
var streamFile = require('./stream-file');

module.exports = function blockTree (filepath, callback) {
  
  var pipeline = pumpify.obj(
    parser(),
    filter.obj(function (line) {
              
      return line.type === 'block';
    }),
    map.obj(function (block) {
          
      return block.content;
    })
  );

  if (filepath) {
    callback = callback || noop;
    
    streamFile(filepath)
      .pipe(pipeline)
      .pipe(concat({object: true}, function (blocks) {
        
        callback(null, blocks);
      }))
      .on('error', callback);
  }

  return pipeline;
};