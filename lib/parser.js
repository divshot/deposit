var _ = require('lodash');
var through = require('through2');
var concat = require('concat-stream');
var trim = require('trim');

var commentRegex = require('./html-comment-regex');
var injectorRegex = require('./injector-comment-regex');

var exports = module.exports = function parser () {
  
  var parserDone = arguments[0] || function () {};
  var parsingBlock = false;
  var currentBlock = {};
  var lineNumber = 0;
  
  var out = through.obj(function (chunk, enc, done) {
    var content = chunk.toString();
    var line = exports.line(content);
    lineNumber += 1;
    
    if (line.type === 'content' && !parsingBlock) {
      return done(null, {
        type: 'content',
        content: content,
        lineNumber: lineNumber
      });
    }
    
    if (line.type === 'content' && parsingBlock) {
      currentBlock.default += content;
      
      return done();
    }
    
    if (line.type === 'blockstart') {
      parsingBlock = true;
      
      currentBlock.name = line.name;
      currentBlock.location = {
        start: lineNumber
      };
      currentBlock.options = line.options;
      currentBlock.default = '';
      
      return done();
    }
    
    if (line.type === 'blockend') {
      parsingBlock = false;
      
      currentBlock.location.end = lineNumber;
      
      done(null, {
        type: 'block',
        content: currentBlock,
        lineNumber: currentBlock.location.start
      });
      
      currentBlock = {};
    }
  });
  
  out.pipe(concat({object: true}, function (lines) {
    
    parserDone(null, lines);
  }))
  .on('error', parserDone);
  
  return out;
}

exports.line = function (content) {
  
  var c = commentRegex().exec(content);
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