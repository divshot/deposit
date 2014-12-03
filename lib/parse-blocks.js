var _ = require('lodash');
var through = require('through2');
var eos = require('end-of-stream');
var trim = require('trim');

var commentRegex = require('./html-comment-regex');
var injectorRegex = require('./injector-comment-regex');

module.exports = function parseBlocks (callback) {
  
  var parsingBlock = false;
  var _blocks = {};
  var lineNumber = 0;
  var currentInjectorName = '';
  
  var parser = through(function (chunk, enc, done) {
    
    var c = commentRegex().exec(chunk.toString());
    lineNumber += 1;
    
    // Not a comment, move on
    if (c === null && !parsingBlock) {
      return done(null, chunk.toString() + '\n');
    }
    
    // At the start of, or inside of a block
    
    var block;
    parsingBlock = true;
    
    // Start of block
    if (c) {
      block = trim(c[1]).split(' ');
      
      var parsedBlockname = injectorRegex().exec(block[0]);
      
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
          location: {
            start: lineNumber
          },
          content: '',
          options: blockOptions
        };
      }
      
      // End of a block
      else if (block[0] === 'endinject') {
        _blocks[currentInjectorName].location.end = lineNumber;
        
        parsingBlock = false;
        currentInjectorName = ''; // Reset injector name
      }
    }
    
    // Parse content in block
    else if (!c) {
      _blocks[currentInjectorName].content += chunk.toString();
    }
    
    done(null, chunk.toString() + '\n');
  });
  
  if (typeof callback === 'function') {
    eos(parser, {readable: false}, function (err) {
    
      callback(err, _blocks);
    });
  }
  
  return parser;
};