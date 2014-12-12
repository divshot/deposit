var _ = require('lodash');
var through = require('through2');

module.exports = function arrayAsStream (arr) {
  
  var stream = through.obj();
  _.each(arr, stream.write.bind(stream));
  stream.end();
  
  return stream;
};