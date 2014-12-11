var _ = require('lodash');
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
  
  // var stream = through();
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
  };
  
  function blockTree (filepath, callback) {
    
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
  }
  
  function tree (filepath, callback) {
    
    var p = parser();
    
    if (filepath) {
      callback = callback || noop;
      
      streamFile(filepath)
        .pipe(p)
        .pipe(concat({object: true}, function (content) {
          
          callback(null, content);
        }))
        .on('error', callback);
    }
    
    return p;
  }
  
  var _injection =  injectFile(injectors, noop);
  
  function parse (filepath, callback) {
    
    streamFile(filepath)
      .pipe(_injection)
      .pipe(map.obj(function (line) {
        
        return line + '\n'
      }))
      .pipe(concat({object: true}, function (content) {
        
        content = _.initial(content.toString().split('\n')).join('\n');
        
        callback(null, content);
      }))
      .on('error', callback);
  }
  
  _injection.injector = injector;
  _injection.tree = tree;
  _injection.blockTree = blockTree;
  _injection.parse = parse;
  
  return _injection;
};

function noop () {}