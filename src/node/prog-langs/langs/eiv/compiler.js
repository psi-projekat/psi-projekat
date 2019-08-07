'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const format = require('../../../format');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const CompilerBase = require('../../compiler-base');
const L = require('./lambda');

const {G, F} = L;

class Compiler extends CompilerBase{
  static ptrsNum = this.keys(['idents']);

  constructor(g, ast){
    super(g, ast);
    if(g.dsr) return;

    this.idents = new cgs.Array(g);
  }

  ['[script]'](e, th){
    const msg = 'This programming language is temporarily marked as unsafe';
    return th.throw(new cgs.SecurityError(this.g, msg));

    const expr = proc(e.elems[1].fst);
    const input = O.rfs(format.path('-dw/input.txt'));
    const output = L.invoke(expr, input);

    log(output.toString());
    O.proc.exit();

    function proc(elem, argsPrev=[]){
      if(elem instanceof cgs.String){
        const index = argsPrev.indexOf(elem.str);

        if(index === -1)
          throw new SyntaxError(`Undefined identifier ${O.sf(elem.str)}`);

        return index;
      }

      let args = Array.from(elem[0]).map(a => a.str);
      let elems = Array.from(elem[1]);
      elems.a = 0;

      let es = elems;
      let as = argsPrev.slice();

      for(let i = 0; i !== args.length; i++){
        elems = F(elems);
        as.unshift(args[i]);
      }

      for(let i = 0; i !== es.length; i++)
        es[i] = proc(es[i], as);

      return elems;
    }
  }

  ['[list]'](e){
    let args = e.fst.arr;
    if(args.length !== 0) args = args[0];
    return [args, e.elems[2].arr];
  }

  ['[args]'](e){
    return e.fst.arr;
  }

  ['[elem]'](e){
    if(e.patIndex === 0) return e.fst.fst;
    return e.elems[2].fst;
  }

  ['[ident]'](e){
    return new cgs.String(e.g, String(e));
  }

  getIdent(str){
    const {idents} = this;

    for(const ident of idents)
      if(ident.str === str)
        return ident;

    const ident = new cgs.String(this.g, str);
    idents.push(ident);

    return ident;
  }
}

module.exports = Compiler;

const Parser = require('./parser');
const Interpreter = require('./interpreter');

const cs = Interpreter.ctorsObj;

Compiler.Parser = Parser;
Compiler.Interpreter = Interpreter;