var _ = require('lodash');
var through = require('through2');
var concat = require('concat-stream');

var parser = require('./parser');

module.exports = function (injectors, callback) {
  
  var contentStream = through();
  
  contentStream
    .pipe(parser.fileContentTree())
    .pipe(through.obj(function (line, enc, done) {
      
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
    }))
    .pipe(concat({object: true}, function (line) {
      
      callback(null, formatHtml(line));
    }))
    .on('error', callback);
  
  return contentStream;
};

function formatHtml (line) {
  
  if (typeof line === 'object') {
    
    return _.pluck(line, 'content').join('\n');
  }
  
  if (typeof line === 'string') {
    return line.join('\n');
  }
};