var fs = require('fs-extra');
var gather = require('../lib');
var test = require('tape');
var eos = require('end-of-stream');
var concat = require('concat-stream');

var TEST1_FILE_PATH = __dirname + '/fixtures/test1.html';

test('adding injector', function (t) {
  
  var g = gather();
  
  g.injector('test', testInjector);  
  
  function testInjector (options, done) {
    
  }
  
  t.equal(g.injector('test').toString(), testInjector.toString(), 'added injector');
  t.throws(function () {
    g.injector('test', function () {});
  }, 'error for overriding injector');
  t.throws(function () {
    g.injector(function () {});
  }, 'missing injector name');
  t.end();
});

test('parsing comments', function (t) {
  
  var g = gather();
  
  var expected = {
    test: {
      location:{
        start: 8,
        end: 10
      },
      options: {
        key1: 'value1',
        key2: 'value2'
      },
      content: '  <script> window.__ = {}; </script>'
    },
    fetch: {
      location: {
        start: 15,
        end: 17
      },
      options: {
        url: 'http://google.com',
        target: 'data'
      },
      content: '  <script> window.data = []; </script>'
    }
  };
  
  g.blocks(TEST1_FILE_PATH, function (err, blocks) {
    
    t.deepEqual(blocks, expected, 'parsed blocks object');
    t.end();
  });
});