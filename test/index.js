var fs = require('fs-extra');
var gather = require('../lib');
var test = require('tape');
var eos = require('end-of-stream');
var concat = require('concat-stream');
var split = require('split');

var TEST1_FILE_PATH = __dirname + '/fixtures/test1.html';
var TEST1_FILE_BLOCKS = [
  {
    name: 'test',
    location:{
      start: 8,
      end: 10
    },
    options: {
      key1: 'value1',
      key2: 'value2'
    },
    default: '  <script> window.__ = {}; </script>'
  },
  {
    name: 'fetch',
    location: {
      start: 15,
      end: 17
    },
    options: {
      url: 'http://google.com',
      target: 'data'
    },
    default: '  <script> window.data = []; </script>'
  }
];

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

test('parsing blocks', function (t) {
  
  var g = gather();
  
  g.blocks(TEST1_FILE_PATH, function (err, blocks) {
    
    t.deepEqual(blocks, TEST1_FILE_BLOCKS, 'parsed blocks object');
    t.end();
  });
});

test.skip('parse blocks with incoming stream', function (t) {
  
  var g = gather();
  
  fs.createReadStream(TEST1_FILE_PATH)
    .pipe(split())
    .pipe(g.blocks())
    .pipe(concat({object: true}, function (blocks) {
      
      t.deepEqual(blocks.toString(), TEST1_FILE_BLOCKS, 'parsed blocks object');
      t.end();
    }));
});

test('executes injectors in html from file', function (t) {
  
  var g = gather();
  
  g.injector('test', function (options, done) {
    
    t.deepEqual(options, {
      key1: 'value1',
      key2: 'value2'
    }, 'passed options into injector');
    
    done(null, '<!-- injected test -->');
  });
  g.injector('fetch', function (options, done) {
    
    t.deepEqual(options, {
      url: 'http://google.com',
      target: 'data'
    }, 'passed options into injector');
    
    done(null, '<!-- injected fetch -->');
  });
    
  var expected = [
    '<!DOCTYPE html>',
    '<html>',
    '<head>',
    '  <meta charset="utf-8">',
    '  <meta http-equiv="X-UA-Compatible" content="IE=edge">',
    '  <title></title>',
    '  ',
    '<!-- injected test -->',
    '  ',
    '</head>',
    '<body>',
    '  ',
    '<!-- injected fetch -->',
    '  ',
    '</body>',
    '</html>'
  ].join('\n');
  
  g.file(TEST1_FILE_PATH, function (err, content) {
    
    t.equal(content, expected, 'injected contents');
    t.end();
  });
});

test('automaticlly stringifies no string data from injectors');
