var fs = require('fs');

var parser = require('../lib/parser');
var test = require('tape');
var split = require('split');
var concat = require('concat-stream');
var spy = require('through2-spy');
var filter = require('through2-filter');
var through = require('through2');
var pumpify = require('pumpify');

var TEST1_FILE_PATH = __dirname + '/fixtures/test1.html';

test('parser: streaming', function (t) {
  
  var blockNum = 0;
  
  fs.createReadStream(TEST1_FILE_PATH)
    .pipe(split())
    .pipe(parser())
    .pipe(spy.obj(function (line) {
      
      t.ok(typeof line === 'object', 'type: ' + line.type);
      
      if (line.type === 'block') {
        blockNum += 1;
      }
    }))
    .pipe(concat({object: true}, function (lines) {
      
      t.equal(blockNum, 2, 'number of blocks');
      
      t.end();
    }));
});

test('parser: callback', function (t) {
  
  fs.createReadStream(TEST1_FILE_PATH)
    .pipe(split())
    .pipe(parser(function (err, lines) {
      
      t.ok(lines.length > 0, 'line objects');
      t.equal(lines[0].type, 'content', 'first line type');
      t.end();
    }));
});

test('parser: line', function (t) {
  
  var BLOCK_START = '<!-- inject:something option1=value -->';
  var CONTENT = 'test content';
  var BLOCK_END = '<!-- endinject -->'
  
  var parsedBlockStart = parser.line(BLOCK_START);
  
  t.deepEqual(parser.line(BLOCK_START), {
    type: 'blockstart',
    name: 'something',
    options: {
      option1: 'value'
    }
  }, 'block start parsed');
  
  t.deepEqual(parser.line(BLOCK_END), {
    type: 'blockend'
  }, 'block end parsed');
  
  t.deepEqual(parser.line(CONTENT), {
    type: 'content'
  }, 'content parsed');
  
  t.end();
});


