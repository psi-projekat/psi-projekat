'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const O = require('../omikron');
const format = require('../format');
const PL = require('./programming-language');
const Engine = require('./engine');

setTimeout(() => main().catch(log));

async function main(){
  const lang = 'Functional()';
  const src = O.rfs(format.path('-dw/src.txt'), 1);
  const input = O.rfs(format.path('-dw/input.txt'), 1);

  const maxSize = 1e8;
  const eng = new Engine(await PL.get(lang), src, maxSize, maxSize - 1e3);
  const io = new O.IO(input);

  const onRead = (buf, len) => {
    buf[0] = io.read();
    return io.hasMore;
  };

  const onWrite = (buf, len) => {
    io.write(buf[0]);
  };

  eng.stdout.on('write', onWrite);
  eng.stdin.on('read', onRead);

  eng.stderr.on('write', (buf, len) => {
    log(buf.toString());
  });

  eng.run();

  const output = io.getOutput().toString();
  log(output);
}