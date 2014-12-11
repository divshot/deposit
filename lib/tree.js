var concat = require('concat-stream');

var parser = require('./parser');
var streamFile = require('./stream-file');

module.exports = function tree (filepath, callback) {
  
  var p = parser();
  
  if (filepath) {
    callback = callback || function () {};
    
    streamFile(filepath)
      .pipe(p)
      .pipe(concat({object: true}, function (content) {
        
        callback(null, content);
      }))
      .on('error', callback);
  }
  
  return p;
};
