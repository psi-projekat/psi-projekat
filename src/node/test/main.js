'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const logSync = require('../log-sync');

const TIME_TO_WAIT = 10e3;

const cwd = __dirname;
const testsDir = path.join(cwd, '../../../test');

setTimeout(() => main().catch(err));

async function main(){
  aels();

  const tests = fs.readdirSync(testsDir);
  const len = tests.length;

  for(let i = 0; i !== len; i++){
    const test = tests[i];

    if(O.ext(test) !== 'js')
      err(new Error(`Invalid test ${O.sf(test)}`));

    const name = path.parse(test).name;
    logSync(`Test ${i + 1}/${len} (${name}) ---> `);

    const file = path.join(testsDir, test);
    const script = O.rfs(file, 1);

    const func = new Function('O', 'fs', 'path', 'cwd', 'require', 'done', 'err', script);
    await performTest(func);

    log('OK');
  }

  log('\nAll tests passed');
}

function aels(){
  O.proc.on('sigint', () => {
    err('Received SIGINT');
  });
}

function performTest(func){
  return new Promise(res => {
    const timeout = setTimeout(() => {
      err(new Error('Time limit exceeded'));
    }, TIME_TO_WAIT);

    func(O, fs, path, cwd, require, () => {
      clearTimeout(timeout);
      res();
    }, msg => {
      err(new Error(msg));
    });
  });
}

function err(err){
  log('FAILED\n');

  const isErr = err instanceof Error;
  const details = isErr ? `: ${err.message}` : '';
  log(`\nERROR${details}\n`);

  if(!isErr){
    log(err);
    log('\n');
  }

  log('TEST FAILED!');
  O.proc.exit(1);
}