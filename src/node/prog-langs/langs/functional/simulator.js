'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const Interpreter = require('./interpreter');

const cs = Interpreter.ctorsObj;

class Simulator extends cs.NativeInvocation{
  tick(th){
    const {g, name, args} = this;

    if(args === null)
      return th.ret(this.intp.simulator);

    if(args.next !== null)
      return th.throw(new cgs.TypeError(g, `${name} takes no more than one argument`));

    const ident = args.ident.str;

    if(/^[\+\-]?\d+$/.test(ident)){
      const num = +ident;
      const int = num | 0;

      if(int !== num)
        return th.throw(new cgs.TypeError(g, `Invalid integer ${ident} at ${name}`));

      return th.ret(new Integer(g, int));
    }

    if(/^".*"$/.test(ident)){
      let str = null;
      try{ str = JSON.parse(ident); }catch{}

      if(str === null)
        return th.throw(new cgs.TypeError(g, `Invalid string ${ident} at ${name}`));

      return th.ret(new String(g, str));
    }

    if(/^\..+/.test(ident)){
      const method = ident.slice(1);

      switch(method){
        case 'null':
          th.ret(new Null(g));
          break;

        case 'dispatch':
          th.ret(new Dispatch(g));
          break;

        case 'rotate':
          th.ret(new Rotate(g));
          break;

        case 'go':
          th.ret(new Go(g));
          break;

        case 'jump':
          th.ret(new Jump(g));
          break;

        case 'get':
          th.ret(new GetTile(g));
          break;

        default:
          th.throw(new cgs.TypeError(g, `${O.sf(method)} is not a valid method for ${name}`));
          break;
      }

      return;
    }

    th.throw(new cgs.TypeError(g, `${O.sf(ident)} is not a valid argument for ${name}`));
  }
}

class PassiveInvocation extends cs.NativeInvocation{
  tick(th){
    let str = this.toString();
    if(str !== '') str += ' ';

    th.throw(new cgs.TypeError(this.g, `${this.name} ${str}is not a function`));
  }
}

class Null extends PassiveInvocation{
  toString(){
    return '';
  }
}

class Integer extends PassiveInvocation{
  constructor(g, int){
    super(g);
    if(g.dsr) return;

    this.int = int;
  }

  ser(s){ super.ser(); ser.writeInt(this.int); }
  deser(s){ super.deser(); this.int = ser.readInt(); }

  static cmp(v1, v2){
    return v1.int === v2.int;
  }

  invoke(args){
    return new this.constructor(this.g, this.int);
  }

  toString(){
    return global.String(this.int);
  }
}

class String extends PassiveInvocation{
  static ptrsNum = this.keys(['str']);

  constructor(g, str=null){
    super(g);
    if(g.dsr) return;

    this.str = new cgs.String(g, str);
  }

  static cmp(v1, v2){
    return v1.str.str === v2.str.str;
  }

  invoke(args){
    return new this.constructor(this.g, this.str.str);
  }

  toString(){
    return O.sf(this.str.str);
  }
}

class Tile extends cs.NativeInvocation{
  static ptrsNum = this.keys(['x', 'y', 'z']);

  constructor(g, args, x, y, z){
    super(g, null, null, args);
    if(g.dsr) return;

    this.x = x;
    this.y = y;
    this.z = z;
  }

  static cmp(v1, v2){
    return (
      Integer.cmp(v1.x, v2.x) &&
      Integer.cmp(v1.y, v2.y) &&
      Integer.cmp(v1.z, v2.z)
    );
  }

  tick(th){
    const {g, name, args, x, y, z} = this;

    if(args === null || args.next !== null)
      return th.throw(new cgs.TypeError(g, `${name} takes exactly one argument`));

    const ident = args.ident.str;

    if(/^\..+/.test(ident)){
      const method = ident.slice(1);

      switch(method){
        case 'x':
          th.ret(x);
          break;

        case 'y':
          th.ret(y);
          break;

        case 'z':
          th.ret(z);
          break;

        case 'get':
          th.ret(new GetObject(g, null, this));
          break;

        default:
          th.throw(new cgs.TypeError(g, `${O.sf(method)} is not a valid method for ${name}`));
          break;
      }

      return;
    }

    th.throw(new cgs.TypeError(g, `${O.sf(ident)} is not a valid argument for ${name}`));
  }

  invoke(args){
    if(args !== null) args = args.list;
    return new this.constructor(this.g, args, this.x, this.y, this.z);
  }

  toString(){
    return `(${this.x}, ${this.y}, ${this.z})`;
  }
}

class Object extends cs.NativeInvocation{
  static ptrsNum = this.keys(['tile', 'traits']);

  constructor(g, args, tile, traits){
    super(g, null, null, args);
    if(g.dsr) return;

    this.tile = tile;
    this.traits = traits;
  }

  static cmp(v1, v2){
    return (
      Tile.cmp(v1.tile, v2.tile) &&
      String.cmp(v1.traits, v2.traits)
    );
  }

  tick(th){
    const {g, name, args, tile, traits} = this;
    const {x, y, z} = tile;

    if(args === null || args.next !== null)
      return th.throw(new cgs.TypeError(g, `${name} takes exactly one argument`));

    const ident = args.ident.str;

    if(/^\..+/.test(ident)){
      const method = ident.slice(1);

      switch(method){
        case 'tile':
          th.ret(tile);
          break;

        case 'traits':
          th.ret(traits);
          break;

        case 'x':
          th.ret(x);
          break;

        case 'y':
          th.ret(y);
          break;

        case 'z':
          th.ret(z);
          break;

        case 'send':
          th.ret(new SendRequest(g, null, this));
          break;

        default:
          th.throw(new cgs.TypeError(g, `${O.sf(method)} is not a valid method for ${name}`));
          break;
      }

      return;
    }

    th.throw(new cgs.TypeError(g, `${O.sf(ident)} is not a valid argument for ${name}`));
  }

  invoke(args){
    if(args !== null) args = args.list;
    return new this.constructor(this.g, args, this.tile, this.traits);
  }

  toString(){
    return `${this.tile}[${this.traits}]`;
  }
}

class Dispatch extends cs.NativeInvocation{
  tick(th){
    if(this.eargs === null){
      if(this.nval) return th.call(this.evalArgs());
      this.eargs = this.gval;
    }

    const {g, name, args, eargs} = this;

    if(eargs.length !== 0)
      return th.throw(new cgs.TypeError(g, `${name} takes no arguments`));

    if(this.nval){
      this.g.stdout.write(O.Buffer.from([0x00]));
      return th.call(new cgs.Read(g, 8));
    }

    const {buf} = this.gval;
    if(buf[0] !== 0) return th.ret(new Null(g));

    th.ret(this.intp.zero);
  }
}

class Rotate extends cs.NativeInvocation{
  tick(th){
    if(this.eargs === null){
      if(this.nval) return th.call(this.evalArgs());
      this.eargs = this.gval;
    }

    const {g, name, args, eargs} = this;

    if(eargs.length !== 1)
      return th.throw(new cgs.TypeError(g, `${name} takes exactly 1 argument`));

    const dir = eargs.get(0);

    if(!(dir instanceof Integer))
      return th.throw(new cgs.TypeError(g, `${name} takes integer representing direction as argument`));

    if(dir.int !== (dir.int & 3))
      return th.throw(new cgs.TypeError(g, `${name} argument can only be an integer in interval [0, 3]`));

    if(this.nval){
      this.g.stdout.write(O.Buffer.from([0x01, dir.int]));
      return th.call(new cgs.Read(g, 8));
    }

    const {buf} = this.gval;
    if(buf[0] !== 0) return th.ret(new Null(g));

    th.ret(this.intp.zero);
  }
}

class Go extends cs.NativeInvocation{
  tick(th){
    if(this.eargs === null){
      if(this.nval) return th.call(this.evalArgs());
      this.eargs = this.gval;
    }

    const {g, name, args, eargs} = this;

    if(eargs.length !== 0)
      return th.throw(new cgs.TypeError(g, `${name} takes no arguments`));

    if(this.nval){
      this.g.stdout.write(O.Buffer.from([0x02]));
      return th.call(new cgs.Read(g, 8));
    }

    const {buf} = this.gval;
    if(buf[0] !== 0) return th.ret(new Null(g));

    th.ret(this.intp.zero);
  }
}

class Jump extends cs.NativeInvocation{
  tick(th){
    if(this.eargs === null){
      if(this.nval) return th.call(this.evalArgs());
      this.eargs = this.gval;
    }

    const {g, name, args, eargs} = this;

    if(eargs.length !== 0)
      return th.throw(new cgs.TypeError(g, `${name} takes no arguments`));

    if(this.nval){
      this.g.stdout.write(O.Buffer.from([0x03]));
      return th.call(new cgs.Read(g, 8));
    }

    const {buf} = this.gval;
    if(buf[0] !== 0) return th.ret(new Null(g));

    th.ret(this.intp.zero);
  }
}

class GetTile extends cs.NativeInvocation{
  tick(th){
    if(this.eargs === null){
      if(this.nval) return th.call(this.evalArgs());
      this.eargs = this.gval;
    }

    const {g, name, args, eargs} = this;

    if(eargs.length !== 3)
      return th.throw(new cgs.TypeError(g, `${name} takes 3 arguments (got ${eargs.length})`));

    const x = eargs.get(0);
    const y = eargs.get(1);
    const z = eargs.get(2);

    if(!(x instanceof Integer && y instanceof Integer && z instanceof Integer))
      return th.throw(new cgs.TypeError(g, `${name} takes three integer coordinates as arguments (x, y, z)`));

    if(this.nval){
      this.g.stdout.write(O.Buffer.from([0x04, x.int, y.int, z.int]));
      return th.call(new cgs.Read(g, 16));
    }

    const {buf} = this.gval;
    if(buf[0] !== 0 || !(buf[1] & 1)) return th.ret(new Null(g));

    th.ret(new Tile(g, null, x, y, z));
  }
}

class GetObject extends cs.NativeInvocation{
  static ptrsNum = this.keys(['tile']);

  constructor(g, args, tile){
    super(g, null, null, args);
    if(g.dsr) return;

    this.tile = tile;
  }

  static cmp(v1, v2){
    return Tile.cmp(v1.tile, v2.tile);
  }

  invoke(args){
    if(args !== null) args = args.list;
    return new this.constructor(this.g, args, this.tile);
  }

  tick(th){
    if(this.eargs === null){
      if(this.nval) return th.call(this.evalArgs());
      this.eargs = this.gval;
    }

    const {g, name, args, eargs, tile} = this;
    const {x, y, z} = tile;

    if(eargs.length === 0)
      return th.throw(new cgs.TypeError(g, `${name} takes at least 1 argument`));

    let traits = '';

    for(let i = 0; i != eargs.length; i++){
      const arg = eargs.get(i);

      if(!(arg instanceof String))
        return th.throw(new cgs.TypeError(g, `${name} takes strings as arguments`));

      if(i !== 0) traits += ' ';
      traits += arg.str.str;
    }

    if(this.nval){
      const buf = O.Buffer.from(`${'0'.repeat(5)}${traits}`);
      buf[0] = 0x05;
      buf[1] = x.int;
      buf[2] = y.int;
      buf[3] = z.int;
      buf[4] = traits.length;
      this.g.stdout.write(buf);
      return th.call(new cgs.Read(g, 16));
    }

    const {buf} = this.gval;
    if(buf[0] !== 0 || !(buf[1] & 1)) return th.ret(new Null(g));

    th.ret(new Object(g, null, tile, new String(g, traits)));
  }
}

class SendRequest extends cs.NativeInvocation{
  static ptrsNum = this.keys(['obj']);

  constructor(g, args, obj){
    super(g, null, null, args);
    if(g.dsr) return;

    this.obj = obj;
  }

  static cmp(v1, v2){
    return (
      Tile.cmp(v1.tile, v2.tile) &&
      String.cmp(v1.traits, v2.traits)
    );
  }

  invoke(args){
    if(args !== null) args = args.list;
    return new this.constructor(this.g, args, this.obj);
  }

  tick(th){
    if(this.eargs === null){
      if(this.nval) return th.call(this.evalArgs());
      this.eargs = this.gval;
    }

    const {g, name, args, eargs, obj} = this;
    const {tile} = obj;
    const {x, y, z} = tile;
    const traits = obj.traits.str;

    if(eargs.length === 0)
      return th.throw(new cgs.TypeError(g, `${name} takes at least 1 argument`));

    let request = '';

    for(let i = 0; i != eargs.length; i++){
      const arg = eargs.get(i);

      if(!(arg instanceof String))
        return th.throw(new cgs.TypeError(g, `${name} takes strings as arguments`));

      if(i !== 0) request += ' ';
      request += arg.str.str;
    }

    if(this.nval){
      const buf = O.Buffer.from(`${'0'.repeat(5)}${traits}0${request}`);
      buf[0] = 0x06;
      buf[1] = x.int;
      buf[2] = y.int;
      buf[3] = z.int;
      buf[4] = traits.length;
      buf[traits.length + 5] = request.length;
      this.g.stdout.write(buf);
      return th.call(new cgs.Read(g, 8));
    }

    const {buf} = this.gval;
    if(buf[0] !== 0) return th.ret(new Null(g));

    th.ret(new Integer(g, buf[1]));
  }
}

const ctorsArr = [
  Simulator,
  PassiveInvocation,
  Null,
  Integer,
  String,
  Tile,
  Object,
  Dispatch,
  Rotate,
  Go,
  Jump,
  GetTile,
  GetObject,
  SendRequest,
];

const ctorsObj = O.obj();
for(const ctor of ctorsArr)
  ctorsObj[ctor.name] = ctor;

module.exports = {
  ctorsArr,
  ctorsObj,
};