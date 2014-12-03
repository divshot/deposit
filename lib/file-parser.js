var _ = require('lodash');
var through = require('through2');
var concat = require('concat-stream');
var trim = require('trim');
var eos = require('end-of-stream');

var commentRegex = require('./html-comment-regex');
var injectorRegex = require('./injector-comment-regex');

var exports = module.exports = function (callback) {
  
  var fileTransform = through(function (chunk, enc, done) {
    
    done(null, chunk);
  });
  
  fileTransform
    .on('error', callback)
    .pipe(concat(function (contents) {
      callback(null, contents.toString());
    }));
  
  return fileTransform;
};

var fileContentTree = exports.fileContentTree = function (fileStream) {
  
  var out = through.obj();
  var parsingBlock = false;
  var currentBlock = {};
  var lineNumber = 0;
  
  fileStream.pipe(through(function (chunk, enc, done) {
    
    var content = chunk.toString();
    var line = parseLine(content);
    lineNumber += 1;
    
    if (line.type === 'content' && !parsingBlock) {
      out.push({
        type: 'content',
        content: content,
        lineNumber: lineNumber
      });
    }
    
    if (line.type === 'content' && parsingBlock) {
      currentBlock.default += content;
    }
    
    if (line.type === 'blockstart') {
      parsingBlock = true;
      
      currentBlock.name = line.name;
      currentBlock.location = {
        start: lineNumber
      };
      currentBlock.options = line.options;
      currentBlock.default = '';
    }
    
    if (line.type === 'blockend') {
      parsingBlock = false;
      
      currentBlock.location.end = lineNumber;
      
      out.push({
        type: 'block',
        content: currentBlock,
        lineNumber: currentBlock.location.start
      });
      
      currentBlock = {};
    }
    
    done();
  }));
  
  eos(fileStream, {readable: false}, function (err) {
    
    out.end();
  });
  
  return out;
}

var parseLine = exports.parseLine = function (chunk) {
  
  var c = commentRegex().exec(chunk);
  var data = {};
  
  if (!c) {
    data.type = 'content';
  }
  else {
    var block = trim(c[1]).split(' ');
    var parsedBlockname = injectorRegex().exec(block[0]);
    
    if (parsedBlockname) {
      data.type = 'blockstart';
      data.name = parsedBlockname[1];
      data.options = _(block)
        .tail()
        .map(function (option) {
          
          return option.split('=');
        })
        .zipObject()
        .value();
    }
    else {
      data.type = 'blockend';
    }
  }
  
  return data;
};