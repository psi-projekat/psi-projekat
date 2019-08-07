'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const config = require('../config');

const DEFAULT_LEN = 64;

class Token{
  constructor(str){
    this.str = str;
  }

  static generate(len=DEFAULT_LEN){
    const buf = O.randBuf(len);
    const str = O.base64.encode(buf, 1);

    return new Token(str);
  }

  toJSON(){
    return this.toString();
  }

  toString(){
    return this.str;
  }
}

module.exports = Token;