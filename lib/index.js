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
var tree = require('./tree');
var blockTree = require('./block-tree');
var injectTree = require('./inject-tree');

module.exports = function deposit () {
  
  // var stream = through();
  var injectors = {};
  
  function _addInjector (name, callback) {
    
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
  
  _injection.injectTree = injectTree(injectors);
  _injection.tree = tree;
  _injection.blockTree = blockTree;
  _injection.injector = _addInjector;
  _injection.parse = parse;
  
  return _injection;
};

function noop () {}