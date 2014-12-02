var fs = require('fs-extra');
var gather = require('../lib');
var test = require('tape');
var eos = require('end-of-stream');

test('Does nothing', function (t) {
  
  t.ok(true);
  t.end();
});