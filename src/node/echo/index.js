'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');
const Token = require('../token');

const EXPIRE_TIMEOUT = 1e3 * 10;

const bufs = O.obj();

module.exports = {
  has,
  get,
  set,
};

function has(token){
  return token in bufs;
}

function get(token){
  if(token in bufs) return bufs[token];
  return null;
}

function set(buf){
  const token = Token.generate();
  bufs[token] = buf;
  setTimeout(() => delete bufs[token], EXPIRE_TIMEOUT);
  return token;
}