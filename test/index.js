var fs = require('fs-extra');

var _ = require('lodash');
var test = require('tessed');
var concat = require('concat-stream');
var split = require('split');
var spy = require('through2-spy');

var deposit = require('../lib');

var blockTrees = test('block tree');
var trees = test('tree');
var injecting = test('injecting');

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
var TEST1_EXPECTED_CONTENT = [
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
];

test('adding injector', function (t) {
  
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

blockTrees.test('streaming', function (t) {
  
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

blockTrees.test('callback', function (t) {
  
  var d = deposit();
  
  d.blockTree(TEST1_FILE_PATH, function (err, blocks) {
    
    t.deepEqual(blocks, TEST1_FILE_BLOCKS, 'parsed blocks object');
    t.end();
  });
});

trees.test('streaming', function (t) {
  
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

trees.test('callback', function (t) {
  
  var d = deposit();
  
  d.tree(TEST1_FILE_PATH, function (err, content) {
    
    t.equal(content.length, 16, 'parsed all lines');
    t.equal(_.filter(content, {type: 'block'}).length, 2, 'block count');
    t.equal(_.filter(content, {type: 'content'}).length, 14, 'content count');
    t.end();
  });
});

injecting.test('streaming', function (t) {
  
  var depositor = deposit();
  
  depositor.injector('test', function (options, done) {
    
    t.deepEqual(options, {
      key1: 'value1',
      key2: 'value2',
      default: '  <script> window.__ = {}; </script>'
    }, 'passed options into injector');
    
    done(null, '<!-- injected test -->');
  });
  depositor.injector('fetch', function (options, done) {
    
    t.deepEqual(options, {
      url: 'http://google.com',
      target: 'data',
      default: '  <script> window.data = []; </script>'
    }, 'passed options into injector');
    
    done(null, '<!-- injected fetch -->');
  });
  
  fs.createReadStream(TEST1_FILE_PATH)
    .pipe(split())
    .pipe(depositor)
    .pipe(concat(function (html) {
      
      t.equal(html.toString(), TEST1_EXPECTED_CONTENT.join(''), 'injected content');
      t.end();
    }));
});

injecting.test('callback', function (t) {
  
  var depositor = deposit();
  
  depositor.injector('test', function (options, done) {
    
    t.deepEqual(options, {
      key1: 'value1',
      key2: 'value2',
      default: '  <script> window.__ = {}; </script>'
    }, 'passed options into injector');
    
    done(null, '<!-- injected test -->');
  });
  depositor.injector('fetch', function (options, done) {
    
    t.deepEqual(options, {
      url: 'http://google.com',
      target: 'data',
      default: '  <script> window.data = []; </script>'
    }, 'passed options into injector');
    
    done(null, '<!-- injected fetch -->');
  });
  
  depositor.parse(TEST1_FILE_PATH, function (err, content) {
    
    t.equal(content, TEST1_EXPECTED_CONTENT.join('\n'), 'content parsed');
    t.end();
  });
});

injecting.test('undefined value in callback', function (t) {
  
  var depositor = deposit();
  
  depositor.injector('test', function (options, done) {
    
    done();
  });
  
  depositor.parse(TEST1_FILE_PATH, function (err, content) {
    
    t.end();
  });
});

test('automaticlly stringifies no string data from injectors');
