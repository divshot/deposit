var _ = require('lodash');
var through = require('through2');
var concat = require('concat-stream');

var streamFile = require('./stream-file');
var arrayAsStream = require('./utils/array-as-stream');

module.exports = function injectTree (injectors) {
  
  return function (tree, callback) {
    
    var injectionStream =  through.obj(function (line, enc, done) {
      
      // Not an injectable block
      if (line.type === 'content') {
        return done(null, line);
      }
      
      var injectFn = injectors[line.content.name];
      
      // No matching injector
      if (!injectFn) {
        return done(null, line);
      }
      
      var options = _.extend({
        default: line.content.default
      }, line.content.options);
      
      injectFn(options, function (err, data) {
        
        line.content.injected = data || '';
        done(null, line);
      });
    });
    
    if (tree) {
      callback = callback || function () {};
      
      arrayAsStream(tree)
        .pipe(injectionStream)
        .pipe(concat({object: true}, function (injectedTree) {
          
          callback(null, injectedTree);
        }))
        .on('error', callback);
    }
    
    return injectionStream;
  };
};