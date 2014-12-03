var fs = require('fs');

var _ = require('lodash');
var concat = require('concat-stream');
var through = require('through2');
var split = require('split');
var eos = require('end-of-stream');
var trim = require('trim');

var comment = require('./comment');
var commentRegex = require('./html-comment-regex');

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
    
    var inBlock = false;
    var _blocks = {};
    var lineNumber = 0;
    var currentInjectorName = '';
    
    var s = streamFile(filepath)
      .pipe(split())
      .pipe(through(function filterComments (chunk, enc, done) {
        
        var c = commentRegex().exec(chunk.toString());
        lineNumber += 1;
        
        // Not a comment, move on
        if (c === null && !inBlock) {
          this.push(chunk.toString() + '\n');
          done();
          return;
        }
        
        //
        // At the start of, or inside of a block
        //
        
        var block;
        inBlock = true;
        
        // Start of block
        if (c) {
          block = trim(c[1]).split(' ');
          
          var blockNameRegex = /inject:((?:[a-z][a-z]+))/i;
          var parsedBlockname = blockNameRegex.exec(block[0]);
          
          // This is a start of a block
          if (parsedBlockname) {
            currentInjectorName = parsedBlockname[1];
            
            // Parse block options
            var blockOptions = _(block)
              .tail()
              .map(function (option) {
                
                return option.split('=');
              })
              .zipObject()
              .value();
            
            _blocks[currentInjectorName] = {
              insertAt: lineNumber,
              content: '',
              options: blockOptions
            };
          }
          
          // End of a block
          else if (block[0] === 'endinject') {
            inBlock = false;
            currentInjectorName = ''; // Reset injector name
          }
        }
        
        // Parse content in block
        else if (!c) {
          _blocks[currentInjectorName].content += chunk.toString();
        }
        
        done();
      }))
      .pipe(concat(function (data) {
        
        blocksDone(null, _blocks);
      }))
      .on('error', blocksDone)
  };
  
  function streamFile (filepath) {
    
    return fs.createReadStream(filepath);
  }
  
  stream.injector = injector;
  stream.blocks = blocks;
  return stream;
};