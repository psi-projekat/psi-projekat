'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

setTimeout(main);

function main(){
  const args = process.argv.slice(2);
  if(args.length === 0) err('Expected at least 1 argument');

  switch(args[0]){
    case 'init': load('init'); break;
    case 'start': load('node'); break;
    case 'test': load('test'); break;
    case 'find': load('syntax-finder'); break;
    default: err(`Invalid argument ${O.sf(arg)}`); break;
  }
}

function load(proj){
  const dir = path.join('..', proj);
  require(dir);
}

function err(msg){
  log(`ERROR: ${msg}`);
  O.proc.exit(1);
}