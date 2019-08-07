'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const finder = require('./finder');
const skipList = require('./skip-list');

const strToFind = process.argv.slice(2).join(' ').toLowerCase();

const cwd = __dirname;
const mainDir = path.join(cwd, '../../..');

const dirs = [
  mainDir,
];

const codeExts = [
  'bat',
  'js',
  'php',
  'sql',
];

const textExts = codeExts.concat([
  'txt',
  'md',
  'json',
  'htm',
  'css',
  'xml',
  'yml',
]);

setTimeout(main);

function main(){
  const output = finder.find(dirs, textExts, func);

  if(output.length !== 0)
    log(output.join('\n'));
}

function func(file, src){
  const dirs = file.split(/[\/\\]/);
  if(dirs.some(dir => skipList.includes(dir))) return;

  const lines = O.sanl(src);

  const index = lines.findIndex(line => {
    return line.toLowerCase().includes(strToFind);
  });

  return index + 1;
}