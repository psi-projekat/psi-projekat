'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsRec = require('../fs-rec');
const format = require('../format');

const cwd = __dirname;
const dir = path.join(cwd, '../../..');

setTimeout(main);

function main(){
  let num = 0;

  fsRec.processFilesSync(dir, d => {
    if(d.isDir) return;

    const str = O.rfs(d.fullPath, 1);
    const matches = str.match(/\bclass\b/g);
    if(matches === null) return;

    num += matches.length;
  });

  log(`Total number of classes in the project: ${format.num(num)}`);
}