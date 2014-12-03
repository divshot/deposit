var through = require('through2');

var streamFile = require('./stream-file');
var parseBlocks = require('./parse-blocks');
var parseFile = require('./parse-file');

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
  
  function blocks (filepath, blocksDone) {
    
    return streamFile(filepath)
      .pipe(parseBlocks(blocksDone));
  }
  
  function file (filepath, fileDone) {
    
    return streamFile(filepath)
      .pipe(parseFile(fileDone));
  }
  
  stream.injector = injector;
  stream.file = file;
  stream.blocks = blocks;
  
  return stream;
};