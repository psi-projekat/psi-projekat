'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../omikron');

module.exports = {
  encode,
};

function encode(str){
  const ser = new O.Serializer();

  const [verts, norms, tex] = getArrs(str);

  const len = verts.length / 3;
  const len1 = len - 1;

  ser.writeUint(len);
  for(const arr of [verts, norms, tex])
    for(const f of arr) ser.writeFloat(f);

  return ser.getOutput();
}

function getArrs(str){
  const verts = [];
  const norms = [];
  const tex = [];

  const verts1 = [];
  const norms1 = [];
  const tex1 = [];

  const lines = O.sanl(str);

  for(let i = 0; i !== lines.length; i++){
    const line = lines[i];
    const args = line.split(' ');
    const cmd = args.shift();

    switch(cmd){
      case 'v':
        verts1.push(+args[0], +args[1], +args[2]);
        break;

      case 'vn':
        norms1.push(+args[0], +args[1], +args[2]);
        break;

      case 'vt':
        tex1.push(+args[0], 1 - args[1]);
        break;

      case 'f':
        const a = args.map(a => a.split('/').map(a => ~-a));
        let k;

        verts.push(verts1[k = a[0][0] * 3], verts1[k + 1], verts1[k + 2]);
        verts.push(verts1[k = a[1][0] * 3], verts1[k + 1], verts1[k + 2]);
        verts.push(verts1[k = a[2][0] * 3], verts1[k + 1], verts1[k + 2]);

        norms.push(norms1[k = a[0][2] * 3], norms1[k + 1], norms1[k + 2]);
        norms.push(norms1[k = a[1][2] * 3], norms1[k + 1], norms1[k + 2]);
        norms.push(norms1[k = a[2][2] * 3], norms1[k + 1], norms1[k + 2]);

        tex.push(tex1[k = a[0][1] * 2], tex1[k + 1]);
        tex.push(tex1[k = a[1][1] * 2], tex1[k + 1]);
        tex.push(tex1[k = a[2][1] * 2], tex1[k + 1]);
        break;
    }
  }

  return [verts, norms, tex];
}