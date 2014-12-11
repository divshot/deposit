var fs = require('fs-extra');

var _ = require('lodash');
var test = require('tape');
var concat = require('concat-stream');
var split = require('split');
var spy = require('through2-spy');

var deposit = require('../lib');

var TEST1_FILE_PATH = __dirname + '/fixtures/test1.html';
var TEST2_FILE_PATH = __dirname + '/fixtures/test2.html';
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

test('default: adding injector', function (t) {
  
  var d = deposit();
  
  d.injector('test', testInjector);  
  
  function testInjector (options, done) {
    
  }
  
  t.equal(d.injector('test').toString(), testInjector.toString(), 'added injector');
  t.throws(function () {
    d.injector('test', function () {});
  }, 'error for overriding injector');
  t.throws(function () {
    d.injector(function () {});
  }, 'missing injector name');
  t.end();
});

test('block tree: streaming', function (t) {
  
  var d = deposit();
  var blockNum = 0;
  
  var s = fs.createReadStream(TEST1_FILE_PATH)
    .pipe(split())
    .pipe(d.blockTree())
    .pipe(spy.obj(function (line) {
      
      blockNum += 1;
    }))
    .pipe(concat({object: true}, function (blocks) {
      
      t.equal(blockNum, 2, 'number of blocks');
      t.deepEqual(blocks, TEST1_FILE_BLOCKS, 'parsed blocks object');
      t.end();
    }));
});

test('block tree: callback', function (t) {
  
  var d = deposit();
  
  d.blockTree(TEST1_FILE_PATH, function (err, blocks) {
    
    t.deepEqual(blocks, TEST1_FILE_BLOCKS, 'parsed blocks object');
    t.end();
  });
});

test('tree: streaming', function (t) {
  
  var d = deposit();
  var blockNum = 0;
  var contentNum = 0;
  
  var s = fs.createReadStream(TEST1_FILE_PATH)
    .pipe(split())
    .pipe(d.tree())
    .pipe(spy.obj(function (line) {
      
      if (line.type === 'block') {
        blockNum += 1;
      }
      
      if (line.type === 'content') {
        contentNum += 1;
      }
    }))
    .pipe(concat({object: true}, function (blocks) {
      
      t.equal(blockNum, 2, 'number of blocks during parse');
      t.equal(contentNum, 14, 'number of contents during parse');
      t.end();
    }));
});

test('tree: callback', function (t) {
  
  var d = deposit();
  
  d.tree(TEST1_FILE_PATH, function (err, content) {
    
    t.equal(content.length, 16, 'parsed all lines');
    t.equal(_.filter(content, {type: 'block'}).length, 2, 'block count');
    t.equal(_.filter(content, {type: 'content'}).length, 14, 'content count');
    t.end();
  });
});

test('injecting: streaming', function (t) {
  
  var depositor = deposit();
  
  depositor.injector('test', function (options, done) {
    
    t.deepEqual(options, {
      key1: 'value1',
      key2: 'value2'
    }, 'passed options into injector');
    
    done(null, '<!-- injected test -->');
  });
  depositor.injector('fetch', function (options, done) {
    
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
  ].join('');
  
  fs.createReadStream(TEST1_FILE_PATH)
    .pipe(split())
    .pipe(depositor)
    .pipe(concat(function (html) {
      
      t.equal(html.toString(), expected, 'injected content');
      t.end();
    }));
});

test('injecting: callback', function (t) {
  
  var depositor = deposit();
  
  depositor.injector('test', function (options, done) {
    
    t.deepEqual(options, {
      key1: 'value1',
      key2: 'value2'
    }, 'passed options into injector');
    
    done(null, '<!-- injected test -->');
  });
  depositor.injector('fetch', function (options, done) {
    
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
  
  depositor.parse(TEST1_FILE_PATH, function (err, content) {
    
    t.equal(content, expected, 'content parsed');
    t.end();
  });
});

test('automaticlly stringifies no string data from injectors');
