'use strict';

const fs = require('fs');
const path = require('path');
const O = require('../../../omikron');
const SG = require('../../../serializable-graph');
const SF = require('../../stack-frame');
const cgs = require('../../common-graph-nodes');
const CompilerBase = require('../../compiler-base');

// TODO: linter: forbid semicolon after class definition

class Compiler extends CompilerBase{
  static ptrsNum = this.keys(['idents']);

  constructor(g, ast){
    super(g, ast);
    if(g.dsr) return;

    this.idents = new cgs.Array(g);
  }

  ['[script]'](e){
    const {g} = e;

    const list = e.elems[1].fst;
    const idents = new cgs.Map(g);

    const arr = this.idents;
    const len = Math.min(arr.length, Interpreter.identsNum);
    this.idents = null;

    initIdents: {
      let i = 0;

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.Zero(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.One(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.Equality(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.Assign(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.Variable(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.NewFunction(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.Read(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.Write(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], new cs.Eof(g));

      if(len === i) break initIdents;
      idents.set(arr[i++], this.intp.simulator);
    }

    const inv = new cs.GlobalInvocation(g, idents, list);
    this.intp.globInv = inv;

    return inv;
  }

  ['[list]'](e){
    const lists = e.fst.arr;

    for(let i = 0; i !== lists.length; i++)
      lists[i].next = i !== lists.length - 1 ? lists[i + 1] : null;

    return lists.length !== 0 ? lists[0] : null;
  }

  ['[chain]'](e){
    const args = e.elems[2].arr;
    const ident = e.fst.fst;

    for(let i = 0; i !== args.length; i++)
      args[i].next = i !== args.length - 1 ? args[i + 1] : null;

    const firstArg = args.length !== 0 ? args[0] : null;
    return new cs.List(e.g, ident, firstArg);
  }

  ['[arg]'](e){
    if(e.patIndex === 1)
      return new cs.Argument(e.g, e.elems[2].fst);

    const ident = this.getIdent(String(e));
    const list = new cs.List(e.g, ident);
    return new cs.Argument(e.g, list);
  }

  ['[ident]'](e){
    return this.getIdent(String(e));
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