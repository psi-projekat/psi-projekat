'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = randStr;

function randStr(ranges, lenMin, lenMax=lenMin){
  if(ranges.length === 0) ranges = ' '.repeat(2);
  else if(ranges.length === 1) ranges += ranges[0];

  const chars = [];

  ranges.match(/../g).forEach(([start, end]) => {
    [start, end] = [start, end].map(a => a.charCodeAt(0));

    O.repeat(end - start + 1, charCode => {
      chars.push(String.fromCharCode(start + charCode));
    });
  });

  let len = O.rand(lenMin, lenMax);
  let str = O.ca(len, () => chars[O.rand(chars.length)]).join('');

  return str;
}