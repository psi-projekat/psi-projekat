'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsRec = require('../fs-rec');
const wavefront = require('.');

const cwd = __dirname;
const modelsDir = path.join(cwd, '../simulator/models');

setTimeout(main);

function main(){
  fsRec.processFilesSync(modelsDir, d => {
    if(d.isDir || d.ext !== 'obj') return;

    log(`Processing: ${d.relativeSubPath}`);

    const pth = d.fullPath;
    const fout = pth.replace(/\.obj$/, '.hex');

    const input = O.rfs(pth, 1);
    const output = wavefront.encode(input);

    O.wfs(fout, output);
  });
}