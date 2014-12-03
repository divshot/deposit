var through = require('through2');
var filter = require('through2-filter');
var concat = require('concat-stream');

var streamFile = require('./stream-file');
var parseBlocks = require('./parse-blocks');
var parseFile = require('./parse-file');
var parser = require('./parser');

module.exports = function gather () {
  
  var stream = through();
  var injectors = {};
  
  function injector (name, callback) {
    
    if (typeof name !== 'string') {
      throw new Error('[gather] Injector name must be a string');
    }
    
    if (typeof callback !== 'function') {
      return injectors[name];
    }
    
    if (injectors[name]) {
      throw new Error('[gather] Injector names must be unique');
    }
    
    injectors[name] = callback;
    
    return stream;
  };
  
  function blocks (filepath, callback) {
    
    // if (!filepath) {
    //   var s = through();
      
    //   return s
    //     // .pipe(split())
    //     .pipe(parseBlocks())
      
    //   return s;
    // }
    
    return streamFile(filepath)
      .pipe(parseBlocks(callback));
  }
  
  function file (filepath, done) {
    
    return streamFile(filepath)
      .pipe(parseFile(injectors, done));
  }
  
  stream.injector = injector;
  stream.file = file;
  stream.blocks = blocks;
  
  return stream;
};