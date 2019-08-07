'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const fsRec = require('../fs-rec');

module.exports = {
  find,
};

function find(dirs, exts, func){
  const arr = [];

  dirs.forEach(dir => {
    fsRec.processFilesSync(dir, d => {
      if(d.isDir || d.fullPath.includes('node_modules'))
        return;

      const ext = path.parse(d.name).ext.substring(1);
      if(!exts.includes(ext)) return;

      const src = fs.readFileSync(d.fullPath, 'utf8');
      const line = func(d.fullPath, src);
      if(!line) return;

      arr.push(new Element(d.fullPath, line));
    });
  });

  return arr;
}

class Element{
  constructor(filePath, line){
    this.filePath = filePath;
    this.line = line;
  }

  toString(){
    return `${this.filePath}:${this.line}`;
  }
}