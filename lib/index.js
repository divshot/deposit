var through = require('through2');
var filter = require('through2-filter');
var map = require('through2-map');
var concat = require('concat-stream');
var split = require('split2');
var pumpify = require('pumpify');

var streamFile = require('./stream-file');
var injectFile = require('./inject-file');
var parser = require('./parser');

module.exports = function deposit () {
  
  var stream = through();
  var injectors = {};
  
  function injector (name, callback) {
    
    if (typeof name !== 'string') {
      throw new Error('[deposit] Injector name must be a string');
    }
    
    if (typeof callback !== 'function') {
      return injectors[name];
    }
    
    if (injectors[name]) {
      throw new Error('[deposit] Injector names must be unique');
    }
    
    injectors[name] = callback;
    
    return stream;
  };
  
  function blocks (filepath, callback) {
    
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
      callback = callback || function () {};
      
      streamFile(filepath)
        .pipe(pipeline)
        .pipe(concat({object: true}, function (blocks) {
          
          callback(null, blocks);
        }))
        .on('error', callback);
    }
    
    return pipeline;
  }
  
  // TODO: refactor this method to work like "blocks" method
  // Maybe don't use a file() method and let deposit() be the file() method
  
  function file (filepath, done) {
    
    var p = parser();
    
    return p;
  }
  
  stream.injector = injector;
  stream.file = file;
  stream.blocks = blocks;
  
  return stream;
};