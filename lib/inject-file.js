var _ = require('lodash');
var through = require('through2');
var map = require('through2-map');
var concat = require('concat-stream');
var pumpify = require('pumpify');

var parser = require('./parser');

module.exports = function (injectors, callback) {
  
  callback = callback || noop;
  
  var runInjectors = through.obj(function (line, enc, done) {
    
    // Non injectable content gets no transofmation
    if (line.type === 'content') {
      done(null, line);
      return;
    }
    
    // Run injectors and update content
    var injector = injectors[line.content.name];
    
    if (injector && typeof injector === 'function') {
      
      injector(line.content.options, function (err, data) {
        
        done(err, {
          content: data
        });
      });
    }
    
    // No injector availble, use default/placeholder text
    else {
      done(null, {
        content: line.content.default
      });
    }
  });
  
  // File injection pipeline
  return pumpify(
    parser(),
    runInjectors,
    map.obj(toHTML)
  );
};

function toHTML (line) {
  
  if (typeof line === 'object') {
    
    return line.content;
  }
};