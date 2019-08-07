'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../../omikron');
const L = require('.');

const {G, F} = L;

const B0 = F(F(0));
const B1 = F(F(1));
const P = F(F(F(0, 1, 2)));
const E = G(F(0, 0), F(P, B0, G(0, 0)));

module.exports = invoke;

function invoke(src, input){
  src = L.normalize(src);

  const io = new O.IO(input);

  const S = getInput(io);
  const C = src;
  const R = G(C, S);

  let e = L.reduce(R, 0, 0);
  let i = 0;

  while(1){
    const bit = L.reduce(G(e, B0), 0, 0);

    const isZero = L.cmp(bit, B0);
    const isOne = L.cmp(bit, B1);

    if(!(isZero || isOne)) throw new TypeError('Unknown value');

    if((i++ & 1) === 0){
      if(isZero) break;
    }else{
      io.write(isOne);
    }

    e = L.reduce(G(e, B1), 0, 0);
  }

  return io.getOutput();
}

function getInput(io){
  const s = G(P);
  let e = s;

  while(io.hasMore)
    e.push(B1, G(P, io.read() ? B1 : B0, e = G(P)));

  e.push(B0, E);
  return s;
}